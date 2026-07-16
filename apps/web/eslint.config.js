// @ts-check
const { FlatCompat } = require("@eslint/eslintrc");
const path = require("path");

const compat = new FlatCompat({
  baseDirectory: path.join(__dirname),
});

module.exports = [
  ...compat.config({
    extends: ["next/core-web-vitals"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  }),
];
