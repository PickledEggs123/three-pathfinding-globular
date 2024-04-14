import { resolve } from 'path';

export default {
	root: 'demo',
	publicDir: './assets',
	resolve: { alias: { '@pickledeggs123/three-pathfinding': '../' } },
	build: {
		rollupOptions: {
			input: {
				index: resolve(__dirname, 'index.html'),
				teleport: resolve(__dirname, 'teleport.html'),
			},
		},
	},
};
