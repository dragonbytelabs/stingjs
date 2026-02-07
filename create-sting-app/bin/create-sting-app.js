#!/usr/bin/env node
import process from "node:process"
import { run } from "../lib/run.js"

run(process.argv.slice(2), { cliName: "create-sting-app" }).catch((err) => {
  console.error(`\n[create-sting-app] ${err?.message || err}`)
  process.exit(1)
})
