import test from 'ava';

import { SupportedVendorsEnum } from '../../vendors/supported-vendors.enum';
import { MetricsTypesEnum } from '../metrics-types.enum';

import { Gauge } from './gauge';

test('object properly initiates with name defined', (t) => {
  t.notThrows(() => new Gauge('gauge1', {}, []));
});

test('object properly initiates and class constructor arguments are accessible using getter methods', (t) => {
  let gauge;
  t.notThrows(() => {
    gauge = new Gauge('gauge1', { tags: ['tag1', 'tag2'] }, [
      SupportedVendorsEnum.Prometheus,
    ]);
  });
  t.is(gauge.getName(), 'gauge1');
  t.deepEqual(gauge.getOptions(), { tags: ['tag1', 'tag2'] });
  t.deepEqual(gauge.getVendorsRegistry(), [SupportedVendorsEnum.Prometheus]);
});

test('object properly returns its type', (t) => {
  const gauge = new Gauge('gauge1', {}, []);
  t.is(gauge.getType(), MetricsTypesEnum.Gauge);
});

test('measure method is callable mock, no state is saved', (t) => {
  const gauge1 = new Gauge('gauge1', { tags: ['tag1', 'tag2'] }, [
    SupportedVendorsEnum.Prometheus,
  ]);

  const gauge2 = new Gauge('gauge1', { tags: ['tag1', 'tag2'] }, [
    SupportedVendorsEnum.Prometheus,
  ]);

  t.notThrows(() => {
    gauge1.set(1);
    gauge1.set(1, { tag1: 'tag1Value' });
  });
  t.deepEqual(gauge1, gauge2);
});
