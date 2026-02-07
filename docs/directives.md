# Directive Contract (v1)

This document defines supported and unsupported directive behavior.

## Expression Rules

StingJS directives use path-safe expressions by default.

Supported expression forms:
- Identifier: `count`
- Dot-path: `user.profile.name`
- Limited literals in `x-on` args: strings, numbers, booleans, `null`, `undefined`
- `$event` token in `x-on` args

Not supported:
- Arbitrary JavaScript expressions
- `eval`/`new Function` expression execution

## `x-text`

Behavior:
- Sets `textContent` to resolved value
- `null`/`undefined` render as empty string
- Signal getters are unwrapped automatically

Supported:
- Path-safe lookup: `x-text="user.name"`
- Getter functions in scope

Not supported:
- Inline arithmetic or boolean expressions

## `x-show`

Behavior:
- Toggles `display: none` when falsy
- Restores initial inline display when truthy

Supported:
- Path-safe boolean-like values

Not supported:
- Transition modifiers (not implemented)

## `x-on:event`

Behavior:
- Binds DOM event listeners
- Handler receives event as the final argument

Supported:
- Path call: `x-on:click="inc"`
- One/many args: `x-on:click="setLabel('a', 1, true)"`
- Event token: `x-on:click="handle($event)"`
- Curried handlers: `x-on:click="remove(i)"` where `remove(i)` returns a function

Not supported:
- Modifier syntax like `.prevent`, `.stop`, `.debounce`
- Arbitrary inline JS statements

## `x-model`

Behavior:
- Two-way sync between form control and scope path

Supported:
- `<input>` text-like fields
- `<input type="checkbox">` boolean mapping
- `<input type="radio">` value mapping
- `<textarea>`
- `<select>`

Not supported:
- Custom parser/modifier chains (`.number`, `.trim`, etc.)

## `x-bind:attr`

Behavior:
- Binds attributes/properties reactively

Supported:
- Generic attributes: `x-bind:title="title"`
- Boolean-ish attrs: `disabled`, `checked`, `selected`, `readonly`, `required`
- Form `value` property binding
- `class` values: string, array, object
- `style` values: string or object
- `null`/`false` removes attributes (where applicable)

Not supported:
- Modifier pipeline syntax

## `x-if` (`<template>` only)

Behavior:
- Conditionally inserts/removes cloned template content
- Hydrates directives inside inserted content
- Disposes inserted-content effects/listeners when removed

Supported:
- `x-if` on `<template>` nodes

Not supported:
- `x-if` on non-template elements
- Transition directives tied to `x-if`

## `x-for` (`<template>` only)

Behavior:
- Renders iterable values by cloning template content
- Provides item and optional index scope

Supported:
- `x-for="item in items"`
- `x-for="(item, i) in items"`
- Array and iterable sources

Known v1 behavior:
- Full re-render of loop instances on source update (no keyed diffing)

Not supported:
- Destructuring syntax in loop variables
- Keyed patching semantics

## `x-effect`

Behavior:
- Runs a reactive function from scope
- Re-runs on dependency changes
- Supports cleanup return function

Supported:
- `x-effect="track"`
- Cleanup function return from `track`

Not supported:
- Inline function expressions in attribute values

## `x-debug`

Behavior:
- Development-oriented signal debugging output in DOM

Supported:
- `x-debug="$count"`
- Fallback lookup from `count` to `$count`

Not supported:
- Production diagnostics contract (dev helper only)
