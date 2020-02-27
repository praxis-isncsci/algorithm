import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import { terser as minify } from "rollup-plugin-terser";

function config({ output = {}, plugins = [] }) {
  return {
    input: 'src/ISNCSCI.ts',
    output: {
      name: 'ISNCSCI',
      ...output,
    },
    plugins: [
      resolve(),
      typescript({
        tsconfigOverride: output.format === 'cjs' ? {} : {compilerOptions: {declaration:false}},
      }),
      ...plugins
    ]
  }
}

const configs = ['iife','cjs','esm'].map(format => [
  // development - sourcemap
  {
    output:{
      file: `dist/${format}/ISNCSCI.js`,
      format,
      sourcemap: true,
    }
  },
  // production - minify
  {
    output:{
      file: `dist/${format}/ISNCSCI.min.js`,
      format,
    },
    plugins:[
      minify()
    ]
  }
]).reduce((p, c) => [...p, ...c], []);

export default configs.map(c => config(c))