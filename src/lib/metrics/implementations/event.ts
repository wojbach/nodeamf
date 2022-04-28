import { EventOptions as SendOptions } from 'hot-shots';

import { MetricAbstract } from '../metric.abstract';
import { MetricInterface } from '../metric.interface';
import { MetricsTypesEnum } from '../metrics-types.enum';

export type EventOptions = Record<string, never>;

export class Event
  extends MetricAbstract<EventOptions>
  implements MetricInterface
{
  readonly type: MetricsTypesEnum = MetricsTypesEnum.Event;

  /* eslint-disable- @typescript-eslint/no-empty-function,@typescript-eslint-no-unused-vars */
  send(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    value: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    description?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options?: SendOptions,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tags?: string[]
    // eslint-disable-next-line @typescript-eslint/no-empty-function
  ): void {}
}
