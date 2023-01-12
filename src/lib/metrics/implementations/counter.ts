import { MetricAbstract } from '../metric.abstract';
import { MetricInterface } from '../metric.interface';
import { MetricsTypesEnum } from '../metrics-types.enum';

export type CounterOptions = {
  tags?: string[];
  unit?: string; //only supported in Cloud Watch (https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cloudwatch/enums/standardunit.html)
};

export class Counter
  extends MetricAbstract<CounterOptions>
  implements MetricInterface
{
  readonly type: MetricsTypesEnum = MetricsTypesEnum.Counter;

  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  increment(value?: number, tags?: { [tagName: string]: string }): void {}
}
