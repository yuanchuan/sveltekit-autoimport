import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import { autowire } from 'sveltekit-autowire'

const config: UserConfig = {
	plugins: [autowire({
		autoimport: {
			components: [{ directory: './src/lib/myComponents', flat: true }],
			module: {
				"svelte": ["onMount"],
				"$lib/Icons": "* as Icons"
			}
		}
	}), sveltekit()]
};

export default config;
