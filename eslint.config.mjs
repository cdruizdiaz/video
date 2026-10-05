import { config } from "@remotion/eslint-config-flat";

export default [
  ...config,
  // Scripts de Node dentro de src/trabajos (preparar audio, transcribir…): tienen console, process, etc.
  {
    files: ["**/*.mjs"],
    languageOptions: { globals: { console: "readonly", process: "readonly" } },
  },
];
