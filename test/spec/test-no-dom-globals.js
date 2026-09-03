// A service worker has no `window` and no `localStorage`. Node has neither
// either, which makes the Node suite the place to prove that the browser's URL
// storage can be loaded outside a document at all.
//
// This module is imported by the browser entry point and runs its feature
// detection at module scope, so a throw here takes down the whole entry point
// and with it any hope of using tus-js-client in a service worker.
describe('browser urlStorage without DOM globals', () => {
  it('should load where window does not exist', async () => {
    expect(typeof window).toBe('undefined')
    expect(typeof localStorage).toBe('undefined')

    const { canStoreURLs } = await import('../../lib.esm/browser/urlStorage.js')

    expect(canStoreURLs).toBe(false)
  })
})
