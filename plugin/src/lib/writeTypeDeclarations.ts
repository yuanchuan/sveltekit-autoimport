import path from 'path'
import {writeFileSync} from 'fs'

export function writeTypeDeclarations(typeDeclarations: string[], location: string = "./src/components.d.ts") {
    const declarationFilePath = path.resolve(location)
    writeFileSync(declarationFilePath, typeDeclarations.join('\n'))
}