import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "no-var": "error",
      "prefer-const": "error",
      "no-console": "warn",
    },
  },
  {
    files: ["*.config.ts", "*.config.js"],
    rules: { "no-console": "off" },
  },
  {
    ignores: ["node_modules/", "dist/", "coverage/"],
  },
);
