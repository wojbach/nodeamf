import { StandardUnit } from '@aws-sdk/client-cloudwatch';
import test from 'ava';
import * as sinon from 'ts-sinon';

import { MetricsTypesEnum } from '../../metrics/metrics-types.enum';
import { SupportedVendorsEnum } from '../supported-vendors.enum';

import { CloudWatch } from './cloud-watch';

test('object properly initiates without config', (t) => {
  t.notThrows(() => new CloudWatch());
});

test('object properly initiates with config', (t) => {
  t.notThrows(
    () =>
      new CloudWatch({
        region: 'us-east-1',
        logger: console,
      })
  );
});

test('underlying client is accessible through getter', (t) => {
  const vendor = new CloudWatch();
  t.truthy(vendor.getClient());
});

test('properly returns its name and supported metrics', (t) => {
  const vendor = new CloudWatch();
  t.is(vendor.getName(), SupportedVendorsEnum.CloudWatch);
  t.truthy(Array.isArray(vendor.getSupportedMetrics()));
  t.truthy(vendor.getSupportedMetrics().length > 0);
  vendor
    .getSupportedMetrics()
    .forEach((value) => t.truthy(MetricsTypesEnum[value]));
});

test('properly sets a custom name for vendor', (t) => {
  const vendor = new CloudWatch({
    name: 'my cloudwatch 1',
  });
  t.is(vendor.getName(), 'my cloudwatch 1');
});

test('properly sets a custom flushTimeout for vendor', (t) => {
  const vendor = new CloudWatch({
    flushTimeout: 10,
  });
  t.is((vendor as any).flushTimeout, 10);
});

test('properly sets a custom bufferSize for vendor', (t) => {
  const vendor = new CloudWatch({
    bufferSize: 10,
  });
  t.is((vendor as any).bufferSize, 10);
});

test('throws when buffer size exceeds max allowed buffer size', (t) => {
  t.throws(
    () =>
      new CloudWatch({
        bufferSize: Number.MAX_SAFE_INTEGER,
      })
  );
});

test('properly sets a custom namespace for vendor', (t) => {
  const vendor = new CloudWatch({
    namespace: 'LOREM_IPSUM',
  });
  t.is((vendor as any).namespace, 'LOREM_IPSUM');
});

test('properly sets a custom name for vendor and a client config', async (t) => {
  const vendor = new CloudWatch({
    name: 'my cloudwatch 1',
    region: 'us-west-2',
  });

  t.is(vendor.getName(), 'my cloudwatch 1');
  t.truthy(vendor.getClient());
  t.deepEqual(await vendor.getClient().config.region(), 'us-west-2');
});

test('properly registers metric of supported type', (t) => {
  const vendor = new CloudWatch();

  vendor.registerMetric('metric1', MetricsTypesEnum.Gauge, {});
  t.truthy((vendor as any).metricsRegistry.has('metric1'));
});

test('throws while registering unsupported metrics types', (t) => {
  const vendor = new CloudWatch();
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
  const vendor = new CloudWatch();

  t.throws(() => {
    vendor.registerMetric('metric1', MetricsTypesEnum.Counter, {});
    vendor.registerMetric('metric1', MetricsTypesEnum.Counter, {});
  });
});

test('throws when calling unregistered metric', (t) => {
  const vendor = new CloudWatch();

  t.throws(() => {
    vendor.callMetric('metric1', 'increment', []);
  });
});

test('calling counter metric invokes underlying client properly', (t) => {
  const now = new Date();
  sinon.default.useFakeTimers(now);

  const vendor = new CloudWatch({ bufferSize: 1 });
  const client = vendor.getClient();
  const sendMock = sinon.default
    .stub(client, 'send')
    .resolves({ $metadata: {} });

  vendor.registerMetric('counter', MetricsTypesEnum.Counter, {
    tags: ['tag1', 'tag2'],
  });
  vendor.callMetric('counter', 'increment', [13, { tag1: '1', tag2: 'foo' }]);

  t.deepEqual(sendMock?.firstCall?.firstArg?.input, {
    Namespace: undefined,
    MetricData: [
      {
        MetricName: 'counter',
        Dimensions: [
          {
            Name: 'tag1',
            Value: '1',
          },
          {
            Name: 'tag2',
            Value: 'foo',
          },
        ],
        Unit: 'None',
        Value: 13,
        StatisticValues: {
          Sum: 13,
          Maximum: 13,
          Minimum: 13,
          SampleCount: 1,
        },
        Timestamp: now,
      },
    ],
  });

  sendMock.restore();
});

