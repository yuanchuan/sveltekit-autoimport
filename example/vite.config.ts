import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';
import autoimport from '@dijkstra/sveltekit-autoimport'

const config: UserConfig = {
	plugins: [sveltekit()]
};

export default config;
