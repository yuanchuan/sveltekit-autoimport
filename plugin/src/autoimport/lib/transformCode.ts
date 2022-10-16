import { walkAST } from "./parsing/walkAST.js";
import MagicString from 'magic-string';
import path from 'path';
import { Ast, ImportMapping } from "../types.js";

export function transformCode(code: string, ast: Ast | undefined, filePath: string, importMapping: ImportMapping) {
    const { imported, maybeUsed, declared } = walkAST(ast);

    /* A list of import statements that need to be added to the current file */
    const imports: string[] = [];
    Object.entries(importMapping).forEach(([name, getImportStatement]) => {

        if (/\W/.test(name)) return;    //If the ModuleName contains whitespace, it's invalid
        if (imported.has(name)) return; //If the module is already imported in this file, skip adding the import
        if (declared.has(name)) return; //If the module is declared in this file, don't add an import
        if (!maybeUsed.has(name)) return; //If there is no way for this module to be used in this file, don't import it

        let importValue = getImportStatement(path.dirname(filePath)) //Create an import-statement relative to the current file
        imports.push(importValue);

    });

    const s = new MagicString(code, { filename: filePath });

    if (imports.length) {
        let value = imports.join('\n');
        const hasScriptTag = !!ast.instance;
        if (hasScriptTag) {

            const scriptTagStart = ast.instance.start;
            const scriptTagEnd =  scriptTagStart + (code.slice(scriptTagStart).indexOf('>'));
            
            s.prependLeft(scriptTagEnd + 1, value);
        } else {
            const importScriptTag = `\n<script>${value}</script>`
            s.append(importScriptTag);
        }
    }

    return {
        code: s.toString(),
        map: s.generateMap(),
    }
}