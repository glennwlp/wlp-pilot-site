// Vite plugin that walks .astro files at build/dev time and injects
// `data-wlp-source` attributes onto elements that bind a content-constant
// field. The portal's overlay (./overlay/picker.ts) only highlights elements
// carrying this attribute, so emission is what makes a page picker-eligible.
//
// Cases covered:
//   - Markup expression child (Slice 1):  `<h1>{HERO_CONTENT.headline}</h1>`
//     emits `data-wlp-source` (kind defaults to text).
//   - Attribute expression (Slice 2):     `<img src={HERO_CONTENT.image} />`
//     emits `data-wlp-source` + `data-wlp-kind="image"`. Same for `<source>`,
//     `<picture>`-children, and `<video>` (kind="video").
//
// NOT covered yet (acceptable; upgrade in a follow-up):
//   - expressions inside JSX-style helpers (e.g. `{items.map((it) => ...)}`)
//   - tags whose inner expression is wrapped in a fragment / multiple children
//   - expressions referring to imported values (only top-level `const`s in
//     the same .astro frontmatter are picked up)
//
// On any failure (parse error, unfamiliar shape) we leave the file untouched
// — emission is best-effort, never breaks the build.
import { parse as parseAstro } from "@astrojs/compiler";
import { parse as parseJs } from "@babel/parser";
const TAGLIKE_TYPES = new Set([
    "element",
    "component",
    "custom-element",
    "fragment",
]);
export function wlpAstroVitePlugin(options = {}) {
    const root = options.root ?? process.cwd();
    return {
        name: "@whitelabelpress/astro-integration:emit-source-refs",
        enforce: "pre",
        async transform(code, id) {
            if (!id.endsWith(".astro"))
                return null;
            // Skip files inside node_modules — only walk the user's own .astro files.
            if (id.includes("/node_modules/"))
                return null;
            const relPath = toRelativePath(id, root);
            let ast;
            try {
                const result = await parseAstro(code, { position: true });
                ast = result.ast;
            }
            catch {
                // Don't break the build over our injection.
                return null;
            }
            const constNames = collectFrontmatterConstNames(ast);
            if (constNames.size === 0)
                return null;
            const insertions = collectInsertions(ast, constNames, relPath);
            if (insertions.length === 0)
                return null;
            // Apply insertions from highest offset to lowest so earlier offsets
            // remain valid.
            insertions.sort((a, b) => b.offset - a.offset);
            let out = code;
            for (const ins of insertions) {
                out = out.slice(0, ins.offset) + ins.text + out.slice(ins.offset);
            }
            return { code: out, map: null };
        },
    };
}
function toRelativePath(id, root) {
    // Strip any vite-style query string (`?astro&type=script` etc).
    const clean = id.split("?")[0];
    if (clean.startsWith(root + "/"))
        return clean.slice(root.length + 1);
    if (clean.startsWith(root))
        return clean.slice(root.length).replace(/^\/+/, "");
    return clean.replace(/^\/+/, "");
}
function collectFrontmatterConstNames(ast) {
    const names = new Set();
    for (const child of ast.children ?? []) {
        if (child.type !== "frontmatter")
            continue;
        let program;
        try {
            program = parseJs(child.value, {
                sourceType: "module",
                plugins: ["typescript", "jsx"],
            }).program;
        }
        catch {
            return names;
        }
        for (const stmt of program.body) {
            const decl = stmt.type === "VariableDeclaration"
                ? stmt
                : stmt.type === "ExportNamedDeclaration" &&
                    stmt.declaration?.type === "VariableDeclaration"
                    ? stmt.declaration
                    : null;
            if (!decl)
                continue;
            for (const declarator of decl.declarations) {
                if (declarator.id.type === "Identifier" && declarator.init) {
                    names.add(declarator.id.name);
                }
            }
        }
    }
    return names;
}
function collectInsertions(ast, constNames, relPath) {
    // Per-element dedupe: an element with both a child markup expression AND
    // a media src attribute that resolve to source-refs gets one insertion,
    // not two. Map keyed by tag-open offset (unique per element).
    const byElement = new Map();
    walk(ast, [], (node, ancestors) => {
        // (1) Markup-expression child case — Slice 1 path.
        if (node.type === "expression") {
            const sourceRef = analyzeExpression(node, constNames, relPath);
            if (!sourceRef)
                return;
            const parent = nearestTagLike(ancestors);
            if (!parent)
                return;
            maybePush(byElement, parent, sourceRef, undefined);
            return;
        }
        // (2) Attribute-expression case — Slice 2 path. Only fires for the
        // image/video tags; other elements with `src={X.y}` don't have an
        // editable interpretation in the portal yet.
        if (node.type !== "element")
            return;
        const el = node;
        const kind = mediaKindForTag(el, ancestors);
        if (!kind)
            return;
        for (const attr of el.attributes) {
            if (attr.kind !== "expression")
                continue;
            if (attr.name !== "src" && attr.name !== "srcset")
                continue;
            const sourceRef = analyzeExpressionString(attr.value, constNames, relPath);
            if (!sourceRef)
                continue;
            maybePush(byElement, el, sourceRef, kind);
            // First matched src/srcset wins; don't double-emit on the same tag.
            break;
        }
    });
    return Array.from(byElement.values());
}
function maybePush(byElement, el, sourceRef, kind) {
    // Skip if the element already carries a manual data-wlp-source.
    if (el.attributes.some((a) => a.name === "data-wlp-source"))
        return;
    const startOffset = el.position?.start?.offset;
    if (typeof startOffset !== "number")
        return;
    if (typeof el.name !== "string" || el.name.length === 0)
        return;
    // Already enqueued for this element (Slice 1 markup hit beat Slice 2 attr,
    // or vice versa) — first match wins, deterministic by walk order.
    if (byElement.has(startOffset))
        return;
    const tagOpenLen = 1 + el.name.length; // `<tagname`
    const text = kind
        ? ` data-wlp-source="${escapeAttr(sourceRef)}" data-wlp-kind="${kind}"`
        : ` data-wlp-source="${escapeAttr(sourceRef)}"`;
    byElement.set(startOffset, {
        offset: startOffset + tagOpenLen,
        text,
    });
}
function mediaKindForTag(el, ancestors) {
    if (el.name === "img" || el.name === "picture")
        return "image";
    if (el.name === "video")
        return "video";
    if (el.name === "source") {
        // <source> inherits its kind from the closest media-element parent.
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const a = ancestors[i];
            if (a.type !== "element")
                continue;
            const name = a.name;
            if (name === "video")
                return "video";
            if (name === "picture" || name === "audio")
                return "image";
        }
        return null;
    }
    return null;
}
function walk(node, ancestors, visit) {
    visit(node, ancestors);
    if ("children" in node && Array.isArray(node.children)) {
        const next = [...ancestors, node];
        for (const child of node.children) {
            walk(child, next, visit);
        }
    }
}
function nearestTagLike(ancestors) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
        const a = ancestors[i];
        if (TAGLIKE_TYPES.has(a.type)) {
            // Fragment has no real tag and no position to anchor to — skip it.
            // Real elements/components always have a name + position.
            const tag = a;
            if (tag.type === "fragment")
                continue;
            if (typeof tag.position?.start?.offset !== "number")
                continue;
            // Element nodes always have a name (`<h1>`, `<MyComp>`).
            const e = tag;
            if (typeof e.name !== "string" || e.name.length === 0)
                continue;
            return tag;
        }
    }
    return null;
}
/**
 * If the expression's body is a single member-expression rooted at one of
 * the known content-constant names, format it as a source-ref.
 */
