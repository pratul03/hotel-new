import js from "@eslint/js";
import tseslint from "typescript-eslint";
import sonarjs from "eslint-plugin-sonarjs";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "prisma/migrations/**",
      "src/__tests__/**",
      "jest.config.js",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts", "prisma.config.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      sonarjs,
    },
    rules: {
      "sonarjs/no-ignored-exceptions": "warn",
      "sonarjs/different-types-comparison": "error",
      "sonarjs/no-dead-store": "error",
      "sonarjs/slow-regex": "warn",
      "sonarjs/cognitive-complexity": ["warn", 25],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
);
