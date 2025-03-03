// src/plugins/alight-predefined-link-plugin/alight-predefined-link-plugin-registry.ts
import { PredefinedLinkData, PredefinedLinkRegistry } from './alight-predefined-link-plugin-types';

/**
 * A singleton registry for predefined links to ensure it's available
 * to all plugin components regardless of initialization order.
 */
export class PredefinedLinkRegistryManager {
  private static instance: PredefinedLinkRegistryManager;
  private _registry: PredefinedLinkRegistry;

  private constructor() {
    this._registry = new Map<string, PredefinedLinkData>();
  }

  public static getInstance(): PredefinedLinkRegistryManager {
    if (!PredefinedLinkRegistryManager.instance) {
      PredefinedLinkRegistryManager.instance = new PredefinedLinkRegistryManager();
    }
    return PredefinedLinkRegistryManager.instance;
  }

  public getRegistry(): PredefinedLinkRegistry {
    return this._registry;
  }

  public setLink(url: string, data: PredefinedLinkData): void {
    this._registry.set(url, data);
  }

  public getLink(url: string): PredefinedLinkData | undefined {
    return this._registry.get(url);
  }

  public hasLink(url: string): boolean {
    return this._registry.has(url);
  }

  public removeLink(url: string): boolean {
    return this._registry.delete(url);
  }

  public clear(): void {
    this._registry.clear();
  }
}

// Export a singleton instance for easy access
export const predefinedLinkRegistry = PredefinedLinkRegistryManager.getInstance();