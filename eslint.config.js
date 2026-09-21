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
        // Auto discovers the nearest tsconfig.json for each linted file, which a monorepo
        // (packages/*, apps/*) needs rather than one hardcoded project path.
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
    // Repository tooling run from a terminal, where the console is the output.
    files: ["scripts/**/*.ts"],
    rules: { "no-console": "off" },
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
