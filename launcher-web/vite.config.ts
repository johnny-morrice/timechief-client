
import { defineConfig, loadEnv } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import { createHtmlPlugin } from 'vite-plugin-html'

function minifyOption(env) {
  if (env.VITE_MINIFY == "false") {
    return false;
  } else {
    return undefined;
  }
}

function sourcemapOption(env) {
  if (env.VITE_SOURCEMAP == "true") {
    return true;
  } else {
    return false;
  }
}

export default ({ mode }) => {
  let env = loadEnv(mode, process.cwd());
  return defineConfig({
    base: "",
    plugins: [
      solidPlugin(),
      createHtmlPlugin({
        minify: true,
      })
    ],
    build: {
        target: 'esnext',
        minify: minifyOption(env),
        sourcemap: sourcemapOption(env),
    },
    server: {
        proxy: {
            '/web-setup': {
                target: 'http://localhost:8080',
                changeOrigin: true,
              },
              '/auth': {
                target: 'http://localhost:8080',
                changeOrigin: true,
              }
        },
    }
})};