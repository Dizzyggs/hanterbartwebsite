const typescript = require('@rollup/plugin-typescript');
const commonjs = require('@rollup/plugin-commonjs');
const resolve = require('@rollup/plugin-node-resolve');

module.exports = {
  input: 'netlify/functions/raidhelper.ts',
  output: {
    dir: 'dist/functions',
    format: 'cjs',
    manualChunks: {
      'vendor': ['node-fetch', '@netlify/functions']
    },
    chunkFileNames: '[name]-[hash].js'
  },
  plugins: [
    typescript({
      tsconfig: './netlify/functions/tsconfig.json'
    }),
    resolve({
      preferBuiltins: true
    }),
    commonjs()
  ],
  external: ['@netlify/node-cookies'],
  onwarn(warning, warn) {
    // Suppress chunk size warnings
    if (warning.code === 'CHUNK_SIZE_WARNING') return;
    warn(warning);
  }
}; 