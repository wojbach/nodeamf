import { MetricAbstract } from '../metric.abstract';
import { MetricInterface } from '../metric.interface';
import { MetricsTypesEnum } from '../metrics-types.enum';

export type GaugeOptions = {
  tags?: string[];
};

export class Gauge
  extends MetricAbstract<GaugeOptions>
  implements MetricInterface
{
  readonly type: MetricsTypesEnum = MetricsTypesEnum.Gauge;

  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  set(value?: number, tags?: { [tagName: string]: string }): void {}
}
