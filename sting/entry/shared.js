import * as core from "../core/index.js"

export function makeSting() {
  let started = false

  function ensureStarted() {
    if (started) return
    started = true
    core.start() // mounts existing [x-data] + sets up mutation observer
  }

  function autoStart() {
    // Safety net: start when DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", ensureStarted, { once: true })
    } else {
      ensureStarted()
    }
  }

  // Wrap data() so first registration triggers start
  function data(name, factory) {
    core.data(name, factory) // Register first
    ensureStarted() // Then start
  }

  return {
    ...core,
    data,
    autoStart,
    start: ensureStarted
  }
}
