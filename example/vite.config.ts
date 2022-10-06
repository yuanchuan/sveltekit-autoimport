import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import autowire from 'sveltekit-autowire'

const config: UserConfig = {
	plugins: [autowire({
		components:  [{ name: './src/lib', flat: true } ],
	}), sveltekit()]
};

export default config;
