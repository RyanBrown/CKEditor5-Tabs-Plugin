/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

/**
 * @module link
 */

export { default as AlightLink } from './link';
export { default as AlightLinkEditing } from './linkediting';
export { default as AlightLinkUI } from './linkui';
export { default as AlightLinkImage } from './linkimage';
export { default as AlightLinkImageEditing } from './linkimageediting';
export { default as AlightLinkImageUI } from './linkimageui';
export { default as AlightAutoLink } from './autolink';
export { default as LinkActionsView } from './ui/linkactionsview';
export { default as LinkFormView } from './ui/linkformview';
export { default as AlightLinkCommand } from './linkcommand';
export { default as AlightUnlinkCommand } from './unlinkcommand';

export {
	addLinkProtocolIfApplicable,
	ensureSafeUrl,
	isLinkableElement
} from './utils';

export type { LinkConfig, LinkDecoratorDefinition } from './linkconfig';

import './augmentation';
