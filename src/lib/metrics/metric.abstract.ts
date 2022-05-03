import { SupportedVendorsEnum } from '../vendors/supported-vendors.enum';

import { MetricsTypesEnum } from './metrics-types.enum';

export abstract class MetricAbstract<T extends Record<string, unknown>> {
  protected readonly name: string;
  protected readonly type: MetricsTypesEnum;
  protected readonly options: T;
  protected readonly registerInVendors: SupportedVendorsEnum[] = [];

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
