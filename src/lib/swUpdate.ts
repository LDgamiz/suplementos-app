type Updater = (reload?: boolean) => Promise<void>

let pendingUpdater: Updater | null = null

export const SW_UPDATE_AVAILABLE_EVENT = 'sw-update-available'

export function registerSWUpdate(updateSW: Updater): void {
  pendingUpdater = updateSW
  window.dispatchEvent(new Event(SW_UPDATE_AVAILABLE_EVENT))
}

export async function applySWUpdate(): Promise<void> {
  if (pendingUpdater) await pendingUpdater(true)
}
