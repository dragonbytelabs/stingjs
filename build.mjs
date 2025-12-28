import esbuild from "esbuild"

await esbuild.build({
  entryPoints: ["sting/entry/entry-esm.js"],
  outfile: "dist/sting.mjs",
  bundle: true,
  format: "esm",
  sourcemap: true,
})

await esbuild.build({
  entryPoints: ["sting/entry/entry-global.js"],
  outfile: "dist/sting.global.js",
  bundle: true,
  format: "iife",
  globalName: "sting",
  sourcemap: true,
  footer: { js: "window.sting = sting.default || sting;" },
})
