/**
 * @license Copyright (c) 2003-2025, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-licensing-options
 */

/**
 * @module link
 */

export { default as AlightExternalLink } from './link';
export { default as AlightExternalLinkEditing } from './linkediting';
export { default as AlightExternalLinkUI } from './linkui';
export { default as AlightExternalLinkImage } from './linkimage';
export { default as AlightExternalLinkImageEditing } from './linkimageediting';
export { default as AlightExternalLinkImageUI } from './linkimageui';
export { default as AlightExternalLinkAutoLink } from './autolink';
export { default as LinkActionsView } from './ui/linkactionsview';
export { default as LinkFormView } from './ui/linkformview';
export { default as AlightExternalLinkCommand } from './linkcommand';
export { default as AlightExternalLinkUnlinkCommand } from './unlinkcommand';

export {
	addLinkProtocolIfApplicable,
	ensureSafeUrl,
	isLinkableElement
} from './utils';

export type { LinkConfig, LinkDecoratorDefinition } from './linkconfig';

import './augmentation';
