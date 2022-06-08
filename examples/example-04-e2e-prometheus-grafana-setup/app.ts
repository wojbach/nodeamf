import { createServer, ServerResponse } from 'http';
import { Prometheus, SupportedVendorsEnum } from '@wojbach/nodeamf';
import nodeAmf from './metrics';

const port = process.env.PORT || 8080;
const server = createServer();
const registry = nodeAmf.getVendor<Prometheus>(SupportedVendorsEnum.Prometheus).getClient().register;

server.on("request", async (request, response: ServerResponse) => {
  const metrics = await registry.metrics();
  response.setHeader('Content-Type', registry.contentType);
  response.end(metrics);
});

server.listen(port, () => {
  console.log(`starting server at port ${port}`);
});
