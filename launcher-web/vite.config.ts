
import { defineConfig, loadEnv } from 'vite';
import solidPlugin from 'vite-plugin-solid';

function minifyOption(env) {
  if (env.VITE_MINIFY == "false") {
    return false;
  } else {
    return undefined;
  }
}

export default ({ mode }) => {
  let env = loadEnv(mode, process.cwd());
  return defineConfig({
    base: "",
    plugins: [
      solidPlugin(),
    ],
    build: {
        target: 'esnext',
        minify: minifyOption(env)
    },
    server: {
        proxy: {
            '/': {
                target: 'http://localhost:8080',
                changeOrigin: true,
              },
        },
    }
})};