function analyzeExpression(expr, constNames, relPath) {
    // ExpressionNode children are TextNodes whose `.value` is the raw JS.
    // Concatenate to handle pre-Astro-5 chunking quirks.
    let raw = "";
    for (const child of expr.children) {
        if (child.type === "text")
            raw += child.value;
        else
            return null; // Reject mixed/nested expression bodies.
    }
    return analyzeExpressionString(raw, constNames, relPath);
}
/**
 * Same analysis as `analyzeExpression` but takes the raw JS as a string —
 * for attribute expressions where the AST already gives us `attr.value`.
 */
function analyzeExpressionString(raw, constNames, relPath) {
    raw = raw.trim();
    if (raw.length === 0)
        return null;
    let body;
    try {
        body = parseJs(raw, {
            sourceType: "module",
            plugins: ["typescript", "jsx"],
        });
    }
    catch {
        return null;
    }
    if (body.program.body.length !== 1)
        return null;
    const stmt = body.program.body[0];
    if (stmt.type !== "ExpressionStatement")
        return null;
    const refRoot = stmt.expression;
    const path = [];
    const constName = walkMemberChain(refRoot, path, constNames);
    if (!constName)
        return null;
    if (path.length === 0)
        return null;
    return `astro:${relPath}:${constName}${formatFieldPath(path)}`;
}
/**
 * Recurse into a MemberExpression chain, building up the field path. Returns
 * the rooted const name when the chain bottoms out at an Identifier in the
 * known set, or null if the expression isn't a simple member chain.
 */
function walkMemberChain(node, out, constNames) {
    if (node.type === "Identifier") {
        return constNames.has(node.name)
            ? node.name
            : null;
    }
    if (node.type !== "MemberExpression")
        return null;
    const me = node;
    if (me.computed) {
        if (me.property.type !== "NumericLiteral")
            return null;
        const lit = me.property;
        if (!Number.isInteger(lit.value) || lit.value < 0)
            return null;
        const root = walkMemberChain(me.object, out, constNames);
        if (!root)
            return null;
        out.push({ kind: "index", index: lit.value });
        return root;
    }
    if (me.property.type !== "Identifier")
        return null;
    const root = walkMemberChain(me.object, out, constNames);
    if (!root)
        return null;
    out.push({ kind: "key", key: me.property.name });
    return root;
}
function formatFieldPath(steps) {
    let s = "";
    for (const step of steps) {
        if (step.kind === "key")
            s += `.${step.key}`;
        else
            s += `[${step.index}]`;
    }
    return s;
}
function escapeAttr(s) {
    return s
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;");
}
//# sourceMappingURL=vite-plugin.js.map