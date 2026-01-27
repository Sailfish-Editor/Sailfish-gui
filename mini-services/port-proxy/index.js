import http from 'http';

const TARGET_PORT = 8601;
const TARGET_HOST = 'localhost';
const PROXY_PORT = 3000;

const server = http.createServer((req, res) => {
  // 移除 host 头以避免问题
  const headers = { ...req.headers };
  delete headers.host;

  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: headers
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  req.pipe(proxyReq);

  proxyReq.on('error', (err) => {
    console.error('代理错误:', err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Bad Gateway: 无法连接到目标服务器');
    }
  });
});

server.on('error', (err) => {
  console.error('服务器错误:', err.message);
  process.exit(1);
});

server.listen(PROXY_PORT, () => {
  console.log(`代理服务器运行在端口 ${PROXY_PORT}，转发请求到 ${TARGET_HOST}:${TARGET_PORT}`);
});
