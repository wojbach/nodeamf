import test from 'ava';
import Counter from 'nflx-spectator/src/counter';
import DistributionSummary from 'nflx-spectator/src/dist_summary';
import Gauge from 'nflx-spectator/src/gauge';
import Timer from 'nflx-spectator/src/timer';

import { MetricsTypesEnum } from '../../metrics/metrics-types.enum';
import { SupportedVendorsEnum } from '../supported-vendors.enum';

import { Atlas } from './atlas';

test('object properly initiates without config', (t) => {
  t.notThrows(() => new Atlas());
});

test('object properly initiates with config', (t) => {
  t.notThrows(
    () =>
      new Atlas({
        commonTags: { tag1: 1, tag2: 'foo' },
        uri: 'http://test-uri',
      })
  );
});

test('underlying client is accessible through getter', (t) => {
  const vendor = new Atlas({
    commonTags: { tag1: 1, tag2: 'foo' },
    uri: 'http://test-uri',
  });
  t.truthy(vendor.getClient());
});

test('properly returns its name and supported metrics', (t) => {
  const vendor = new Atlas({
    commonTags: { tag1: 1, tag2: 'foo' },
    uri: 'http://test-uri',
  });
  t.is(vendor.getName(), SupportedVendorsEnum.Atlas);
  t.truthy(Array.isArray(vendor.getSupportedMetrics()));
  t.truthy(vendor.getSupportedMetrics().length > 0);
  vendor
    .getSupportedMetrics()
    .forEach((value) => t.truthy(MetricsTypesEnum[value]));
});

test('properly registers metric of supported type', (t) => {
  const vendor = new Atlas({
    commonTags: { tag1: 1, tag2: 'foo' },
    uri: 'http://test-uri',
  });

  vendor.registerMetric('metric1', MetricsTypesEnum.Gauge);
  t.truthy((vendor as any).metricsRegistry.has('metric1'));
});

test('throws while registering unsupported metrics types', (t) => {
  const vendor = new Atlas({
    commonTags: { tag1: 1, tag2: 'foo' },
    uri: 'http://test-uri',
  });
  const nonExistingMetricEnum = 1337;
  t.throws(() => {
    vendor.registerMetric('metric1', nonExistingMetricEnum as MetricsTypesEnum);
  });
});

test('throws while registering metric with the same name', (t) => {
  const vendor = new Atlas({
    commonTags: { tag1: 1, tag2: 'foo' },
    uri: 'http://test-uri',
  });

  t.throws(() => {
    vendor.registerMetric('metric1', MetricsTypesEnum.Counter);
    vendor.registerMetric('metric1', MetricsTypesEnum.Counter);
  });
});

test('throws when calling unregistered metric', (t) => {
  const vendor = new Atlas({
    commonTags: { tag1: 1, tag2: 'foo' },
    uri: 'http://test-uri',
  });

  t.throws(() => {
    vendor.callMetric('metric1', 'increment', []);
  });
});

test('throws when calling unsupported method', (t) => {
  const vendor = new Atlas({
    commonTags: { tag1: 1, tag2: 'foo' },
    uri: 'http://test-uri',
  });

  vendor.registerMetric('metric1', MetricsTypesEnum.Counter);
  t.throws(() => {
    vendor.callMetric('metric1', 'nonExistingMethod', []);
  });
});

test('calling counter metric invokes underlying client properly', (t) => {
  const vendor = new Atlas({
    uri: 'http://test-uri',
  });

  vendor.registerMetric('counter', MetricsTypesEnum.Counter);
  vendor.callMetric('counter', 'increment', [1, { tag1: 1, tag2: 'foo' }]);

  const meters = vendor.getClient().meters();
  const clientMetric = meters.find((v: Counter) => v.id.name === 'counter');

  t.assert((clientMetric as Counter).count === 1);
  t.deepEqual(
    (clientMetric as Counter).id.tags,
    new Map(Object.entries({ tag1: 1, tag2: 'foo' }))
  );
});

test('calling gauge metric invokes underlying client properly', (t) => {
  const vendor = new Atlas({
    uri: 'http://test-uri',
  });

  vendor.registerMetric('gauge', MetricsTypesEnum.Gauge);
  vendor.callMetric('gauge', 'set', [10, { tag1: 1, tag2: 'foo' }]);

  const meters = vendor.getClient().meters();
  const clientMetric = meters.find((v: Gauge) => v['id'].name === 'gauge');

  t.assert((clientMetric as Gauge).get() === 10);
  t.deepEqual(
    (clientMetric as Gauge)['id'].tags,
    new Map(Object.entries({ tag1: 1, tag2: 'foo' }))
  );
});

test('calling summary metric invokes underlying client properly', (t) => {
  const vendor = new Atlas({
    uri: 'http://test-uri',
  });

  vendor.registerMetric('summary', MetricsTypesEnum.Summary);
  vendor.callMetric('summary', 'observe', [20, { tag1: 1, tag2: 'foo' }]);
  vendor.callMetric('summary', 'observe', [40, { tag1: 1, tag2: 'foo' }]);

  const meters = vendor.getClient().meters();
  const clientMetric = meters.find(
    (v: DistributionSummary) => v['id'].name === 'summary'
  );

  t.assert((clientMetric as DistributionSummary)['count'] === 2);
  t.assert((clientMetric as DistributionSummary)['totalAmount'] === 60);
  t.deepEqual(
    (clientMetric as DistributionSummary)['id'].tags,
    new Map(Object.entries({ tag1: 1, tag2: 'foo' }))
  );
});

test('calling timer metric invokes underlying client properly', (t) => {
  const vendor = new Atlas({
    uri: 'http://test-uri',
  });

  vendor.registerMetric('timer', MetricsTypesEnum.Timer);
  vendor.callMetric('timer', 'record', [30, { tag1: 1, tag2: 'foo' }]);

  const meters = vendor.getClient().meters();
  const clientMetric = meters.find((v: Timer) => v['id'].name === 'timer');

  t.assert((clientMetric as Timer)['count'] === 1);
  t.assert((clientMetric as Timer)['totalTime'] === 30000000000);
  t.deepEqual(
    (clientMetric as Timer)['id'].tags,
    new Map(Object.entries({ tag1: 1, tag2: 'foo' }))
  );
});
