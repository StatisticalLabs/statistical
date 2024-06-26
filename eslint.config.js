import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import nextjsConfig from "eslint-config-neon/flat/next.js";

/** @type {import("typescript-eslint").ConfigWithExtends} */
const baseConfig = {
  languageOptions: {
    parserOptions: {
      project: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
};

/** @type {import("typescript-eslint").ConfigWithExtends} */
const botConfig = {
  ...baseConfig,
  rules: {
    "prettier/prettier": "error",
    quotes: ["error", "double", { avoidEscape: true }],
    semi: ["error", "always"],
    "quote-props": ["error", "as-needed"],
    "prefer-const": "error",
    "no-var": "error",
    "no-async-promise-executor": "off",
    "@typescript-eslint/array-type": "error",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/consistent-type-assertions": "error",
    "@typescript-eslint/consistent-type-imports": "error",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/no-explicit-any": "off",
  },
};

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/",
      ".git/",
      "**/.next/",
      "apps/web/src/components/ui/**",
      "apps/web/.contentlayer/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["apps/bot/**/*.ts"],
    ...botConfig,
  },
  {
    files: ["apps/web/**/*.{ts,tsx,js,jsx}"],
    ...nextjsConfig[0],
    rules: {
      ...nextjsConfig[0].rules,
      "@next/next/no-duplicate-head": 0,
    },
  },
  eslintPluginPrettierRecommended,
);
