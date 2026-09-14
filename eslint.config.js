// @ts-check
const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const prettier = require("eslint-config-prettier");

module.exports = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    languageOptions: {
      parserOptions: {
        // Auto-découvre le tsconfig.json le plus proche de chaque fichier linté — nécessaire en
        // monorepo (packages/*, apps/*) plutôt qu'un chemin de projet unique codé en dur.
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-floating-promises": "error",
      "no-console": "warn",
    },
  },
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.next/**",
      "eslint.config.js",
      "packages/database/prisma.config.ts",
      "apps/dashboard/next.config.js",
      "packages/database/scripts/**",
    ],
  },
);
