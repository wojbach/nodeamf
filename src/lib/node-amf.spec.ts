import test, { beforeEach, ExecutionContext } from 'ava';
import { StubbedInstance } from 'ts-sinon';
import * as sinon from 'ts-sinon';

import { Counter } from './metrics/implementations/counter';
import { MetricInterface } from './metrics/metric.interface';
import { MetricsTypesEnum } from './metrics/metrics-types.enum';
import { NodeAmf } from './node-amf';
import { SupportedVendorsEnum } from './vendors/supported-vendors.enum';
import { VendorInterface } from './vendors/vendor.interface';

type TestContextType = {
  vendor1: StubbedInstance<VendorInterface>;
  vendor2: StubbedInstance<VendorInterface>;
  metric1: StubbedInstance<Counter>;
  metric2: StubbedInstance<Counter>;
};

beforeEach((t) => {
  const vendor1 = sinon.stubInterface<VendorInterface>({
    getName: 'vendor1' as SupportedVendorsEnum,
  });

  const vendor2 = sinon.stubInterface<VendorInterface>({
    getName: 'vendor2' as SupportedVendorsEnum,
  });

  const metric1 = sinon.stubInterface<MetricInterface>({
    getName: 'metric1',
    getType: MetricsTypesEnum.Counter,
    getVendorsRegistry: [],
    getOptions: {},
  });

  const metric2 = sinon.stubInterface<MetricInterface>({
    getName: 'metric2',
    getType: MetricsTypesEnum.Counter,
    getVendorsRegistry: [],
    getOptions: {},
  });

  t.context = { vendor1, vendor2, metric1, metric2 };
});

test('object properly initiates with empty vendor and metrics array', (t: ExecutionContext<TestContextType>) => {
  t.notThrows(() => NodeAmf.init({ vendors: [], metrics: [] }));
});

test('object properly initiates with vendors array only', (t: ExecutionContext<TestContextType>) => {
  const { vendor1, vendor2 } = t.context;
  t.notThrows(() =>
    NodeAmf.init({
      vendors: [vendor1, vendor2],
      metrics: [],
    })
  );
});

test('object properly initiates with metrics array only', (t: ExecutionContext<TestContextType>) => {
  const { metric1, metric2 } = t.context;
  t.notThrows(() =>
    NodeAmf.init({
      vendors: [],
      metrics: [metric1, metric2],
    })
  );
});

test('object vendors registry finds existing entry also returns undefined on not found entry', (t: ExecutionContext<TestContextType>) => {
  const { vendor1 } = t.context;
  const nodeamf = NodeAmf.init({ vendors: [vendor1], metrics: [] });
  t.notDeepEqual(
    nodeamf.getVendor('vendor1' as SupportedVendorsEnum),
    undefined
  );
  t.deepEqual(nodeamf.getVendor('vendor2' as SupportedVendorsEnum), undefined);
});

test('object metrics registry finds existing entry also returns undefined on not found entry', (t: ExecutionContext<TestContextType>) => {
  const { metric1 } = t.context;
  const nodeamf = NodeAmf.init({ vendors: [], metrics: [metric1] });
  t.notDeepEqual(
    nodeamf.getMetric('metric1' as SupportedVendorsEnum),
    undefined
  );
  t.deepEqual(nodeamf.getMetric('metric2' as SupportedVendorsEnum), undefined);
});

test('object properly initiates with vendors and metrics', (t: ExecutionContext<TestContextType>) => {
  const { vendor1, vendor2, metric1, metric2 } = t.context;
  t.notThrows(() =>
    NodeAmf.init({ vendors: [vendor1, vendor2], metrics: [metric1, metric2] })
  );
});

test('object properly initiates and metrics are registered in vendors', (t: ExecutionContext<TestContextType>) => {
  const { vendor1, vendor2 } = t.context;
  const metricWithVendorsRegistry1 = sinon.stubInterface<MetricInterface>({
    getName: 'metric1',
    getType: MetricsTypesEnum.Counter,
    getVendorsRegistry: ['vendor1' as SupportedVendorsEnum],
    getOptions: {},
  });

  const metricWithVendorsRegistry2 = sinon.stubInterface<MetricInterface>({
    getName: 'metric2',
    getType: MetricsTypesEnum.Counter,
    getVendorsRegistry: ['vendor2' as SupportedVendorsEnum],
    getOptions: {},
  });

  t.notThrows(() =>
    NodeAmf.init({
      vendors: [vendor1, vendor2],
      metrics: [metricWithVendorsRegistry1, metricWithVendorsRegistry2],
    })
  );
  t.assert(
    vendor1.registerMetric.calledOnceWith(
      'metric1',
      MetricsTypesEnum.Counter,
      {}
    )
  );
  t.assert(
    vendor2.registerMetric.calledOnceWith(
      'metric2',
      MetricsTypesEnum.Counter,
      {}
    )
  );
});

test("metric measure method calls vendor's callMetric method", (t: ExecutionContext<TestContextType>) => {
  const { vendor1, vendor2, metric1 } = t.context;
  const metricWithVendorsRegistry1 = sinon.stubInterface<MetricInterface>({
    getName: 'metric1',
    getType: MetricsTypesEnum.Counter,
    getVendorsRegistry: [
      'vendor1' as SupportedVendorsEnum,
      'vendor2' as SupportedVendorsEnum,
    ],
    getOptions: {},
  });

  const nodeAmf = NodeAmf.init({
    vendors: [vendor1, vendor2],
    metrics: [metricWithVendorsRegistry1],
  });

  nodeAmf.getMetric<Counter>('metric1').increment(1);

  t.assert(vendor1.callMetric.calledOnceWith('metric1', 'increment', [1]));
  t.assert(vendor2.callMetric.calledOnceWith('metric1', 'increment', [1]));
  t.assert(metric1.increment.notCalled);
});

test('metric non-measure method or property does not call vendor\'s callMetric method ', (t: ExecutionContext<TestContextType>) => {
  const { vendor1 } = t.context;
  const metricWithVendorsRegistry1 = sinon.stubInterface<
    MetricInterface & { someProp }
  >({
    getName: 'metric1',
    getType: MetricsTypesEnum.Counter,
    getVendorsRegistry: ['vendor1' as SupportedVendorsEnum],
    getOptions: {},
    someProp: 'foo',
  });

  const nodeAmf = NodeAmf.init({
    vendors: [vendor1],
    metrics: [metricWithVendorsRegistry1],
  });

  const registeredMetric1: any = nodeAmf.getMetric<Counter>('metric1');
  registeredMetric1.getName();
  registeredMetric1.someProp;

  t.assert(vendor1.callMetric.notCalled);
});
