import { existsSync, statSync, readdirSync } from 'fs';
import path from 'path';
import { walk } from 'estree-walker';
import { Ast } from './types.js';

/**
 * Finds all the .svelte files that could be autoimported based on the configuration
 */
export function createMapping({ components, module, mapping, filter }): [{}, any[]] {

  const importMapping = {};
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
    componentPaths.push(componentPath);

    traverse(componentPath, filter, filename => {
      let moduleName = getModuleName(componentPath, filename, flat, prefix);
      console.log(moduleName);
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

export function camelize(name) {
  return name
    .replace(/[-_\/\\]+(.{1})/g, toUpperCase)
    .replace(/^(.{1})/, toUpperCase);
}

export function getLastDir(dir) {
  let dirs = dir.split(path.sep).filter(n => n !== 'index');
  return dirs[dirs.length - 1];
}

export function normalizePath(name) {
  return name.replace(/\\/g, '/');
}

/**
 * Resolves the name under which a given Module should be made available, based on the flat, prfix and position relative to root.
 * @param rootPath - The root directory from which names should be resolved
 * @param modulePath - The path to the module file, for which a name is needed
 * @param flat - Only consider the filename. Position does not matter
 * @param prefix - A string with which the module name should be prefixed
 * @returns - A module name for the given path, standardized to CamelCase
 */
export function getModuleName(rootPath: string, modulePath: string, flat: boolean, prefix: string) {
  let moduleName: string;
  if (flat) {
    let parsed = path.parse(modulePath);
    if (parsed.name === 'index') {
      moduleName = camelize(getLastDir(parsed.dir)); //Use the name of the directory, if the module is called "index"
    } else {
      moduleName = camelize(parsed.name);
    }
  } else {
    let parsed = (rootPath === modulePath)
      ? path.parse(path.parse(modulePath).base)
      : path.parse(path.relative(rootPath, modulePath));
    moduleName = camelize(parsed.dir + '_' + parsed.name);
    if (parsed.name === 'index') {
      moduleName = camelize(parsed.dir);
    }
  }
  if (prefix) {
    moduleName = camelize(prefix) + moduleName;
  }
  return moduleName;
}

/**
 * Recursively walkt through the filesystem from the given root path, and call the callback on all files that match the given filter function
 * @param root - The filesystem path from which to start
 * @param filter - A function to determine if a file should be included or not
 * @param callback - The callback to be called with all files that match the filter
 * @returns 
 */
export function traverse(root: string, filter: (arg0: string) => boolean, callback: (filename: string) => any): false | string {
  if (!existsSync(root)) {
    return false; //The given root path does not exist
  }

  if (statSync(root).isFile()) {
    return root; // The root path is the component
  }
  if (!statSync(root).isDirectory()) {
    return false; //The root is not a directory and can't be traversed any further
  }

  //Recursively call traverse, and call the callback on all files that match the filter
  for (let dir of readdirSync(root)) {
    dir = path.join(root, dir);
    let stat = statSync(dir);
    if (stat.isDirectory()) {
      traverse(dir, filter, callback);
    } else if (stat.isFile() && filter(dir)) {
      callback(dir);
    }
  }
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

function toUpperCase(_, c) {
  return String(c).toUpperCase();
}
