/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

/**
 * @module link
 */

export { default as AlightPredefinedLink } from './link';
export { default as AlightPredefinedLinkEditing } from './linkediting';
export { default as AlightPredefinedLinkUI } from './linkui';
export { default as AlightPredefinedLinkImage } from './linkimage';
export { default as AlightPredefinedLinkImageEditing } from './linkimageediting';
export { default as AlightPredefinedLinkImageUI } from './linkimageui';
export { default as AlightPredefinedLinkAutoLink } from './autolink';
export { default as LinkActionsView } from './ui/linkactionsview';
export { default as LinkFormView } from './ui/linkformview';
export { default as AlightPredefinedLinkCommand } from './linkcommand';
export { default as AlightPredefinedLinkUnlinkCommand } from './unlinkcommand';

export {
  addLinkProtocolIfApplicable,
  ensureSafeUrl,
  isLinkableElement
} from './utils';

export type { LinkConfig, LinkDecoratorDefinition } from './linkconfig';

import './augmentation';
