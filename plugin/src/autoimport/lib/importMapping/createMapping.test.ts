import { describe, it, expect } from 'vitest'
import {  ModuleConfig } from '../../types.js'
import { createMapping } from './createMapping.js'

describe("componentMapping", () => {
    it("supports importing modules as namespaces (import * as Namespace from 'module')", () => {
        const moduleConfig: ModuleConfig = {
            "module": ["* as Namespace"]
        }
        const [importMapping, typeDeclarationMapping] = createMapping([], moduleConfig, {}, () => false);
        const importStatement = importMapping["Namespace"]("/");
        const typeDeclaration = typeDeclarationMapping["Namespace"]("/");

        expect(importStatement).toBe("import * as Namespace from 'module'");
        expect(typeDeclaration).toBe('declare const Namespace: typeof import("module");');
    })
    it("supports aliased imports from modules (import {origin as alias} from 'module')", () => {
        const moduleConfig: ModuleConfig = {
            "module": ["origin as alias"]
        }
        const [importMapping, typeDeclarationMapping] = createMapping([], moduleConfig, {}, () => false);
        const importStatement = importMapping["alias"]("/");
        const typeDeclaration = typeDeclarationMapping["alias"]("/");

        expect(importStatement).toBe("import { origin as alias } from 'module'");
        expect(typeDeclaration).toBe('declare const alias: typeof import("module")["origin"];');
    });
    it("supports named imports from modules (import {name} from 'module')", () => {
        const moduleConfig: ModuleConfig = {
            "module": ["name"]
        }
        const [importMapping, typeDeclarationMapping] = createMapping([], moduleConfig, {}, () => false);
        const importStatement = importMapping["name"]("/");
        const typeDeclaration = typeDeclarationMapping["name"]("/");

        expect(importStatement).toBe("import { name } from 'module'");
        expect(typeDeclaration).toBe('declare const name: typeof import("module")["name"];');
    });
})