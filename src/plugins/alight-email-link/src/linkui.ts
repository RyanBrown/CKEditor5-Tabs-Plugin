// LinkUI with both Balloon and Modal Dialog
import { Plugin } from 'ckeditor5/src/core';
import {
	ClickObserver,
	type ViewAttributeElement,
	type ViewDocumentClickEvent
} from 'ckeditor5/src/engine';
import {
	ButtonView,
	ContextualBalloon,
	MenuBarMenuListItemButtonView,
	clickOutsideHandler
} from 'ckeditor5/src/ui';
import { isWidget } from 'ckeditor5/src/widget';

import AlightEmailLinkEditing from './linkediting';
import LinkActionsView from './ui/linkactionsview';
import type AlightEmailLinkCommand from './linkcommand';
import type AlightEmailUnlinkCommand from './unlinkcommand';
import { addLinkProtocolIfApplicable, isLinkElement, LINK_KEYSTROKE } from './utils';
import CkAlightModalDialog from '../../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';

import linkIcon from '../theme/icons/link.svg';

const VISUAL_SELECTION_MARKER_NAME = 'alight-email-link-ui';
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * The link UI plugin. It introduces the `'link'` and `'unlink'` buttons and support for the <kbd>Ctrl+K</kbd> keystroke.
 * 
 * Uses a balloon for unlink actions, and a modal dialog for create/edit functions.
 */
export default class AlightEmailLinkUI extends Plugin {
	/**
	 * The modal dialog instance.
	 */
	private _modalDialog: CkAlightModalDialog | null = null;

	/**
	 * The actions view displayed inside of the balloon.
	 */
	public actionsView: LinkActionsView | null = null;

	/**
	 * The contextual balloon plugin instance.
	 */
	private _balloon!: ContextualBalloon;

	/**
	 * Track if we are currently updating the UI to prevent recursive calls
	 */
	private _isUpdatingUI: boolean = false;

	/**
	 * @inheritDoc
	 */
	public static get requires() {
		return [AlightEmailLinkEditing, ContextualBalloon] as const;
	}

	/**
	 * @inheritDoc
	 */
	public static get pluginName() {
		return 'AlightEmailLinkUI' as const;
	}

	/**
	 * @inheritDoc
	 */
	public static override get isOfficialPlugin(): true {
		return true;
	}

	/**
	 * @inheritDoc
	 */
	public init(): void {
		const editor = this.editor;
		const t = this.editor.t;

		editor.editing.view.addObserver(ClickObserver);
		this._balloon = editor.plugins.get(ContextualBalloon);

		// Create the actions view for the balloon
		this.actionsView = this._createActionsView();

		// Create toolbar buttons.
		this._createToolbarLinkButton();
		this._enableUIActivators();

		// Renders a fake visual selection marker on an expanded selection.
		editor.conversion.for('editingDowncast').markerToHighlight({
			model: VISUAL_SELECTION_MARKER_NAME,
			view: {
				classes: ['ck-fake-link-selection']
			}
		});

		// Renders a fake visual selection marker on a collapsed selection.
		editor.conversion.for('editingDowncast').markerToElement({
			model: VISUAL_SELECTION_MARKER_NAME,
			view: (data, { writer }) => {
				if (!data.markerRange.isCollapsed) {
					return null;
				}

				const markerElement = writer.createUIElement('span');

				writer.addClass(
					['ck-fake-link-selection', 'ck-fake-link-selection_collapsed'],
					markerElement
				);

				return markerElement;
			}
		});

		// Enable balloon-modal interactions
		this._enableBalloonInteractions();

		// Add the information about the keystrokes to the accessibility database.
		editor.accessibility.addKeystrokeInfos({
			keystrokes: [
				{
					label: t('Create Email Link'),
					keystroke: LINK_KEYSTROKE
				},
				{
					label: t('Move out of a link'),
					keystroke: [
						['arrowleft', 'arrowleft'],
						['arrowright', 'arrowright']
					]
				}
			]
		});

		// Register the UI component
		editor.ui.componentFactory.add('AlightEmailLink', locale => {
			return this._createButton(ButtonView);
		});
	}

	/**
	 * @inheritDoc
	 */
	public override destroy(): void {
		super.destroy();

		// Destroy created UI components
		if (this._modalDialog) {
			this._modalDialog.destroy();
			this._modalDialog = null;
		}

		if (this.actionsView) {
			this.actionsView.destroy();
		}
	}

