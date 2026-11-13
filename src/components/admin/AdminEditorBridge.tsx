'use client'

import {
  useDocumentInfo,
  useFormInitializing,
  useFormModified,
  useFormProcessing,
} from '@payloadcms/ui'
import { useEffect } from 'react'
import { isNativeEditorField, focusNativeEditorField } from './nativeEditorFocus'

/** Reports form state and focuses allowlisted photo fields. Writes stay in native Payload. */
export function AdminEditorBridge() {
  const { collectionSlug, globalSlug, isInitializing: documentInitializing } = useDocumentInfo()
  const kind = globalSlug || collectionSlug || ''
  const formInitializing = useFormInitializing()
  const modified = useFormModified()
  const processing = useFormProcessing()
  useEffect(() => {
    if (window.parent === window || !window.frameElement?.hasAttribute('data-rtm-native-editor'))
      return
    if (documentInitializing || formInitializing) return
    const field = window.frameElement.getAttribute('data-rtm-editor-field')
    if (!field || !isNativeEditorField(kind, field)) return
    // The native document owns its readiness and cleanup; a parent load/message can race it.
    return focusNativeEditorField(document, kind, field)
  }, [kind, documentInitializing, formInitializing])
  useEffect(() => {
    if (window.parent === window || !window.frameElement?.hasAttribute('data-rtm-native-editor'))
      return
    window.parent.postMessage(
      { type: 'rtm-native-form', modified, processing },
      window.location.origin,
    )
  }, [modified, processing])
  return null
}
