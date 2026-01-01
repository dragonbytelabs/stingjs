import { STING_SIGNAL } from "./reactivity.js"

/**
 * @typedef {Error & { code?: string }} StingError
 */

/**
 * True if we should run dev-only checks/logs.
 * @type {boolean}
 */
export const __DEV__ = typeof __DEV__ !== "undefined" ? __DEV__ : true

/**
 * Assert an invariant 
 * If this fails, StingJS is in a state it doesn't know how to recover from.
 *
 * @param {any} condition
 * @param {string} message
 * @param {{ code?: string, cause?: any }=} options
 * @returns {asserts condition}
 */
export function assert(condition, message, options) {
  if (condition) return
  const err = /** @type {StingError} */ (new Error(message))
  if (options?.code) err.code = options.code
  if (options?.cause) err.cause = options.cause
  throw err
}

/**
 * Dev-only assert. 
 *
 * @param {any} condition
 * @param {string} message
 * @returns {asserts condition}
 */
export function devAssert(condition, message) {
  if (!__DEV__) return
  assert(condition, message)
}

/**
 * Dev-only warning (user misuse, not engine corruption).
 *
 * @param {string} message
 * @param {any=} extra
 */
export function devWarn(message, extra) {
  if (!__DEV__) return
  if (extra !== undefined) console.warn(message, extra)
  else console.warn(message)
}

/**
 * Helper: safer string tag name for elements.
 * @param {Element} el
 */
export function elementTag(element) {
  return element?.tagName?.toLowerCase?.() ?? ""
}

/**
 * Check if a path string is safe to eval.
 * Only allows simple dot-separated identifiers.
 *
 * @param {string} path
 * @returns {boolean}
 */
export function isPathSafe(path) {
  if (typeof path !== "string") return false
  return /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*$/.test(path)
}

/**
 * Unwrap a signal getter (marked with STING_SIGNAL) or return the value as-is.
 *
 * @template T
 * @param {T | (() => T)} signal
 * @returns {T}
 */
export function unwrap(v) {
  if (typeof v === "function" && v[STING_SIGNAL]) return v()
  return v
}