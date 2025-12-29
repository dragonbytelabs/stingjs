import * as core from "../core/index.js"

export function makeSting() {
    let started = false
    let startQueued = false

    function ensureStarted() {
        if (started || startQueued) return
        startQueued = true

        queueMicrotask(() => {
            startQueued = false
            if (started) return
            started = true
            core.start()
        })
    }

    let domReadyHooked = false
    function autoStart() {
        if (started || startQueued) return
        if (document.readyState === "loading") {
            if (domReadyHooked) return
            domReadyHooked = true
            document.addEventListener("DOMContentLoaded", ensureStarted, { once: true })
        } else {
            ensureStarted()
        }
    }

    function data(name, factory) {
        core.devAssert(typeof name === "string" && name.length > 0, `[sting] data(name) requires a string name`)
        core.devAssert(typeof factory === "function", `[sting] data("${name}") requires a factory function`)
        core.data(name, factory)
        ensureStarted()
    }


    return {
        ...core,
        data,
        autoStart,
        start: ensureStarted
    }
}
