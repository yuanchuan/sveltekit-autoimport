import path from 'path'
import {writeFileSync, mkdirSync} from 'fs'
import { TypeDeclarationMapping } from '../types.js'

const DTS_DIR='./.svelte-kit/'
const DTS_NAME='components.d.ts'

export function writeTypeDeclarations(typeDeclarations: TypeDeclarationMapping) {
    let declarationStatements : string[] = [];

    Object.values(typeDeclarations).forEach( getDeclaration => {
        declarationStatements.push(getDeclaration(DTS_DIR));
    })

    //Creating the directory, if it does not already exist. This is harmless in case it already does exist
    mkdirSync(path.resolve(DTS_DIR), { recursive: true });
    writeFileSync(path.resolve(DTS_DIR + DTS_NAME), declarationStatements.join('\n'))
}