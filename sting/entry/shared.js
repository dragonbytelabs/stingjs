import * as core from "../core/index.js"

export function makeSting() {
  let stop = null
  let startQueued = false
  let domReadyHooked = false

  function startNow(root = document) {
    if (stop) return stop
    stop = core.start(root)
    return stop
  }

  function ensureStarted() {
    if (stop || startQueued) return
    startQueued = true

    queueMicrotask(() => {
      startQueued = false
      if (stop) return

      // If DOM isn't ready yet, defer to DOMContentLoaded (same behavior as autoStart)
      if (document.readyState === "loading") {
        autoStart()
        return
      }

      start()
    })
  }

  function autoStart() {
    if (stop || startQueued) return

    if (document.readyState === "loading") {
      if (domReadyHooked) return
      domReadyHooked = true
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          if (!stop) startNow(document)
        },
        { once: true }
      )
      return
    }

    startNow(document)
  }

  /**
   * Start Sting runtime manually.
   * - For `document`, this starts immediately if DOM is ready, else defers to DOMContentLoaded.
   * - For a specific root element, this starts immediately.
   *
   * @param {Document | Element} root
   * @returns {() => void} stop function
   */
  function start(root = document) {
    core.devAssert(root === document || root instanceof Element, `[sting] start(root) expects Document or Element`)

    if (stop) return stop

    if (root !== document) return startNow(root)

    if (document.readyState === "loading") {
      autoStart()
      return () => {
        if (!stop) return
        stop()
        stop = null
      }
    }

    return startNow(document)
  }

  function data(name, factory) {
    core.devAssert(typeof name === "string" && name.length > 0, `[sting] data(name) requires a string name`)
    core.devAssert(typeof factory === "function", `[sting] data("${name}") requires a factory function`)

    core.data(name, factory)

    // If runtime already started, mount any existing unmounted roots for this component.
    if (stop) {
      const selector = `[x-data="${cssEscape(name)}"]`
      document.querySelectorAll(selector).forEach((el) => {
        if (!el.__stingScope) core.mountComponent(el)
      })
      return
    }

    // Otherwise, start (but only when DOM is ready)
    ensureStarted()
  }

  return {
    ...core,
    data,
    autoStart,
    start,
    // optional: allow stopping in dev/tests
    stop() {
      if (!stop) return
      stop()
      stop = null
    },
  }
}

// Minimal CSS escape (good enough for your use; uses native if present)
function cssEscape(s) {
  if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(s)
  return String(s).replace(/["\\]/g, "\\$&")
}
