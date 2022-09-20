import {
  Counter,
  DogStatsd,
  Gauge,
  Histogram,
  NodeAmf,
  Prometheus,
  Summary,
  SupportedVendorsEnum
} from '@wojbach/nodeamf';

const nodeAmf = NodeAmf.init({
  vendors: [
    new Prometheus(),
    new DogStatsd({host: 'my-host', port: 1337, globalTags: ['service', 'environment']})
  ],
  metrics: [
    new Counter('visits', { tags: ['country', 'browser'] }, [SupportedVendorsEnum.Prometheus]),
    new Gauge('currentUsersCount', {}, [SupportedVendorsEnum.Prometheus]),
    new Histogram('transactionsValue', { buckets: [10, 20, 30, 40, 50, 100] }, [SupportedVendorsEnum.Prometheus]),
    new Summary('responseTime', { percentiles: [0.01, 0.1, 0.9, 0.99] }, [SupportedVendorsEnum.Prometheus])
  ]
});

const countries = ['US', 'UK', 'DE', 'PL', 'DK'];
const browsers = ['chrome', 'firefox', 'edge'];

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

setInterval(() => {
  nodeAmf.getMetric<Counter>('visits').increment(getRandomIntInclusive(0, 100), { 'country': countries[getRandomIntInclusive(0,4)] });
  // or nodeAmf.getCounter('visits').increment(getRandomIntInclusive(0, 100), { 'country': countries[getRandomIntInclusive(0,4)] });
  nodeAmf.getMetric<Counter>('visits').increment(getRandomIntInclusive(0, 100), { 'browser': browsers[getRandomIntInclusive(0,2)] });
  // or nodeAmf.getCounter('visits').increment(getRandomIntInclusive(0, 100), { 'browser': browsers[getRandomIntInclusive(0,2)] });
  nodeAmf.getMetric<Gauge>('currentUsersCount').set(getRandomIntInclusive(0, 100));
  // or nodeAmf.getGauge('currentUsersCount').set(getRandomIntInclusive(0, 100));
  nodeAmf.getMetric<Histogram>('transactionsValue').observe(getRandomIntInclusive(1, 100));
  // or nodeAmf.getHistogram('transactionsValue').observe(getRandomIntInclusive(1, 100));
  nodeAmf.getMetric<Summary>('responseTime').observe(getRandomIntInclusive(1, 1000));
  // or nodeAmf.getSummary('responseTime').observe(getRandomIntInclusive(1, 1000));
}, 5000);


export default nodeAmf;
