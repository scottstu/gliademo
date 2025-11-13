/* eslint-disable @typescript-eslint/ban-types */
import { Injectable, Scope, Type } from '@nestjs/common';
import { STATIC_CONTEXT } from '@nestjs/core/injector/constants';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { Module } from '@nestjs/core/injector/module';
import { ModulesContainer } from '@nestjs/core/injector/modules-container';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { flatMap, get, some } from 'lodash';

import {
  Filter,
  MetaKey,
  ScannedClass,
  ScannedMethodWithMeta,
} from './scanner.interfaces';

export function getComponentMetaAtKey<T>(
  key: MetaKey,
  component: ScannedClass,
): T | undefined {
  const dependencyMeta = Reflect.getMetadata(
    key,
    component.dependencyType,
  ) as T;
  if (dependencyMeta) {
    return dependencyMeta;
  }

  if (component.injectType != null) {
    return Reflect.getMetadata(key, component.injectType) as T;
  }
}

export const withMetaAtKey: (key: MetaKey) => Filter<ScannedClass> =
  (key) => (component) => {
    const metaTargets: Function[] = [
      get(component, 'instance.constructor'),
      component.injectType as Function,
    ].filter((x) => x != null);

    return some(metaTargets, (x) => Reflect.getMetadata(key, x));
  };

@Injectable()
export class ScannerService {
  private discoveredProviders?: Promise<ScannedClass[]>;

  constructor(
    private readonly modulesContainer: ModulesContainer,
    private readonly metadataScanner: MetadataScanner,
  ) {}

  async providers(filter: Filter<ScannedClass>): Promise<ScannedClass[]> {
    if (!this.discoveredProviders) {
      this.discoveredProviders = this.discover('providers');
    }
    return (await this.discoveredProviders).filter((x) => filter(x));
  }

  async providerMethodsWithMetaAtKey<T>(
    metaKey: MetaKey,
    providerFilter: Filter<ScannedClass> = () => true,
  ): Promise<ScannedMethodWithMeta<T>[]> {
    const providers = await this.providers(providerFilter);

    return flatMap(providers, (provider) =>
      this.classMethodsWithMetaAtKey<T>(provider, metaKey),
    );
  }

  classMethodsWithMetaAtKey<T>(
    component: ScannedClass,
    metaKey: MetaKey,
  ): ScannedMethodWithMeta<T>[] {
    const { instance } = component;

    if (!instance) {
      return [];
    }

    const prototype = Object.getPrototypeOf(instance);

    return this.metadataScanner
      .scanFromPrototype(instance, prototype, (name) =>
        this.extractMethodMetaAtKey<T>(metaKey, component, prototype, name),
      )
      .filter((x) => !!x.meta);
  }

  private extractMethodMetaAtKey<T>(
    metaKey: MetaKey,
    ScannedClass: ScannedClass,
    prototype: any,
    methodName: string,
  ): ScannedMethodWithMeta<T> {
    const handler = prototype[methodName];
    const meta: T = Reflect.getMetadata(metaKey, handler);

    return {
      meta,
      discoveredMethod: {
        handler,
        methodName,
        parentClass: ScannedClass,
      },
    };
  }

  private async toScannedClass(
    nestModule: Module,
    wrapper: InstanceWrapper<any>,
  ): Promise<ScannedClass> {
    const instanceHost = wrapper.getInstanceByContextId(
      STATIC_CONTEXT,
      wrapper && wrapper.id ? wrapper.id : undefined,
    );

    if (instanceHost.isPending && !instanceHost.isResolved) {
      await instanceHost.donePromise;
    }

    return {
      name: wrapper.name as string,
      instance: instanceHost.instance,
      injectType: wrapper.metatype,
      dependencyType: get(instanceHost, 'instance.constructor'),
      parentModule: {
        name: nestModule.metatype.name,
        instance: nestModule.instance,
        injectType: nestModule.metatype,
        dependencyType: nestModule.instance.constructor as Type<{}>,
      },
    };
  }

  private async discover(
    component: 'providers' | 'controllers',
  ): Promise<ScannedClass[]> {
    const modulesMap = [...this.modulesContainer.entries()];
    return Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      flatMap(modulesMap, ([key, nestModule]) => {
        const components = [...nestModule[component].values()];
        return components
          .filter((component) => component.scope !== Scope.REQUEST)
          .map((component) => this.toScannedClass(nestModule, component));
      }),
    );
  }
}
