import { FlatCompat } from "@eslint/eslintrc"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) })

const config = [
  { ignores: [".next/**", "node_modules/**", "prototype/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{
          group: ["**/prototype/**", "**/agents/**", "@skilved/agent-*"],
          message: "The public web app must not import prototype or agent execution code.",
        }],
      }],
    },
  },
]

export default config
