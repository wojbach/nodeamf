import { SupportedVendorsEnum } from '../vendors/supported-vendors.enum';

import { MetricsTypesEnum } from './metrics-types.enum';

export interface MetricInterface {
  readonly type: MetricsTypesEnum;
  readonly name: string;
  readonly options: Record<string, unknown>;
  readonly registerInVendors: SupportedVendorsEnum[];
}
