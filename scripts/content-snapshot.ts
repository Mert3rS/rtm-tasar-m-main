import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { createReadStream } from 'node:fs'
import {
  access,
  cp,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises'
import { createConnection } from 'node:net'
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { z } from 'zod'

const projectRoot = process.cwd()
const snapshotsRoot = join(projectRoot, '.content-snapshots')
const mediaRoot = join(projectRoot, 'media')
const databaseFileName = 'database.dump'
const manifestFileName = 'manifest.json'
const composeService = 'postgres'
const databaseName = 'rtm_tasarim'
const databaseUser = 'rtm_dev'
const snapshotVersion = 1

const sensitiveTables = [
  // Phase 9–10 private visitor/analytics records: never part of a team content snapshot.
  'assistant_feedback',
  'assistant_unanswered',
  'consent_records',
  'form_rate_limits',
  'inquiries',
  'payload_kv',
  'payload_locked_documents',
  'payload_locked_documents_rels',
  'payload_preferences',
  'payload_preferences_rels',
  'users',
  'users_sessions',
] as const

const contentTables = [
  'cities',
  'countries',
  'design_models',
  'media',
  'model_categories',
  'project_categories',
  'projects',
  'services',
  'showroom_scenes',
  'showrooms',
  // Phase 9–10 editorial content (counted only where the table already exists).
  'assistant_answers',
  'assistant_settings',
  'faqs',
  'site_settings',
] as const

const FileEntrySchema = z.object({
  path: z.string().min(1),
  bytes: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
})

const ManifestSchema = z.object({
  version: z.literal(snapshotVersion),
  scope: z.enum(['team-content', 'full-local-backup']),
  createdAt: z.string().datetime(),
  gitCommit: z.string().regex(/^[a-f0-9]{40}$/),
  database: z.object({
    file: z.literal(databaseFileName),
    bytes: z.number().int().positive(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    excludedTableData: z.array(z.string()),
  }),
  media: z.object({
    directory: z.literal('media'),
    files: z.array(FileEntrySchema),
    totalBytes: z.number().int().nonnegative(),
  }),
  contentCounts: z.record(z.string(), z.number().int().nonnegative()),
})

type Manifest = z.infer<typeof ManifestSchema>
type SnapshotScope = Manifest['scope']

function printHelp() {
  console.log(`RTM içerik snapshot aracı

Kullanım:
  pnpm content:export -- [--name ekip-snapshoti]
  pnpm content:verify -- <snapshot-klasoru>
  pnpm content:check -- <snapshot-klasoru>
  pnpm content:import -- <snapshot-klasoru> --confirm-replace-local

export  PostgreSQL içeriği ile media/ dosyalarını checksum manifestiyle birlikte çıkarır.
verify  Dump ve tüm medya dosyalarının bütünlüğünü yalnızca dosya seviyesinde doğrular.
check   Snapshot dump'ını geçici bir PostgreSQL veritabanına geri yükleyerek test eder.
import  Hedefin tam yedeğini alır, doğrulanmış snapshot'ı atomik olarak yerel ortama kurar.

Ekip export'u users, sessions, inquiries ve özel Payload altyapı verilerini içermez.`)
}

function run(command: string, args: string[], capture = false) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit',
  })
  if (result.error) throw result.error
  if (result.status !== 0) {
    const detail = capture ? `${result.stderr || result.stdout}`.trim() : ''
    throw new Error(`${command} komutu başarısız oldu${detail ? `: ${detail}` : '.'}`)
  }
  return capture ? `${result.stdout}`.trim() : ''
}

function dockerCompose(args: string[], capture = false) {
  return run('docker', ['compose', ...args], capture)
}

async function exists(path: string) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function assertProjectRoot() {
  for (const required of ['compose.yaml', 'package.json', '.git']) {
    if (!(await exists(join(projectRoot, required))))
      throw new Error('Komutu RTM Tasarım depo kökünden çalıştırın.')
  }
}

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function safeName(value: string) {
  if (!/^[a-z0-9][a-z0-9_-]{1,60}$/i.test(value))
    throw new Error('Snapshot adı 2-61 karakter olmalı; yalnızca harf, sayı, - ve _ kullanın.')
  return value
}

