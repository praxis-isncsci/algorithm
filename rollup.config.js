import typescript from '@rollup/plugin-typescript';
import { terser as minify } from "rollup-plugin-terser";

function config({ output = {}, plugins = [] }) {
  return {
    input: 'src/ISNCSCI.ts',
    output: {
      name: 'ISNCSCI',
      ...output,
    },
    plugins: [
      // resolve(),
      typescript({
        declaration: output.format === 'cjs',
        outDir: output.dir,
      }),
      ...plugins
    ]
  }
}

const configs = ['iife','cjs','esm'].map(format => [
  // development - sourcemap
  {
    output:{
      dir: `dist/${format}`,
      entryFileNames: `ISNCSCI.js`,
      exports: 'named',
      format,
      sourcemap: true,
    }
  },
  // production - minify
  {
    output:{
      dir: `dist/${format}`,
      entryFileNames: `ISNCSCI.min.js`,
      exports: 'named',
      format,
    },
    plugins:[
      minify()
    ]
  }
]).reduce((p, c) => [...p, ...c], []);

export default configs.map(c => config(c))