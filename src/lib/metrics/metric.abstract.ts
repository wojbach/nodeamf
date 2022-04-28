import { SupportedVendorsEnum } from '../vendors/supported-vendors.enum';
import { VendorInterface } from '../vendors/vendor.interface';

export abstract class MetricAbstract<T> {
  readonly name: string;
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
}
