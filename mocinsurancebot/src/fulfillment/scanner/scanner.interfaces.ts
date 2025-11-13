import { Type } from '@nestjs/common';

export interface DiscoveredModule {
  name: string;
  instance: any;
  // eslint-disable-next-line @typescript-eslint/ban-types
  injectType?: Function | Type<any>;
  dependencyType: Type<any>;
}

export interface ScannedClass extends DiscoveredModule {
  parentModule: DiscoveredModule;
}

export interface DiscoveredMethod {
  handler: (...args: any[]) => any;
  methodName: string;
  parentClass: ScannedClass;
}

export interface ScannedMethodWithMeta<T> {
  discoveredMethod: DiscoveredMethod;
  meta: T;
}

export interface ScannedClassWithMeta<T> {
  ScannedClass: ScannedClass;
  meta: T;
}

export type MetaKey = string | number | symbol;

export type Filter<T> = (item: T) => boolean;
