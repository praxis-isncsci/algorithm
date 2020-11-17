import typescript from '@rollup/plugin-typescript';
import { terser as minify } from "rollup-plugin-terser";

function config({ output = {}, plugins = [] }) {
  const dir = `${output.format}`;
  return {
    input: 'src/ISNCSCI.ts',
    output: {
      dir,
      extend: output.format === 'iife',
      name: output.format === 'iife' ? 'window' : undefined,
      exports: 'named',
      ...output,
    },
    plugins: [
      // resolve(),
      typescript({
        declaration: output.format !== 'iife',
        outDir: dir,
      }),
      ...plugins
    ]
  }
}

const configs = ['iife','cjs','esm'].map(format => [
  // development - sourcemap
  {
    output:{
      entryFileNames: `ISNCSCI.js`,
      format,
      sourcemap: true,
    }
  },
  // production - minify
  {
    output:{
      entryFileNames: `ISNCSCI.min.js`,
      format,
    },
    plugins:[
      minify()
    ]
  }
]).reduce((p, c) => [...p, ...c], []);

export default configs.map(c => config(c))