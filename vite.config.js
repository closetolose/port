import path from 'node:path';

import { defineConfig, loadEnv } from 'vite';



import { createApiMiddleware } from './server/api.mjs';



const root = process.cwd();



function contentApiPlugin(env) {

  const middleware = createApiMiddleware({ env, root });



  return {

    name: 'content-api',

    configureServer(server) {

      server.middlewares.use(middleware);

    },

    configurePreviewServer(server) {

      server.middlewares.use(middleware);

    },

  };

}



export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, root, '');

  return {

    root: '.',

    server: {

      host: '127.0.0.1',

      port: 5173,

      strictPort: true,

    },

    build: {

      rollupOptions: {

        input: {

          main: path.resolve(root, 'index.html'),

          admin: path.resolve(root, 'admin.html'),

        },

      },

    },

    plugins: [contentApiPlugin(env)],

  };

});

