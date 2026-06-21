import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { toast } from 'sonner'

export const PwaServiceWorker = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      console.error('Service worker registration failed', error)
    },
  })

  useEffect(() => {
    if (!offlineReady) return

    toast.success('FIT Merger is ready to use offline.', {
      onDismiss: () => setOfflineReady(false),
      onAutoClose: () => setOfflineReady(false),
    })
  }, [offlineReady, setOfflineReady])

  useEffect(() => {
    if (!needRefresh) return

    toast.info('A new FIT Merger version is available.', {
      action: {
        label: 'Update',
        onClick: () => {
          void updateServiceWorker(true)
        },
      },
      onDismiss: () => setNeedRefresh(false),
      onAutoClose: () => setNeedRefresh(false),
      duration: 10000,
    })
  }, [needRefresh, setNeedRefresh, updateServiceWorker])

  return null
}
