export type InlineInputResult = {
    kind: "submit";
    body: string;
} | {
    kind: "cancel";
};
export declare function openInlineInput(coords: {
    x: number;
    y: number;
}, options: {
    placeholder?: string;
    onResolve: (result: InlineInputResult) => void;
}): () => void;
//# sourceMappingURL=inline-input.d.ts.map