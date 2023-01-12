import {
  Counter,
  CloudWatch,
  Gauge,
  NodeAmf,
  SupportedVendorsEnum,
} from '@wojbach/nodeamf';

const nodeAmf = NodeAmf.init({
  vendors: [
    new CloudWatch({
      region: 'eu-west-1',
      credentials: {
        //should have permissions to put metric data: https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_PutMetricData.html
        accessKeyId: '',
        secretAccessKey: '',
      },
      namespace: 'SHOP_STATISTICS',
      flushTimeout: 5000,
    }),
  ],
  metrics: [
    new Counter('visits', { tags: ['country', 'browser'] }, [
      SupportedVendorsEnum.CloudWatch,
    ]),
    new Gauge('currentUsersCount', {}, [SupportedVendorsEnum.CloudWatch]),
  ],
});

const countries = ['US', 'UK', 'DE', 'PL', 'DK'];
const browsers = ['chrome', 'firefox', 'edge'];

function getRandomIntInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

setInterval(() => {
  nodeAmf
    .getMetric<Counter>('visits')
    .increment(getRandomIntInclusive(0, 100), {
      country: countries[getRandomIntInclusive(0, 4)],
    });
  // or nodeAmf.getCounter('visits').increment(getRandomIntInclusive(0, 100), { 'country': countries[getRandomIntInclusive(0,4)] });
  nodeAmf
    .getMetric<Counter>('visits')
    .increment(getRandomIntInclusive(0, 100), {
      browser: browsers[getRandomIntInclusive(0, 2)],
    });
  // or nodeAmf.getCounter('visits').increment(getRandomIntInclusive(0, 100), { 'browser': browsers[getRandomIntInclusive(0,2)] });
  nodeAmf
    .getMetric<Gauge>('currentUsersCount')
    .set(getRandomIntInclusive(0, 100));
  // or nodeAmf.getGauge('currentUsersCount').set(getRandomIntInclusive(0, 100));
}, 5000);
