
export default {
  basePath: '/',
  allowedHosts: [
  "localhost",
  "127.0.0.1"
],
  supportedLocales: {
  "en-US": ""
},
  entryPoints: {
    '': () => import('./main.server.mjs')
  },
};
