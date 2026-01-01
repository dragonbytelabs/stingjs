import * as core from "../core/index.js"

export function makeSting() {
  let stop = null
  let startQueued = false
  let domReadyHooked = false

  function startNow() {
    if (stop) return stop
    stop = core.start()
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

      startNow()
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
          if (!stop) startNow()
        },
        { once: true }
      )
      return
    }

    startNow()
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
    start: ensureStarted,
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
