export type MenuItemId = "comment" | "copy" | "inspect";
export interface MenuItem {
    id: MenuItemId;
    label: string;
    /** Optional small caption rendered below the label. */
    caption?: string;
}
export declare function openMenu(coords: {
    x: number;
    y: number;
}, items: MenuItem[], onPick: (id: MenuItemId) => void): () => void;
//# sourceMappingURL=menu.d.ts.map