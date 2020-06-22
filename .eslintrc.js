module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: ['prettier/@typescript-eslint', 'plugin:prettier/recommended'],
  ignorePatterns: [],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', '@typescript-eslint/tslint'],
  rules: {
    'no-caller': 'error',
    'no-constant-condition': 'error',
    'no-control-regex': 'error',
    'no-eval': 'error',
    'no-extra-semi': 'error',
    'no-invalid-regexp': 'error',
    'no-octal': 'error',
    'no-octal-escape': 'error',
    'no-regex-spaces': 'error',
    'no-restricted-syntax': ['error', 'ForInStatement'],
    '@typescript-eslint/tslint/config': [
      'error',
      {
        lintFile: './tslint.json',
      },
    ],
  },
  settings: {},
};
