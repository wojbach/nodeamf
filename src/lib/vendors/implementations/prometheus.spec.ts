import test from 'ava';
import sinon from 'ts-sinon';

import { MetricsTypesEnum } from '../../metrics/metrics-types.enum';
import { SupportedVendorsEnum } from '../supported-vendors.enum';

import { Prometheus } from './prometheus';

test('object properly initiates', (t) => {
  t.notThrows(() => new Prometheus());
});

test('underlying client is accessible through getter', (t) => {
  const vendor = new Prometheus();
  t.truthy(vendor.getClient());
});

test('properly returns its name and supported metrics', (t) => {
  const vendor = new Prometheus();
  t.is(vendor.getName(), SupportedVendorsEnum.Prometheus);
  t.truthy(Array.isArray(vendor.getSupportedMetrics()));
  t.truthy(vendor.getSupportedMetrics().length > 0);
  vendor
    .getSupportedMetrics()
    .forEach((value) => t.truthy(MetricsTypesEnum[value]));
});

test('properly sets a custom name for vendor', (t) => {
  const vendor = new Prometheus({
    name: 'my prometheus 1',
  });
  t.is(vendor.getName(), 'my prometheus 1');
});

test('properly registers metric of supported type', (t) => {
  const vendor = new Prometheus();

  vendor.registerMetric('metric1', MetricsTypesEnum.Gauge, {});
  t.truthy((vendor as any).metricsRegistry.has('metric1'));
});

test('throws while registering unsupported metrics types', (t) => {
  const vendor = new Prometheus();
  const nonExistingMetricEnum = 1337;
  t.throws(() => {
    vendor.registerMetric(
      'metric1',
      nonExistingMetricEnum as MetricsTypesEnum,
      {}
    );
  });
});

test('throws while trying to create unsupported metric object', (t) => {
  const vendor = new Prometheus();
  (vendor as any).supportedMetrics = [MetricsTypesEnum.Event];
  const error = t.throws(() => {
    vendor.registerMetric('metric1', MetricsTypesEnum.Event, {});
  });

  t.is(error.message, 'Could not find object for metric of type: Event');
});

test('throws while registering metric with the same name', (t) => {
  const vendor = new Prometheus();

  vendor.registerMetric('metric1', MetricsTypesEnum.Counter, {});

  t.throws(() => {
    vendor.registerMetric('metric1', MetricsTypesEnum.Counter, {});
  });
});

test('throws when calling unregistered metric', (t) => {
  const vendor = new Prometheus();

  t.throws(() => {
    vendor.callMetric('metric1', 'increment', []);
  });
});

test('throws when calling unsupported method', (t) => {
  const vendor = new Prometheus();
  vendor.registerMetric('metric1', MetricsTypesEnum.Counter, {});

  t.throws(() => {
    vendor.callMetric('metric1', 'nonExistingMethod', []);
  });
});

test('calling counter metric invokes underlying client properly', (t) => {
  const vendor = new Prometheus();

  vendor.registerMetric('counter', MetricsTypesEnum.Counter, {
    tags: ['tag1', 'tag2'],
  });
  const registeredMetricSpy = sinon.spy<{
    inc: (
      tagsOrValue?: Record<string, string | number> | number,
      value?: number
    ) => void;
    labelNames: string[];
  }>((vendor as any).metricsRegistry.get('counter'));

  vendor.callMetric('counter', 'increment', [13, { tag1: 1, tag2: 'foo' }]);
  vendor.callMetric('counter', 'increment', [14]);
  vendor.callMetric('counter', 'increment', []);

  t.assert(registeredMetricSpy.inc.calledWith({ tag1: 1, tag2: 'foo' }, 13));
  t.assert(registeredMetricSpy.inc.calledWith(14));
  t.assert(registeredMetricSpy.inc.calledWith());
  t.deepEqual(registeredMetricSpy.labelNames, ['tag1', 'tag2']);
});

test('calling gauge metric invokes underlying client properly', (t) => {
  const vendor = new Prometheus();

  vendor.registerMetric('gauge', MetricsTypesEnum.Gauge, {
    tags: ['tag1', 'tag2'],
  });
  const registeredMetricSpy = sinon.spy<{
    set: (
      tagsOrValue?: Record<string, string | number> | number,
      value?: number
    ) => void;
    labelNames: string[];
  }>((vendor as any).metricsRegistry.get('gauge'));

  vendor.callMetric('gauge', 'set', [10, { tag1: 1, tag2: 'foo' }]);
  vendor.callMetric('gauge', 'set', [11]);

  t.assert(registeredMetricSpy.set.calledWith({ tag1: 1, tag2: 'foo' }, 10));
  t.assert(registeredMetricSpy.set.calledWith(11));
  t.deepEqual(registeredMetricSpy.labelNames, ['tag1', 'tag2']);
});

