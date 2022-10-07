import { prependTo, walkAST } from "../lib.js";
import MagicString from 'magic-string';
import path from 'path';
import { Ast } from "../types.js";

export function transformCode(code: string, ast: Ast | undefined, filename: string, importMapping: Record<string, Function>) {
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
            code += `\n<script>${value}</script>`;
        }
    }
    let s = new MagicString(code, { filename });
    return {
        code: s.toString(),
        map: s.generateMap(),
    }
}