test('calling counter metric with set unit type invokes underlying client properly', (t) => {
  const now = new Date();
  sinon.default.useFakeTimers(now);

  const vendor = new CloudWatch({ bufferSize: 1 });
  const client = vendor.getClient();
  const sendMock = sinon.default
    .stub(client, 'send')
    .resolves({ $metadata: {} });

  vendor.registerMetric('counter', MetricsTypesEnum.Counter, {
    tags: ['tag1', 'tag2'],
    unit: StandardUnit.Count,
  });
  vendor.callMetric('counter', 'increment', [13, { tag1: '1', tag2: 'foo' }]);

  t.deepEqual(sendMock?.firstCall?.firstArg?.input, {
    Namespace: undefined,
    MetricData: [
      {
        MetricName: 'counter',
        Dimensions: [
          {
            Name: 'tag1',
            Value: '1',
          },
          {
            Name: 'tag2',
            Value: 'foo',
          },
        ],
        Unit: 'Count',
        Value: 13,
        StatisticValues: {
          Sum: 13,
          Maximum: 13,
          Minimum: 13,
          SampleCount: 1,
        },
        Timestamp: now,
      },
    ],
  });

  sendMock.restore();
});

test('if AWS send method throws collecting another metrics should be still possible', async (t) => {
  const vendor = new CloudWatch({ bufferSize: 1 });
  const client = vendor.getClient();
  const sendMock = sinon.default
    .stub(client, 'send')
    .rejects(new Error('network error'));

  const consoleSpy = sinon.default.spy(console, 'error');

  vendor.registerMetric('counter', MetricsTypesEnum.Counter, {});

  t.notThrows(() => vendor.callMetric('counter', 'increment', [1]));

  consoleSpy.restore();
  sendMock.restore();
});

test('calling counter metric invokes underlying client properly after flush timeout has passed', (t) => {
  const now = new Date();
  const clock = sinon.default.useFakeTimers(now);

  const vendor = new CloudWatch({ flushTimeout: 200 });
  const client = vendor.getClient();
  const sendMock = sinon.default
    .stub(client, 'send')
    .resolves({ $metadata: {} });

  vendor.registerMetric('counter', MetricsTypesEnum.Counter, {
    tags: ['tag1', 'tag2'],
  });
  vendor.callMetric('counter', 'increment', [13, { tag1: '1', tag2: 'foo' }]);

  clock.tick(210);

  t.deepEqual(sendMock?.firstCall?.firstArg?.input, {
    Namespace: undefined,
    MetricData: [
      {
        MetricName: 'counter',
        Dimensions: [
          {
            Name: 'tag1',
            Value: '1',
          },
          {
            Name: 'tag2',
            Value: 'foo',
          },
        ],
        Unit: 'None',
        Value: 13,
        StatisticValues: {
          Sum: 13,
          Maximum: 13,
          Minimum: 13,
          SampleCount: 1,
        },
        Timestamp: now,
      },
    ],
  });

  clock.restore();
  sendMock.restore();
});

test('calling counter metric invokes underlying client properly few times after flush timeout has passed', (t) => {
  const now = new Date();
  const clock = sinon.default.useFakeTimers(now);

  const vendor = new CloudWatch({ flushTimeout: 50 });
  const client = vendor.getClient();
  const sendMock = sinon.default
    .stub(client, 'send')
    .resolves({ $metadata: {} });

  vendor.registerMetric('counter', MetricsTypesEnum.Counter, {});

  const first = [10, 20, 30, 15, 45, 5];

  for (const value of first) {
    vendor.callMetric('counter', 'increment', [value]);
  }

  clock.tick(55);

  const second = [11, 33, 23, 432, 1, 22];

  for (const value of second) {
    vendor.callMetric('counter', 'increment', [value]);
  }

  clock.tick(55);

  t.deepEqual(sendMock?.getCall(0)?.firstArg?.input, {
    Namespace: undefined,
    MetricData: [
      {
        MetricName: 'counter',
        Dimensions: [],
        Unit: 'None',
        Value: first.reduce((a, b) => a + b, 0),
        StatisticValues: {
          Sum: first.reduce((a, b) => a + b, 0),
          Maximum: Math.max(...first),
          Minimum: Math.min(...first),
          SampleCount: first.length,
        },
        Timestamp: now,
      },
    ],
  });

  t.deepEqual(sendMock?.getCall(1)?.firstArg?.input, {
    Namespace: undefined,
    MetricData: [
      {
        MetricName: 'counter',
        Dimensions: [],
        Unit: 'None',
        Value: second.reduce((a, b) => a + b, 0),
        StatisticValues: {
          Sum: second.reduce((a, b) => a + b, 0),
          Maximum: Math.max(...second),
          Minimum: Math.min(...second),
          SampleCount: second.length,
        },
        Timestamp: new Date(now.getTime() + 55),
      },
    ],
  });

  sendMock.restore();
  clock.restore();
});

