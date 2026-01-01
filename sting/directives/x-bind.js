import { directive } from "../core/directives.js"
import { devAssert, devWarn, elementTag, isPathSafe, unwrap } from "../core/utils.js"

/**
 * Bind `x-bind:*` attribute directives.
 *
 * Examples:
 *   <input x-bind:placeholder="placeholder">
 *   <button x-bind:disabled="isBusy">Save</button>
 *   <a x-bind:href="profileUrl">Profile</a>
 *
 * Rules:
 * - expression must be a safe dot-path (no eval)
 * - unwrap() is applied so you can pass signals or plain values
 *
 * @param {import("../core/runtime.js").DirectiveContext} ctx
 */
export function bindXBind(ctx) {
    const { el, scope, getPath, effect, disposers } = ctx

    // gather all x-bind:* on this element
    for (const attr of el.attributes) {
        if (!attr.name.startsWith("x-bind:")) continue
        const arg = attr.name.slice("x-bind:".length).trim()
        const expr = (attr.value ?? "").trim()
        if (!arg) {
            devWarn(`[sting] x-bind missing attribute name`, el)
            continue
        }
        if (!expr) {
            devWarn(`[sting] x-bind:${arg} is missing an expression`, el)
            continue
        }

        devAssert(isPathSafe(expr), `[sting] x-bind:${arg} invalid path "${expr}"`)

        const dispose = effect(() => {
            const resolved = getPath(scope, expr)
            let value = unwrap(resolved)

            // Treat plain functions as computed getters for binding contexts
            if (typeof value === "function") {
                try {
                    value = value.length > 0 ? value(scope) : value()
                } catch (e) {
                    devWarn(`[sting] x-bind:${arg} "${expr}" threw while evaluating`, e)
                    value = null
                }
            }

            applyBinding(el, arg, value)
        })
        disposers.push(dispose)
    }

}

directive(bindXBind)

/**
 * Apply a binding to an element attribute/property.
 *
 * @param {Element} el
 * @param {string} attr
 * @param {any} value
 */
function applyBinding(el, attr, value) {
    const tag = elementTag(el)

    // --- boolean-ish attributes ---
    if (
        attr === "disabled" ||
        attr === "checked" ||
        attr === "selected" ||
        attr === "readonly" ||
        attr === "required"
    ) {
        const next = !!value

        // DOM property names:
        const prop =
            attr === "readonly" ? "readOnly" : attr

        // @ts-ignore
        if (prop in el) el[prop] = next

        if (next) el.setAttribute(attr, "")
        else el.removeAttribute(attr)

        return
    }

    // --- value prop (inputs) ---
    if (attr === "value" && (tag === "input" || tag === "textarea" || tag === "select")) {
        const next = value ?? ""
        // @ts-ignore
        if (el.value !== String(next)) el.value = String(next)
        return
    }

    if (attr === "class") {
        applyClassBinding(el, value)
        return
    }

    // --- style (string or object) ---
    if (attr === "style") {
        if (value && typeof value === "object") {
            const parts = []
            for (const [k, v] of Object.entries(value)) {
                if (v == null || v === false) continue
                parts.push(`${k}: ${String(v)};`)
            }
            el.setAttribute("style", parts.join(" "))
        } else {
            el.setAttribute("style", value ?? "")
        }
        return
    }

    // --- default: attribute ---
    if (value == null || value === false) {
        el.removeAttribute(attr)
    } else {
        el.setAttribute(attr, String(value))
    }
}

const CLASS_STATE = new WeakMap()

function initClassState(el) {
    let st = CLASS_STATE.get(el)
    if (st) return st
    st = {
        base: new Set((el.getAttribute("class") || "").split(/\s+/).filter(Boolean)),
        applied: new Set(),
    }
    CLASS_STATE.set(el, st)
    return st
}

function normalizeClassValue(value) {
    // supports: "a b", ["a","b"], {a:true,b:false}
    const out = new Set()

    if (!value) return out

    if (typeof value === "string") {
        value.split(/\s+/).filter(Boolean).forEach(c => out.add(c))
        return out
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            if (typeof item === "string") item.split(/\s+/).filter(Boolean).forEach(c => out.add(c))
        }
        return out
    }

    if (typeof value === "object") {
        for (const [cls, on] of Object.entries(value)) {
            if (on) cls.split(/\s+/).filter(Boolean).forEach(c => out.add(c))
        }
        return out
    }

    return out
}

function applyClassBinding(el, value) {
    const st = initClassState(el)
    const next = normalizeClassValue(value)

    // remove previously applied bound classes
    for (const c of st.applied) {
        el.classList.remove(c)
    }

    // ensure base classes are present (in case something removed them)
    for (const c of st.base) {
        el.classList.add(c)
    }

    // add new bound classes
    for (const c of next) {
        el.classList.add(c)
    }

    st.applied = next
}
