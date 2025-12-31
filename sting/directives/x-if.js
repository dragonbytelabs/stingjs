import { directive } from "../core/directives.js"
import { devAssert, isPathSafe, unwrap } from "../core/utils.js"
import { applyDirectives } from "../core/runtime.js"

const IF_STATE = new WeakMap()

/**
 * Bind the `x-if` directive.
 * 
 * Example:
 * <template x-if="open">
 *    <div>Contents...</div>
 * </template>
 *
 * @param {import("../core/runtime.js").DirectiveContext} ctx
 */
export function bindXIf(ctx) {
  const { el, scope, getAttr, getPath, effect, disposers } = ctx

  const expr = getAttr(el, "x-if")
  if (!expr) return

  devAssert(el.tagName.toLowerCase() === "template", `[sting] x-if can only be used on <template> elements`)
  devAssert(isPathSafe(expr), `[sting] x-if invalid path "${expr}"`)

  // init state once
  let st = IF_STATE.get(el)
  if (!st) {
    const start = document.createComment("sting:x-if")
    const end = document.createComment("/sting:x-if")
    el.parentNode?.insertBefore(start, el)
    el.parentNode?.insertBefore(end, el.nextElementSibling)
    st = { start, end, mounted: false } 
    IF_STATE.set(el, st)
  } 
  const dispose = effect(() => {
    const ok = !!unwrap(getPath(scope, expr))

    if (ok && !st.mounted) {
      const frag = el.content.cloneNode(true)

      // collect inserted element roots so we can hydrate + remove later
      const inserted = []
      for (const n of Array.from(frag.childNodes)) {
        inserted.push(n)
      }

      st.end.parentNode.insertBefore(frag, st.end)

      // hydrate directives inside inserted nodes
      for (const n of inserted) {
        if (n.nodeType === 1) applyDirectives(n, scope, disposers) // ELEMENT_NODE
      }

      st.inserted = inserted
      st.mounted = true
      return
    }

    if (!ok && st.mounted) {
      // remove everything between start and end
      let node = st.start.nextSibling
      while (node && node !== st.end) {
        const next = node.nextSibling
        node.parentNode.removeChild(node)
        node = next
      }
      st.inserted = []
      st.mounted = false
    }
  })

  disposers.push(() => {
    // when component is destroyed, ensure block is removed
    if (st?.mounted) {
      let node = st.start.nextSibling
      while (node && node !== st.end) {
        const next = node.nextSibling
        node.parentNode.removeChild(node)
        node = next
      }
    }
    // anchors can remain or be removed—your call. I'd remove them:
    st.start.remove()
    st.end.remove()
  })

  disposers.push(dispose)
}

directive(bindXIf)