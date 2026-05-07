module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // `unstable_transformImportMeta` rewrites `import.meta.env` references
      // (used by some ESM-only deps such as `zustand/middleware`) into a form
      // that Hermes/Metro can parse. Without it, the Metro bundler throws
      // `SyntaxError: Cannot use 'import.meta' outside a module`.
      // See https://github.com/expo/expo/issues/36384 and
      // https://github.com/pmndrs/zustand/discussions/3438
      ['babel-preset-expo', { unstable_transformImportMeta: true }],
    ],
    plugins: [
      'react-native-worklets/plugin',
    ],
  };
};
