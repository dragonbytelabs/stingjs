import { signal } from "./reactivity.js"

/**
 * Produce helper: mutate draft, return next.
 */
export function produce(mutator) {
    return (prev) => {
        const draft =
            typeof structuredClone === "function"
                ? structuredClone(prev)
                : JSON.parse(JSON.stringify(prev))

        mutator(draft)
        return draft
    }
}

/**
 * Deep proxy store:
 * - reading any property tracks the whole store signal
 * - writing any nested property triggers a root update via produce + path
 */
export function store(initial) {
    const [get, set] = signal(initial)

    /** cache proxies per (rootObjIdentity, pathKey) */
    const proxyCache = new WeakMap()

    function getAtPath(obj, path) {
        let cur = obj
        for (const key of path) cur = cur?.[key]
        return cur
    }

    function setAtPath(draft, path, value) {
        if (path.length === 0) return
        let cur = draft
        for (let i = 0; i < path.length - 1; i++) {
            const k = path[i]
            const next = cur?.[k]
            // create containers if missing
            if (next == null || typeof next !== "object") {
                // choose array vs object based on next key if numeric
                const nk = path[i + 1]
                cur[k] = typeof nk === "number" ? [] : {}
            }
            cur = cur[k]
        }
        cur[path[path.length - 1]] = value
    }

    function delAtPath(draft, path) {
        if (path.length === 0) return
        let cur = draft
        for (let i = 0; i < path.length - 1; i++) {
            cur = cur?.[path[i]]
            if (cur == null) return
        }
        delete cur[path[path.length - 1]]
    }

    function makeProxy(path) {
        const raw = get()
        if (raw == null || typeof raw !== "object") {
            // if someone stores a primitive, just return it (rare)
            return raw
        }

        // key cache by the *current root object identity* + path string
        let perRoot = proxyCache.get(raw)
        if (!perRoot) {
            perRoot = new Map()
            proxyCache.set(raw, perRoot)
        }

        const key = path.join(".")
        if (perRoot.has(key)) return perRoot.get(key)

        const p = new Proxy(
            {},
            {
                get(_t, prop) {
                    if (prop === Symbol.toStringTag) return "StingStore"
                    if (prop === "__raw") return get()
                    if (prop === "__path") return path.slice()

                    const cur = getAtPath(get(), path)

                    // allow symbols (like util.inspect) to pass through
                    if (typeof prop === "symbol") return cur?.[prop]

                    const value = cur?.[prop]

                    // If it's an object/array, return a nested proxy
                    if (value && typeof value === "object") {
                        return makeProxy(path.concat(prop))
                    }

                    return value
                },

                set(_t, prop, value) {
                    if (typeof prop === "symbol") return false

                    set(
                        produce((draft) => {
                            setAtPath(draft, path.concat(prop), value)
                        })
                    )
                    return true
                },

                deleteProperty(_t, prop) {
                    if (typeof prop === "symbol") return false

                    set(
                        produce((draft) => {
                            delAtPath(draft, path.concat(prop))
                        })
                    )
                    return true
                },

                ownKeys() {
                    const cur = getAtPath(get(), path)
                    return Reflect.ownKeys(cur ?? {})
                },

                getOwnPropertyDescriptor(_t, prop) {
                    const cur = getAtPath(get(), path)
                    if (cur && prop in cur) return { enumerable: true, configurable: true }
                },
            }
        )

        perRoot.set(key, p)
        return p
    }

    function setStore(next) {
        set(next) // supports value OR updater function because signal.write handles it
    }

    return [makeProxy([]), setStore]
}
