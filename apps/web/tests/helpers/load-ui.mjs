import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
const require = createRequire(import.meta.url), ts = require("typescript")
const src = fileURLToPath(new URL("../../src/", import.meta.url))

// Render the real UI and its local dependencies; callers replace only external boundaries.
export function loadUi(path, overrides = {}) {
  const cache = new Map()
  function load(file) {
    if (cache.has(file)) return cache.get(file)
    const exports = {}; cache.set(file, exports)
    const output = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } })
    new Function("require", "exports", output.outputText)(id => {
      if (Object.hasOwn(overrides, id)) return overrides[id]
      if (id.startsWith("@/") || id.startsWith(".")) {
        const base = id.startsWith("@/") ? resolve(src, id.slice(2)) : resolve(dirname(file), id)
        for (const extension of [".tsx", ".ts", ""]) {
          try { readFileSync(base + extension); return load(base + extension) } catch (error) { if (error.code !== "ENOENT") throw error }
        }
      }
      return require(id)
    }, exports)
    return exports
  }
  return load(resolve(src, path))
}
