import test from 'ava';

import { SupportedVendorsEnum } from '../../vendors/supported-vendors.enum';
import { MetricsTypesEnum } from '../metrics-types.enum';

import { Counter } from './counter';

test('object properly initiates with name defined', (t) => {
  t.notThrows(() => new Counter('counter1', {}, []));
});

test('object properly initiates and class constructor arguments are accessible using getter methods', (t) => {
  let counter;
  t.notThrows(() => {
    counter = new Counter('counter1', { tags: ['tag1', 'tag2'] }, [
      SupportedVendorsEnum.Prometheus,
      'another-named-vendor-client',
    ]);
  });
  t.is(counter.getName(), 'counter1');
  t.deepEqual(counter.getOptions(), { tags: ['tag1', 'tag2'] });
  t.deepEqual(counter.getVendorsRegistry(), [
    SupportedVendorsEnum.Prometheus,
    'another-named-vendor-client',
  ]);
});

test('object properly returns its type', (t) => {
  const counter = new Counter('counter1', {}, []);
  t.is(counter.getType(), MetricsTypesEnum.Counter);
});

test('measure method is callable mock, no state is saved', (t) => {
  const counter1 = new Counter('counter1', { tags: ['tag1', 'tag2'] }, [
    SupportedVendorsEnum.Prometheus,
    'another-named-vendor-client',
  ]);

  const counter2 = new Counter('counter1', { tags: ['tag1', 'tag2'] }, [
    SupportedVendorsEnum.Prometheus,
    'another-named-vendor-client',
  ]);

  t.notThrows(() => {
    counter1.increment();
    counter1.increment(12);
    counter1.increment(12, { tag1: 'tagValue1' });
  });
  t.deepEqual(counter1, counter2);
});
