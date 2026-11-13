'use client'

import {
  ConfirmationModal,
  RenderDefaultCell,
  toast,
  useAuth,
  useConfig,
  useListDrawerContext,
  useListQuery,
  useModal,
} from '@payloadcms/ui'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { DefaultCellComponentProps } from 'payload'
import { useId, useRef, useState } from 'react'
import { readMediaId } from '@/lib/photoPlacements'

function deletionError(body: unknown): string {
  if (body && typeof body === 'object' && 'errors' in body && Array.isArray(body.errors)) {
    for (const error of body.errors) {
      if (!error || typeof error !== 'object' || !('data' in error)) continue
      const data: unknown = error.data
      if (!data || typeof data !== 'object' || !('errors' in data) || !Array.isArray(data.errors))
        continue
      for (const field of data.errors) {
        if (
          field &&
          typeof field === 'object' &&
          'path' in field &&
          field.path === 'usage' &&
          'message' in field &&
          typeof field.message === 'string'
        )
          return field.message
      }
    }
  }
  return 'Fotoğraf silinemedi. Kullanım ilişkilerini ve silme yetkinizi kontrol edip tekrar deneyin.'
}

/** Keep native thumbnail/selection behavior and delete through Payload's authenticated API. */
export function MediaFilenameCell(props: DefaultCellComponentProps) {
  return <MediaFilenameCellContent key={String(props.rowData.id)} {...props} />
}

function MediaFilenameCellContent(props: DefaultCellComponentProps) {
  const { config } = useConfig()
  const { permissions, user } = useAuth()
  const { isInDrawer, drawerSlug } = useListDrawerContext()
  const { data, query, refineListData } = useListQuery()
  const { openModal } = useModal()
  const router = useRouter()
  const uniqueId = useId()
  const modalSlug = `rtm-delete-media-${drawerSlug || 'archive'}-${uniqueId}`
  const pending = useRef(false)
  const [busy, setBusy] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [error, setError] = useState('')
  const id = readMediaId(props.rowData.id)
  const filename = typeof props.rowData.filename === 'string' ? props.rowData.filename : 'Fotoğraf'
  const canDelete =
    props.collectionSlug === 'media' &&
    Boolean(user) &&
    permissions?.collections?.media?.delete === true &&
    id !== undefined

  async function deletePhoto() {
    if (!canDelete || id === undefined || pending.current || deleted) return
    pending.current = true
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`${config.routes.api}/media/${encodeURIComponent(String(id))}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { 'Accept-Language': 'tr' },
      })
      if (!response.ok) {
        const body: unknown = response.status < 500 ? await response.json().catch(() => null) : null
        const message =
          response.status === 401 || response.status === 403
            ? 'Bu fotoğrafı silme yetkiniz yok veya oturumunuz sona ermiş. Yeniden giriş yapın.'
            : deletionError(body)
        setError(message)
        toast.error(message)
        return
      }
      setDeleted(true)
      toast.success('Fotoğraf medya arşivinden silindi.')
      const page = data?.page || 1
      const nextPage = data?.docs.length === 1 && page > 1 ? page - 1 : page
      try {
        if (isInDrawer || nextPage !== page)
          await refineListData({ ...query, page: nextPage }, false)
        else router.refresh()
      } catch {
        toast.error('Fotoğraf silindi ancak liste yenilenemedi. Medya arşivini yeniden açın.')
      }
    } catch {
      const message =
        'Silme işlemi tamamlanamadı. Bağlantınızı kontrol edip medya arşivini yenileyin.'
      setError(message)
      toast.error(message)
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  if (deleted) return <span role="status">Fotoğraf silindi.</span>

  return (
    <div className="rtm-media-file-cell">
      <div className="rtm-media-file-cell__content" title={filename}>
        <RenderDefaultCell
          clientProps={props}
          columnIndex={props.columnIndex || 0}
          isLinkedColumn={props.link === true}
        />
      </div>
      {canDelete ? (
        <>
          <button
            type="button"
            className="rtm-media-delete-button"
            aria-label={`${filename} fotoğrafını kalıcı sil`}
            title="Fotoğrafı medya arşivinden sil"
            disabled={busy}
            aria-busy={busy}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setError('')
              openModal(modalSlug)
            }}
          >
            <X size={20} strokeWidth={2.5} aria-hidden="true" />
          </button>
          <ConfirmationModal
            modalSlug={modalSlug}
            heading="Fotoğraf kalıcı olarak silinsin mi?"
            body={
              <>
                <p>
                  <strong>{filename}</strong> medya arşivinden ve sunucudan kalıcı olarak silinecek.
                </p>
                <p>
                  Kullanıldığı sayfalarda görsel eksilebilir. Yalnızca bir alandaki fotoğraf
                  seçimini kaldırmak istiyorsanız o alanın kaldırma düğmesini kullanın.
                </p>
              </>
            }
            cancelLabel="Vazgeç"
            confirmLabel="Fotoğrafı kalıcı sil"
            confirmingLabel="Siliniyor…"
            onConfirm={deletePhoto}
          />
        </>
      ) : null}
      {error ? (
        <p className="rtm-media-delete-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
