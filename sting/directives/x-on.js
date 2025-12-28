/**
 * Bind `x-on:*` event directives.
 *
 * Supports arbitrary DOM events.
 *
 * Examples:
 *   <button x-on:click="submit"></button>
 *   <input x-on:input="onInput"></input>
 *
 * Behavior:
 * - Looks for all attributes starting with `x-on:`
 * - Resolves the attribute value to a function in component scope
 * - Attaches a DOM event listener
 * - Automatically removes the listener when the component is destroyed
 *
 * @param {DirectiveContext} ctx
 */
export function bindXOn(ctx) {
  const { el, scope, resolvePath, disposers } = ctx

  for (const attr of el.attributes) {
    if (!attr.name.startsWith("x-on:")) continue

    const eventName = attr.name.slice(5)
    const handlerFn = resolvePath(scope, attr.value)

    if (typeof handlerFn !== "function") {
      console.warn(`[sting] ${attr.name}="${attr.value}" is not a function`, el)
      continue
    }

    const handler = (e) => handlerFn(e)
    el.addEventListener(eventName, handler)
    disposers.push(() => el.removeEventListener(eventName, handler))
  }
}