test('calling counter metric with custom namespace invokes underlying client properly', (t) => {
  const now = new Date();
  sinon.default.useFakeTimers(now);

  const vendor = new CloudWatch({ bufferSize: 1, namespace: 'LOREM_IPSUM' });
  const client = vendor.getClient();
  const sendMock = sinon.default
    .stub(client, 'send')
    .resolves({ $metadata: {} });

  vendor.registerMetric('counter', MetricsTypesEnum.Counter, {
    tags: ['tag1', 'tag2'],
  });
  vendor.callMetric('counter', 'increment', [13, { tag1: '1', tag2: 'foo' }]);

  t.deepEqual(sendMock?.firstCall?.firstArg?.input, {
    Namespace: 'LOREM_IPSUM',
    MetricData: [
      {
        MetricName: 'counter',
        Dimensions: [
          {
            Name: 'tag1',
            Value: '1',
          },
          {
            Name: 'tag2',
            Value: 'foo',
          },
        ],
        Unit: 'None',
        Value: 13,
        StatisticValues: {
          Sum: 13,
          Maximum: 13,
          Minimum: 13,
          SampleCount: 1,
        },
        Timestamp: now,
      },
    ],
  });

  sendMock.restore();
});

test('calling gauge metric invokes underlying client properly', (t) => {
  const now = new Date();
  sinon.default.useFakeTimers(now);

  const vendor = new CloudWatch({ bufferSize: 1 });
  const client = vendor.getClient();
  const sendMock = sinon.default
    .stub(client, 'send')
    .resolves({ $metadata: {} });

  vendor.registerMetric('gauge', MetricsTypesEnum.Gauge, {});
  vendor.callMetric('gauge', 'set', [10, { tag1: '1', tag2: 'foo' }]);

  t.deepEqual(sendMock?.firstCall?.firstArg?.input, {
    Namespace: undefined,
    MetricData: [
      {
        MetricName: 'gauge',
        Dimensions: [
          {
            Name: 'tag1',
            Value: '1',
          },
          {
            Name: 'tag2',
            Value: 'foo',
          },
        ],
        Unit: 'None',
        Value: 10,
        StatisticValues: {
          Sum: 10,
          Maximum: 10,
          Minimum: 10,
          SampleCount: 1,
        },
        Timestamp: now,
      },
    ],
  });

  sendMock.restore();
});

test('calling summary metric invokes underlying client properly', (t) => {
  const now = new Date();
  sinon.default.useFakeTimers(now);

  const vendor = new CloudWatch({ bufferSize: 1 });
  const client = vendor.getClient();
  const sendMock = sinon.default
    .stub(client, 'send')
    .resolves({ $metadata: {} });

  vendor.registerMetric('summary', MetricsTypesEnum.Summary, {});
  vendor.callMetric('summary', 'observe', [20, { tag1: '1', tag2: 'foo' }]);

  t.deepEqual(sendMock?.firstCall?.firstArg?.input, {
    Namespace: undefined,
    MetricData: [
      {
        MetricName: 'summary',
        Dimensions: [
          {
            Name: 'tag1',
            Value: '1',
          },
          {
            Name: 'tag2',
            Value: 'foo',
          },
        ],
        Unit: 'None',
        Value: 20,
        StatisticValues: {
          Sum: 20,
          Maximum: 20,
          Minimum: 20,
          SampleCount: 1,
        },
        Timestamp: now,
      },
    ],
  });

  sendMock.restore();
});

