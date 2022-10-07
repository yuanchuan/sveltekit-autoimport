import { walkAST } from "../lib.js";
import MagicString from 'magic-string';
import path from 'path';
import { Ast, ImportMapping } from "../types.js";

export function transformCode(code: string, ast: Ast | undefined, filePath: string, importMapping: ImportMapping) {
    const { imported, maybeUsed, declared } = walkAST(ast);

    /* A list of import statements that need to be added to the current file */
    const imports: string[] = [];
    Object.entries(importMapping).forEach(([name, value]) => {

        if (/\W/.test(name)) return;    //If the ModuleName contains whitespace, it's invalid
        if (imported.has(name)) return; //If the module is already imported in this file, skip adding the import
        if (declared.has(name)) return; //If the module is declared in this file, don't add an import
        if (!maybeUsed.has(name)) return; //If there is no way for this module to be used in this file, don't import it

        let importValue = value(path.dirname(filePath)) //Create an import-statement relative to the current file
        imports.push(importValue);

    });

    if (imports.length) {
        let value = imports.join('\n');
        if (ast.instance) {
            //Find a <script> tag inside the code, and ad d the imports to it
            code = prependTo(code, value, ast.instance.start);
        } else {
            code += `\n<script>${value}</script>`; //No script tag is defined inside the file, so add one
        }
    }
    //TODO propper sourcemaps
    let s = new MagicString(code, { filename: filePath });
    return {
        code: s.toString(),
        map: s.generateMap(),
    }
}


/**
 * Injects a string into a <script> tag inside a piece of code. Starts after a given start index
 * @param code 
 * @param injection 
 * @param start 
 * @returns 
 */
function prependTo(code: string, injection: string, start: number)  : string{
    let index = start + (code.slice(start).indexOf('>') + 1);
    let head = code.slice(0, index);
    let tail = code.slice(index);
    return head + '\n' + injection + '\n' + tail;
}
