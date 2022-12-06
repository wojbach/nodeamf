import test from 'ava';

import { SupportedVendorsEnum } from '../../vendors/supported-vendors.enum';
import { MetricsTypesEnum } from '../metrics-types.enum';

import { Event } from './event';

test('object properly initiates with name defined', (t) => {
  t.notThrows(() => new Event('counter1', {}, []));
});

test('object properly initiates and class constructor arguments are accessible using getter methods', (t) => {
  let event;
  t.notThrows(() => {
    event = new Event('event1', { tags: ['tag1', 'tag2'] }, [
      SupportedVendorsEnum.Prometheus,
      'another-named-vendor-client',
    ]);
  });
  t.is(event.getName(), 'event1');
  t.deepEqual(event.getOptions(), { tags: ['tag1', 'tag2'] });
  t.deepEqual(event.getVendorsRegistry(), [
    SupportedVendorsEnum.Prometheus,
    'another-named-vendor-client',
  ]);
});

test('object properly returns its type', (t) => {
  const event = new Event('event1', {}, []);
  t.is(event.getType(), MetricsTypesEnum.Event);
});

test('measure method is callable mock, no state is saved', (t) => {
  const event1 = new Event('event1', { tags: ['tag1', 'tag2'] }, [
    SupportedVendorsEnum.Prometheus,
    'another-named-vendor-client',
  ]);

  const event2 = new Event('event1', { tags: ['tag1', 'tag2'] }, [
    SupportedVendorsEnum.Prometheus,
    'another-named-vendor-client',
  ]);

  t.notThrows(() => {
    event1.send('foo');
    event1.send('foo', 'some description');
    event1.send('foo', 'another description', {
      date_happened: new Date(),
      priority: 'low',
    });
  });
  t.deepEqual(event1, event2);
});
