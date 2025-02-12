// src/plugins/alight-public-link-plugin/alight-public-link-plugin-utils.ts
export interface AlightPublicLinkPluginConfig {
  url: string;
  displayText?: string;
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}
