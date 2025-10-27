import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default [
  // CommonJS (for Node) and ES module (for bundlers) build
  {
    input: 'src/index.ts',
    external: ['axios'],
    output: [
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: pkg.module,
        format: 'es',
        sourcemap: true,
      },
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist',
      }),
      resolve(),
      commonjs(),
    ],
  },
  // UMD build for browsers
  {
    input: 'src/index.ts',
    external: ['axios'],
    output: {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'AGLWebSDK',
      sourcemap: true,
      globals: {
        axios: 'axios',
      },
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
      resolve(),
      commonjs(),
    ],
  },
];
