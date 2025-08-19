const typescript = require('@rollup/plugin-typescript');
const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser').default;
const peerDepsExternal = require('rollup-plugin-peer-deps-external');

const packageJson = require('./package.json');

module.exports = [
  // ESM build
  {
    input: 'src/index.ts',
    output: {
      file: packageJson.module,
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: true,
        declarationDir: 'dist',
        rootDir: 'src',
      }),
    ],
    external: ['react', 'rxjs', 'use-sync-external-store/shim'],
  },
  // CommonJS build
  {
    input: 'src/index.ts',
    output: {
      file: packageJson.main,
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: false,
        declarationDir: undefined,
      }),
    ],
    external: ['react', 'rxjs', 'use-sync-external-store/shim'],
  },
  // Minified ESM build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.min.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: false,
        declarationDir: undefined,
      }),
      terser({
        compress: {
          drop_console: true,
        },
      }),
    ],
    external: ['react', 'rxjs', 'use-sync-external-store/shim'],
  },
];
