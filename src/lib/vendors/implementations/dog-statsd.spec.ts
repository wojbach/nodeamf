import test from 'ava';

import { MetricsTypesEnum } from '../../metrics/metrics-types.enum';
import { SupportedVendorsEnum } from '../supported-vendors.enum';

import { DogStatsd } from './dog-statsd';

test('object properly initiates without config', (t) => {
  t.notThrows(() => new DogStatsd());
});

test('object properly initiates with config', (t) => {
  t.notThrows(
    () =>
      new DogStatsd({
        host: 'http://test-uri',
        globalTags: ['tag1', 'tag2'],
      })
  );
});

test('underlying client is accessible through getter', (t) => {
  const vendor = new DogStatsd({
    mock: true,
  });
  t.truthy(vendor.getClient()['mock']);
});

test('properly returns its name and supported metrics', (t) => {
  const vendor = new DogStatsd({
    mock: true,
  });
  t.is(vendor.getName(), SupportedVendorsEnum.DogStatsD);
  t.truthy(Array.isArray(vendor.getSupportedMetrics()));
  t.truthy(vendor.getSupportedMetrics().length > 0);
  vendor
    .getSupportedMetrics()
    .forEach((value) => t.truthy(MetricsTypesEnum[value]));
});

test('properly sets a custom name for vendor', (t) => {
  const vendor = new DogStatsd({
    name: 'my datadog 1',
  });
  t.is(vendor.getName(), 'my datadog 1');
});

test('properly sets a custom name for vendor and a client config', (t) => {
  const vendor = new DogStatsd({
    name: 'my datadog 1',
    mock: true,
    globalTags: ['foo', 'bar'],
  });

  t.is(vendor.getName(), 'my datadog 1');
  t.truthy(vendor.getClient()['mock']);
  t.deepEqual(vendor.getClient()['globalTags'], ['foo', 'bar']);
});

test('properly registers metric of supported type', (t) => {
  const vendor = new DogStatsd({
    mock: true,
  });

  vendor.registerMetric('metric1', MetricsTypesEnum.Gauge, {});
  t.truthy((vendor as any).metricsRegistry.has('metric1'));
});

test('throws while registering unsupported metrics types', (t) => {
  const vendor = new DogStatsd({
    mock: true,
  });
  const nonExistingMetricEnum = 1337;
  t.throws(() => {
    vendor.registerMetric(
      'metric1',
      nonExistingMetricEnum as MetricsTypesEnum,
      {}
    );
  });
});

test('throws while registering metric with the same name', (t) => {
  const vendor = new DogStatsd({
    mock: true,
  });

  t.throws(() => {
    vendor.registerMetric('metric1', MetricsTypesEnum.Counter, {});
    vendor.registerMetric('metric1', MetricsTypesEnum.Counter, {});
  });
});

test('throws when calling unregistered metric', (t) => {
  const vendor = new DogStatsd({
    mock: true,
  });

  t.throws(() => {
    vendor.callMetric('metric1', 'increment', []);
  });
});

test('throws when calling unsupported method', (t) => {
  const vendor = new DogStatsd({
    mock: true,
  });

  vendor.registerMetric('metric1', MetricsTypesEnum.Counter, {});
  t.throws(() => {
    vendor.callMetric('metric1', 'nonExistingMethod', []);
  });
});

test('calling counter metric invokes underlying client properly', (t) => {
  const vendor = new DogStatsd({
    mock: true,
  });

  vendor.registerMetric('counter', MetricsTypesEnum.Counter, {});
  vendor.callMetric('counter', 'increment', [13, { tag1: 1, tag2: 'foo' }]);

  const mockBuffer = vendor.getClient().mockBuffer;

  t.assert(mockBuffer[0] === 'counter:13|c|#tag1:1,tag2:foo');
});

test('calling gauge metric invokes underlying client properly', (t) => {
  const vendor = new DogStatsd({
    mock: true,
  });

  vendor.registerMetric('gauge', MetricsTypesEnum.Gauge, {});
  vendor.callMetric('gauge', 'set', [10, { tag1: 1, tag2: 'foo' }]);

  const mockBuffer = vendor.getClient().mockBuffer;

  t.assert(mockBuffer[0] === 'gauge:10|g|#tag1:1,tag2:foo');
});

