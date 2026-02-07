#!/usr/bin/env node
import process from "node:process"

const run = await resolveRun()

run(process.argv.slice(2), { cliName: "create-sting" })
  .catch((err) => {
    console.error(`\n[create-sting] ${err?.message || err}`)
    process.exit(1)
  })

async function resolveRun() {
  try {
    const loaded = await import("create-sting-app/cli")
    return loaded.run
  } catch {
    const loaded = await import("../../create-sting-app/lib/run.js")
    return loaded.run
  }
}
