import { makeSting } from "./shared.js"

// built-in directives (self-register via directive(...))
import "../directives/x-text.js"
import "../directives/x-show.js"
import "../directives/x-on.js"
import "../directives/x-debug.js"
import "../directives/x-model.js"

const sting = makeSting()

// auto-start on DOM ready (safety net)
sting.autoStart()

export default sting

export const {
  data,
  start,
  autoStart,
  signal,
  effect,
  batch,
  untrack,
  store,
  produce,
  directive,
  use,
  binders,
} = sting
