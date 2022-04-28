import { MetricsTypesEnum } from '../metrics/metrics-types.enum';

import { SupportedVendorsEnum } from './supported-vendors.enum';

export interface VendorInterface {
  readonly name: SupportedVendorsEnum;
  readonly supportedMetrics: MetricsTypesEnum[];

  getClient();
  callMetric(metricName: string, method: string, args: unknown[]);
  registerMetric(
    metricName: string,
    metricType: MetricsTypesEnum,
    options: Record<string, unknown>
  );
}
