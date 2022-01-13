const { globalAgent } = require('https');
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    createProxyMiddleware("/api", {
      target: "https://mux-monitor.aws.nextdayvideo.com.au:443/",
      agent  : globalAgent,
      headers: {
        host: 'mux-monitor.aws.nextdayvideo.com.au'
      }
    })
  );
};
