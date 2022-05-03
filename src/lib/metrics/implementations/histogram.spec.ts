import test from 'ava';

import { SupportedVendorsEnum } from '../../vendors/supported-vendors.enum';
import { MetricsTypesEnum } from '../metrics-types.enum';

import { Histogram } from './histogram';

test('object properly initiates with name defined', (t) => {
  t.notThrows(() => new Histogram('histogram1', {}, []));
});

test('object properly initiates and class constructor arguments are accessible using getter methods', (t) => {
  let histogram;
  t.notThrows(() => {
    histogram = new Histogram(
      'histogram1',
      { tags: ['tag1', 'tag2'], buckets: [0.1, 5, 15, 50, 100, 500] },
      [SupportedVendorsEnum.Atlas]
    );
  });
  t.is(histogram.getName(), 'histogram1');
  t.deepEqual(histogram.getOptions(), {
    tags: ['tag1', 'tag2'],
    buckets: [0.1, 5, 15, 50, 100, 500],
  });
  t.deepEqual(histogram.getVendorsRegistry(), [SupportedVendorsEnum.Atlas]);
});

test('object properly returns its type', (t) => {
  const histogram = new Histogram('histogram1', {}, []);
  t.is(histogram.getType(), MetricsTypesEnum.Histogram);
});

test('measure method is callable mock, no state is saved', (t) => {
  const histogram1 = new Histogram(
    'histogram1',
    { tags: ['tag1', 'tag2'], buckets: [0.1, 5, 15, 50, 100, 500] },
    [SupportedVendorsEnum.Atlas]
  );

  const histogram2 = new Histogram(
    'histogram1',
    { tags: ['tag1', 'tag2'], buckets: [0.1, 5, 15, 50, 100, 500] },
    [SupportedVendorsEnum.Atlas]
  );

  t.notThrows(() => {
    histogram1.observe(1);
    histogram1.observe(1, { tag1: 'tag1Value' });
  });
  t.deepEqual(histogram1, histogram2);
});
