import { walk } from 'estree-walker';
import { Ast } from './types.js';

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