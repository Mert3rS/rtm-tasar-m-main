'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

type Item = {
  id: string
  name: string
  preview?: string
  handle?: string
  error?: string
  progress: number
}
export function InquiryAttachments({
  token,
  submissionKey,
  onChange,
  onBusy,
}: {
  token: string
  submissionKey: string
  onChange: (handles: string[]) => void
  onBusy: (busy: boolean) => void
}) {
  const [items, setItems] = useState<Item[]>([])
  const [message, setMessage] = useState('')
  const urls = useRef<string[]>([])
  const active = useRef<XMLHttpRequest | null>(null)
  useEffect(
    () => () => {
      active.current?.abort()
      urls.current.forEach(URL.revokeObjectURL)
    },
    [],
  )
  useEffect(() => {
    onChange(items.flatMap((item) => (item.handle ? [item.handle] : [])))
  }, [items, onChange])
  const uploading = items.some((item) => item.progress < 100 && !item.error)
  async function remove(item: Item) {
    if (item.handle) {
      try {
        const result = await fetch('/api/teklif/ek', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-Form-Token': token,
            'X-Submission-Key': submissionKey,
          },
          body: JSON.stringify({ handle: item.handle }),
        })
        if (!result.ok) {
          setMessage(
            'Dosya sunucudan kaldırılamadı; başvuruya eklenmeyecek. Bağlanmayan dosyalar 24 saat sonra temizliğe alınır.',
          )
        }
      } catch {
        setMessage('Dosya başvurudan çıkarıldı. Geçici sunucu kopyası temizliğe alınacak.')
      }
    }
    setItems((current) => current.filter((entry) => entry.id !== item.id))
  }
  async function add(files: FileList | null) {
    if (!files?.length || uploading) return
    if (items.length + files.length > 3) {
      setMessage('En fazla üç dosya ekleyebilirsiniz.')
      return
    }
    onBusy(true)
    for (const file of Array.from(files)) {
      const id = crypto.randomUUID()
      setItems((current) => [...current, { id, name: file.name, progress: 0 }])
      try {
        const { resizeInquiryImage } = await import('@/lib/resizeInquiryImage')
        const blob = await resizeInquiryImage(file)
        const preview = URL.createObjectURL(blob)
        urls.current.push(preview)
        setItems((current) => current.map((item) => (item.id === id ? { ...item, preview } : item)))
        const handle = await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          active.current = xhr
          xhr.open('POST', '/api/teklif/ek')
          xhr.setRequestHeader('Content-Type', 'image/jpeg')
          xhr.setRequestHeader('X-Form-Token', token)
          xhr.setRequestHeader('X-Submission-Key', submissionKey)
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable)
              setItems((current) =>
                current.map((item) =>
                  item.id === id
                    ? {
                        ...item,
                        progress: Math.min(95, Math.round((event.loaded / event.total) * 95)),
                      }
                    : item,
                ),
              )
          }
          xhr.timeout = 60000
          xhr.onload = () => {
            try {
              const body: unknown = JSON.parse(xhr.responseText)
              if (
                xhr.status === 201 &&
                body &&
                typeof body === 'object' &&
                'handle' in body &&
                typeof body.handle === 'string'
              )
                resolve(body.handle)
              else
                reject(
                  new Error('Yükleme başarısız. Dosyayı kaldırıp metinle devam edebilirsiniz.'),
                )
            } catch {
              reject(new Error('Yükleme başarısız.'))
            }
          }
          xhr.onerror =
            xhr.ontimeout =
            xhr.onabort =
              () => reject(new Error('Dosya yüklenemedi. Dosya olmadan da gönderebilirsiniz.'))
          xhr.send(blob)
        })
        setItems((current) =>
          current.map((item) => (item.id === id ? { ...item, handle, progress: 100 } : item)),
        )
      } catch (error) {
        setItems((current) =>
          current.map((item) =>
            item.id === id
              ? {
                  ...item,
                  error: error instanceof Error ? error.message : 'Dosya yüklenemedi.',
                  progress: 100,
                }
              : item,
          ),
        )
      }
    }
    onBusy(false)
  }
  return (
    <div className="inquiry-field inquiry-field-wide">
      <label htmlFor="inquiry-files">Mekân fotoğrafı veya eskiz (isteğe bağlı)</label>
      <input
        id="inquiry-files"
        className="dq-file-input"
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.heic,.heif"
        multiple
        disabled={!token || uploading}
        onChange={(event) => {
          void add(event.currentTarget.files)
          event.currentTarget.value = ''
        }}
        aria-describedby="attachment-hint"
      />
      <label className="dq-file-button" htmlFor="inquiry-files">
        + Dosya ekle
      </label>
      <p id="attachment-hint" className="field-hint">
        En fazla 3 görsel. Büyük fotoğraflar gönderilmeden önce küçültülür; konum meta verisi
        silinir.
      </p>
      <div className="dq-attachments">
        {items.map((item) => (
          <div key={item.id}>
            {item.preview ? (
              <Image
                unoptimized
                src={item.preview}
                alt={`${item.name} önizlemesi`}
                width={64}
                height={64}
              />
            ) : null}
            <span>{item.name}</span>
            <progress max={100} value={item.progress} aria-label={`${item.name} yükleme`} />
            {item.error ? <p role="status">{item.error}</p> : null}
            <button type="button" disabled={uploading} onClick={() => void remove(item)}>
              Kaldır
            </button>
          </div>
        ))}
      </div>
      <p role="status">{message}</p>
    </div>
  )
}