test('calling histogram metric invokes underlying client properly', (t) => {
  const vendor = new DogStatsd({
    mock: true,
  });

  vendor.registerMetric('histogram', MetricsTypesEnum.Histogram, {});
  vendor.callMetric('histogram', 'observe', [20, { tag1: 1, tag2: 'foo' }]);

  const mockBuffer = vendor.getClient().mockBuffer;

  t.assert(mockBuffer[0] === 'histogram:20|h|#tag1:1,tag2:foo');
});

test('calling set metric invokes underlying client properly', (t) => {
  const vendor = new DogStatsd({
    mock: true,
  });

  vendor.registerMetric('set', MetricsTypesEnum.Set, {});
  vendor.callMetric('set', 'set', [30, { tag1: 1, tag2: 'foo' }]);

  const mockBuffer = vendor.getClient().mockBuffer;

  t.assert(mockBuffer[0] === 'set:30|s|#tag1:1,tag2:foo');
});

test('calling event metric invokes underlying client properly', (t) => {
  const vendor = new DogStatsd({
    mock: true,
  });

  vendor.registerMetric('event', MetricsTypesEnum.Event, {});
  vendor.callMetric('event', 'send', [
    'title',
    'description',
    { alert_type: 'info' },
    {
      tag1: 1,
      tag2: 'foo',
    },
  ]);

  const mockBuffer = vendor.getClient().mockBuffer;

  t.assert(mockBuffer[0] === '_e{5,5}:event|title|#alert_type:info');
});

test('metric names ARE modified if their names are invalid from default naming strategy perspective', (t) => {
  const invalidMetricsNames = {
    camelCase: 'camel.case',
    'special-@#$%^-chars': 'special.chars',
    'space seperated': 'space.seperated',
    'mixed - type_of-metricName ': 'mixed.type.of.metric.name',
  };

  const vendor = new DogStatsd({ mock: true });
  for (const [invalidMetricName, validMetricName] of Object.entries(
    invalidMetricsNames
  )) {
    vendor.registerMetric(invalidMetricName, MetricsTypesEnum.Counter, {});
    vendor.callMetric(invalidMetricName, 'increment', []);

    const mockBuffer = vendor.getClient().mockBuffer;
    t.truthy(mockBuffer.find((v) => v.indexOf(validMetricName) === 0));
  }
});

test('metric names ARE NOT modified if their names are valid from default naming strategy perspective', (t) => {
  const validMetricsNames = [
    'lorem.ipsum',
    'sit.dolor.amet',
    'consectetur.adipiscing.elit',
    'consectetur.adipiscing.elit.sed.at1337',
  ];

  const vendor = new DogStatsd({ mock: true });
  for (const validMetricName of validMetricsNames) {
    vendor.registerMetric(validMetricName, MetricsTypesEnum.Counter, {});
    vendor.callMetric(validMetricName, 'increment', []);

    const mockBuffer = vendor.getClient().mockBuffer;
    t.truthy(mockBuffer.find((v) => v.indexOf(validMetricName) === 0));
  }
});

test('metric names ARE modified according to the custom naming strategy', (t) => {
  const metricsNames = {
    FOO: 'oof',
    baR: 'rab',
  };

  const vendor = new DogStatsd({ mock: true });
  vendor.setMetricNamingConvention((metricName) =>
    metricName
      .split('')
      .map((v) => v.toLowerCase())
      .reverse()
      .join('')
  );

  for (const [givenMetricName, expectedMetricName] of Object.entries(
    metricsNames
  )) {
    vendor.registerMetric(givenMetricName, MetricsTypesEnum.Counter, {});
    vendor.callMetric(givenMetricName, 'increment', []);

    const mockBuffer = vendor.getClient().mockBuffer;
    t.truthy(mockBuffer.find((v) => v.indexOf(expectedMetricName) === 0));
  }
});
