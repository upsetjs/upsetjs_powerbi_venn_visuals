module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: ['prettier', 'plugin:prettier/recommended', 'plugin:powerbi-visuals/recommended'],
  ignorePatterns: [],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.eslint.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'powerbi-visuals'],
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
  },
  settings: {},
};
