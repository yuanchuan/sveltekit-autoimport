import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import autoimport from '@dijkstra/sveltekit-autoimport'

const config: UserConfig = {
	plugins: [autoimport({
		components:  [{ name: './src/lib', flat: true } ],
	}), sveltekit()]
};

export default config;
