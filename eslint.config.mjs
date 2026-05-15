import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "dist/**",
      "source-data/**",
      "public/**",
    ],
  },
  ...nextVitals,
  ...nextTypescript,
];

export default eslintConfig;
