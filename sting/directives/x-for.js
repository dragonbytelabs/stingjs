import { directive } from "../core/directives.js"
import { devAssert, devWarn, isPathSafe, unwrap } from "../core/utils.js"

const FOR_STATE = new WeakMap()

/**
 * x-for on <template>
 *
 * Supported:
 *  <template x-for="item in items">...</template>
 *  <template x-for="(item, i) in items">...</template>
 *
 * Constraints:
 * - "items" must be a safe dot-path (no eval)
 */
export function bindXFor(ctx) {
    const { el, scope, getAttr, getPath, effect, disposers, hydrate } = ctx

    const expr = getAttr(el, "x-for")
    if (!expr) return

    devAssert(el.tagName.toLowerCase() === "template", `[sting] x-for can only be used on <template>`)

    const parsed = parseForExpr(expr)
    if (!parsed) {
        devWarn(
            `[sting] x-for invalid expression "${expr}". Expected: "item in items" or "(item, i) in items"`,
            el
        )
        return
    }

    const { itemName, indexName, listPath } = parsed
    devAssert(isPathSafe(listPath), `[sting] x-for list must be a safe path, got "${listPath}"`)

    // state per-template
    let st = FOR_STATE.get(el)
    if (!st) {
        st = {
            nodes: /** @type {Node[]} */ ([]),
            instanceDisposers: /** @type {Array<Array<() => void>>} */ ([]),
            marker: document.createComment("sting:x-for"),
            initialized: false,
        }
        FOR_STATE.set(el, st)
    }

    // Ensure marker exists and is positioned right AFTER the template
    if (!st.initialized) {
        st.initialized = true
        el.parentNode?.insertBefore(st.marker, el.nextSibling)
    }

    const dispose = effect(() => {
        // 1) resolve list value
        const resolved = getPath(scope, listPath)
        let listVal = unwrap(resolved)
        const items = normalizeIterable(listVal)

        // 2) clear previous instances
        clearForInstances(st)

        // 3) render new instances
        for (let i = 0; i < items.length; i++) {
            const item = items[i]

            // child scope inherits from parent scope
            const childScope = Object.create(scope)
            childScope[itemName] = item
            if (indexName) childScope[indexName] = i

            // clone
            const frag = document.importNode(el.content, true)

            // IMPORTANT: capture nodes BEFORE inserting (frag empties after insertion)
            const newNodes = Array.from(frag.childNodes)

            // insert AFTER template (before marker.nextSibling)
            // marker is after template; inserting at marker means "just before marker" which is correct
            st.marker.parentNode?.insertBefore(frag, st.marker)

            // track inserted nodes
            for (const n of newNodes) st.nodes.push(n)

            // per-instance disposers
            const localDisposers = []
            st.instanceDisposers.push(localDisposers)

            // hydrate inserted element subtrees
            for (const n of newNodes) {
                if (n.nodeType === Node.ELEMENT_NODE) {
                    hydrate(/** @type {Element} */(n), childScope, localDisposers)
                }
            }
        }
    })

    // component cleanup
    disposers.push(() => {
        try {
            dispose()
        } finally {
            clearForInstances(st)
            // remove marker too (optional but keeps DOM clean)
            try { st.marker.parentNode?.removeChild(st.marker) } catch { }
            FOR_STATE.delete(el)
        }
    })
}

directive(bindXFor)

/**
 * Parse x-for expression.
 *
 * @param {string} expr
 * @returns {{ itemName: string, indexName: string | null, listPath: string } | null}
 */
function parseForExpr(expr) {
    // "(item, i) in items" OR "item in items"
    const m = expr.trim().match(/^\s*(\([^)]+\)|[A-Za-z_$][\w$]*)\s+in\s+(.+?)\s*$/)
    if (!m) return null

    const lhs = m[1].trim()
    const listPath = m[2].trim()

    let itemName = ""
    let indexName = ""

    if (lhs.startsWith("(")) {
        const inner = lhs.slice(1, -1)
        const parts = inner.split(",").map(s => s.trim()).filter(Boolean)
        if (parts.length < 1) return null
        itemName = parts[0]
        indexName = parts[1] || ""
    } else {
        itemName = lhs
    }

    if (!/^[A-Za-z_$][\w$]*$/.test(itemName)) return null
    if (indexName && !/^[A-Za-z_$][\w$]*$/.test(indexName)) return null

    return { itemName, indexName: indexName || null, listPath }
}

function normalizeIterable(val) {
    if (Array.isArray(val)) return val
    if (val == null) return []
    if (typeof val[Symbol.iterator] === "function") return Array.from(val)
    return []
}

function clearForInstances(st) {
    // dispose instance-level watchers/listeners
    for (const ds of st.instanceDisposers) {
        for (let i = ds.length - 1; i >= 0; i--) {
            try { ds[i]() } catch { }
        }
    }
    st.instanceDisposers.length = 0

    // remove inserted nodes
    for (const n of st.nodes) {
        try { n.parentNode?.removeChild(n) } catch { }
    }
    st.nodes.length = 0
}
