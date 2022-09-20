import {
  Counter,
  NodeAmf,
  Prometheus,
  SupportedVendorsEnum
} from '@wojbach/nodeamf';

const nodeAmf = NodeAmf.init({
  vendors: [
    new Prometheus()
  ],
  metrics: [
    new Counter('visits', {tags: ['country', 'browser']}, [SupportedVendorsEnum.Prometheus]),
  ]
});

nodeAmf.getMetric<Counter>('visits').increment();// no tags used - tags are optional
//or
nodeAmf.getCounter('visits').increment();

nodeAmf.getMetric<Counter>('visits').increment(1, {'country': 'US'});
//or
nodeAmf.getCounter('visits').increment(1, {'country': 'US'});

nodeAmf.getMetric<Counter>('visits').increment(1, {'browser': 'firefox'});
//or
nodeAmf.getCounter('visits').increment(1, {'browser': 'firefox'});

nodeAmf.getMetric<Counter>('visits').increment(1, {'country': 'DE', 'browser': 'chrome'});
//or
nodeAmf.getCounter('visits').increment(1, {'country': 'DE', 'browser': 'chrome'});
