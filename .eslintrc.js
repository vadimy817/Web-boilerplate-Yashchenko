module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  globals: {
    _: 'readonly',
    dayjs: 'readonly',
    L: 'readonly',
    Chart: 'readonly',
    WebDataRocks: 'readonly',
  },
  rules: {
    'import/extensions': ['error', 'ignorePackages'],
  },
};
