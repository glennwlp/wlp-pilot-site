declare global {
    interface Window {
        __wlpPickerInstalled?: boolean;
        /**
         * Build-time-injected list of origins this iframe will trust as a
         * portal. Set by the integration's `injectScript` stub before this
         * picker module loads. Defaults below are used if the stub didn't
         * set anything (developer running locally without configuration).
         */
        __wlpAllowedParentOrigins?: string[];
    }
}
export declare function installPicker(): void;
//# sourceMappingURL=picker.d.ts.map