import resolve from 'rollup-plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import { terser as minify } from "rollup-plugin-terser";

function config({ output = {}, plugins = [] }) {
  return {
    input: 'src/ISNCSCI.ts',
    output: {
      name: 'ISNCSCI',
      file: 'dist/ISNCSCI.js',
      format: 'iife',
      ...output,
    },
    plugins: [
      resolve(),
      typescript(),
      ...plugins
    ]
  }
}

const devBuild = {
  output:{
    sourcemap: true
  }
};

const prodBuild = {
  output: {
    file:'dist/ISNCSCI.min.js'
  },
  plugins:[
    minify()
  ]
};

export default [
  config(devBuild),
  config(prodBuild),
]