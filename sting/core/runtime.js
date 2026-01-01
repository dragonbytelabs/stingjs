import { effect, untrack } from "./reactivity.js"
import { getFactory } from "./registry.js"
import { binders } from "./directives.js"
import { devAssert, devWarn } from "./utils.js"
import { _withDisposers } from "./lifecycle.js"

/**
 * 
 * @param {Elemebt} el 
 * @param {string} name 
 * @returns string | null
 */
function getAttr(el, name) {
  return el.getAttribute(name)
}

/**
 * Simple tree walker
 *
 * @param {Element} root
 * @param {(node: Element) => void} fn
 */
function walk(root, fn) {
  const stack = [root]
  while (stack.length) {
    const node = stack.pop()
    if (!node) continue
    fn(node)
    for (let i = node.children.length - 1; i >= 0; i--) stack.push(node.children[i])
  }
}

/**
 * Get a value from scope by dot-path
 *
 * @param {object} scope
 * @param {string} path
 * @returns {any}
 */
function getPath(scope, path) {
  const parts = path.split(".").map(s => s.trim()).filter(Boolean)
  let cur = scope
  for (const p of parts) cur = cur?.[p]
  return cur
}

/**
 * Set a value in scope by dot-path
 *
 * @param {object} scope
 * @param {string} path
 * @param {any} value
 */
function setPath(scope, path, value) {
  const parts = path.split(".").map(s => s.trim()).filter(Boolean)
  if (parts.length === 0) return
  let cur = scope
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]
    cur = cur?.[key]
    if (cur == null) {
      console.warn(`setPath: "${path}" not reachable (missing "${key}")`)
      return
    }
  }
  cur[parts[parts.length - 1]] = value
}

/**
 * Apply all directives to a subtree
 *
 * @param {Element} rootEl
 * @param {object} scope
 * @param {Array<() => void>} disposers
 */
export function applyDirectives(rootEl, scope, disposers) {
  const hydrate = (subtreeRootEl, subtreeScope, subtreeDisposers) => {
    applyDirectives(subtreeRootEl, subtreeScope, subtreeDisposers)
  }

  walk(rootEl, (el) => {
    const ctx = {
      el,
      scope,
      getAttr,
      getPath,
      setPath,
      effect,
      untrack,
      disposers,
      hydrate,
    }
    for (const bind of binders) bind(ctx)
  })
}

// --- mounting ---
const MOUNTED = new WeakSet()

/**
 * Mount a component at the given root element.
 *
 * @param {Element} rootEl
 * @returns {(() => void) | undefined} disposer function
 */
export function mountComponent(rootEl) {
  devAssert(rootEl instanceof Element, "[sting] mountComponent expects an Element")
  if (MOUNTED.has(rootEl)) return

  const name = getAttr(rootEl, "x-data")
  devAssert(!!name, `[sting] mountComponent called without x-data`)

  const factory = getFactory(name)
  if (!factory) {
    devWarn(
      `[sting] component "${name}" not registered yet. ` +
      `Did you call sting.data("${name}", ...) before DOM ready?`,
      rootEl
    )
    return
  }

  const disposers = []
  const scope = _withDisposers(disposers, () => factory())

  rootEl.__stingScope = scope
  MOUNTED.add(rootEl)

  applyDirectives(rootEl, scope, disposers)

  return () => {
    MOUNTED.delete(rootEl)
    delete rootEl.__stingScope
    for (let i = disposers.length - 1; i >= 0; i--) {
      try { disposers[i]() } catch (e) { console.error("[sting] error during disposer", e) }
    }
  }
}

/**
 * Start monitoring a subtree for components to mount.
 *
 * @param {Element} rootEl
 */
export function startSubtree(rootEl) {
  devAssert(rootEl instanceof Element, "[sting] startSubtree(rootEl) expects Element")
  // mount the root if it's x-data, and any nested x-data
  if (rootEl.matches?.("[x-data]")) mountComponent(rootEl)
  rootEl.querySelectorAll?.("[x-data]").forEach((el) => mountComponent(el))
}

/**
 * Start the Sting runtime on a root element (or document).
 *
 * @param {Document | Element} root
 * @returns {() => void} stop function
 */
export function start(root = document) {
  devAssert(root === document || root instanceof Element, "[sting] start(root) expects Document or Element")

  const base = root === document ? document.body : root
  if (!base) return () => {}

  // initial mount
  startSubtree(base)

  // unmount tracking
  const destroys = new Map()
  base.querySelectorAll?.("[x-data]").forEach((el) => {
    const d = mountComponent(el)
    if (d) destroys.set(el, d)
  })

  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.removedNodes) {
        if (!(node instanceof Element)) continue

        if (destroys.has(node)) {
          destroys.get(node)()
          destroys.delete(node)
        }

        node.querySelectorAll?.("[x-data]").forEach((el) => {
          if (destroys.has(el)) {
            destroys.get(el)()
            destroys.delete(el)
          }
        })
      }

      // if nodes are added, mount subtree
      for (const node of m.addedNodes) {
        if (!(node instanceof Element)) continue
        startSubtree(node)
      }
    }
  })

  mo.observe(base, { childList: true, subtree: true })

  return () => {
    mo.disconnect()
    for (const destroy of destroys.values()) destroy()
    destroys.clear()
  }
}
