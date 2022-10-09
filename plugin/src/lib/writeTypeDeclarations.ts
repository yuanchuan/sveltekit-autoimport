import path from 'path'
import {writeFileSync} from 'fs'
import { TypeDeclarationMapping } from '../types.js'

const PATH_TO_DTS='./.svelte-kit/'
const DTS_NAME='components.d.ts'

export function writeTypeDeclarations(typeDeclarations: TypeDeclarationMapping) {
    let declarationStatements : string[] = [];

    Object.values(typeDeclarations).forEach( getDeclaration => {
        declarationStatements.push(getDeclaration(PATH_TO_DTS));
    })

    writeFileSync(path.resolve(PATH_TO_DTS + DTS_NAME), declarationStatements.join('\n'))
}