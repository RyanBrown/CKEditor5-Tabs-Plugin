/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

/**
 * @module link
 */

export { default as AlightPredefinedLinkPlugin } from './link';
export { default as AlightPredefinedLinkPluginEditing } from './linkediting';
export { default as AlightPredefinedLinkPluginUI } from './linkui';
export { default as AlightPredefinedLinkPluginImage } from './linkimage';
export { default as AlightPredefinedLinkPluginImageEditing } from './linkimageediting';
export { default as AlightPredefinedLinkPluginImageUI } from './linkimageui';
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
