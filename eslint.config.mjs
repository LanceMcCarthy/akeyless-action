import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [
    {
        ignores: [
            "**/node_modules/",
            "**/.vscode/",
            "**/action.yml",
            "**/package.json",
            "**/package-lock.json",
            "**/README.md"
        ],
    },
    ...compat.extends(
        "eslint:recommended",
        "plugin:jest/recommended",
    ),
    {
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.commonjs,
            },
            ecmaVersion: "latest",
            sourceType: "commonjs",
        },
        rules: {
            "prefer-template": "warn",
            "no-unused-vars": "off",
            camelcase: "off",
            "no-undef": "off",
        },
    }
];