test('metric names ARE modified if their names are invalid from default naming strategy perspective', (t) => {
  const now = new Date();
  sinon.default.useFakeTimers(now);

  const invalidMetricsNames = {
    camelCase: 'camel_case',
    'special-@#$%^-chars': 'special_chars',
    'space seperated': 'space_seperated',
    'mixed - type_of-metricName ': 'mixed_type_of_metric_name',
  };

  const vendor = new CloudWatch({ bufferSize: 1 });
  const client = vendor.getClient();

  for (const [invalidMetricName, validMetricName] of Object.entries(
    invalidMetricsNames
  )) {
    const sendMock = sinon.default
      .stub(client, 'send')
      .resolves({ $metadata: {} });

    vendor.registerMetric(invalidMetricName, MetricsTypesEnum.Counter, {});
    vendor.callMetric(invalidMetricName, 'increment', []);

    t.deepEqual(sendMock?.firstCall?.firstArg?.input, {
      Namespace: undefined,
      MetricData: [
        {
          MetricName: validMetricName,
          Dimensions: [],
          Unit: 'None',
          Value: 1,
          StatisticValues: {
            Sum: 1,
            Maximum: 1,
            Minimum: 1,
            SampleCount: 1,
          },
          Timestamp: now,
        },
      ],
    });

    sendMock.restore();
  }
});

test('metric names ARE NOT modified if their names are valid from default naming strategy perspective', (t) => {
  const now = new Date();
  sinon.default.useFakeTimers(now);

  const validMetricsNames = [
    'lorem_ipsum',
    'sit_dolor_amet',
    'consectetur_adipiscing_elit',
    'consectetur_adipiscing_elit_sed_at1337',
  ];

  const vendor = new CloudWatch({ bufferSize: 1 });
  const client = vendor.getClient();

  for (const validMetricName of validMetricsNames) {
    const sendMock = sinon.default
      .stub(client, 'send')
      .resolves({ $metadata: {} });

    vendor.registerMetric(validMetricName, MetricsTypesEnum.Counter, {});
    vendor.callMetric(validMetricName, 'increment', []);

    t.deepEqual(sendMock?.firstCall?.firstArg?.input, {
      Namespace: undefined,
      MetricData: [
        {
          MetricName: validMetricName,
          Dimensions: [],
          Unit: 'None',
          Value: 1,
          StatisticValues: {
            Sum: 1,
            Maximum: 1,
            Minimum: 1,
            SampleCount: 1,
          },
          Timestamp: now,
        },
      ],
    });

    sendMock.restore();
  }
});

test('metric names ARE modified according to the custom naming strategy', (t) => {
  const now = new Date();
  sinon.default.useFakeTimers(now);

  const metricsNames = {
    FOO: 'oof',
    baR: 'rab',
  };

  const vendor = new CloudWatch({ bufferSize: 1 });
  const client = vendor.getClient();

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
    const sendMock = sinon.default
      .stub(client, 'send')
      .resolves({ $metadata: {} });

    vendor.registerMetric(givenMetricName, MetricsTypesEnum.Counter, {});
    vendor.callMetric(givenMetricName, 'increment', []);

    t.deepEqual(sendMock?.firstCall?.firstArg?.input, {
      Namespace: undefined,
      MetricData: [
        {
          MetricName: expectedMetricName,
          Dimensions: [],
          Unit: 'None',
          Value: 1,
          StatisticValues: {
            Sum: 1,
            Maximum: 1,
            Minimum: 1,
            SampleCount: 1,
          },
          Timestamp: now,
        },
      ],
    });

    sendMock.restore();
  }
});

