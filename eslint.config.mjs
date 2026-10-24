import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import linework from "./eslint/linework-plugin.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { linework },
    rules: {
      "linework/class-names": "error",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: ["src/components/**/*.{ts,tsx}"],
    rules: { "linework/no-hex": "error" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
