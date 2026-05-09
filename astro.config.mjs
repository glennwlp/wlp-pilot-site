// @ts-check

import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import wlpIntegration from '@whitelabelpress/astro-integration';

// https://astro.build/config
export default defineConfig({
	integrations: [
		// WhitelabelPRESS picker overlay + data-wlp-source emission.
		// Activates only when the page is loaded with `?wlp=preview`
		// inside an iframe whose parent origin is in the allowlist below.
		wlpIntegration({
			allowedParentOrigins: [
				'https://app.whitelabelpress.com',
				'http://localhost:3000',
			],
		}),
	],
	vite: {
		plugins: [tailwindcss()],
	},
});
