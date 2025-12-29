import { directive } from "../core/directives.js"

/**
 * Bind the `x-model` directive.
 *
 * Two-way bind between a form control's value and a scope path.
 *
 * - scope -> DOM: reactive effect updates el.value when the model changes
 * - DOM -> scope: input/change event updates the model via setPath
 * 
 * Example:
 *   <input type="text" x-model="message">
 *   <span x-text="message"></span>
 *
 * Supports: <input>, <textarea>, <select>
 * (checkbox/radio handled too)
 *
 * @param {import("../core/runtime.js").DirectiveContext} ctx
 */
export function bindXModel(ctx) {
  const { el, scope, getAttr, getPath, setPath, effect, disposers } = ctx

  const expr = getAttr(el, "x-model")
  if (!expr) return

  const tag = el.tagName?.toLowerCase?.()
  const isInput = tag === "input"
  const isTextarea = tag === "textarea"
  const isSelect = tag === "select"
  if (!isInput && !isTextarea && !isSelect) {
    console.warn(`[sting] x-model can only be used on input/textarea/select`, el)
    return
  }

  /** @type {HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement} */
  const field = /** @type {any} */ (el)

  const inputType = isInput ? /** @type {HTMLInputElement} */ (field).type : ""
  const isCheckbox = isInput && inputType === "checkbox"
  const isRadio = isInput && inputType === "radio"

  const onInput = () => {
    if (isCheckbox) {
      setPath(scope, expr, /** @type {HTMLInputElement} */ (field).checked)
      return
    }

    if (isRadio) {
      const radio = /** @type {HTMLInputElement} */ (field)
      if (radio.checked) setPath(scope, expr, radio.value)
      return
    }

    setPath(scope, expr, field.value)
  }

  // use `input` for text-like controls, `change` for select/checkbox/radio
  const eventName = (isSelect || isCheckbox || isRadio) ? "change" : "input"
  field.addEventListener(eventName, onInput)
  disposers.push(() => field.removeEventListener(eventName, onInput))

  const dispose = effect(() => {
    const value = getPath(scope, expr)

    if (isCheckbox) {
      const next = !!value
      if (/** @type {HTMLInputElement} */ (field).checked !== next) {
        /** @type {HTMLInputElement} */ (field).checked = next
      }
      return
    }

    // For radio groups, set checked when the value matches this radio's value
    if (isRadio) {
      const radio = /** @type {HTMLInputElement} */ (field)
      const shouldCheck = String(value ?? "") === radio.value
      if (radio.checked !== shouldCheck) radio.checked = shouldCheck
      return
    }

    const next = value ?? ""
    if (field.value !== String(next)) field.value = String(next)
  })

  disposers.push(dispose)
}

directive(bindXModel)