//  src/plugins/alight-link-trigger-plugin/alight-link-trigger-plugin-utils.ts
export interface LinkTriggerItem {
  id: string;
  label: string;
  trigger: (editor: any) => void;
}

export interface AlightLinkTriggerConfig {
  items: LinkTriggerItem[];
}