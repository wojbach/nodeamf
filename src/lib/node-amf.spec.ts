import test, { beforeEach } from 'ava';
import * as sinon from 'ts-sinon';

import { MetricInterface } from './metrics/metric.interface';
import { MetricsTypesEnum } from './metrics/metrics-types.enum';
import { NodeAmf } from './node-amf';
import { SupportedVendorsEnum } from './vendors/supported-vendors.enum';
import { VendorInterface } from './vendors/vendor.interface';

let metric1;
let metric2;
let vendor1;
let vendor2;

beforeEach(() => {
  vendor1 = sinon.stubInterface<VendorInterface>({
    getName: 'vendor1' as SupportedVendorsEnum,
  });

  vendor2 = sinon.stubInterface<VendorInterface>({
    getName: 'vendor2' as SupportedVendorsEnum,
  });

  metric1 = sinon.stubInterface<MetricInterface>({
    getName: 'metric1',
    getType: MetricsTypesEnum.Counter,
    getVendorsRegistry: [],
    getOptions: {},
  });

  metric2 = sinon.stubInterface<MetricInterface>({
    getName: 'metric2',
    getType: MetricsTypesEnum.Counter,
    getVendorsRegistry: [],
    getOptions: {},
  });
});

test('object properly initiates with empty vendor and metrics array', (t) => {
  t.notThrows(() => NodeAmf.init({ vendors: [], metrics: [] }));
});

test('object properly initiates with vendors array only', (t) => {
  t.notThrows(() =>
    NodeAmf.init({
      vendors: [vendor1, vendor2],
      metrics: [],
    })
  );
});

test('object properly initiates with metrics array only', (t) => {
  t.notThrows(() =>
    NodeAmf.init({
      vendors: [],
      metrics: [metric1, metric2],
    })
  );
});

test('object vendors registry finds existing entry also returns undefined on not found entry', (t) => {
  const nodeamf = NodeAmf.init({ vendors: [vendor1], metrics: [] });
  t.notDeepEqual(
    nodeamf.getVendor('vendor1' as SupportedVendorsEnum),
    undefined
  );
  t.deepEqual(nodeamf.getVendor('vendor2' as SupportedVendorsEnum), undefined);
});

test('object metrics registry finds existing entry also returns undefined on not found entry', (t) => {
  const nodeamf = NodeAmf.init({ vendors: [], metrics: [metric1] });
  t.notDeepEqual(
    nodeamf.getMetric('metric1' as SupportedVendorsEnum),
    undefined
  );
  t.deepEqual(nodeamf.getMetric('metric2' as SupportedVendorsEnum), undefined);
});

test('object properly initiates with vendors and metrics', (t) => {
  t.notThrows(() =>
    NodeAmf.init({ vendors: [vendor1, vendor2], metrics: [metric1, metric2] })
  );
});

test('object properly initiates and metrics are registered in vendors', (t) => {
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
