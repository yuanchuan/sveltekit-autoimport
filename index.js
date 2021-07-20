import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as svelte from 'svelte/compiler';
import { walk } from 'estree-walker';
import { createFilter } from '@rollup/pluginutils';


/**
 * @param {string|string[]} [components] - Component paths
 * @param {object} [module] - Mapping exported method/property from modules
 * @param {object} [mapping] - Set mapping manually
 * @param {string|string[]} [include]
 * @param {string|String[]} [exclude]
 */
export default function autoImport({ components, module, mapping, include, exclude } = {}) {
  const filter = createFilter(include, exclude);

  let importMapping = {};
  let preprocess = [];

  const updateMapping = () => {
    importMapping = createMapping({ components, module, mapping, filter });
  };

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
        preprocess = pkg.default.preprocess;
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
        if (preprocess.length) {
          let result = await svelte.preprocess(code, preprocess);
          code = result.code;
        }
        ast = svelte.parse(code);
      } catch (e) {
        return null;
      }

      const imported = new Set();
      const maybeUsed = new Set();

      if (ast.instance && ast.instance.content) {
        walk(ast.instance.content, {
          enter(node, parent) {
            if (node.type === 'ImportDeclaration') {
              node.specifiers.forEach(sf => {
                imported.add(sf.local.name);
              });
            }
            if (node.type === 'Identifier') {
              switch (parent.type) {
                case 'VariableDeclarator': {
                  if (parent.init && parent.init.name == node.name) {
                    maybeUsed.add(node.name);
                  }
                  break;
                }
                case 'Property': {
                  if (parent.vaue && parent.value.name === node.name) {
                    maybeUsed.add(node.name);
                  }
                  break;
                }
                case 'ArrayExpression':
                case 'CallExpression':
                case 'NewExpression':
                case 'MemberExpression': {
                  maybeUsed.add(node.name);
                  break;
                }
              }
            }
            if (node.type == 'ExportDefaultDeclaration') {
              let name = node.declaration.name;
              if (maybeUsed.has(name)) {
                maybeUsed.delete(name);
              }
            }
          }
        });
      }

      if (ast.html && ast.html.children) {
        walk(ast.html.children, {
          enter(node, parent) {
            if (node.type == 'InlineComponent' && !/^svelte:/.test(node.name)) {
              maybeUsed.add(node.name);
            }
            if (node.type === 'Identifier') {
              switch (parent.type) {
                case 'Property': {
                  if (parent.vaue && parent.value.name === node.name) {
                    maybeUsed.add(node.name);
                  }
                  break;
                }
                case 'ArrayExpression':
                case 'CallExpression':
                case 'NewExpression':
                case 'MemberExpression': {
                  maybeUsed.add(node.name);
                  break;
                }
              }
            }
          }
        });
      }

      let imports = [];
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
    },
    configureServer(server) {
      let componentPaths = makeArray(components).map(n => path.resolve(n));
      if (componentPaths.length) {
        server.watcher
          .add(componentPaths)
          .on('add', updateMapping)
          .on('unlink', updateMapping);
      }
    }
  }
}

function createMapping({ components, module, mapping, filter }) {
  const importMapping = {};

  // Read all components from given paths
  // and transform the import names into CamelCase
  makeArray(components).forEach(comp => {
    let componentPath = path.resolve(comp);
    traverse(componentPath, name => {
      if (!filter(name)) {
        return false;
      }
      let parsed = path.parse(name);
      let moduleName = camelize(parsed.name);
      if (parsed.name === 'index') {
        moduleName = camelize(getLastDir(parsed.dir));
      }
      importMapping[moduleName] = target => {
        let moduleFrom = normalizePath(path.relative(target, name));
        if (!moduleFrom.startsWith('.')) {
          moduleFrom = './' + moduleFrom;
        }
        return `import ${moduleName} from '${moduleFrom}'`
      }
    });
  });

  // Select methods or properties from a given module
  Object.entries(makeLiteral(module)).forEach(([moduleFrom, names]) => {
    makeArray(names).forEach(name => {
      importMapping[name] = `import { ${name} } from '${moduleFrom}'`;
    });
  });

  // Custom mapping is useful for overwriting and
  // import things other than components
  Object.entries(makeLiteral(mapping)).forEach(([name, value]) => {
    if (typeof value === 'string') {
      importMapping[name] = value;
    }
    if (typeof value === 'function') {
      importMapping[name] = `;let ${name} = () => { ${value()} };`;
    }
  });
  return importMapping;
}

function makeArray(arr) {
  if (Array.isArray(arr)) {
    return arr;
  }
  if (arr !== undefined && arr !== null) {
    return [];
  }
  return [arr];
}

function makeLiteral(obj) {
  if (obj && obj.constructor === Object) {
    return obj;
  }
  return {};
}

function prependTo(code, injection, start) {
  let head = code.slice(0, start + 8);
  let tail = code.slice(start + 8);

  return head + '\n' + injection + '\n' + tail;
}

function toUpperCase(_, c) {
  return String(c).toUpperCase();
}

function camelize(name) {
  return name
    .replace(/[-_]+(.{1})/g, toUpperCase)
    .replace(/^(.{1})/, toUpperCase);
}

function getLastDir(dir) {
  let dirs = dir.split(path.sep).filter(n => n !== 'index');
  return dirs[dirs.length - 1];
}

function normalizePath(name) {
  return name.replace(/\\/g, '/');
}

function traverse(root, fn) {
  if (!fs.existsSync(root)) {
    return false;
  }
  if (!fs.statSync(root).isDirectory()) {
    return false;
  }
  let originRoot = root;
  fs.readdirSync(root).forEach(dir => {
    dir = path.join(originRoot, dir);
    let stat = fs.statSync(dir);
    if (stat.isDirectory()) {
      traverse(dir, fn);
    } else if (stat.isFile()) {
      fn(dir);
    }
  });
}
