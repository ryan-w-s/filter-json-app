import js from "@eslint/js"
import tseslint from "typescript-eslint"
import svelte from "eslint-plugin-svelte"
import globals from "globals"

/** @type {import("eslint").Linter.Config[]} */
export default [
  // Ignore SvelteKit's generated output; we only want to lint our source
  {
    ignores: ["**/.svelte-kit/**"],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs["flat/recommended"],

  // Svelte components
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".svelte"],
      },
    },
  },

  // Browser/TS globals and stylistic rules
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "semi": ["error", "never"],
    },
  },

  // Node-based config files (Vite, Svelte)
  {
    files: ["vite.config.*", "svelte.config.*"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
    },
    rules: {
      // Allow typical config-file patterns
      "@typescript-eslint/no-var-requires": "off",
      "no-undef": "off",
    },
  },
]