	/**
	 * Creates a toolbar AlightEmailLink button. Clicking this button will show the modal dialog.
	 */
	private _createToolbarLinkButton(): void {
		const editor = this.editor;

		editor.ui.componentFactory.add('menuBar:AlightEmailLink', () => {
			const button = this._createButton(MenuBarMenuListItemButtonView);

			button.set({
				role: 'menuitemcheckbox'
			});

			return button;
		});
	}

	/**
	 * Creates a button for link command to use either in toolbar or in menu bar.
	 */
	private _createButton<T extends typeof ButtonView>(ButtonClass: T): InstanceType<T> {
		const editor = this.editor;
		const locale = editor.locale;
		const command = editor.commands.get('alight-email-link')!;
		const view = new ButtonClass(editor.locale) as InstanceType<T>;
		const t = locale.t;

		view.set({
			label: t('Alight Email Link'),
			icon: linkIcon,
			keystroke: LINK_KEYSTROKE,
			isToggleable: true,
			withText: true
		});

		view.bind('isEnabled').to(command, 'isEnabled');
		view.bind('isOn').to(command, 'value', value => !!value);

		// Show the modal dialog on button click for creating new links
		this.listenTo(view, 'execute', () => this._showUI());

		return view;
	}

	/**
	 * Creates the {@link module:link/ui/linkactionsview~LinkActionsView} instance.
	 */
	private _createActionsView(): LinkActionsView {
		const editor = this.editor;
		const actionsView = new LinkActionsView(editor.locale);
		const linkCommand = editor.commands.get('alight-email-link') as AlightEmailLinkCommand;
		const unlinkCommand = editor.commands.get('alight-email-unlink') as AlightEmailUnlinkCommand;

		actionsView.bind('href').to(linkCommand, 'value');
		actionsView.editButtonView.bind('isEnabled').to(linkCommand);
		actionsView.unlinkButtonView.bind('isEnabled').to(unlinkCommand);

		// Execute editing in a modal dialog after clicking the "Edit" button
		this.listenTo(actionsView, 'edit', () => {
			this._hideUI();
			this._showUI(true);
		});

		// Execute unlink command after clicking on the "Unlink" button
		this.listenTo(actionsView, 'unlink', () => {
			editor.execute('alight-email-unlink');
			this._hideUI();
		});

		// Close the balloon on Esc key press
		actionsView.keystrokes.set('Esc', (data, cancel) => {
			this._hideUI();
			cancel();
		});

		return actionsView;
	}

	/**
	 * Public method to show UI - needed for compatibility with linkimageui.ts
	 * 
	 * @param isEditing Whether we're editing an existing link
	 */
	public showUI(isEditing: boolean = false): void {
		this._showUI(isEditing);
	}

	/**
	 * Attaches actions that control whether the modal dialog should be displayed.
	 */
	private _enableUIActivators(): void {
		const editor = this.editor;
		const viewDocument = editor.editing.view.document;

		// Handle click on view document and show balloon when selection is placed inside the link element.
		this.listenTo<ViewDocumentClickEvent>(viewDocument, 'click', () => {
			const selectedLink = this._getSelectedLinkElement();

			if (selectedLink) {
				// Show balloon with actions (edit/unlink) when clicking on a link
				this._showBalloon();
			}
		});

		// Handle the `Ctrl+K` keystroke and show the modal dialog for new links.
		editor.keystrokes.set(LINK_KEYSTROKE, (keyEvtData, cancel) => {
			// Prevent focusing the search bar in FF, Chrome and Edge.
			cancel();

			if (editor.commands.get('alight-email-link')!.isEnabled) {
				this._showUI();
			}
		});
	}

	/**
	 * Enable interactions between the balloon and modal interface.
	 */
	private _enableBalloonInteractions(): void {
		// Skip if actionsView is not initialized yet
		if (!this.actionsView) {
			return;
		}

		// Allow clicking outside the balloon to close it
		clickOutsideHandler({
			emitter: this.actionsView,
			activator: () => this._areActionsInPanel,
			contextElements: () => [this._balloon.view.element!],
			callback: () => this._hideUI()
		});
	}

	/**
	 * Shows balloon with link actions.
	 */
	private _showBalloon(): void {
		if (this.actionsView && this._balloon && !this._balloon.hasView(this.actionsView)) {
			this._balloon.add({
				view: this.actionsView,
				position: this._getBalloonPositionData()
			});

			// Begin responding to UI updates
			this._startUpdatingUI();
		}
	}

