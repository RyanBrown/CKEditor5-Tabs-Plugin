// src/plugins/alight-prevent-link-nesting-plugin/index.ts
import './styles/alight-prevent-link-nesting.scss';
import './types'; // Import the types file to ensure type augmentation is applied
import { AlightPreventLinkNestingPlugin } from './alight-prevent-link-nesting';
import type { AlightPreventLinkNestingPluginConfig } from './types';
import { createEditorConfig } from './alight-prevent-link-nesting-config';

export {
  AlightPreventLinkNestingPlugin,
  AlightPreventLinkNestingPluginConfig,
  createEditorConfig
};
export default AlightPreventLinkNestingPlugin;
