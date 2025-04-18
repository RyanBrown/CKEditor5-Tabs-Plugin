// src/plugins/alight-email-link-plugin/index.ts
export { default as AlightEmailLinkPlugin } from './link';
export { default as AlightEmailLinkPluginEditing } from './linkediting';
export { default as AlightEmailLinkPluginUI } from './linkui';
export { default as AlightEmailAutoLink } from './autolink';
export { default as EmailLinkHandler } from './emaillinkhandler';
export { default as LinkActionsView } from './ui/linkactionsview';
export { default as LinkFormView } from './ui/linkformview';
export { default as AlightEmailLinkPluginCommand } from './linkcommand';
export { default as AlightEmailUnlinkCommand } from './unlinkcommand';

export {
  addLinkProtocolIfApplicable,
  ensureSafeUrl,
  isLinkableElement
} from './utils';

export type { AlightEmailLinkConfig, LinkDecoratorDefinition } from './linkconfig';

import './augmentation';
