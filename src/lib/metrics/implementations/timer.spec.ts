import test from 'ava';

import { SupportedVendorsEnum } from '../../vendors/supported-vendors.enum';
import { MetricsTypesEnum } from '../metrics-types.enum';

import { Timer } from './timer';

test('object properly initiates with name defined', (t) => {
  t.notThrows(() => new Timer('timer1', {}, []));
});

test('object properly initiates and class constructor arguments are accessible using getter methods', (t) => {
  let timer;
  t.notThrows(() => {
    timer = new Timer('timer1', { tags: ['tag1', 'tag2'] }, [
      SupportedVendorsEnum.Atlas,
    ]);
  });
  t.is(timer.getName(), 'timer1');
  t.deepEqual(timer.getOptions(), { tags: ['tag1', 'tag2'] });
  t.deepEqual(timer.getVendorsRegistry(), [SupportedVendorsEnum.Atlas]);
});

test('object properly returns its type', (t) => {
  const timer = new Timer('timer1', {}, []);
  t.is(timer.getType(), MetricsTypesEnum.Timer);
});

test('measure method is callable mock, no state is saved', (t) => {
  const timer1 = new Timer('timer1', { tags: ['tag1', 'tag2'] }, [
    SupportedVendorsEnum.Atlas,
  ]);

  const timer2 = new Timer('timer1', { tags: ['tag1', 'tag2'] }, [
    SupportedVendorsEnum.Atlas,
  ]);

  t.notThrows(() => {
    timer1.record(1);
    timer1.record(1, { tag1: 'tag1Value' });
  });
  t.deepEqual(timer1, timer2);
});
