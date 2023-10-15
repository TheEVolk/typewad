import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
// import run from '@rollup/plugin-run';

export default {
  input: 'src/index.ts',
  plugins: [
    typescript(),
    terser(),
    /* run({
      execPath: 'node',
      execArgv: ['./test/test.js'],
    }) */
  ],
  output: [
    {
      file: 'lib/index.mjs',
      format: 'esm'
    }
  ]
};