	/**
	 * Returns positioning options for the balloon.
	 */
	private _getBalloonPositionData() {
		const view = this.editor.editing.view;
		const viewDocument = view.document;
		let target = null;

		// Get the position based on selected link
		const targetLink = this._getSelectedLinkElement();

		if (targetLink) {
			target = view.domConverter.mapViewToDom(targetLink);
		} else {
			target = view.domConverter.viewRangeToDom(viewDocument.selection.getFirstRange()!);
		}

		return { target };
	}

	/**
	 * Determines whether the balloon is visible in the editor.
	 */
	private get _areActionsInPanel(): boolean {
		return !!this.actionsView && !!this._balloon && this._balloon.hasView(this.actionsView);
	}

	/**
	 * Makes the UI respond to editor document changes.
	 */
	private _startUpdatingUI(): void {
		if (this._isUpdatingUI) {
			return;
		}

		const editor = this.editor;
		let prevSelectedLink = this._getSelectedLinkElement();

		const update = () => {
			// Prevent recursive updates
			if (this._isUpdatingUI) {
				return;
			}

			this._isUpdatingUI = true;

			try {
				const selectedLink = this._getSelectedLinkElement();

				// Hide the panel if the selection moved out of the link element
				if (prevSelectedLink && !selectedLink) {
					this._hideUI();
				} else if (this._areActionsInPanel) {
					// Update the balloon position as the selection changes
					this._balloon.updatePosition(this._getBalloonPositionData());
				}

				prevSelectedLink = selectedLink;
			} finally {
				this._isUpdatingUI = false;
			}
		};

		this.listenTo(editor.ui, 'update', update);

		// Only listen to balloon changes if we have a balloon
		if (this._balloon) {
			this.listenTo(this._balloon, 'change:visibleView', update);
		}
	}

	/**
	 * Shows the modal dialog for link editing.
	 */
	private _showUI(isEditing: boolean = false): void {
		const editor = this.editor;
		const t = editor.t;
		const linkCommand = editor.commands.get('alight-email-link') as AlightEmailLinkCommand;
		const defaultProtocol = editor.config.get('link.defaultProtocol');
		const selectedLink = this._getSelectedLinkElement();

		// Create modal if it doesn't exist
		if (!this._modalDialog) {
			this._modalDialog = new CkAlightModalDialog({
				title: t('Create Email Link'),
				width: '500px',
				contentClass: 'cka-email-link-content',
				buttons: [
					{ label: t('Save'), isPrimary: true, closeOnClick: false },
					{ label: t('Cancel'), variant: 'outlined' }
				]
			});

			// Handle Save button click
			this._modalDialog.on('buttonClick', (label: string) => {
				if (label === t('Save')) {
					const emailInput = document.getElementById('ck-email-input') as HTMLInputElement;
					const organizationInput = document.getElementById('ck-organization-input') as HTMLInputElement;

					const email = emailInput.value.trim();
					const organization = organizationInput.value.trim();

					// Validate email
					if (!this._validateEmail(email)) {
						// Show error message
						const errorElement = document.getElementById('ck-email-error');
						if (errorElement) {
							errorElement.textContent = t('Please enter a valid email address');
							errorElement.style.display = 'block';
						}
						return;
					}

					// Build proper mailto link
					let emailLink = email;
					if (!emailLink.startsWith('mailto:')) {
						emailLink = 'mailto:' + emailLink;
					}

					// Execute the command with the organization as custom data
					editor.execute('alight-email-link', emailLink, { organization });

					// Close the modal
					this._modalDialog!.hide();
				}
			});

			// Handle Cancel button click
			this._modalDialog.on('cancel', () => {
				this._modalDialog!.hide();
			});

			// Handle Close button click
			this._modalDialog.on('close', () => {
				this._modalDialog!.hide();
			});
		}

		// Prepare the form HTML
		const formHTML = this._createFormHTML(t, isEditing);
		this._modalDialog.setContent(formHTML);

		// Set values if we're editing
		if (isEditing && linkCommand.value) {
			setTimeout(() => {
				const emailInput = document.getElementById('ck-email-input') as HTMLInputElement;
				const organizationInput = document.getElementById('ck-organization-input') as HTMLInputElement;

				let email = linkCommand.value || '';
				if (email.startsWith('mailto:')) {
					email = email.substring(7); // Remove mailto: prefix
				}

				emailInput.value = email;

				// Get organization from the selection - need to extract from text
				const selectedElement = this._getSelectedLinkElement();
				if (selectedElement && selectedElement.is('attributeElement')) {
					const children = Array.from(selectedElement.getChildren());
					if (children.length > 0) {
						const textNode = children[0];
						if (textNode && textNode.is('$text')) {
							const text = textNode.data || '';
							const match = text.match(/^(.*?)(?:\s*\((.*?)\))?$/);
							if (match && match[2]) {
								organizationInput.value = match[2];
							}
						}
					}
				}
			}, 50);
		}

		// Show the modal
		this._modalDialog.show();

		// Focus the email input
		setTimeout(() => {
			const emailInput = document.getElementById('ck-email-input') as HTMLInputElement;
			if (emailInput) {
				emailInput.focus();
			}
		}, 100);
	}

