const path = require('path');
const { walk } = require('estree-walker');
const { createFilter } = require('@rollup/pluginutils');

exports.autoImport = autoImport;

/**
 * @param {string|string[]} [components] - Component paths
 * @param {object} [module] - Mapping exported method/property from modules
 * @param {object} [mapping] - Set mapping manually
 * @param {string|string[]} [include]
 * @param {string|String[]} [exclude]
 */
function autoImport({ components, module, mapping, include, exclude } = {}) {
  const filter = createFilter(include, exclude);
  let importMapping = {};

  const updateMapping = () => {
    importMapping = createMapping({ components, module, mapping, filter });
  };

  updateMapping();

  return {
    name: 'autoImport',
    transform: function(code, filePath) {
      if (!filter(filePath) || /\/node_modules/.test(filePath)) {
        return null;
      }
      const ast = this.parse(code);
      const imported = new Set();
      const maybeUsed = new Set();
      walk(ast, {
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
          code = prependTo(code, importValue);
        }
      });
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
        let moduleFrom = path.relative(target, name);
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
  Object.assign(importMapping, makeLiteral(mapping));

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

function prependTo(code, injection) {
  return '\n' + injection + '\n' + code;
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
