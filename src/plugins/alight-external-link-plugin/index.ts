// src/plugins/alight-external-link-plugin/index.ts
export { default as AlightExternalLinkPlugin } from './link';
export { default as AlightExternalLinkPluginEditing } from './linkediting';
export { default as AlightExternalLinkPluginUI } from './linkui';
export { default as AlightExternalAutoLink } from './autolink';
export { default as ExternalLinkHandler } from './externallinkhandler';
export { default as LinkActionsView } from './ui/linkactionsview';
export { default as LinkFormView } from './ui/linkformview';
export { default as AlightExternalLinkPluginCommand } from './linkcommand';
export { default as AlightExternalUnlinkCommand } from './unlinkcommand';

export {
  addLinkProtocolIfApplicable,
  ensureSafeUrl,
  isLinkableElement
} from './utils';

export type { AlightExternalLinkConfig, LinkDecoratorDefinition } from './linkconfig';

import './augmentation';
