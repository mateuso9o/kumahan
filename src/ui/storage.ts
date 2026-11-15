type StorageApi = Pick<StorageManager, 'persist' | 'persisted'>

/**
 * Ask the browser not to evict this app's data (Safari can clear site data that
 * has not been used for a while). Returns whether storage is persistent.
 */
export async function requestPersistentStorage(api: StorageApi | undefined = navigator.storage): Promise<boolean> {
  if (!api?.persist || !api.persisted) return false
  try {
    if (await api.persisted()) return true
    return await api.persist()
  } catch {
    return false
  }
}
