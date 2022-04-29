import { SupportedVendorsEnum } from '../vendors/supported-vendors.enum';

import { MetricsTypesEnum } from './metrics-types.enum';

export interface MetricInterface {
  getType(): MetricsTypesEnum;
  getName(): string;
  getOptions(): Record<string, unknown>;
  getVendorsRegistry(): SupportedVendorsEnum[];
}
