import { SupportedVendorsEnum } from './supported-vendors.enum';

export abstract class VendorAbstract {
  protected name: SupportedVendorsEnum | string;

  getName(): string {
    return this.name;
  }
}
