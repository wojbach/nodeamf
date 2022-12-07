import {
  Counter,
  NodeAmf,
  Prometheus,
  SupportedVendorsEnum,
} from '@wojbach/nodeamf';

const nodeAmf = NodeAmf.init({
  vendors: [
    new Prometheus({ name: 'analytics' }),
    new Prometheus({ name: 'finance' }),
    new Prometheus(),
  ],
  metrics: [
    new Counter('visits-counter', {}, [
      'analytics',
      SupportedVendorsEnum.Prometheus,
    ]),
    new Counter('purchase-counter', {}, ['finance']),
    new Counter('http-calls', {}, [SupportedVendorsEnum.Prometheus]),
  ],
});

nodeAmf.getMetric<Counter>('visits-counter').increment();
//or
nodeAmf.getCounter('visits-counter').increment();

nodeAmf.getMetric<Counter>('purchase-counter').increment();
//or
nodeAmf.getCounter('purchase-counter').increment();

nodeAmf.getMetric<Counter>('http-calls').increment();
//or
nodeAmf.getCounter('http-calls').increment();
