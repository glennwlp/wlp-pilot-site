import type { ZodTypeAny } from "zod";
import type { SectionManifest } from "./types.js";
export declare const manifests: SectionManifest[];
/**
 * Per-primitive Zod schemas keyed by manifest `name`. Imported by
 * `lib/agent-tools.ts insert_section` (Slice 22C) to validate the agent's
 * `props` argument before the JSX is serialized into the target file.
 *
 * Schema-as-data, not schema-as-types — the agent tool needs the runtime
 * `parse` method, not just the type.
 */
export declare const propsSchemas: Record<string, ZodTypeAny>;
//# sourceMappingURL=manifests.d.ts.map