import {
  Counter, DogStatsd,
  Gauge,
  Histogram,
  Event,
  NodeAmf,
  SupportedVendorsEnum
} from '@wojbach/nodeamf';

const nodeAmf = NodeAmf.init({
  vendors: [
    new DogStatsd({host: 'dd-agent', port: 8125})
  ],
  metrics: [
    new Counter('visits', { tags: ['country', 'browser'] }, [SupportedVendorsEnum.DogStatsD]),
    new Gauge('currentUsersCount', {}, [SupportedVendorsEnum.DogStatsD]),
    new Histogram('transactionsValue', {}, [SupportedVendorsEnum.DogStatsD]),
    new Event('sellEvents', {}, [SupportedVendorsEnum.DogStatsD])
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
  nodeAmf.getMetric<Event>('sellEvents').send(`${getRandomIntInclusive(1, 1000)} USD`, 'Triggered then client make a purchase', {alert_type: 'info'});
  // or nodeAmf.getEvent('sellEvents')..send(`${getRandomIntInclusive(1, 1000)} USD`, 'Triggered then client make a purchase', {alert_type: 'info'});
}, 5000);
