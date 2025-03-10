// LinkUI with both Balloon and Modal Dialog - Updated to use AlightPredefinedLinkPlugin modal content
import { Plugin } from '@ckeditor/ckeditor5-core';
import {
  ClickObserver,
  type ViewAttributeElement,
  type ViewDocumentClickEvent
} from '@ckeditor/ckeditor5-engine';
import {
  ButtonView,
  ContextualBalloon,
  MenuBarMenuListItemButtonView,
  clickOutsideHandler
} from '@ckeditor/ckeditor5-ui';
import { isWidget } from '@ckeditor/ckeditor5-widget';

import AlightPredefinedLinkEditing from './linkediting';
import LinkActionsView from './ui/linkactionsview';
import type AlightPredefinedLinkCommand from './linkcommand';
import type AlightExternalUnlinkCommand from './unlinkcommand';
import { addLinkProtocolIfApplicable, isLinkElement, LINK_KEYSTROKE } from './utils';
import CkAlightModalDialog from './../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import './../ui-components/alight-checkbox-component/alight-checkbox-component';
// Import ContentManager and PredefinedLink types from the alight-predefined-link-plugin
import { ContentManager } from './../../plugins/alight-predefined-link-plugin/modal-content/predefined-link-modal-ContentManager';
import { PredefinedLink } from './../../plugins/alight-predefined-link-plugin/modal-content/predefined-link-modal-types';
// Import predefined links data
import predefinedLinksData from './../../data/predefined-test-data.json';

import linkIcon from '@ckeditor/ckeditor5-link/theme/icons/link.svg';

const VISUAL_SELECTION_MARKER_NAME = 'alight-predefined-link-ui';

/**
 * The link UI plugin. It introduces the `'link'` and `'unlink'` buttons and support for the <kbd>Ctrl+K</kbd> keystroke.
 * 
 * Uses a balloon for unlink actions, and a modal dialog for create/edit functions.
 */
export default class AlightPredefinedLinkUI extends Plugin {
  /**
   * The modal dialog instance.
   */
  private _modalDialog: CkAlightModalDialog | null = null;

  /**
   * The content manager instance for the modal dialog.
   */
  private _linkManager: ContentManager | null = null;

  /**
   * The predefined links data.
   */
  private _predefinedLinksData: PredefinedLink[] = predefinedLinksData.predefinedLinksDetails;

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
    return [AlightPredefinedLinkEditing, ContextualBalloon] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightPredefinedLinkUI' as const;
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
          label: t('Create Predefined Link'),
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
    editor.ui.componentFactory.add('alightPredefinedLink', locale => {
      return this._createButton(ButtonView);
    });

    // Listen for command execution to show balloon
    const linkCommand = editor.commands.get('alight-predefined-link') as AlightPredefinedLinkCommand;

    // If executed event is available, use it
    if (typeof linkCommand.on === 'function') {
      this.listenTo(linkCommand, 'executed', () => {
        // Let the model update before showing the balloon
        setTimeout(() => this._checkAndShowBalloon(), 50);
      });
    }

    // Also listen to selection changes to detect when user enters a link or clicks on it
    this.listenTo(editor.editing.view.document, 'selectionChange', () => {
      // Use a small delay to ensure the selection is fully updated
      setTimeout(() => this._checkAndShowBalloon(), 10);
    });
  }

  /**
   * Checks if the current selection is in a link and shows the balloon if needed
   */
  private _checkAndShowBalloon(): void {
    const selectedLink = this._getSelectedLinkElement();
    if (selectedLink) {
      this._showBalloon();
    }
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
   * Creates a toolbar AlightPredefinedLink button. Clicking this button will show the modal dialog.
   */
  private _createToolbarLinkButton(): void {
    const editor = this.editor;

    editor.ui.componentFactory.add('menuBar:alightPredefinedLink', () => {
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
    const command = editor.commands.get('alight-predefined-link')!;
    const view = new ButtonClass(editor.locale) as InstanceType<T>;
    const t = locale.t;

    view.set({
      label: t('Alight Predefined Link'),
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
    const linkCommand = editor.commands.get('alight-predefined-link') as AlightPredefinedLinkCommand;
    const unlinkCommand = editor.commands.get('alight-predefined-unlink') as AlightExternalUnlinkCommand;

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
      editor.execute('alight-predefined-unlink');
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
   * Find predefined link by URL
   */
  private _findPredefinedLinkByUrl(url: string): PredefinedLink | null {
    return this._predefinedLinksData.find(link => link.destination === url) || null;
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

      if (editor.commands.get('alight-predefined-link')!.isEnabled) {
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
      // Make sure the link is still selected before showing balloon
      const selectedLink = this._getSelectedLinkElement();
      if (!selectedLink) {
        return;
      }

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
    const linkCommand = editor.commands.get('alight-predefined-link') as AlightPredefinedLinkCommand;

    // Get current link URL if editing
    let initialUrl = '';
    if (isEditing && linkCommand.value) {
      initialUrl = linkCommand.value as string;
    }

    // Create modal if it doesn't exist
    if (!this._modalDialog) {
      this._modalDialog = new CkAlightModalDialog({
        title: isEditing ? t('Edit Predefined Link') : t('Predefined Link'),
        modal: true,
        width: '80vw',
        height: 'auto',
        contentClass: 'predefined-link-content',
        buttons: [
          {
            label: t('Cancel'),
            variant: 'outlined',
            shape: 'round',
            disabled: false
          },
          {
            label: t('Continue'),
            variant: 'default',
            isPrimary: true,
            shape: 'round',
            closeOnClick: false,
            disabled: false
          }
        ]
      });

      // Handle modal button clicks
      this._modalDialog.on('buttonClick', (label: string) => {
        if (label === t('Cancel')) {
          this._modalDialog?.hide();
          return;
        }

        if (label === t('Continue')) {
          // Get the selected link from the content manager
          const selectedLink = this._linkManager?.getSelectedLink();

          if (selectedLink) {
            // Create the link in the editor using the built-in link command
            linkCommand.execute(selectedLink.destination);

            // Hide the modal after creating the link
            this._modalDialog?.hide();

            // Explicitly force balloon to show after link creation
            setTimeout(() => this._checkAndShowBalloon(), 50);
          } else {
            // Show some feedback that no link was selected
            console.warn('No link selected');
            // You could add UI feedback here
          }
        }
      });
    } else {
      // Update title if modal already exists
      this._modalDialog.setTitle(isEditing ? t('Edit Predefined Link') : t('Predefined Link'));
    }

    // Create a new instance of ContentManager with the initial URL
    this._linkManager = new ContentManager(initialUrl);

    // Set the content to the modal dialog using the getContent method
    this._modalDialog.setContent(this._linkManager.getContent());

    // Show the modal
    this._modalDialog.show();
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