
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

export default ({ mode }) => {
  let env = loadEnv(mode, process.cwd());
  return defineConfig({
    base: "",
    plugins: [
      solidPlugin(),
      createHtmlPlugin({
        minify: true,
        inject: {
          data: {
            importGoogleMaps: `<script src="https://maps.googleapis.com/maps/api/js?key=${env.VITE_GOOGLE_MAPS_KEY}&libraries=places&v=quarterly" defer></script>`,
          }
        }
      })
    ],
    build: {
        target: 'esnext',
        minify: minifyOption(env)
    },
    server: {
        proxy: {
            '/api': {
                target: 'https://weather-clock-service-test.herokuapp.com',
                changeOrigin: true,
                secure: true
              },
              '/www': {
                target: 'https://weather-clock-service-test.herokuapp.com',
                changeOrigin: true,
                secure: true,
                rewrite: (path) => path.replace("/bff", "")
              },
              '/authn': {
                target: 'https://weather-clock-service-test.herokuapp.com',
                changeOrigin: true,
                secure: true
              }
        },
    }
})};