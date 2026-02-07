import { directive } from "../core/directives.js"
import { devAssert, isPathSafe, unwrap } from "../core/utils.js"
import { applyDirectives } from "../core/runtime.js"

const IF_STATE = new WeakMap()

export function bindXIf(ctx) {
  const { el, scope, getAttr, getPath, effect, disposers } = ctx

  const expr = getAttr(el, "x-if")
  if (!expr) return

  devAssert(el.tagName.toLowerCase() === "template", `[sting] x-if can only be used on <template>`)
  devAssert(isPathSafe(expr), `[sting] x-if invalid path "${expr}"`)

  // state per template node
  let st = IF_STATE.get(el)
  if (!st) {
    st = {
      mounted: false,
      nodes: /** @type {Node[]} */ ([]),
      instanceDisposers: /** @type {Array<() => void>} */ ([]),
    }
    IF_STATE.set(el, st)
  }

  const dispose = effect(() => {
    const show = !!unwrap(getPath(scope, expr))

    // mount
    if (show && !st.mounted) {
      // clone template content
      const frag = document.importNode(el.content, true)

      // capture inserted nodes (so we can remove them later)
      st.nodes = Array.from(frag.childNodes)

      // insert after the template
      el.parentNode?.insertBefore(frag, el.nextSibling)

      // isolate this mount cycle's directive disposers
      st.instanceDisposers = []

      // hydrate directives in inserted elements
      for (const n of st.nodes) {
        if (n instanceof Element) applyDirectives(n, scope, st.instanceDisposers)
        else if (n instanceof DocumentFragment) {
          // unlikely here, but safe
          n.querySelectorAll?.("*").forEach((child) => {
            if (child instanceof Element) applyDirectives(child, scope, st.instanceDisposers)
          })
        }
      }

      st.mounted = true
      return
    }

    // unmount
    if (!show && st.mounted) {
      unmountIfInstance(st)
    }
  })

  disposers.push(() => {
    dispose()
    unmountIfInstance(st)
    IF_STATE.delete(el)
  })
}

directive(bindXIf)

function unmountIfInstance(st) {
  if (!st.mounted) return

  for (let i = st.instanceDisposers.length - 1; i >= 0; i--) {
    try { st.instanceDisposers[i]() } catch { }
  }
  st.instanceDisposers = []

  for (const n of st.nodes) {
    n.parentNode?.removeChild(n)
  }
  st.nodes = []
  st.mounted = false
}
