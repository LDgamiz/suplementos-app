/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

export {}
declare const self: ServiceWorkerGlobalScope & typeof globalThis

precacheAndRoute(self.__WB_MANIFEST)

interface PushPayload {
  title?: string
  body?: string
  url?: string
}

self.addEventListener('push', (event: PushEvent) => {
  let payload: PushPayload = {}
  try { payload = event.data?.json() ?? {} } catch { payload = {} }

  const title = payload.title || 'My Supplements'
  const body = payload.body || 'Have you taken your supplements today?'
  const url = payload.url || '/'

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'daily-reminder',
      data: { url }
    })
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url = (event.notification.data?.url as string) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const client = clients.find(c => 'focus' in c) as WindowClient | undefined
      if (client) { client.focus(); return client.navigate(url) }
      return self.clients.openWindow(url)
    })
  )
})