	/**
	 * Hides the UI.
	 */
	private _hideUI(): void {
		// Prevent recursive calls
		if (this._isUpdatingUI) {
			return;
		}

		this._isUpdatingUI = true;

		try {
			// Hide the balloon if it's showing
			if (this.actionsView && this._balloon && this._balloon.hasView(this.actionsView)) {
				this._balloon.remove(this.actionsView);
				this.stopListening(this.editor.ui, 'update');
				if (this._balloon) {
					this.stopListening(this._balloon, 'change:visibleView');
				}
			}
		} catch (error) {
			console.error('Error hiding UI:', error);
		} finally {
			this._isUpdatingUI = false;
		}
	}

	/**
	 * Creates the HTML for the form inside the modal.
	 */
	private _createFormHTML(t: any, isEditing: boolean): string {
		return `
			<div class="cka-form-container">
				<div class="cka-form-group">
					<label for="ck-email-input" class="cka-input-label">${t('Email Address')}</label>
					<input id="ck-email-input" type="email" class="cka-input-text cka-width-100" placeholder="${t('user@example.com')}"/>
					<div id="ck-email-error" class="cka-error-message"></div>
					<div class="cka-error-message">${t('Enter a valid email address or a mailto: link')}</div>
				</div>
				<div class="cka-form-group mt-3">
					<label for="ck-organization-input" class="cka-input-label">${t('Organization Name (optional)')}</label>
					<input id="ck-organization-input" type="text" class="cka-input-text cka-width-100" placeholder="${t('Organization name')}"/>
					<div class="cka-note-text">${t('Organization Name (optional): Specify the third-party organization to inform users about the email\'s origin.')}</div>
				</div>
			</div>
		`;
	}

	/**
	 * Validates an email address.
	 */
	private _validateEmail(email: string): boolean {
		// Allow empty string as it will be handled by the link command
		if (!email) {
			return true;
		}

		// If it starts with mailto:, validate the part after
		if (email.startsWith('mailto:')) {
			return EMAIL_REGEX.test(email.substring(7));
		}

		// Otherwise validate the entire string
		return EMAIL_REGEX.test(email);
	}

	/**
	 * Returns the link element under the editing view's selection or `null`
	 * if there is none.
	 */
	private _getSelectedLinkElement(): ViewAttributeElement | null {
		const view = this.editor.editing.view;
		const selection = view.document.selection;
		const selectedElement = selection.getSelectedElement();

		// The selection is collapsed or some widget is selected (especially inline widget).
		if (selection.isCollapsed || selectedElement && isWidget(selectedElement)) {
			return findLinkElementAncestor(selection.getFirstPosition()!);
		} else {
			// The range for fully selected link is usually anchored in adjacent text nodes.
			// Trim it to get closer to the actual link element.
			const range = selection.getFirstRange()!.getTrimmed();
			const startLink = findLinkElementAncestor(range.start);
			const endLink = findLinkElementAncestor(range.end);

			if (!startLink || startLink != endLink) {
				return null;
			}

			// Check if the link element is fully selected.
			if (view.createRangeIn(startLink).getTrimmed().isEqual(range)) {
				return startLink;
			} else {
				return null;
			}
		}
	}
}

/**
 * Returns a link element if there's one among the ancestors of the provided `Position`.
 */
function findLinkElementAncestor(position: any): ViewAttributeElement | null {
	const linkElement = position.getAncestors().find((ancestor: any) => isLinkElement(ancestor));
	return linkElement && linkElement.is('attributeElement') ? linkElement : null;
}