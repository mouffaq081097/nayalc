import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
// import tailwindcssPlugin from "eslint-plugin-tailwindcss"; // Temporarily disabled

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // ...tailwindcssPlugin.configs["flat/recommended"], // Temporarily disabled
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    // settings: { // Temporarily disabled
    //   tailwindcss: {
    //     config: "./tailwind.config.js",
    //     callees: ["classnames", "clsx", "cn"]
    //   }
    // },
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
    rules: {
      "react/no-unescaped-entities": "off",
    },
  },
];

export default eslintConfig;
