import {
  DogStatsd,
  Gauge,
  NodeAmf,
  Prometheus,
  SupportedVendorsEnum
} from '@wojbach/nodeamf';

// Prometheus example
const nodeAmfPrometheus = NodeAmf.init({
  vendors: [
    new Prometheus()
  ],
  metrics: []
});

nodeAmfPrometheus.getVendor<Prometheus>(SupportedVendorsEnum.Prometheus).getClient().collectDefaultMetrics();

// DataDog example
// DataDog currently in private beta: https://docs.datadoghq.com/tracing/runtime_metrics/nodejs/
// For now a custom implementation like one below is possible:

const nodeAmfDataDog = NodeAmf.init({
  vendors: [
    new DogStatsd()
  ],
  metrics: [
    new Gauge('memory.rss', {}, [SupportedVendorsEnum.DogStatsD]),
    new Gauge('memory.external', {}, [SupportedVendorsEnum.DogStatsD]),
    new Gauge('memory.arrayBuffers', {}, [SupportedVendorsEnum.DogStatsD]),
    new Gauge('memory.heapUsed', {}, [SupportedVendorsEnum.DogStatsD]),
    new Gauge('memory.heapTotal', {}, [SupportedVendorsEnum.DogStatsD]),
    new Gauge('cpu.system', {}, [SupportedVendorsEnum.DogStatsD]),
    new Gauge('cpu.user', {}, [SupportedVendorsEnum.DogStatsD]),
    new Gauge('process.activeRequests', {}, [SupportedVendorsEnum.DogStatsD])
  ]
});

setInterval(() => {
  const memory = process.memoryUsage();
  nodeAmfDataDog.getMetric<Gauge>('memory.rss').set(memory.rss);
  nodeAmfDataDog.getMetric<Gauge>('memory.external').set(memory.external);
  nodeAmfDataDog.getMetric<Gauge>('memory.arrayBuffers').set(memory.arrayBuffers);
  nodeAmfDataDog.getMetric<Gauge>('memory.heapUsed').set(memory.heapUsed);
  nodeAmfDataDog.getMetric<Gauge>('memory.heapTotal').set(memory.heapTotal);

  const cpuUsage = process.cpuUsage();
  nodeAmfDataDog.getMetric<Gauge>('cpu.system').set(cpuUsage.system);
  nodeAmfDataDog.getMetric<Gauge>('cpu.user').set(cpuUsage.user);
}, 5000);
