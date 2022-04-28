import { MetricAbstract } from '../metric.abstract';
import { MetricInterface } from '../metric.interface';
import { MetricsTypesEnum } from '../metrics-types.enum';

export type CounterOptions = {
  tags?: string[];
};

export class Counter
  extends MetricAbstract<CounterOptions>
  implements MetricInterface
{
  readonly type: MetricsTypesEnum = MetricsTypesEnum.Counter;

  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  increment(value?: number, tags?: { [tagName: string]: string }): void {}
}
