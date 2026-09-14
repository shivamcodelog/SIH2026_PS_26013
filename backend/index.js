import http from 'node:http';

const PORT = process.env.PORT || 5000;

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health endpoint
  if (req.url === '/api/health' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        success: true,
        service: 'node-server',
        status: 'online',
        timestamp: new Date().toISOString()
      })
    );
    return;
  }

  // Default route
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      message: 'SIH26013 Geospatial Harmonization API Gateway',
      docs: '/docs',
      health: '/api/health'
    })
  );
});

server.listen(PORT, () => {
  console.log(`[SIH26013 Backend] Server running on port ${PORT}`);
});
