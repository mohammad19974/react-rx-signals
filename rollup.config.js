const typescript = require('@rollup/plugin-typescript');
const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser').default;
const dts = require('rollup-plugin-dts');

const packageJson = require('./package.json');

module.exports = [
  // ESM build
  {
    input: 'src/index.ts',
    output: {
      file: packageJson.module,
      format: 'esm',
      sourcemap: false,
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: false, // We'll generate declarations separately
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
      sourcemap: false,
    },
    plugins: [
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
      sourcemap: false,
    },
    plugins: [
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
  // TypeScript declarations
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    plugins: [dts.default()],
    external: ['react', 'rxjs', 'use-sync-external-store/shim'],
  },
];
