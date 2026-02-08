import fs from "node:fs"
import fsp from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"
import { createInterface } from "node:readline/promises"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const templates = {
  javascript: path.resolve(__dirname, "../template/vanilla-js"),
  typescript: path.resolve(__dirname, "../template/vanilla-ts"),
}

const defaultProjectName = "sting-app"

export async function run(argv = process.argv.slice(2), options = {}) {
  const cliName = options.cliName || "create-sting-app"
  const parsed = parseArgs(argv)

  if (parsed.help) {
    printHelp(cliName)
    return
  }

  const resolved = await resolveScaffoldOptions({
    projectArg: parsed.projectArg,
    templateArg: parsed.templateArg,
    skipPrompts: parsed.skipPrompts,
  })

  const projectNameInput = resolved.projectName
  const template = resolved.template
  const templateRoot = templates[template]

  if (!templateRoot) {
    throw new Error(`unknown template: ${template}`)
  }

  const targetDir = path.resolve(process.cwd(), projectNameInput)
  const inCurrentDir = projectNameInput === "."

  const rawName = inCurrentDir ? path.basename(process.cwd()) : projectNameInput
  const packageName = toPackageName(rawName)

  await ensureTargetDir(targetDir, parsed.force)
  await copyDir(templateRoot, targetDir)

  const pkg = buildPackageJson({ packageName, template })
  const pkgPath = path.join(targetDir, "package.json")
  await fsp.writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8")

  console.log("\nDone. Created StingJS app:")
  console.log(`  ${targetDir}`)
  console.log(`\nTemplate: ${template}`)
  console.log("\nNext steps:")

  if (!inCurrentDir) {
    const relativeTarget = path.relative(process.cwd(), targetDir)
    const cdTarget = !relativeTarget || relativeTarget.startsWith("..")
      ? targetDir
      : relativeTarget
    console.log(`  cd ${cdTarget}`)
  }

  console.log("  npm install")
  console.log("  npm run dev")
  console.log(`\nRun \`${cliName} --help\` for options.`)
}

function parseArgs(argv) {
  let projectArg = ""
  let templateArg = ""
  let force = false
  let skipPrompts = false
  let help = false

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === "--force" || arg === "-f") {
      force = true
      continue
    }

    if (arg === "--yes" || arg === "-y") {
      skipPrompts = true
      continue
    }

    if (arg === "--help" || arg === "-h") {
      help = true
      continue
    }

    if (arg === "--template" || arg === "-t") {
      const nextArg = argv[index + 1]
      if (!nextArg || nextArg.startsWith("-")) {
        throw new Error("missing value for --template. Use --template javascript or --template typescript.")
      }
      templateArg = nextArg
      index += 1
      continue
    }

    if (arg.startsWith("--template=")) {
      templateArg = arg.slice("--template=".length)
      continue
    }

    if (!arg.startsWith("-") && !projectArg) {
      projectArg = arg
    }
  }

  return { projectArg, templateArg, force, skipPrompts, help }
}

function printHelp(cliName) {
  console.log(cliName)
  console.log("")
  console.log("Usage:")
  console.log(`  ${cliName} [project-name] [options]`)
  console.log("")
  console.log("Options:")
  console.log("  -t, --template <name>  javascript | typescript")
  console.log("  -f, --force            allow scaffolding into a non-empty directory")
  console.log("  -y, --yes              skip prompts and use defaults")
  console.log("  -h, --help             show this message")
}

async function resolveScaffoldOptions({ projectArg, templateArg, skipPrompts }) {
  const normalizedProject = projectArg && projectArg.trim() ? projectArg.trim() : ""
  const normalizedTemplate = normalizeTemplate(templateArg)

  if (skipPrompts) {
    return {
      projectName: normalizedProject || defaultProjectName,
      template: normalizedTemplate || "javascript",
    }
  }

  if (normalizedProject && normalizedTemplate) {
    return {
      projectName: normalizedProject,
      template: normalizedTemplate,
    }
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout })

  try {
    const projectName = normalizedProject || await promptProjectName(rl)
    const template = normalizedTemplate || await promptTemplate(rl)
    return { projectName, template }
  } finally {
    rl.close()
  }
}

async function promptProjectName(rl) {
  const answer = (await rl.question(`Project name (${defaultProjectName}): `)).trim()
  return answer || defaultProjectName
}

async function promptTemplate(rl) {
  for (;;) {
    const answer = (await rl.question("Language? [1] JavaScript [2] TypeScript (1): ")).trim().toLowerCase()

    if (!answer || answer === "1" || answer === "javascript" || answer === "js") {
      return "javascript"
    }

    if (answer === "2" || answer === "typescript" || answer === "ts") {
      return "typescript"
    }

    console.log("Please enter 1 (JavaScript) or 2 (TypeScript).")
  }
}

function normalizeTemplate(input) {
  if (typeof input !== "string") return ""

  const normalized = input.trim().toLowerCase()
  if (!normalized) return ""

  if (normalized === "javascript" || normalized === "js" || normalized === "vanilla" || normalized === "vanilla-js") {
    return "javascript"
  }

  if (normalized === "typescript" || normalized === "ts" || normalized === "vanilla-ts") {
    return "typescript"
  }

  throw new Error(`unknown template \"${input}\". Use \"javascript\" or \"typescript\".`)
}

function buildPackageJson({ packageName, template }) {
  const base = {
    name: packageName,
    private: true,
    version: "0.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview",
    },
    dependencies: {
      "sting-js": "^1.0.0",
    },
    devDependencies: {
      vite: "^7.3.1",
    },
  }

  if (template === "typescript") {
    base.scripts.typecheck = "tsc --noEmit"
    base.devDependencies.typescript = "^5.9.3"
  }

  return base
}

async function ensureTargetDir(targetDir, force) {
  if (!fs.existsSync(targetDir)) {
    await fsp.mkdir(targetDir, { recursive: true })
    return
  }

  const entries = await fsp.readdir(targetDir)
  if (entries.length === 0) return

  if (!force) {
    throw new Error(`target directory is not empty: ${targetDir}. Use --force to continue.`)
  }
}

async function copyDir(srcDir, destDir) {
  const entries = await fsp.readdir(srcDir, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name)
    const name = entry.name === "_gitignore" ? ".gitignore" : entry.name
    const destPath = path.join(destDir, name)

    if (entry.isDirectory()) {
      await fsp.mkdir(destPath, { recursive: true })
      await copyDir(srcPath, destPath)
      continue
    }

    await fsp.copyFile(srcPath, destPath)
  }
}

function toPackageName(input) {
  const trimmed = input.trim().toLowerCase()
  const sanitized = trimmed
    .replace(/^\.+/, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")

  return sanitized || defaultProjectName
}
