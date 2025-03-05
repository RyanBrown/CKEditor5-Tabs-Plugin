/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

/**
 * @module link
 */

export { default as AlightEmailLinkPlugin } from './link';
export { default as AlightEmailLinkPluginEditing } from './linkediting';
export { default as AlightEmailLinkPluginUI } from './linkui';
export { default as AlightEmailLinkPluginImage } from './linkimage';
export { default as AlightEmailLinkPluginImageEditing } from './linkimageediting';
export { default as AlightEmailLinkPluginImageUI } from './linkimageui';
export { default as AlightEmailAutoLink } from './autolink';
export { default as LinkActionsView } from './ui/linkactionsview';
export { default as LinkFormView } from './ui/linkformview';
export { default as AlightEmailLinkPluginCommand } from './linkcommand';
export { default as AlightEmailUnlinkCommand } from './unlinkcommand';

export {
  addLinkProtocolIfApplicable,
  ensureSafeUrl,
  isLinkableElement
} from './utils';

export type { LinkConfig, LinkDecoratorDefinition } from './linkconfig';

import './augmentation';
