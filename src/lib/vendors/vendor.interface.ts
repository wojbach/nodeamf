import { MetricsTypesEnum } from '../metrics/metrics-types.enum';

import { SupportedVendorsEnum } from './supported-vendors.enum';

export interface VendorInterface {
  getName(): SupportedVendorsEnum;

  getSupportedMetrics(): MetricsTypesEnum[];

  getClient();

  setMetricNamingConvention(convertFunction: (metricName: string) => string);

  callMetric(metricName: string, method: string, args: unknown[]);

  registerMetric(
    metricName: string,
    metricType: MetricsTypesEnum,
    options: Record<string, unknown>
  );
}
