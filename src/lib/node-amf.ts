import { Counter } from './metrics/implementations/counter';
import { Event } from './metrics/implementations/event';
import { Gauge } from './metrics/implementations/gauge';
import { Histogram } from './metrics/implementations/histogram';
import { Set } from './metrics/implementations/set';
import { Summary } from './metrics/implementations/summary';
import { Timer } from './metrics/implementations/timer';
import { MetricInterface } from './metrics/metric.interface';
import { DogStatsd } from './vendors/implementations/dog-statsd';
import { Prometheus } from './vendors/implementations/prometheus';
import { SupportedVendorsEnum } from './vendors/supported-vendors.enum';
import { VendorInterface } from './vendors/vendor.interface';

export class NodeAmf {
  private vendorsRegistry: Map<SupportedVendorsEnum, VendorInterface> =
    new Map();
  private metricsRegistry: Map<string, MetricInterface> = new Map();

  static init(config: {
    vendors: VendorInterface[];
    metrics: MetricInterface[];
  }): NodeAmf {
    const nodeAmf = new NodeAmf();
    const { vendors, metrics } = config;
    vendors.forEach((vendor) => nodeAmf.addVendor(vendor));
    metrics.forEach((metric) => nodeAmf.addMetric(metric));

    return nodeAmf;
  }

  getMetric<T = Counter | Event | Gauge | Histogram | Set | Summary | Timer>(
    name: string
  ): T | undefined {
    return this.metricsRegistry.get(name) as unknown as T;
  }

  getVendor<T = Prometheus | DogStatsd>(
    name: SupportedVendorsEnum
  ): T | undefined {
    return this.vendorsRegistry.get(name) as unknown as T;
  }

  private addVendor(vendor: VendorInterface): void {
    this.vendorsRegistry.set(vendor.getName(), vendor);
  }

  private addMetric(metric: MetricInterface): void {
    const vendorsRegistry = this.vendorsRegistry;
    const measureFunctions = ['increment', 'send', 'set', 'observe', 'record'];
    const metricProxy = new Proxy(metric, {
      get: function (target, prop) {
        return typeof target[prop] !== 'function' ||
          !measureFunctions.includes(String(prop))
          ? target[prop]
          : function (...args) {
              target.getVendorsRegistry().forEach((supportedVendor) => {
                const vendorInRegistry = vendorsRegistry.get(supportedVendor);
                vendorInRegistry.callMetric(
                  target.getName(),
                  String(prop),
                  args
                );
              });
            };
      },
    });

    this.metricsRegistry.set(metric.getName(), metricProxy);

    metric.getVendorsRegistry().forEach((supportedVendor) => {
      const vendorInRegistry = this.vendorsRegistry.get(supportedVendor);
      vendorInRegistry.registerMetric(
        metric.getName(),
        metric.getType(),
        metric.getOptions()
      );
    });
  }
}
