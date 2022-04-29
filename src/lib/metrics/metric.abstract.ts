import { SupportedVendorsEnum } from '../vendors/supported-vendors.enum';
import { VendorInterface } from '../vendors/vendor.interface';

import { MetricsTypesEnum } from './metrics-types.enum';

export abstract class MetricAbstract<T extends Record<string, unknown>> {
  readonly name: string;
  readonly type: MetricsTypesEnum;
  readonly options: T;
  readonly registerInVendors: SupportedVendorsEnum[] = [];
  registeredInVendors: VendorInterface[] = [];

  constructor(
    name: string,
    options: T,
    registerInVendors: SupportedVendorsEnum[]
  ) {
    this.name = name;
    this.options = options;
    this.registerInVendors = registerInVendors;
  }

  getName(): string {
    return this.name;
  }

  getOptions(): Record<string, unknown> {
    return this.options;
  }

  getType(): MetricsTypesEnum {
    return this.type;
  }

  getVendorsRegistry(): SupportedVendorsEnum[] {
    return this.registerInVendors;
  }
}
