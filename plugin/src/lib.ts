import path from 'path';
import { walk } from 'estree-walker';
import { Ast, ImportMapping } from './types.js';
import { getModuleName } from './lib/moduleResolution/moduleNaming.js';
import { traverse } from './lib/moduleResolution/fsTraversal.js';

/**
 * Finds all the .svelte files that could be autoimported based on the configuration
 */
export function createMapping({ components, module, mapping, filter }): [ImportMapping, any[]] {

  /* Map Module names to import statements */
  const importMapping : ImportMapping = {};

  /* Base paths to start looking for svelte components. These may be used by the vite filesystem watcher */
  const componentPaths: any[] = [];

  // Read all components from given paths
  // and transform the import names into CamelCase
  makeArray(components).forEach(async comp => {
    let thisComp = comp;
    let flat = false;
    let prefix = '';
    if (comp && typeof comp !== 'string') {
      thisComp = comp.value || comp.name || comp.component || comp.directory;
      if (comp.flat !== undefined) {
        flat = !!comp.flat;
      }
      if (comp.prefix !== undefined) {
        prefix = String(comp.prefix);
      }
    }

    if (!thisComp) {
      // skip
      return false;
    }
    let componentPath = path.resolve(String(thisComp));
    console.log(componentPath);
    componentPaths.push(componentPath);

    /*
      This looks through the filesystem to find all .svelte files that could be imported,
      resolves the Names by which they are imported, 
      and returns functions, which generate the necessary import statements to import the components,
      relative to any modules they might be imported from.
    */
    traverse(componentPath, filter, filename => {
      let moduleName = getModuleName(componentPath, filename, flat, prefix);
      importMapping[moduleName] = target => {
        let moduleFrom = normalizePath(path.relative(target, filename));
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
      let importValue = `import { ${name} } from '${moduleFrom}'`;
      let [origin, alias] = name.split(/\s+as\s+/);
      let key = (alias === undefined) ? origin : alias;
      importMapping[String(key).trim()] = importValue;
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

  return [
    importMapping,
    componentPaths,
  ];
}

export function walkAST(ast: Ast | undefined) {
  const imported = new Set();
  const maybeUsed = new Set();
  const declared = new Set();
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
              // Target v where `let name = v`
              if (parent.init && parent.init.name == node.name) {
                maybeUsed.add(node.name);
              }
              // Target v where `let v = name`
              if (parent.id && parent.id.name == node.name) {
                declared.add(node.name);
              }
              break;
            }
            case 'RestElement': {
              // Target v where `let { ...v } = {} and let [...v] = []`
              if (parent.argument && parent.argument.name == node.name) {
                declared.add(node.name);
              }
            }
            case 'ArrayPattern': {
              // Target v where `let [v] = name`
              if (parent.elements) {
                declared.add(node.name);
              }
            }
            // Target v where `let { v } = {}`
            case 'Property': {
              if (parent.value && parent.value.name === node.name) {
                maybeUsed.add(node.name);
              }
              if (parent.key && parent.key.name === node.name) {
                declared.add(node.name);
              }
              break;
            }
            case 'TaggedTemplateExpression':
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
          maybeUsed.add(String(node.name).split('.')[0]);
        }
        if (node.type === 'Identifier') {
          switch (parent.type) {
            case 'Property': {
              if (parent.vaue && parent.value.name === node.name) {
                maybeUsed.add(node.name);
              }
              break;
            }
            case 'TaggedTemplateExpression':
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
  return { imported, maybeUsed, declared }
}

export function prependTo(code, injection, start) {
  let index = start + (code.slice(start).indexOf('>') + 1);
  let head = code.slice(0, index);
  let tail = code.slice(index);
  return head + '\n' + injection + '\n' + tail;
}


export function getLastDir(dir) {
  let dirs = dir.split(path.sep).filter(n => n !== 'index');
  return dirs[dirs.length - 1];
}

export function normalizePath(name) {
  return name.replace(/\\/g, '/');
}

export function makeArray(arr) {
  if (Array.isArray(arr)) {
    return arr;
  }
  if (arr === undefined || arr === null) {
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
