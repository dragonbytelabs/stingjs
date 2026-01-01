import { devAssert } from "./utils.js"

let CURRENT_DISPOSERS = null

export function _withDisposers(disposers, fn) {
  const prev = CURRENT_DISPOSERS
  CURRENT_DISPOSERS = disposers
  try {
    return fn()
  } finally {
    CURRENT_DISPOSERS = prev
  }
}

export function onCleanup(fn) {
  devAssert(typeof fn === "function", "[sting] onCleanup(fn) requires a function")
  devAssert(!!CURRENT_DISPOSERS, "[sting] onCleanup() called outside component setup")
  CURRENT_DISPOSERS.push(fn)
}

export function setIntervalSafe(ms, fn) {
  const id = setInterval(fn, ms)
  if (CURRENT_DISPOSERS) CURRENT_DISPOSERS.push(() => clearInterval(id))
  return id
}

export function setTimeoutSafe(ms, fn) {
  const id = setTimeout(fn, ms)
  if (CURRENT_DISPOSERS) CURRENT_DISPOSERS.push(() => clearTimeout(id))
  return id
}
