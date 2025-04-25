// src/plugins/alight-new-document-link-plugin/index.ts
export { default as AlightNewDocumentLinkPlugin } from './link';
export { default as AlightNewDocumentLinkPluginEditing } from './linkediting';
export { default as AlightNewDocumentLinkPluginUI } from './linkui';
export { default as AlightNewDocumentAutoLink } from './autolink';
export { default as NewDocumentLinkHandler } from './newdocumentlinkhandler';
export { default as LinkActionsView } from './ui/linkactionsview';
export { default as LinkFormView } from './ui/linkformview';
export { default as AlightNewDocumentLinkPluginCommand } from './linkcommand';
export { default as AlightNewDocumentUnlinkCommand } from './unlinkcommand';

export {
  addLinkProtocolIfApplicable,
  ensureSafeUrl,
  isLinkableElement
} from './utils';

export type { AlightNewDocumentLinkConfig, LinkDecoratorDefinition } from './linkconfig';

import './augmentation';
