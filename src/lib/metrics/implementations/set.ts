import { MetricAbstract } from '../metric.abstract';
import { MetricInterface } from '../metric.interface';
import { MetricsTypesEnum } from '../metrics-types.enum';

export type SetOptions = {
  tags?: string[];
};

export class Set extends MetricAbstract<SetOptions> implements MetricInterface {
  readonly type: MetricsTypesEnum = MetricsTypesEnum.Set;

  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  set(value?: number | string, tags?: { [tagName: string]: string }): void {}
}
