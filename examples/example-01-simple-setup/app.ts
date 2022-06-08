import { Counter, NodeAmf, Prometheus, SupportedVendorsEnum } from '../../src';

const nodeAmf = NodeAmf.init({
  vendors: [
    new Prometheus()
  ],
  metrics: [
    new Counter('simple-counter', {}, [SupportedVendorsEnum.Prometheus])
  ]
});

nodeAmf.getMetric<Counter>('simple-counter').increment(10);
