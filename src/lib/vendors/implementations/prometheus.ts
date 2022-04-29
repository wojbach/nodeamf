import promClient from 'prom-client';

import { MetricsTypesEnum } from '../../metrics/metrics-types.enum';
import { SupportedVendorsEnum } from '../supported-vendors.enum';
import { VendorInterface } from '../vendor.interface';

export class Prometheus implements VendorInterface {
  private readonly name: SupportedVendorsEnum = SupportedVendorsEnum.Prometheus;
  private readonly supportedMetrics: MetricsTypesEnum[] = [
    MetricsTypesEnum.Counter,
    MetricsTypesEnum.Gauge,
    MetricsTypesEnum.Histogram,
    MetricsTypesEnum.Summary,
  ];
  private readonly client: typeof promClient;
  private metricsRegistry: Map<string, unknown> = new Map();

  constructor() {
    this.client = promClient;
  }

  getName(): SupportedVendorsEnum {
    return this.name;
  }

  getSupportedMetrics(): MetricsTypesEnum[] {
    return this.supportedMetrics;
  }

  getClient(): typeof promClient {
    return this.client;
  }

  callMetric(metricName: string, method: string, args: unknown[]) {
    const metric = this.metricsRegistry.get(metricName);
    if (!metric) {
      throw new Error('Metric named: ' + metricName + " doesn't exist");
    }

    const { specMethod, specArgs } =
      this.mapUnifiedMetricMethodToVendorsSpecific(method, args);

    metric[specMethod](...specArgs);
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

    const metricObject = this.constructMetricObjectByType(
      metricName,
      metricType,
      options
    );

    this.metricsRegistry.set(metricName, metricObject);
  }

  private constructMetricObjectByType(
    metricName,
    metricType: MetricsTypesEnum,
    options: Record<string, unknown>
  ) {
    const labelNames: string[] = options.tags ? (options.tags as string[]) : [];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tags, ...otherOptions } = options;
    switch (metricType) {
      case MetricsTypesEnum.Counter:
        return new this.client.Counter({
          help: metricName,
          name: metricName,
          labelNames,
          ...otherOptions,
        });
      case MetricsTypesEnum.Gauge:
        return new this.client.Gauge({
          help: metricName,
          name: metricName,
          labelNames,
          ...otherOptions,
        });
      case MetricsTypesEnum.Histogram:
        return new this.client.Histogram({
          help: metricName,
          name: metricName,
          labelNames,
          ...otherOptions,
        });
      case MetricsTypesEnum.Summary:
        return new this.client.Summary({
          help: metricName,
          name: metricName,
          labelNames,
          ...otherOptions,
        });
      default:
        throw new Error(
          'Could not find object for metric of type: ' +
            MetricsTypesEnum[metricType]
        );
    }
  }

  private mapUnifiedMetricMethodToVendorsSpecific(
    method: string,
    args: unknown[]
  ): { specMethod: string; specArgs: unknown[] } {
    switch (method) {
      case 'increment':
        return {
          specMethod: 'inc',
          specArgs: ((args) =>
            args.length > 1 ? [args[1], args[0]] : [args[0]])(args),
        };
      case 'set':
        return {
          specMethod: 'set',
          specArgs: ((args) =>
            args.length > 1 ? [args[1], args[0]] : [args[0]])(args),
        };
      case 'observe':
        return {
          specMethod: 'observe',
          specArgs: ((args) =>
            args.length > 1 ? [args[1], args[0]] : [args[0]])(args),
        };
      default:
        throw new Error('Could not map metric method: ' + method);
    }
  }
}
