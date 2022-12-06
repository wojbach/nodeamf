import test from 'ava';

import { SupportedVendorsEnum } from '../../vendors/supported-vendors.enum';
import { MetricsTypesEnum } from '../metrics-types.enum';

import { Summary } from './summary';

test('object properly initiates with name defined', (t) => {
  t.notThrows(() => new Summary('summary1', {}, []));
});

test('object properly initiates and class constructor arguments are accessible using getter methods', (t) => {
  let summary;
  t.notThrows(() => {
    summary = new Summary(
      'summary1',
      { tags: ['tag1', 'tag2'], percentiles: [0.01, 0.1, 0.9, 0.99] },
      [SupportedVendorsEnum.Prometheus, 'another-named-vendor-client']
    );
  });
  t.is(summary.getName(), 'summary1');
  t.deepEqual(summary.getOptions(), {
    tags: ['tag1', 'tag2'],
    percentiles: [0.01, 0.1, 0.9, 0.99],
  });
  t.deepEqual(summary.getVendorsRegistry(), [
    SupportedVendorsEnum.Prometheus,
    'another-named-vendor-client',
  ]);
});

test('object properly returns its type', (t) => {
  const summary = new Summary('summary1', {}, []);
  t.is(summary.getType(), MetricsTypesEnum.Summary);
});

test('measure method is callable mock, no state is saved', (t) => {
  const summary1 = new Summary(
    'summary1',
    { tags: ['tag1', 'tag2'], percentiles: [0.01, 0.1, 0.9, 0.99] },
    [SupportedVendorsEnum.Prometheus, 'another-named-vendor-client']
  );

  const summary2 = new Summary(
    'summary1',
    { tags: ['tag1', 'tag2'], percentiles: [0.01, 0.1, 0.9, 0.99] },
    [SupportedVendorsEnum.Prometheus, 'another-named-vendor-client']
  );

  t.notThrows(() => {
    summary1.observe(1);
    summary1.observe(1, { tag1: 'tag1Value' });
  });
  t.deepEqual(summary1, summary2);
});
