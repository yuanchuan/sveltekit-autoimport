import path from 'path';
import { fileURLToPath } from 'url';
import * as svelte from 'svelte/compiler';
import { createFilter } from '@rollup/pluginutils';
import MagicString from 'magic-string';
import { createMapping, walkAST, prependTo, normalizePath, makeArray } from './lib.js';
import type {Plugin} from 'vite'

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
  let preprocess = [];

  function updateMapping() {
    [importMapping, componentPaths] =
      createMapping({ components, module, mapping, filter });
  }

  function transformCode(code, ast, filename) {
    const { imported, maybeUsed, declared } = walkAST(ast);
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
    name: 'sveltekit-autoimport',

    enforce: 'pre',

    // Must be processed before vite-plugin-svelte
    async configResolved(config) {
      let { plugins } = config;
      let indexPluginSvelte = plugins.findIndex(n => n.name === 'vite-plugin-svelte');
      let indexAutoImport = plugins.findIndex(n => n.name === 'sveltekit-autoimport');
      if (indexPluginSvelte < indexAutoImport) {
        throw Error("The AutoImport plugin must come before SvelteKit plugin in your vite config")
      }
      try {
        let dirname = path.dirname(fileURLToPath(import.meta.url));
        let relative = path.relative(dirname, config.inlineConfig.root || config.root);
        let configFile = path.join(relative, './svelte.config.js');
        let pkg = await import(normalizePath('./' + configFile));
        preprocess = pkg.default.preprocess || [];
      } catch(e) {
        console.warn('Error reading svelte.config.js');
      }
    },

    async transform(code, filename) {
      if (!filter(filename)) {
        return null;
      }
      let ast;
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
      console.log(newCode)
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