test('calling histogram metric invokes underlying client properly', (t) => {
  const vendor = new Prometheus();

  vendor.registerMetric('histogram', MetricsTypesEnum.Histogram, {
    tags: ['tag1', 'tag2'],
  });
  const registeredMetricSpy = sinon.spy<{
    observe: (
      tagsOrValue?: Record<string, string | number> | number,
      value?: number
    ) => void;
    labelNames: string[];
  }>((vendor as any).metricsRegistry.get('histogram'));

  vendor.callMetric('histogram', 'observe', [20, { tag1: 1, tag2: 'foo' }]);
  vendor.callMetric('histogram', 'observe', [20]);

  t.assert(
    registeredMetricSpy.observe.calledWith({ tag1: 1, tag2: 'foo' }, 20)
  );
  t.assert(registeredMetricSpy.observe.calledWith(20));
  t.deepEqual(registeredMetricSpy.labelNames, ['tag1', 'tag2']);
});

test('calling summary metric invokes underlying client properly', (t) => {
  const vendor = new Prometheus();

  vendor.registerMetric('summary', MetricsTypesEnum.Summary, {
    percentiles: [0.5, 0.9, 0.99],
    tags: ['tag1', 'tag2'],
  });
  const registeredMetricSpy = sinon.spy<{
    observe: (
      tagsOrValue?: Record<string, string | number> | number,
      value?: number
    ) => void;
    labelNames: string[];
    percentiles: number[];
  }>((vendor as any).metricsRegistry.get('summary'));

  vendor.callMetric('summary', 'observe', [30, { tag1: 1, tag2: 'foo' }]);
  vendor.callMetric('summary', 'observe', [30]);

  t.assert(
    registeredMetricSpy.observe.calledWith({ tag1: 1, tag2: 'foo' }, 30)
  );
  t.assert(registeredMetricSpy.observe.calledWith(30));
  t.deepEqual(registeredMetricSpy.labelNames, ['tag1', 'tag2']);
  t.deepEqual(registeredMetricSpy.percentiles, [0.5, 0.9, 0.99]);
});

test('metric names ARE modified if their names are invalid from default naming strategy perspective', (t) => {
  const invalidMetricsNames = {
    camelCase: 'camel_case',
    'special-@#$%^-chars': 'special_chars',
    'space seperated': 'space_seperated',
    'mixed - type_of-metricName ': 'mixed_type_of_metric_name',
  };

  const vendor = new Prometheus();
  for (const [invalidMetricName, validMetricName] of Object.entries(
    invalidMetricsNames
  )) {
    vendor.registerMetric(invalidMetricName, MetricsTypesEnum.Counter, {});
    const registeredMetric = (vendor as any).metricsRegistry.get(
      invalidMetricName
    );
    t.is(registeredMetric.name, validMetricName);
  }
});

test('metric names ARE NOT modified if their names are valid from default naming strategy perspective', (t) => {
  const validMetricsNames = [
    'lorem_ipsum',
    'sit_dolor_amet',
    'consectetur_adipiscing:elit',
    'consectetur_adipiscing:elit:sed:at',
  ];

  const vendor = new Prometheus();
  for (const validMetricName of validMetricsNames) {
    vendor.registerMetric(validMetricName, MetricsTypesEnum.Counter, {});
    const registeredMetric = (vendor as any).metricsRegistry.get(
      validMetricName
    );
    t.is(registeredMetric.name, validMetricName);
  }
});

test('metric names ARE modified according to the custom naming strategy', (t) => {
  const invalidMetricsNames = {
    FOO: 'oof',
    baR: 'rab',
  };

  const vendor = new Prometheus();
  vendor.setMetricNamingConvention((metricName) =>
    metricName
      .split('')
      .map((v) => v.toLowerCase())
      .reverse()
      .join('')
  );

  for (const [givenMetricName, expectedMetricName] of Object.entries(
    invalidMetricsNames
  )) {
    vendor.registerMetric(givenMetricName, MetricsTypesEnum.Counter, {});
    const registeredMetric = (vendor as any).metricsRegistry.get(
      givenMetricName
    );
    t.is(registeredMetric.name, expectedMetricName);
  }
});