function argumentValue(flag: string) {
  const index = process.argv.indexOf(flag)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function positionalSnapshotPath() {
  const commandIndex = process.argv.findIndex((value) =>
    ['verify', 'check', 'import'].includes(value),
  )
  const value = commandIndex >= 0 ? process.argv[commandIndex + 1] : undefined
  if (!value || value.startsWith('--')) throw new Error('Snapshot klasörü belirtilmedi.')
  return resolve(projectRoot, value)
}

async function ensurePostgres() {
  const running = dockerCompose(['ps', '--status', 'running', '--services'], true)
    .split(/\r?\n/)
    .includes(composeService)
  if (!running) dockerCompose(['up', '-d', composeService])
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const ready = spawnSync(
      'docker',
      ['compose', 'exec', '-T', composeService, 'pg_isready', '-U', databaseUser, '-d', databaseName],
      { cwd: projectRoot, stdio: 'ignore' },
    )
    if (ready.status === 0) return
    await new Promise((resolveWait) => setTimeout(resolveWait, 500))
  }
  throw new Error('Yerel PostgreSQL servisi hazır duruma gelmedi.')
}

async function sha256(path: string) {
  const hash = createHash('sha256')
  await new Promise<void>((resolveHash, rejectHash) => {
    const input = createReadStream(path)
    input.on('data', (chunk) => hash.update(chunk))
    input.on('error', rejectHash)
    input.on('end', resolveHash)
  })
  return hash.digest('hex')
}

async function mediaEntries(root: string, current = root): Promise<Manifest['media']['files']> {
  if (!(await exists(current))) return []
  const entries = await readdir(current, { withFileTypes: true })
  const files: Manifest['media']['files'] = []
  for (const entry of entries.sort((first, second) => first.name.localeCompare(second.name))) {
    const absolute = join(current, entry.name)
    if (entry.isDirectory()) files.push(...(await mediaEntries(root, absolute)))
    else if (entry.isFile()) {
      const fileStat = await stat(absolute)
      files.push({
        path: relative(root, absolute).split(sep).join('/'),
        bytes: fileStat.size,
        sha256: await sha256(absolute),
      })
    }
  }
  return files
}

function queryCounts(tables: readonly string[], targetDatabase = databaseName) {
  const query = tables
    .map((table) => `SELECT '${table}' AS name, count(*)::text AS total FROM ${table}`)
    .join(' UNION ALL ')
  const output = dockerCompose(
    ['exec', '-T', composeService, 'psql', '-U', databaseUser, '-d', targetDatabase, '-At', '-F', '=', '-c', query],
    true,
  )
  return Object.fromEntries(
    output
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => {
        const [name, total] = line.split('=')
        return [name, Number(total)]
      }),
  )
}

/** Tables that exist in the target DB (older snapshots may predate newer private tables). */
function existingTables(tables: readonly string[], targetDatabase = databaseName) {
  const list = tables.map((table) => `'${table}'`).join(',')
  const output = dockerCompose(
    ['exec', '-T', composeService, 'psql', '-U', databaseUser, '-d', targetDatabase, '-At', '-c', `SELECT name FROM unnest(ARRAY[${list}]) AS name WHERE to_regclass(name) IS NOT NULL`],
    true,
  )
  const present = new Set(output.split(/\r?\n/).filter(Boolean))
  return tables.filter((table) => present.has(table))
}

function contentCounts(targetDatabase = databaseName) {
  return queryCounts(existingTables(contentTables, targetDatabase), targetDatabase)
}

