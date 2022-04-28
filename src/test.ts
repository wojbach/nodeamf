import {
  Atlas,
  Counter,
  DogStatsd,
  Gauge,
  Histogram,
  NodeAmf,
  Prometheus,
  Summary,
  SupportedVendorsEnum,
  Timer,
  VendorInterface,
} from './index';

const vendors: VendorInterface[] = [
  new Prometheus(),
  new DogStatsd(),
  new Atlas(),
];

const metrics = [
  new Counter('counter_1', { tags: ['tag1'] }, [
    SupportedVendorsEnum.Prometheus,
    SupportedVendorsEnum.DogStatsD,
  ]),
  new Gauge('gauge_1', { tags: ['tag2'] }, [SupportedVendorsEnum.Prometheus]),
  new Summary('summary_1', {}, [SupportedVendorsEnum.Prometheus]),
  new Histogram('histogram_1', {}, [SupportedVendorsEnum.Prometheus]),
  new Timer('timer_1', { tags: ['responseTime'] }, [
    SupportedVendorsEnum.Atlas,
  ]),
];

const nodeAmf = NodeAmf.init({ vendors, metrics });
const counter = nodeAmf.getMetric<Counter>('counter_1');
counter.increment(12, { tag1: 'baz' });
counter.increment(13);

const gauge = nodeAmf.getMetric<Gauge>('gauge_1');
gauge.set(12, { tag2: 'qux' });
gauge.set(13);

const timer = nodeAmf.getMetric<Timer>('timer_1');
timer.record(61, { tag2: 'qux' });
timer.record(60);

nodeAmf
  .getVendor<Prometheus>(SupportedVendorsEnum.Prometheus)
  .getClient()
  .register.metrics()
  .then((res) => {
    console.log(res);
  });

const dd = nodeAmf
  .getVendor<DogStatsd>(SupportedVendorsEnum.DogStatsD)
  .getClient();

const atlas = nodeAmf.getVendor<Atlas>(SupportedVendorsEnum.Atlas).getClient();

console.log(dd);
console.log(atlas);
