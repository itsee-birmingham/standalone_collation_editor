/* global module */
module.exports = {
    "plugins": [
        '@stylistic'
      ],
    "ignorePatterns": ['static/CE_core/js/*min.js'],
    "rules": {
        "semi": "error",
        "prefer-const": "warn",
        "no-mixed-spaces-and-tabs": "off",
        "@stylistic/no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
    },
    "env": {
        "browser": true,
        "es2021": true,
        "jquery": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "script"
    },
};
