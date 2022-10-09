import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import { autowire } from 'sveltekit-autowire'

const config: UserConfig = {
	plugins: [autowire({
		components: [{ directory: './src/lib', flat: true }],
		module: {
			"svelte": ["onMount"]
		}
	}), sveltekit()]
};

export default config;
