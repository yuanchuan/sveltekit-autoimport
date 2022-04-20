import path from 'path';
import { fileURLToPath } from 'url';
import * as svelte from 'svelte/compiler';
import { createFilter } from '@rollup/pluginutils';
import { createMapping, walkAST, prependTo, normalizePath } from './lib.js';
import MagicString from 'magic-string';

/**
 * @param {string|string[]} [components] - Component paths
 * @param {object} [module] - Mapping exported method/property from modules
 * @param {object} [mapping] - Set mapping manually
 * @param {string|string[]} [include]
 * @param {string|String[]} [exclude]
 */
export default function autoImport({ components, module, mapping, include, exclude } = {}) {
  if (!include) {
    include = ['**/*.svelte'];
  }
  const filter = createFilter(include, exclude);

  let importMapping = {};
  let componentPaths = [];
  let preprocess = [];

  function updateMapping() {
    [importMapping, componentPaths] =
      createMapping({ components, module, mapping, filter });
  }

  function transformCode(code, ast, filePath) {
    const { imported, maybeUsed } = walkAST(ast);
    const imports = [];
    Object.entries(importMapping).forEach(([name, value]) => {
      if (/\W/.test(name)) {
        return false;
      }
      if (imported.has(name)) {
        return false;
      }
      if (maybeUsed.has(name)) {
        let importValue = (typeof value == 'function')
          ? value(path.dirname(filePath))
          : value;
        imports.push(importValue);
      }
    });
    if (imports.length) {
      let value = imports.join('\n');
      if (ast.instance) {
        code = prependTo(code, value, ast.instance.start);
      } else {
        code += `<script>${ value }</script>`;
      }
    }
    return code;
  }

  updateMapping();

  return {
    name: 'vite-plugin-autoimport',

    enforce: 'pre',

    // Must be processed before vite-plugin-svelte
    async configResolved(config) {
      let { plugins } = config;
      let indexPluginSvelte = plugins.findIndex(n => n.name === 'vite-plugin-svelte');
      let indexAutoImport = plugins.findIndex(n => n.name === 'vite-plugin-autoimport');
      if (indexPluginSvelte < indexAutoImport) {
        let autoImport = plugins[indexAutoImport];
        plugins.splice(indexAutoImport, 1);
        config.plugins = [
          ...plugins.slice(0, indexPluginSvelte),
          autoImport,
          ...plugins.slice(indexPluginSvelte + 1)
        ];
      }
      try {
        let dirname = path.dirname(fileURLToPath(import.meta.url));
        let relative = path.relative(dirname, config.inlineConfig.root);
        let configFile = path.join(relative, './svelte.config.js');
        let pkg = await import(normalizePath('./' + configFile));
        preprocess = pkg.default.preprocess || [];
      } catch(e) {
        console.warn('Error reading svelte.config.js');
      }
    },

    async transform(code, filePath) {
      if (!filter(filePath) || /\/node_modules/.test(filePath)) {
        return null;
      }
      let ast;
      try {
        if (preprocess && preprocess.length) {
          let result = await svelte.preprocess(code, preprocess);
          code = result.code;
        }
        ast = svelte.parse(code);
      } catch (e) {
        return null;
      }
      return transformCode(code, ast, filePath);
    },

    configureServer(server) {
      if (componentPaths.length) {
        server.watcher
          .add(componentPaths)
          .on('add', updateMapping)
          .on('unlink', updateMapping);
      }
    },

    /* As svelte preprocessor */
    markup({ content, filename }) {
      if (!filter(filename) || /\/node_modules/.test(filename)) {
        return null;
      }
      let ast;
      try {
        ast = svelte.parse(content);
      } catch (e) {
        return null;
      }
      const code = transformCode(content, ast, filename);
      const s = new MagicString(code, { filename });
      return {
        code: s.toString(),
        map: s.generateMap(),
      }
    }

  }
}
