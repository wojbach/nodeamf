import test from 'ava';

import { SupportedVendorsEnum } from '../../vendors/supported-vendors.enum';
import { MetricsTypesEnum } from '../metrics-types.enum';

import { Set } from './set';

test('object properly initiates with name defined', (t) => {
  t.notThrows(() => new Set('set1', {}, []));
});

test('object properly initiates and class constructor arguments are accessible using getter methods', (t) => {
  let set;
  t.notThrows(() => {
    set = new Set('set1', { tags: ['tag1', 'tag2'] }, [
      SupportedVendorsEnum.Prometheus,
    ]);
  });
  t.is(set.getName(), 'set1');
  t.deepEqual(set.getOptions(), { tags: ['tag1', 'tag2'] });
  t.deepEqual(set.getVendorsRegistry(), [SupportedVendorsEnum.Prometheus]);
});

test('object properly returns its type', (t) => {
  const set = new Set('set1', {}, []);
  t.is(set.getType(), MetricsTypesEnum.Set);
});

test('measure method is callable mock, no state is saved', (t) => {
  const set1 = new Set('set1', { tags: ['tag1', 'tag2'] }, [
    SupportedVendorsEnum.Prometheus,
  ]);

  const set2 = new Set('set1', { tags: ['tag1', 'tag2'] }, [
    SupportedVendorsEnum.Prometheus,
  ]);

  t.notThrows(() => {
    set1.set(1);
    set1.set('foo');
    set1.set('foo', { tag1: 'tag1Value' });
  });
  t.deepEqual(set1, set2);
});
