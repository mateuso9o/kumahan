import { requestPersistentStorage } from './storage'

test('asks the browser to keep data when persist is available', async () => {
  const persist = vi.fn().mockResolvedValue(true)
  expect(await requestPersistentStorage({ persisted: vi.fn().mockResolvedValue(false), persist })).toBe(true)
  expect(persist).toHaveBeenCalled()
})
test('does not ask again when already persisted', async () => {
  const persist = vi.fn()
  expect(await requestPersistentStorage({ persisted: vi.fn().mockResolvedValue(true), persist })).toBe(true)
  expect(persist).not.toHaveBeenCalled()
})
test('returns false where the API does not exist', async () => {
  expect(await requestPersistentStorage(undefined)).toBe(false)
})
