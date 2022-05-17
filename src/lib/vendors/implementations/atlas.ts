import { Registry } from 'nflx-spectator';
import MeterId from 'nflx-spectator/src/meter_id';

import { MetricsTypesEnum } from '../../metrics/metrics-types.enum';
import { SupportedVendorsEnum } from '../supported-vendors.enum';
import { VendorInterface } from '../vendor.interface';

type RegisteredMetric = {
  type: MetricsTypesEnum;
  metricsIds: Map<string, MeterId>;
  options: Record<string, unknown>;
};

type AtlasConfigOptions = {
  uri: string;
  commonTags: Record<string, string | number> | Map<string, string | number>;
  strictMode: boolean;
  gaugePollingFrequency: number;
  frequency: number;
  logger: Logger;
  publisher: any;
};

type Logger = {
  debug: (value: string) => void;
  info: (value: string) => void;
  error: (value: string) => void;
};

export class Atlas implements VendorInterface {
  private readonly name: SupportedVendorsEnum = SupportedVendorsEnum.Atlas;
  private readonly supportedMetrics: MetricsTypesEnum[] = [
    MetricsTypesEnum.Counter,
    MetricsTypesEnum.Gauge,
    MetricsTypesEnum.Summary,
    MetricsTypesEnum.Timer,
  ];
  private readonly client: Registry;
  private metricNamingConvention = (metricName: string) => {
    metricName = metricName.charAt(0).toLowerCase() + metricName.slice(1);
    return metricName
      .trim()
      .split(/[.\-_\s]|[^\w]/g)
      .reduce((v, w) => v + (w ? w[0].toUpperCase() + w.slice(1) : ''));
  };
  private metricsRegistry: Map<string, RegisteredMetric> = new Map();

  constructor(config?: Partial<AtlasConfigOptions>) {
    this.client = new Registry(config);
    this.client.start();
  }

  getName(): SupportedVendorsEnum {
    return this.name;
  }

  getSupportedMetrics(): MetricsTypesEnum[] {
    return this.supportedMetrics;
  }

  getClient() {
    return this.client;
  }

  setMetricNamingConvention(convertFunction: (metricName: string) => string) {
    this.metricNamingConvention = convertFunction;
  }

  callMetric(metricName: string, method: string, args: any[]) {
    const metric = this.metricsRegistry.get(metricName);
    if (!metric) {
      throw new Error('Metric named: ' + metricName + " doesn't exist");
    }

    const tags = args[1] ? args[1] : {};
    const meterId = this.getOrCreateMeterId(
      this.metricNamingConvention(metricName),
      metric,
      tags
    );

    const { specMethod, specArgs } =
      this.mapUnifiedMetricMethodToVendorsSpecific(method, args);

    const specMetric =
      MetricsTypesEnum[metric.type] !== 'Summary'
        ? MetricsTypesEnum[metric.type].toLowerCase()
        : 'distributionSummary';

    this.client[specMetric](meterId)[specMethod](...specArgs);
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

    this.metricsRegistry.set(metricName, {
      type: metricType,
      metricsIds: new Map(),
      options,
    });
  }

  private mapUnifiedMetricMethodToVendorsSpecific(
    method: string,
    args: unknown[]
  ): { specMethod: string; specArgs: unknown[] } {
    switch (method) {
      case 'increment':
        return {
          specMethod: 'increment',
          specArgs: ((args) => [args[0]])(args),
        };
      case 'set':
        return {
          specMethod: 'set',
          specArgs: ((args) => [args[0]])(args),
        };
      case 'observe':
        return {
          specMethod: 'record',
          specArgs: ((args) => [args[0]])(args),
        };
      case 'record':
        return {
          specMethod: 'record',
          specArgs: ((args) => [args[0]])(args),
        };
      default:
        throw new Error('Could not map metric method: ' + method);
    }
  }

  private getOrCreateMeterId(
    metricName: string,
    registeredMetric: RegisteredMetric,
    tags: Map<string, unknown>
  ): MeterId {
    const key = JSON.stringify([metricName, tags]);
    const tagsMap = new Map<string, string | number>(Object.entries(tags));

    if (!registeredMetric.metricsIds.get(key)) {
      registeredMetric.metricsIds.set(key, new MeterId(metricName, tagsMap));
    }

    return registeredMetric.metricsIds.get(key);
  }
}