async function createSnapshot(scope: SnapshotScope, requestedName?: string) {
  await ensurePostgres()
  await mkdir(snapshotsRoot, { recursive: true })
  const name = safeName(requestedName || `${scope === 'team-content' ? 'team' : 'backup'}-${timestamp()}`)
  const destination = join(snapshotsRoot, name)
  const temporary = join(snapshotsRoot, `.building-${name}-${process.pid}`)
  if (await exists(destination)) throw new Error(`Snapshot zaten var: ${destination}`)
  await rm(temporary, { recursive: true, force: true })
  await mkdir(temporary, { recursive: true })
  const containerDump = `/tmp/rtm-content-${process.pid}.dump`
  try {
    const exclusions = scope === 'team-content' ? [...sensitiveTables] : []
    const dumpArgs = [
      'exec',
      '-T',
      composeService,
      'pg_dump',
      '-U',
      databaseUser,
      '-d',
      databaseName,
      '--format=custom',
      '--no-owner',
      '--no-privileges',
      `--file=${containerDump}`,
      ...exclusions.map((table) => `--exclude-table-data=${table}`),
    ]
    dockerCompose(dumpArgs)
    dockerCompose(['cp', `${composeService}:${containerDump}`, join(temporary, databaseFileName)])
    const snapshotMedia = join(temporary, 'media')
    await mkdir(snapshotMedia, { recursive: true })
    if (await exists(mediaRoot)) await cp(mediaRoot, snapshotMedia, { recursive: true })
    const files = await mediaEntries(snapshotMedia)
    const dumpFile = join(temporary, databaseFileName)
    const dumpStat = await stat(dumpFile)
    const manifest: Manifest = {
      version: snapshotVersion,
      scope,
      createdAt: new Date().toISOString(),
      gitCommit: run('git', ['rev-parse', 'HEAD'], true),
      database: {
        file: databaseFileName,
        bytes: dumpStat.size,
        sha256: await sha256(dumpFile),
        excludedTableData: exclusions,
      },
      media: {
        directory: 'media',
        files,
        totalBytes: files.reduce((total, file) => total + file.bytes, 0),
      },
      contentCounts: contentCounts(),
    }
    await writeFile(join(temporary, manifestFileName), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
    await rename(temporary, destination)
    console.log(`Snapshot oluşturuldu: ${destination}`)
    console.log(`Kapsam: ${scope}; medya: ${files.length} dosya; DB: ${dumpStat.size} bayt`)
    return destination
  } catch (error) {
    await rm(temporary, { recursive: true, force: true })
    throw error
  } finally {
    spawnSync('docker', ['compose', 'exec', '-T', composeService, 'rm', '-f', containerDump], {
      cwd: projectRoot,
      stdio: 'ignore',
    })
  }
}

function safeSnapshotFile(root: string, relativePath: string) {
  if (isAbsolute(relativePath)) throw new Error(`Geçersiz mutlak dosya yolu: ${relativePath}`)
  const resolved = resolve(root, relativePath)
  const rootPrefix = `${resolve(root)}${sep}`
  if (!resolved.startsWith(rootPrefix)) throw new Error(`Snapshot dışına çıkan yol: ${relativePath}`)
  return resolved
}

async function readManifest(snapshotPath: string) {
  const raw = await readFile(join(snapshotPath, manifestFileName), 'utf8')
  return ManifestSchema.parse(JSON.parse(raw))
}

async function verifySnapshot(snapshotPath: string) {
  const manifest = await readManifest(snapshotPath)
  const dumpPath = safeSnapshotFile(snapshotPath, manifest.database.file)
  const dumpStat = await stat(dumpPath)
  if (dumpStat.size !== manifest.database.bytes || (await sha256(dumpPath)) !== manifest.database.sha256)
    throw new Error('Veritabanı dump checksum veya boyut doğrulaması başarısız.')
  const mediaDirectory = safeSnapshotFile(snapshotPath, manifest.media.directory)
  let totalBytes = 0
  for (const file of manifest.media.files) {
    const filePath = safeSnapshotFile(mediaDirectory, file.path)
    const fileStat = await stat(filePath)
    if (fileStat.size !== file.bytes || (await sha256(filePath)) !== file.sha256)
      throw new Error(`Medya doğrulaması başarısız: ${file.path}`)
    totalBytes += fileStat.size
  }
  const actualFiles = await mediaEntries(mediaDirectory)
  if (actualFiles.length !== manifest.media.files.length || totalBytes !== manifest.media.totalBytes)
    throw new Error('Snapshot medya dosya listesi manifest ile eşleşmiyor.')
  console.log(`Snapshot doğrulandı: ${snapshotPath}`)
  console.log(`Kapsam: ${manifest.scope}; medya: ${actualFiles.length} dosya`)
  return manifest
}

async function copyDumpToContainer(dumpPath: string, containerPath: string) {
  dockerCompose(['cp', dumpPath, `${composeService}:${containerPath}`])
}

async function restoreDump(dumpPath: string, clean: boolean, targetDatabase = databaseName) {
  const containerDump = `/tmp/rtm-restore-${process.pid}.dump`
  try {
    await copyDumpToContainer(dumpPath, containerDump)
    dockerCompose([
      'exec',
      '-T',
      composeService,
      'pg_restore',
      '-U',
      databaseUser,
      '-d',
      targetDatabase,
      '--no-owner',
      '--no-privileges',
      '--exit-on-error',
      '--single-transaction',
      ...(clean ? ['--clean', '--if-exists'] : []),
      containerDump,
    ])
  } finally {
    spawnSync('docker', ['compose', 'exec', '-T', composeService, 'rm', '-f', containerDump], {
      cwd: projectRoot,
      stdio: 'ignore',
    })
  }
}

async function portIsOpen(port: number) {
  return new Promise<boolean>((resolvePort) => {
    const socket = createConnection({ host: '127.0.0.1', port })
    const finish = (open: boolean) => {
      socket.destroy()
      resolvePort(open)
    }
    socket.setTimeout(500)
    socket.once('connect', () => finish(true))
    socket.once('timeout', () => finish(false))
    socket.once('error', () => finish(false))
  })
}

async function checkRestore(snapshotPath: string) {
  const manifest = await verifySnapshot(snapshotPath)
  await ensurePostgres()
  const checkDatabase = `rtm_snapshot_check_${Date.now()}`
  try {
    dockerCompose(['exec', '-T', composeService, 'createdb', '-U', databaseUser, checkDatabase])
    await restoreDump(join(snapshotPath, manifest.database.file), false, checkDatabase)
    const restoredCounts = contentCounts(checkDatabase)
    for (const [table, expected] of Object.entries(manifest.contentCounts)) {
      if (restoredCounts[table] !== expected)
        throw new Error(`${table} geri yükleme sayısı eşleşmiyor: ${restoredCounts[table]} / ${expected}`)
    }
    if (manifest.scope === 'team-content') {
      const privateCounts = queryCounts(existingTables(sensitiveTables, checkDatabase), checkDatabase)
      const populatedPrivateTable = Object.entries(privateCounts).find(([, count]) => count !== 0)
      if (populatedPrivateTable)
        throw new Error(`Ekip snapshot'ında özel tablo verisi bulundu: ${populatedPrivateTable[0]}`)
    }
    console.log(
      `Geri yükleme testi başarılı; ${Object.values(restoredCounts).reduce((total, count) => total + count, 0)} içerik kaydı doğrulandı.`,
    )
  } finally {
    spawnSync('docker', ['compose', 'exec', '-T', composeService, 'dropdb', '-U', databaseUser, '--if-exists', checkDatabase], {
      cwd: projectRoot,
      stdio: 'ignore',
    })
  }
}

async function replaceMedia(snapshotPath: string, rollbackPath: string) {
  const source = join(snapshotPath, 'media')
  const staged = join(projectRoot, `.content-media-staged-${process.pid}`)
  await rm(staged, { recursive: true, force: true })
  await cp(source, staged, { recursive: true })
  let movedCurrent = false
  try {
    if (await exists(mediaRoot)) {
      await rename(mediaRoot, rollbackPath)
      movedCurrent = true
    }
    await rename(staged, mediaRoot)
  } catch (error) {
    await rm(mediaRoot, { recursive: true, force: true })
    if (movedCurrent && (await exists(rollbackPath))) await rename(rollbackPath, mediaRoot)
    throw error
  } finally {
    await rm(staged, { recursive: true, force: true })
  }
}

async function importSnapshot(snapshotPath: string) {
  if (!process.argv.includes('--confirm-replace-local'))
    throw new Error('İçe aktarma için --confirm-replace-local onayı zorunludur.')
  if (await portIsOpen(3000))
    throw new Error('localhost:3000 çalışıyor. Veri tutarlılığı için uygulamayı önce durdurun.')
  const manifest = await verifySnapshot(snapshotPath)
  await ensurePostgres()
  const backupPath = await createSnapshot('full-local-backup', `backup-${timestamp()}`)
  const rollbackMedia = join(projectRoot, `.content-media-rollback-${process.pid}`)
  let databaseChanged = false
  try {
    await restoreDump(join(snapshotPath, manifest.database.file), true)
    databaseChanged = true
    await replaceMedia(snapshotPath, rollbackMedia)
    await rm(rollbackMedia, { recursive: true, force: true })
    console.log(`İçerik snapshot'ı kuruldu. Otomatik önceki durum yedeği: ${backupPath}`)
    console.log('Ekip snapshot kullanıcı hesabı taşımaz; /admin üzerinden yerel yönetici oluşturun.')
  } catch (error) {
    console.error('İçe aktarma tamamlanamadı; önceki yerel duruma geri dönülüyor.')
    if (databaseChanged) await restoreDump(join(backupPath, databaseFileName), true)
    if (await exists(rollbackMedia)) {
      await rm(mediaRoot, { recursive: true, force: true })
      await rename(rollbackMedia, mediaRoot)
    }
    throw error
  }
}

async function main() {
  await assertProjectRoot()
  const command = process.argv[2]
  if (!command || ['help', '--help', '-h'].includes(command)) {
    printHelp()
    return
  }
  if (command === 'export') {
    await createSnapshot('team-content', argumentValue('--name'))
    return
  }
  if (command === 'verify') {
    await verifySnapshot(positionalSnapshotPath())
    return
  }
  if (command === 'check') {
    await checkRestore(positionalSnapshotPath())
    return
  }
  if (command === 'import') {
    await importSnapshot(positionalSnapshotPath())
    return
  }
  throw new Error(`Bilinmeyen komut: ${basename(command)}`)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Bilinmeyen snapshot hatası.'
  console.error(`Hata: ${message}`)
  process.exitCode = 1
})
