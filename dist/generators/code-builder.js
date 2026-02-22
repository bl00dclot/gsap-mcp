const INDENT = "  ";
export class CodeBuilder {
    defaultImports = new Map();
    namedImports = new Map();
    plugins = new Set();
    lines = [];
    // ── Imports ──────────────────────────────────────────────
    addDefaultImport(module, name) {
        this.defaultImports.set(module, name);
        return this;
    }
    addImport(module, named) {
        const existing = this.namedImports.get(module);
        if (existing) {
            for (const n of named)
                existing.add(n);
        }
        else {
            this.namedImports.set(module, new Set(named));
        }
        return this;
    }
    getImportBlock() {
        const statements = [];
        for (const [module, name] of this.defaultImports) {
            statements.push(`import ${name} from "${module}";`);
        }
        for (const [module, names] of this.namedImports) {
            const sorted = [...names].sort();
            statements.push(`import { ${sorted.join(", ")} } from "${module}";`);
        }
        return statements.join("\n");
    }
    // ── Plugin registration ──────────────────────────────────
    addPlugin(name) {
        this.plugins.add(name);
        return this;
    }
    getRegistrationBlock() {
        if (this.plugins.size === 0)
            return "";
        const sorted = [...this.plugins].sort();
        return `gsap.registerPlugin(${sorted.join(", ")});`;
    }
    // ── Code body ────────────────────────────────────────────
    addLine(code, indent = 0) {
        this.lines.push(`${INDENT.repeat(indent)}${code}`);
        return this;
    }
    addBlock(lines, indent = 0) {
        for (const line of lines) {
            this.addLine(line, indent);
        }
        return this;
    }
    addComment(text, indent = 0) {
        this.lines.push(`${INDENT.repeat(indent)}// ${text}`);
        return this;
    }
    newLine() {
        this.lines.push("");
        return this;
    }
    // ── Output ───────────────────────────────────────────────
    build() {
        const sections = [];
        const imports = this.getImportBlock();
        if (imports)
            sections.push(imports);
        const registration = this.getRegistrationBlock();
        if (registration)
            sections.push(registration);
        const body = this.lines.join("\n");
        if (body)
            sections.push(body);
        return sections.join("\n\n");
    }
    buildSnippet() {
        return this.lines.join("\n");
    }
}
