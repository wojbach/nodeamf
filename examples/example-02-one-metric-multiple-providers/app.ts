import {
  Counter,
  Gauge,
  DogStatsd,
  NodeAmf,
  Prometheus,
  SupportedVendorsEnum
} from '@wojbach/nodeamf';

const nodeAmf = NodeAmf.init({
  vendors: [
    new Prometheus(),
    new DogStatsd()
  ],
  metrics: [
    new Counter('simple-counter', {}, [SupportedVendorsEnum.Prometheus, SupportedVendorsEnum.DogStatsD]),
    new Gauge('simple-gauge', {}, [SupportedVendorsEnum.DogStatsD]),
  ]
});

nodeAmf.getMetric<Counter>('simple-counter').increment(10);
//or
nodeAmf.getCounter('simple-counter').increment(10);

nodeAmf.getMetric<Gauge>('simple-gauge').set(10);
//or
nodeAmf.getGauge('simple-gauge').set(10)
