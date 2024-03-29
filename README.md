![logo](logo.png)

[![license](https://img.shields.io/github/license/wojbach/nodeamf)](https://github.com/wojbach/nodeamf/blob/master/LICENSE)
![node](https://img.shields.io/node/v/@wojbach/nodeamf)
[![npm](https://img.shields.io/npm/v/@wojbach/nodeamf)](https://www.npmjs.com/package/@wojbach/nodeamf)
[![Circleci](https://img.shields.io/circleci/build/github/wojbach/nodeamf?label=ci&logo=CircleCI&style=flat)](https://app.circleci.com/pipelines/github/wojbach/nodeamf?branch=master)
[![codecov](https://codecov.io/gh/wojbach/nodeamf/branch/master/graph/badge.svg?token=RVDN6RNU90)](https://codecov.io/gh/wojbach/nodeamf)
[![npm](https://img.shields.io/npm/dm/@wojbach/nodeamf?label=npm%20downloads)](https://www.npmjs.com/package/@wojbach/nodeamf)

## Description
Nodeamf offers an abstraction over metrics like counters, gauges, histograms for multiple vendors:
- [AWS Cloud Watch](https://aws.amazon.com/cloudwatch/) <img src="https://github.githubassets.com/images/icons/emoji/unicode/1f195.png" height="20"/>
- [Data Dog](https://www.datadoghq.com/)
- [Prometheus](https://prometheus.io/)

It makes application metrics vendor-neutral.
Package is 100% written in TypeScript but can be easily used in a pure JavaScript projects.

## Installation
```bash
// using npm
$ npm install nodeamf

// using yarn
$ yarn add nodeamf
```

## Base Usage
#### Setup with one metric and Prometheus

```typescript
import { Counter, NodeAmf, Prometheus, SupportedVendorsEnum } from '@wojbach/nodeamf';

const nodeAmf = NodeAmf.init({
  vendors: [
    new Prometheus()
  ],
  metrics: [
    new Counter('simple-counter', {}, [SupportedVendorsEnum.Prometheus])
  ]
});

nodeAmf.getCounter('simple-counter').increment(10);
```
## Vendors and metrics support

### A list of supported metrics in each vendor
|           	| AWS Cloud Watch            	            | Data Dog                 	| Prometheus               	|
|-----------	|-----------------------------------------|--------------------------	|--------------------------	|
| Counter   	| <img src="https://github.githubassets.com/images/icons/emoji/unicode/2714.png" height="20"/>         	            | <img src="https://github.githubassets.com/images/icons/emoji/unicode/2714.png" height="20"/>       	| <img src="https://github.githubassets.com/images/icons/emoji/unicode/2714.png" height="20"/>       	|
| Event     	| <img src="https://github.githubassets.com/images/icons/emoji/unicode/2716.png" height="20"/>   	            | <img src="https://github.githubassets.com/images/icons/emoji/unicode/2714.png" height="20"/>       	| <img src="https://github.githubassets.com/images/icons/emoji/unicode/2716.png" height="20"/> 	|
| Gauge     	| <img src="https://github.githubassets.com/images/icons/emoji/unicode/2714.png" height="20"/>         	            | <img src="https://github.githubassets.com/images/icons/emoji/unicode/2714.png" height="20"/>       	| <img src="https://github.githubassets.com/images/icons/emoji/unicode/2714.png" height="20"/>       	|
| Histogram 	| <img src="https://github.githubassets.com/images/icons/emoji/unicode/2716.png" height="20"/> * 	| <img src="https://github.githubassets.com/images/icons/emoji/unicode/2714.png" height="20"/>       	| <img src="https://github.githubassets.com/images/icons/emoji/unicode/2714.png" height="20"/>       	|
| Set       	| <img src="https://github.githubassets.com/images/icons/emoji/unicode/2716.png" height="20"/>   	            | <img src="https://github.githubassets.com/images/icons/emoji/unicode/2714.png" height="20"/>       	| <img src="https://github.githubassets.com/images/icons/emoji/unicode/2716.png" height="20"/> 	|
| Summary   	| <img src="https://github.githubassets.com/images/icons/emoji/unicode/2716.png" height="20"/>   	            | <img src="https://github.githubassets.com/images/icons/emoji/unicode/2716.png" height="20"/> 	| <img src="https://github.githubassets.com/images/icons/emoji/unicode/2714.png" height="20"/>       	|
<sup>*</sup> AWS Cloud Watch offers many statistics definitions for metrics and NodeAmf package is compatible with this feature, more can be found here: https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Statistics-definitions.html


### A list of vendor clients libraries used in this package
| Name                	 | Client package             	| Version 	| NPM Link                                                     	      |
|-----------------------|----------------------------	|---------	|---------------------------------------------------------------------|
| AWS Cloud Watch 	     | @aws-sdk/client-cloudwatch 	| 3.245.0 	| [Link](https://www.npmjs.com/package/@aws-sdk/client-cloudwatch) 	    |
| Data Dog        	     | hot-shots                  	| 9.3.0   	| [Link](https://www.npmjs.com/package/hot-shots])                  	 |
| Prometheus      	     | prom-client                	| 14.1.1  	| [Link](https://www.npmjs.com/package/prom-client])                	 |


### A list of nodeamf's custom parameters for vendors that can be passed together with config specific for a client 
| Vendor          	| Parameter    	| Type   	| Description                                                                                                      	|
|-----------------	|--------------	|--------	|------------------------------------------------------------------------------------------------------------------	|
| AWS Cloud Watch 	| name         	| string 	| used to register vendors under a specific name, default: "cloudWatch"                                            	|
|                 	| flushTimeout 	| number 	| number of milliseconds between calls to AWS API, has a direct connection with metrics resolution, default:60000  	|
|                 	| bufferSize   	| number 	| maximum buffer size that holds metrics + dimensions (tags) as a unique key, default: 1000                        	|
|                 	| namespace    	| string 	| a namespace under which metrics will be stored, default: 'DEFAULT'                                               	|
| Data Dog        	| name         	| string 	| used to register vendors under a specific name, default: "dogStatsD"                                             	|
| Prometheus      	| name         	| string 	| used to register vendors under a specific name, default: "prometheus"                                            	|

## Other setup examples
#### Setup with multiple metrics and vendors

```typescript
import {
  Counter,
  Gauge,
  DogStatsd,
  NodeAmf,
  Prometheus,
  SupportedVendorsEnum
} from '@wojbach/nodeamf';

const nodeAmf = NodeAmf.init({
  vendors: [
    new Prometheus(),
    new DogStatsd()
  ],
  metrics: [
    new Counter('simple-counter', {}, [SupportedVendorsEnum.Prometheus, SupportedVendorsEnum.DogStatsD]),
    new Gauge('simple-gauge', {}, [SupportedVendorsEnum.DogStatsD]),
  ]
});

nodeAmf.getCounter('simple-counter').increment(10);
nodeAmf.getGauge('simple-gauge').set(10)
```

#### Setup vendors with custom names

```typescript
import {
  Counter,
  Gauge,
  DogStatsd,
  NodeAmf,
  Prometheus,
  SupportedVendorsEnum
} from '@wojbach/nodeamf';

const nodeAmf = NodeAmf.init({
  vendors: [
    new Prometheus({ name: 'vendor1' }),
    new DogStatsd({ name: 'vendor2' }),
    new Prometheus({ name: 'vendor3' }),
  ],
  metrics: [
    new Counter('simple-counter', {}, ['vendor1', 'vendor2']),
    new Gauge('simple-gauge', {}, ['vendor2', 'vendor3']),
  ]
});

nodeAmf.getCounter('simple-counter').increment(10);
nodeAmf.getGauge('simple-gauge').set(10)
```

#### Using metrics tags
```typescript
import {
  Counter,
  NodeAmf,
  Prometheus,
  SupportedVendorsEnum
} from '@wojbach/nodeamf';

const nodeAmf = NodeAmf.init({
  vendors: [
    new Prometheus()
  ],
  metrics: [
    new Counter('visits', {tags: ['country', 'browser']}, [SupportedVendorsEnum.Prometheus]),
  ]
});

nodeAmf.getCounter('visits').increment();
nodeAmf.getCounter('visits').increment(1, {'country': 'US'});
nodeAmf.getCounter('visits').increment(1, {'browser': 'chrome'});
```

#### Accessing underlying clients and/or registry of vendor

```typescript
import {
  DogStatsd,
  NodeAmf,
  Prometheus,
  SupportedVendorsEnum
} from '@wojbach/nodeamf';

const nodeAmf = NodeAmf.init({
  vendors: [
    new Prometheus(),
    new DogStatsd()
  ],
  metrics: [...]
});

nodeAmf.getVendor<Prometheus>(SupportedVendorsEnum.Prometheus).getClient() // returns client from https://www.npmjs.com/package/prom-client package 
nodeAmf.getVendor<DogStatsd>(SupportedVendorsEnum.DogStatsD).getClient() // returns StatsD object from https://www.npmjs.com/package/hot-shots package
```

#### Custom vendor configuration

```typescript
import {
  DogStatsd,
  NodeAmf,
  Prometheus,
  SupportedVendorsEnum
} from '@wojbach/nodeamf';

const nodeAmf = NodeAmf.init({
  vendors: [
    new DogStatsd({host: 'my-host', port: 1337, globalTags: ['service', 'environment']})
  ],
  metrics: [...]
});
```

## More examples

More examples can be found [here](https://github.com/wojbach/nodeamf/tree/master/examples) including e2e cases.

## Stay in touch
Author - [Wojciech Bachur](https://www.linkedin.com/in/wojciech-bachur-5b013a13/)

## License
Nodeamf is licensed under the [MIT](LICENSE).
