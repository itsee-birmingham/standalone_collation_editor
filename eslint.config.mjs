import js from "@eslint/js";
import globals from "globals";

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script",
            globals: {
                ...globals.browser,
                ...globals.jquery
            }
        },
        rules: {
            "no-unused-vars": "error",
            "no-undef": "error"
        }
    }
];