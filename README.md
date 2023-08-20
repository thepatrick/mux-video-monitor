# mux-video-monitor

This repository contains two web "apps" for supporting streaming, primarily of conferences.

1. A tool for monitoring a number of video streams
2. A website for attendees to view the video streams from a conference

## Limitations

This was created for linux.conf.au & PyCon AU, and had no auth so was easy to test. 
With the latest changes to support the attendee view authentication is required,
which is provided by integration with events. Getting a cookie in place to test
the frontend locally involves changing `frontend/.proxyrc.js` to 

```javascript
const { globalAgent } = require('https');
const { createProxyMiddleware } = require('http-proxy-middleware');

const cookie = 'NDV_AUD=' + encodeURIComponent(process.env.NDV_AUD_COOKIE);

module.exports = function (app) {
  app.use(
    createProxyMiddleware('/api', {
      target: 'https://live.aws.nextdayvideo.com.au:443/',
      agent: globalAgent,
      cookieDomainRewrite: 'localhost',
      headers: {
        host: 'live.aws.nextdayvideo.com.au',
      },
      onProxyReq: function (proxyReq) {
        console.log('setting cookie');
        proxyReq.setHeader('cookie', cookie);
      },
    }),
  );
};
```

Thnen passing in your `NDV_AUD` cookie as the environment variable `NDV_AUD_COOKIE` 
when starting the frontend dev server.