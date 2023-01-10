import { MetricAbstract } from '../metric.abstract';
import { MetricInterface } from '../metric.interface';
import { MetricsTypesEnum } from '../metrics-types.enum';

export type SummaryOptions = {
  tags?: string[];
  percentiles?: number[]; //only supported in prometheus
  unit?: string; //only supported in CloudWatch (https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cloudwatch/enums/standardunit.html)
};

export class Summary
  extends MetricAbstract<SummaryOptions>
  implements MetricInterface
{
  readonly type: MetricsTypesEnum = MetricsTypesEnum.Summary;

  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  observe(value?: number, tags?: { [tagName: string]: string }): void {}
}
