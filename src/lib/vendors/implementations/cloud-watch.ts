import {
  CloudWatchClient,
  CloudWatchClientConfig,
  MetricDatum,
  PutMetricDataCommand,
  StandardUnit,
} from '@aws-sdk/client-cloudwatch';

import { MetricsTypesEnum } from '../../metrics/metrics-types.enum';
import { SupportedVendorsEnum } from '../supported-vendors.enum';
import { VendorAbstract } from '../vendor.abstract';
import { VendorInterface } from '../vendor.interface';

type CloudWatchConfigOptions = CloudWatchClientConfig & {
  name?: string;
  flushTimeout?: number;
  bufferSize?: number;
  namespace?: string;
};

export class CloudWatch extends VendorAbstract implements VendorInterface {
  private readonly supportedMetrics: MetricsTypesEnum[] = [
    MetricsTypesEnum.Counter,
    MetricsTypesEnum.Gauge,
    MetricsTypesEnum.Summary,
  ];
  private readonly client: CloudWatchClient;
  private readonly buffer: ({ hash: string } & MetricDatum)[] = [];
  /**
   * https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-cloudwatch/interfaces/putmetricdatacommandinput.html#metricdata
   */
  private readonly maxBufferSize: number = 1000;
  private readonly bufferSize: number = this.maxBufferSize;
  private readonly flushTimeout: number = 60000;
  private readonly namespace: string = undefined;
  private timer: ReturnType<typeof setTimeout>;
  private metricsRegistry: Map<
    string,
    { metricType: MetricsTypesEnum; options: Partial<MetricDatum> }
  > = new Map();

  constructor(config?: CloudWatchConfigOptions) {
    super();

    const name = config?.name;
    if (name) {
      this.name = name;
      delete config.name;
    } else {
      this.name = SupportedVendorsEnum.CloudWatch;
    }

    const flushTimeout = config?.flushTimeout;
    if (flushTimeout) {
      this.flushTimeout = flushTimeout;
      delete config.flushTimeout;
    }

    const bufferSize = config?.bufferSize;
    if (bufferSize) {
      if (bufferSize > this.maxBufferSize) {
        throw new Error('Max allowed buffer size is ' + this.maxBufferSize);
      }
      this.bufferSize = bufferSize;
      delete config.bufferSize;
    }

    const namespace = config?.namespace;
    if (namespace) {
      this.namespace = namespace;
      delete config.namespace;
    }

    this.client = new CloudWatchClient(config);
  }

  getSupportedMetrics(): MetricsTypesEnum[] {
    return this.supportedMetrics;
  }

  getClient(): CloudWatchClient {
    return this.client;
  }

  setMetricNamingConvention(convertFunction: (metricName: string) => string) {
    this.metricNamingConvention = convertFunction;
  }

  callMetric(
    metricName: string,
    method: string,
    args: [value?: number, tags?: { [tagName: string]: string }]
  ) {
    const metric = this.metricsRegistry.get(metricName);
    if (!metric) {
      throw new Error('Metric named: ' + metricName + " doesn't exist");
    }

    const metricDatum = this.mapUnifiedMetricMethodToVendorsSpecificStructure(
      this.metricNamingConvention(metricName),
      metric,
      method,
      args
    );

    this.pushToBuffer(metric.metricType, metricDatum);
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

  private metricNamingConvention = (metricName: string) =>
    metricName
      .replace(/[A-Z]+/g, (match) => `.${match.toLowerCase()}`)
      .match(
        /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g
      )
      .join('_');

  private mapUnifiedMetricMethodToVendorsSpecificStructure(
    metricName: string,
    metric: { metricType: MetricsTypesEnum; options: Record<string, unknown> },
    method: string,
    args: [value?: number, tags?: { [tagName: string]: string }]
  ): MetricDatum {
    return {
      MetricName: metricName,
      Dimensions: Object.entries(args[1] || {})
        .map(([Name, Value]) => ({
          Name,
          Value,
        }))
        .sort((a, b) => a.Name.localeCompare(b.Name)),
      Unit: (metric.options.unit as string) || StandardUnit.None,
      Value: args[0] || 1,
      StatisticValues: {
        Sum: args[0] || 1,
        Maximum: args[0] || 1,
        Minimum: args[0] || 1,
        SampleCount: 1,
      },
      Timestamp: new Date(),
    };
  }

  private pushToBuffer(metricType: MetricsTypesEnum, metricDatum: MetricDatum) {
    const hash =
      metricDatum.MetricName + JSON.stringify(metricDatum.Dimensions);
    const metricInBuffer = this.buffer.find((entry) => entry.hash === hash);

    if (!metricInBuffer || metricType == MetricsTypesEnum.Summary) {
      this.buffer.push({ hash, ...metricDatum });
    } else {
      this.aggregateToMetricInBuffer(metricType, metricInBuffer, metricDatum);
    }

    if (this.buffer.length >= this.bufferSize) {
      this.flushBuffer();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flushBuffer(), this.flushTimeout);
    }
  }

  private aggregateToMetricInBuffer(
    metricType: MetricsTypesEnum,
    metricInBuffer: MetricDatum,
    metricDatum: MetricDatum
  ) {
    if (metricType === MetricsTypesEnum.Gauge) {
      metricInBuffer.Value = metricDatum.Value;
    } else {
      metricInBuffer.Value += metricDatum.Value;
    }

    metricInBuffer.StatisticValues.Sum += metricDatum.StatisticValues.Sum;
    if (
      metricInBuffer.StatisticValues.Minimum >
      metricDatum.StatisticValues.Minimum
    ) {
      metricInBuffer.StatisticValues.Minimum =
        metricDatum.StatisticValues.Minimum;
    }
    if (
      metricInBuffer.StatisticValues.Maximum <
      metricDatum.StatisticValues.Maximum
    ) {
      metricInBuffer.StatisticValues.Maximum =
        metricDatum.StatisticValues.Maximum;
    }
    metricInBuffer.StatisticValues.SampleCount++;
    metricInBuffer.Timestamp = metricDatum.Timestamp;
  }
  private flushBuffer() {
    clearTimeout(this.timer);
    this.timer = null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const bufferCopy = this.buffer.splice(0).map(({ hash, ...rest }) => rest);

    this.client
      .send(
        new PutMetricDataCommand({
          Namespace: this.namespace,
          MetricData: bufferCopy,
        })
      )
      .catch((err) =>
        console.error(
          `CloudWatch.flushBuffer - unable to flush buffer of size ${bufferCopy.length}`,
          err
        )
      );
  }
}
