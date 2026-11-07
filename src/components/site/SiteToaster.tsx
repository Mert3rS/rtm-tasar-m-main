'use client'

import { Toaster } from 'sonner'

export function SiteToaster() {
  return (
    <Toaster
      closeButton
      containerAriaLabel="Bildirimler"
      duration={4200}
      mobileOffset={{ left: 16, right: 16, top: 88 }}
      offset={{ right: 24, top: 24 }}
      position="top-right"
      toastOptions={{
        classNames: {
          closeButton: 'rtm-toast__close',
          content: 'rtm-toast__content',
          description: 'rtm-toast__description',
          error: 'rtm-toast--error',
          icon: 'rtm-toast__icon',
          info: 'rtm-toast--info',
          success: 'rtm-toast--success',
          title: 'rtm-toast__title',
          toast: 'rtm-toast',
          warning: 'rtm-toast--warning',
        },
        unstyled: true,
      }}
      visibleToasts={4}
    />
  )
}
