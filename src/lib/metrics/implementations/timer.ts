import { MetricAbstract } from '../metric.abstract';
import { MetricInterface } from '../metric.interface';
import { MetricsTypesEnum } from '../metrics-types.enum';

export type TimerOptions = {
  tags?: string[];
};

export class Timer
  extends MetricAbstract<TimerOptions>
  implements MetricInterface
{
  readonly type: MetricsTypesEnum = MetricsTypesEnum.Timer;

  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  record(value?: number, tags?: { [tagName: string]: string }): void {}
}
