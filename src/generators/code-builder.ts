const INDENT = "  ";

interface DefaultImport {
  module: string;
  name: string;
}

interface NamedImport {
  module: string;
  names: Set<string>;
}

export class CodeBuilder {
  private defaultImports: Map<string, string> = new Map();
  private namedImports: Map<string, Set<string>> = new Map();
  private plugins: Set<string> = new Set();
  private lines: string[] = [];

  // ── Imports ──────────────────────────────────────────────

  addDefaultImport(module: string, name: string): this {
    this.defaultImports.set(module, name);
    return this;
  }

  addImport(module: string, named: string[]): this {
    const existing = this.namedImports.get(module);
    if (existing) {
      for (const n of named) existing.add(n);
    } else {
      this.namedImports.set(module, new Set(named));
    }
    return this;
  }

  getImportBlock(): string {
    const statements: string[] = [];

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

  addPlugin(name: string): this {
    this.plugins.add(name);
    return this;
  }

  getRegistrationBlock(): string {
    if (this.plugins.size === 0) return "";
    const sorted = [...this.plugins].sort();
    return `gsap.registerPlugin(${sorted.join(", ")});`;
  }

  // ── Code body ────────────────────────────────────────────

  addLine(code: string, indent: number = 0): this {
    this.lines.push(`${INDENT.repeat(indent)}${code}`);
    return this;
  }

  addBlock(lines: string[], indent: number = 0): this {
    for (const line of lines) {
      this.addLine(line, indent);
    }
    return this;
  }

  addComment(text: string, indent: number = 0): this {
    this.lines.push(`${INDENT.repeat(indent)}// ${text}`);
    return this;
  }

  newLine(): this {
    this.lines.push("");
    return this;
  }

  // ── Header comment ──────────────────────────────────────

  buildHeaderComment(params: {
    toolName: string;
    target: string;
    method: string;
    plugin?: string;
  }): string {
    const { toolName, target, method, plugin } = params;
    const upperMethod = method.toUpperCase();
    if (plugin) {
      return `// Animates ${target} with ${plugin} (requires: import { ${plugin} } from "gsap/${plugin}")`;
    }
    return `// ${toolName}: Animates ${target} ${upperMethod}`;
  }

  // ── Output ───────────────────────────────────────────────

  build(): string {
    const sections: string[] = [];

    const imports = this.getImportBlock();
    if (imports) sections.push(imports);

    const registration = this.getRegistrationBlock();
    if (registration) sections.push(registration);

    const body = this.lines.join("\n");
    if (body) sections.push(body);

    return sections.join("\n\n");
  }

  buildSnippet(): string {
    return this.lines.join("\n");
  }
}
