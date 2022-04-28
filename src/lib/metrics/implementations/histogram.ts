import { MetricAbstract } from '../metric.abstract';
import { MetricInterface } from '../metric.interface';
import { MetricsTypesEnum } from '../metrics-types.enum';

export type HistogramOptions = {
  tags?: string[];
  /**
   * Only for prometheus
   */
  buckets?: number[];
};

export class Histogram
  extends MetricAbstract<HistogramOptions>
  implements MetricInterface
{
  readonly type: MetricsTypesEnum = MetricsTypesEnum.Histogram;

  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  observe(value?: number, tags?: { [tagName: string]: string }): void {}
}
