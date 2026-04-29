const HttpsProxyAgent = require('https-proxy-agent');

/*
 * API proxy configuration.
 * This allows you to proxy HTTP request like `http.get('/api/stuff')` to another server/port.
 * This is especially useful during app development to avoid CORS issues while running a local server.
 */
const proxyConfig = {
  '/api': {
    target: 'http://localhost:3000',
    pathRewrite: { '^/api': '' },
    changeOrigin: true,
    secure: false
  }
};

/*
 * Configures a corporate proxy agent for the API proxy if needed.
 */
function setupForCorporateProxy(proxyConfig) {
  const proxyServer = process.env.http_proxy || process.env.HTTP_PROXY;

  if (proxyServer) {
    console.log(`Using corporate proxy server: ${proxyServer}`);
    const agent = new HttpsProxyAgent(proxyServer);
    Object.values(proxyConfig).forEach(entry => { entry.agent = agent; });
  }

  return proxyConfig;
}

module.exports = setupForCorporateProxy(proxyConfig);
