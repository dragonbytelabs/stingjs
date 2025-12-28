import { signal } from "./reactivity.js"

/**
 * Produce helper: takes a "mutate the draft" function and returns an updater
 * function suitable for setStore(updater).
 *
 * @template T
 * @param {(draft: T) => void} mutator
 * @returns {(prev: T) => T}
 *
 * @example
 * setUser(produce(d => { d.name = "Frodo" }))
 */
export function produce(mutator) {
    return (prev) => {
        // MVP clone strategy:
        // - structuredClone if available (handles more types)
        // - fallback JSON clone (loses Dates/Maps/functions/etc)
        const draft =
            typeof structuredClone === "function"
                ? structuredClone(prev)
                : JSON.parse(JSON.stringify(prev))

        mutator(draft)
        return draft
    }
}

/**
 * Create a store for nested objects.
 * This MVP store is "signal-backed":
 * - the whole object lives in a signal
 * - the returned Proxy reads from that signal (so effects track)
 * - writes use produce to replace the object
 *
 * @template {Record<string, any>} T
 * @param {T} initial
 * @returns {[T, (next: T | ((prev: T) => T)) => void]}
 *
 * @example
 * const [user, setUser] = store({ name: "Sam" })
 * effect(() => console.log(user.name))
 * setUser(produce(d => { d.name = "Frodo" }))
 */
export function store(initial) {
    const [get, set] = signal(initial)

    /** @type {any} */
    const proxy = new Proxy(
        {},
        {
            get(_target, prop) {
                // allow inspection and symbols
                if (prop === Symbol.toStringTag) return "StingStore"
                if (prop === "__raw") return get()

                const cur = get()
                return cur?.[prop]
            },

            set(_target, prop, value) {
                set(
                    produce((d) => {
                        d[prop] = value
                    })
                )
                return true
            },

            ownKeys() {
                return Reflect.ownKeys(get() ?? {})
            },

            getOwnPropertyDescriptor(_target, prop) {
                const cur = get()
                if (cur && prop in cur) {
                    return { enumerable: true, configurable: true }
                }
            },
        }
    )

    /**
     * Set store value.
     * Accepts:
     * - a new object
     * - an updater(prev) => next (including produce(...))
     *
     * @param {any} next
     */
    function setStore(next) {
        set(next)
    }

    return [proxy, setStore]
}
