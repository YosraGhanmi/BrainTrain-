const http = require('http');
const next = require('next');

const port = Number(process.env.PORT || 3000);
const hostname = '0.0.0.0';
const app = next({ dev: process.env.NODE_ENV !== 'production', hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  http
    .createServer((request, response) => handle(request, response))
    .listen(port, hostname, () => {
      console.log(`BrainTrain listening on ${hostname}:${port}`);
    });
});