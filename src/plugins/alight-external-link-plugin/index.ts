// src/plugins/alight-external-link-plugin/index.ts
export { default as AlightExternalLinkPlugin } from './link';
export { default as AlightExternalLinkPluginEditing } from './linkediting';
export { default as AlightExternalLinkPluginUI } from './linkui';
export { default as AlightExternalLinkPluginImage } from './linkimage';
export { default as AlightExternalLinkPluginImageEditing } from './linkimageediting';
export { default as AlightExternalLinkPluginImageUI } from './linkimageui';
export { default as AlightExternalLinkPluginAutoLink } from './autolink';
export { default as LinkActionsView } from './ui/linkactionsview';
export { default as LinkFormView } from './ui/linkformview';
export { default as AlightExternalLinkPluginCommand } from './linkcommand';
export { default as AlightExternalLinkPluginUnlinkCommand } from './unlinkcommand';

export {
  addLinkProtocolIfApplicable,
  ensureSafeUrl,
  isLinkableElement
} from './utils';

export type { LinkConfig, LinkDecoratorDefinition } from './linkconfig';

import './augmentation';