test('calling counter metric multiple times aggregates stats properly and invokes underlying client properly', (t) => {
  const now = new Date();
  sinon.default.useFakeTimers(now);

  const vendor = new CloudWatch({ bufferSize: 2 });
  const client = vendor.getClient();
  const sendMock = sinon.default
    .stub(client, 'send')
    .resolves({ $metadata: {} });

  vendor.registerMetric('counter', MetricsTypesEnum.Counter, {
    tags: ['tag1', 'tag2'],
  });
  vendor.callMetric('counter', 'increment', [13, { tag1: '1', tag2: 'foo' }]);
  vendor.callMetric('counter', 'increment', [1, { tag1: '1', tag2: 'foo' }]);
  vendor.callMetric('counter', 'increment', [15, { tag1: '1', tag2: 'foo' }]);
  vendor.callMetric('counter', 'increment', [7]);

  t.deepEqual(sendMock?.firstCall?.firstArg?.input, {
    Namespace: undefined,
    MetricData: [
      {
        MetricName: 'counter',
        Dimensions: [
          {
            Name: 'tag1',
            Value: '1',
          },
          {
            Name: 'tag2',
            Value: 'foo',
          },
        ],
        Unit: 'None',
        Value: 29,
        StatisticValues: {
          Sum: 29,
          Maximum: 15,
          Minimum: 1,
          SampleCount: 3,
        },
        Timestamp: now,
      },
      {
        MetricName: 'counter',
        Dimensions: [],
        Unit: 'None',
        Value: 7,
        StatisticValues: {
          Sum: 7,
          Maximum: 7,
          Minimum: 7,
          SampleCount: 1,
        },
        Timestamp: now,
      },
    ],
  });

  sendMock.restore();
});

test('calling gauge metric multiple times aggregates stats properly and invokes underlying client properly', (t) => {
  const now = new Date();
  sinon.default.useFakeTimers(now);

  const vendor = new CloudWatch({ bufferSize: 2 });
  const client = vendor.getClient();
  const sendMock = sinon.default
    .stub(client, 'send')
    .resolves({ $metadata: {} });

  vendor.registerMetric('gauge', MetricsTypesEnum.Gauge, {
    tags: ['tag1', 'tag2'],
  });
  vendor.callMetric('gauge', 'set', [30, { tag1: '1', tag2: 'foo' }]);
  vendor.callMetric('gauge', 'set', [20, { tag1: '1', tag2: 'foo' }]);
  vendor.callMetric('gauge', 'set', [10, { tag1: '1', tag2: 'foo' }]);
  vendor.callMetric('gauge', 'set', [13]);

  t.deepEqual(sendMock?.firstCall?.firstArg?.input, {
    Namespace: undefined,
    MetricData: [
      {
        MetricName: 'gauge',
        Dimensions: [
          {
            Name: 'tag1',
            Value: '1',
          },
          {
            Name: 'tag2',
            Value: 'foo',
          },
        ],
        Unit: 'None',
        Value: 10,
        StatisticValues: {
          Sum: 60,
          Maximum: 30,
          Minimum: 10,
          SampleCount: 3,
        },
        Timestamp: now,
      },
      {
        MetricName: 'gauge',
        Dimensions: [],
        Unit: 'None',
        Value: 13,
        StatisticValues: {
          Sum: 13,
          Maximum: 13,
          Minimum: 13,
          SampleCount: 1,
        },
        Timestamp: now,
      },
    ],
  });

  sendMock.restore();
});

test('calling summary metric multiple times does not aggregate stats to allow CloudWatch calculate percentiles and invokes underlying client properly', (t) => {
  const now = new Date();
  sinon.default.useFakeTimers(now);

  const vendor = new CloudWatch({ bufferSize: 3 });
  const client = vendor.getClient();
  const sendMock = sinon.default
    .stub(client, 'send')
    .resolves({ $metadata: {} });

  vendor.registerMetric('summary', MetricsTypesEnum.Summary, {});
  vendor.callMetric('summary', 'observe', [1]);
  vendor.callMetric('summary', 'observe', [15]);
  vendor.callMetric('summary', 'observe', [7]);

  t.deepEqual(sendMock?.firstCall?.firstArg?.input, {
    Namespace: undefined,
    MetricData: [
      {
        MetricName: 'summary',
        Dimensions: [],
        Unit: 'None',
        Value: 1,
        StatisticValues: {
          Sum: 1,
          Maximum: 1,
          Minimum: 1,
          SampleCount: 1,
        },
        Timestamp: now,
      },
      {
        MetricName: 'summary',
        Dimensions: [],
        Unit: 'None',
        Value: 15,
        StatisticValues: {
          Sum: 15,
          Maximum: 15,
          Minimum: 15,
          SampleCount: 1,
        },
        Timestamp: now,
      },
      {
        MetricName: 'summary',
        Dimensions: [],
        Unit: 'None',
        Value: 7,
        StatisticValues: {
          Sum: 7,
          Maximum: 7,
          Minimum: 7,
          SampleCount: 1,
        },
        Timestamp: now,
      },
    ],
  });

  sendMock.restore();
});
