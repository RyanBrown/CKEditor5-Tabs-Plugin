// src/plugins/alight-predefined-link-plugin/index.ts
export { default as AlightPredefinedLinkPlugin } from './link';
export { default as AlightPredefinedLinkPluginEditing } from './linkediting';
export { default as AlightPredefinedLinkPluginUI } from './linkui';
export { default as AlightPredefinedLinkPluginAutoLink } from './autolink';
export { default as LinkActionsView } from './ui/linkactionsview';
export { default as LinkFormView } from './ui/linkformview';
export { default as AlightPredefinedLinkPluginCommand } from './linkcommand';
export { default as AlightPredefinedLinkPluginUnlinkCommand } from './unlinkcommand';

export {
  addLinkProtocolIfApplicable,
  ensureSafeUrl,
  isLinkableElement
} from './utils';

export type { LinkConfig, LinkDecoratorDefinition } from './linkconfig';

import './augmentation';
