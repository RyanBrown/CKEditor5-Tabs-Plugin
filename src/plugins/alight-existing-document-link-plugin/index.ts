// src/plugins/alight-existing-document-link/index.ts
export { default as AlightExistingDocumentLinkPlugin } from './link';
export { default as AlightExistingDocumentLinkPluginEditing } from './linkediting';
export { default as AlightExistingDocumentLinkPluginUI } from './linkui';
export { default as AlightExistingDocumentLinkPluginAutoLink } from './autolink';
export { default as LinkActionsView } from './ui/linkactionsview';
export { default as LinkFormView } from './ui/linkformview';
export { default as AlightExistingDocumentLinkPluginCommand } from './linkcommand';
export { default as AlightExistingDocumentLinkPluginUnlinkCommand } from './unlinkcommand';

export {
  addLinkProtocolIfApplicable,
  ensureSafeUrl,
  isLinkableElement
} from './utils';

export type { LinkConfig, LinkDecoratorDefinition } from './linkconfig';

import './augmentation';
