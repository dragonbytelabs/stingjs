import { makeSting } from "./shared.js"

// built-in directives (self-register via directive(...))
import "../directives/x-text.js"
import "../directives/x-show.js"
import "../directives/x-on.js"
import "../directives/x-debug.js"

const sting = makeSting()

// auto-start on DOM ready (safety net)
sting.autoStart()

export default sting
export * from "../core/index.js" // optional: named exports if you want
