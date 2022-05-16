import { ClientOptions, StatsD } from 'hot-shots';

import { MetricsTypesEnum } from '../../metrics/metrics-types.enum';
import { SupportedVendorsEnum } from '../supported-vendors.enum';
import { VendorInterface } from '../vendor.interface';

type DogStatsdConfigOptions = ClientOptions;

export class DogStatsd implements VendorInterface {
  private readonly name: SupportedVendorsEnum = SupportedVendorsEnum.DogStatsD;
  private readonly supportedMetrics: MetricsTypesEnum[] = [
    MetricsTypesEnum.Counter,
    MetricsTypesEnum.Gauge,
    MetricsTypesEnum.Histogram,
    MetricsTypesEnum.Set,
    MetricsTypesEnum.Event,
  ];
  private readonly client: StatsD;
  private metricNamingConvention = (metricName: string) =>
    metricName
      .replace(/[A-Z]+/g, (match) => `.${match.toLowerCase()}`)
      .match(
        /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g
      )
      .join('.');
  private metricsRegistry: Map<
    string,
    { metricType: MetricsTypesEnum; options: Record<string, unknown> }
  > = new Map();

  constructor(config?: DogStatsdConfigOptions) {
    this.client = new StatsD(config);
  }

  getName(): SupportedVendorsEnum {
    return this.name;
  }

  getSupportedMetrics(): MetricsTypesEnum[] {
    return this.supportedMetrics;
  }

  getClient(): StatsD {
    return this.client;
  }

  setMetricNamingConvention(convertFunction: (metricName: string) => string) {
    this.metricNamingConvention = convertFunction;
  }

  callMetric(metricName: string, method: string, args: unknown[]) {
    const metric = this.metricsRegistry.get(metricName);
    if (!metric) {
      throw new Error('Metric named: ' + metricName + " doesn't exist");
    }

    const { specMethod, specArgs } =
      this.mapUnifiedMetricMethodToVendorsSpecific(
        this.metricNamingConvention(metricName),
        metric,
        method,
        args
      );

    this.client[specMethod](...specArgs);
  }

  registerMetric(
    metricName: string,
    metricType: MetricsTypesEnum,
    options: Record<string, unknown>
  ) {
    if (!this.supportedMetrics.includes(metricType)) {
      throw new Error(
        'Unsupported metric type: ' + MetricsTypesEnum[metricType]
      );
    }

    if (this.metricsRegistry.has(metricName)) {
      throw new Error(
        'Metric with the same name already exists: ' + metricName
      );
    }

    this.metricsRegistry.set(metricName, { metricType, options });
  }

  private mapUnifiedMetricMethodToVendorsSpecific(
    metricName: string,
    metric: { metricType: MetricsTypesEnum; options: Record<string, unknown> },
    method: string,
    args: unknown[]
  ): { specMethod: string; specArgs: unknown[] } {
    switch (method) {
      case 'increment':
        return {
          specMethod: 'increment',
          specArgs: ((args) => [metricName, ...args])(args),
        };
      case 'set':
        return metric.metricType === MetricsTypesEnum.Gauge
          ? {
              specMethod: 'gauge',
              specArgs: ((args) => [metricName, ...args])(args),
            }
          : {
              specMethod: 'set',
              specArgs: ((args) => [metricName, ...args])(args),
            };
      case 'observe':
        return {
          specMethod: 'histogram',
          specArgs: ((args) => [metricName, ...args])(args),
        };
      case 'send':
        return {
          specMethod: 'event',
          specArgs: ((args) => [metricName, ...args])(args),
        };
      default:
        throw new Error('Could not map metric method: ' + method);
    }
  }
}
