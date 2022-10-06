import path from 'path';
import * as svelte from 'svelte/compiler';
import { createFilter } from '@rollup/pluginutils';
import MagicString from 'magic-string';
import { createMapping, walkAST, prependTo, makeArray } from './lib.js';
import type {Plugin} from 'vite'
import { enforcePluginOrdering, resolveSveltePreprocessor } from './lib/configHelpers.js';
import { Ast, PreprocessorGroup } from './types.js';

interface PluginOptions {
  components?: string[],
  mapping?: Record<string, string>,
  module?: Record<string, string[]>,
  include?: string[],
  exclude? : string[]
}


export default function autoImport({ components, module, mapping, include, exclude } : PluginOptions= {}) : Plugin {
  if (!include) {
    include = ['**/*.svelte'];
  }
  const filter = createFilter(include, [
    ...makeArray(exclude),
    '**/node_modules/**',
    '**/.git/**',
    '**/.svelte-kit/**',
    '**/.svelte/**'
  ]);

  let importMapping = {};
  let componentPaths = [];
  let preprocess : PreprocessorGroup;

  function updateMapping() {
    [importMapping, componentPaths] =
      createMapping({ components, module, mapping, filter });
  }

  function transformCode(code, ast, filename) {
    const { imported, maybeUsed, declared } = walkAST(ast);
    console.log(imported, maybeUsed, declared);
    const imports = [];
    Object.entries(importMapping).forEach(([name, value]) => {
      if (/\W/.test(name)) {
        return false;
      }
      if (imported.has(name)) {
        return false;
      }
      if (declared.has(name)) {
        return false;
      }
      if (maybeUsed.has(name)) {
        let importValue = (typeof value == 'function')
          ? value(path.dirname(filename))
          : value;
        imports.push(importValue);
      }
    });
    if (imports.length) {
      let value = imports.join('\n');
      if (ast.instance) {
        code = prependTo(code, value, ast.instance.start);
      } else {
        code += `\n<script>${ value }</script>`;
      }
    }
    let s = new MagicString(code, { filename });
    return {
      code: s.toString(),
      map: s.generateMap(),
    }
  }

  updateMapping();

  return {
    name: 'sveltekit-autowire',

    enforce: 'pre',

    // Must be processed before vite-plugin-svelte
    async configResolved(config) {
      enforcePluginOrdering(config.plugins);
      preprocess = await resolveSveltePreprocessor(config);
    },

    async transform(code, filename) {
      if (!filter(filename)) {
        return null;
      }
      let ast : Ast;
      try {
        if (preprocess) {
          let result = await svelte.preprocess(code, preprocess, { filename });
          code = result.code;
        }
        ast = svelte.parse(code);
      } catch (e) {
        console.warn('Error on preprocess:', e.message);
        return null;
      }
      const newCode =  transformCode(code, ast, filename);
      return newCode;
    },

    configureServer(server) {
      if (componentPaths.length) {
        server.watcher
          .add(componentPaths)
          .on('add', updateMapping)
          .on('unlink', updateMapping);
      }
    }
  }
}
