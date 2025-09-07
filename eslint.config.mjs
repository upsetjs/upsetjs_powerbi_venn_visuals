// @ts-check

import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import powerbi from "eslint-plugin-powerbi-visuals";
import prettier from "eslint-config-prettier";

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  powerbi.configs.recommended,
  prettier,
);
