// src/plugins/alight-predefined-link-plugin/alight-predefined-link-plugin-ui.ts
import { Plugin, Editor } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { CkAlightModalDialog } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { ContentManager } from './modal-content/predefined-link-modal-ContentManager';
import predefinedLinksData from './../../data/predefined-test-data.json';
import ToolBarIcon from '@ckeditor/ckeditor5-link/theme/icons/link.svg';
import './styles/alight-predefined-link-plugin.scss';
import { PredefinedLinkData } from './alight-predefined-link-plugin-types';
import { predefinedLinkRegistry } from './alight-predefined-link-plugin-registry';
import type LinkCommand from '@ckeditor/ckeditor5-link/src/linkcommand';

/////
// A UI plugin that provides:
// 1. A "Predefined Link" toolbar button
// 2. A modal for selecting predefined links
// 3. Metadata tracking for predefined links
///
export default class AlightPredefinedLinkPluginUI extends Plugin {
  private _modalDialog?: CkAlightModalDialog;
  private linkManager?: ContentManager;
  private _predefinedLinksData = predefinedLinksData.predefinedLinksDetails;
  private _linkUIPlugin: any = null;

  public static get pluginName() {
    return 'AlightPredefinedLinkPluginUI' as const;
  }

  constructor(editor: Editor) {
    super(editor);
  }


  // Initialize the plugin:
  // 1. Pre-populate registry with predefined links
  // 2. Set up the toolbar button
  // 3. Enhance the link UI
  public init(): void {
    try {
      // Safety check the data before continuing
      if (!this._predefinedLinksData || !Array.isArray(this._predefinedLinksData)) {
        console.warn('Predefined links data is not available or not an array');
        this._predefinedLinksData = [];
      }

      // Pre-populate registry with predefined links from data
      this._initializeRegistry();

      // Set up the predefined link button
      this._setupToolbarButton();

      // Add afterInit to ensure we have access to all plugins
      this.editor.on('ready', () => {
        console.log('Editor ready - setting up link UI enhancements');
        // Wait a bit to ensure all UI components are initialized
        setTimeout(() => {
          this._setupLinkUIEnhancements();
        }, 200);
      });

    } catch (e) {
      console.error('Error initializing predefined link UI', e);
    }
  }


  // Initialize the registry with predefined links data
  private _initializeRegistry(): void {
    try {
      this._predefinedLinksData.forEach(link => {
        predefinedLinkRegistry.setLink(link.destination, {
          id: String(link.uniqueId || ''),
          name: link.predefinedLinkName || '',
          description: link.predefinedLinkDescription || '',
          url: link.destination || '',
          pageCode: link.pageCode || '',
          domain: link.domain || '',
          baseOrClientSpecific: link.baseOrClientSpecific || '',
          pageType: link.pageType || ''
        });
      });
    } catch (e) {
      console.error('Error populating predefined links registry', e);
    }
  }


  // Creates and configures the predefined link toolbar button
  private _setupToolbarButton(): void {
    try {
      const editor = this.editor;
      const t = editor.t;

      editor.ui.componentFactory.add('alightPredefinedLinkPlugin', locale => {
        const button = new ButtonView(locale);
        const linkCommand = editor.commands.get('link') as LinkCommand;

        button.set({
          label: t('Predefined Link'),
          icon: ToolBarIcon,
          tooltip: true,
          withText: true
        });

        // Bind button state to link command if it exists
        if (linkCommand && typeof linkCommand.isEnabled !== 'undefined') {
          button.bind('isEnabled').to(linkCommand);
        }

        // When clicked, show the predefined link modal
        button.on('execute', () => {
          this._showModal();
        });

        return button;
      });
    } catch (e) {
      console.error('Error setting up toolbar button', e);
    }
  }


  // Sets up enhancements to the link UI for predefined links.
  // This is a direct approach to override the edit button's behavior.
  private _setupLinkUIEnhancements(): void {
    try {
      // Get the LinkUI plugin
      try {
        this._linkUIPlugin = this.editor.plugins.get('LinkUI');
        if (!this._linkUIPlugin) {
          console.warn('LinkUI plugin not found');
          return;
        }
        console.log('Successfully got LinkUI plugin');
      } catch (e) {
        console.error('Error getting LinkUI plugin:', e);
        return;
      }

      // Set up observers to watch for actionsView becoming visible
      try {
        if (this._linkUIPlugin.actionsView) {
          console.log('LinkUI actionsView already exists');
          this._hookEditButton();
        } else {
          console.log('LinkUI actionsView does not exist yet, setting up observer');
          // If actionsView doesn't exist yet, we need to observe when it's created
          this._observeActionsViewCreation();
        }

        // Also watch for changes in the balloon's visible view
        if (this._linkUIPlugin.balloon && typeof this._linkUIPlugin.balloon.on === 'function') {
          this._linkUIPlugin.balloon.on('change:visibleView', () => {
            console.log('Balloon visible view changed');
            this._extendLinkUIBalloon();
            this._hookEditButton();
          });
        }
      } catch (e) {
        console.error('Error setting up observers:', e);
      }
    } catch (e) {
      console.error('Error setting up link UI enhancements:', e);
    }
  }


  // Observe when the actionsView is created
  private _observeActionsViewCreation(): void {
    const linkUI = this._linkUIPlugin;

    // Monitor the _createActionsView method
    if (linkUI._createActionsView) {
      const originalCreateActionsView = linkUI._createActionsView.bind(linkUI);

      linkUI._createActionsView = () => {
        const actionsView = originalCreateActionsView();
        console.log('Actions view created, hooking edit button');

        // Now that actionsView is created, we can hook the edit button
        setTimeout(() => {
          this._hookEditButton();
        }, 100);

        return actionsView;
      };
    }
  }


  // Hook into the edit button to handle predefined links
  private _hookEditButton(): void {
    try {
      const linkUI = this._linkUIPlugin;
      if (!linkUI || !linkUI.actionsView || !linkUI.actionsView.editButtonView) {
        console.log('Cannot hook edit button - actionsView or editButtonView not found');
        return;
      }

      const actionsView = linkUI.actionsView;
      const editButtonView = actionsView.editButtonView;

      // Check if we've already hooked this button
      if (editButtonView._predefinedLinkHooked) {
        console.log('Edit button already hooked');
        return;
      }

      console.log('Hooking edit button');

      // Mark this button as hooked to avoid multiple handlers
      editButtonView._predefinedLinkHooked = true;

      // Remove all execute listeners
      editButtonView.off('execute');

      // Add our custom handler
      editButtonView.on('execute', () => {
        console.log('Edit button clicked');
        const linkCommand = this.editor.commands.get('link') as LinkCommand;

        if (linkCommand && typeof linkCommand.value === 'string') {
          const url = linkCommand.value;
          console.log('Current link URL:', url);

          // Check if this is a predefined link
          if (predefinedLinkRegistry.hasLink(url)) {
            console.log('This is a predefined link, opening modal');

            // Hide the default balloon
            if (linkUI.balloon && typeof linkUI.balloon.remove === 'function') {
              linkUI.balloon.remove(actionsView);
            }

            // Show our custom modal
            this._showModal({ url });
            return;
          } else {
            console.log('This is a regular link, using default behavior');
          }
        }

        // For non-predefined links, trigger the default edit action
        actionsView.fire('edit');
      });

      console.log('Edit button hook complete');
    } catch (e) {
      console.error('Error hooking edit button:', e);
    }
  }


  // Extends the link UI balloon when it's visible
  private _extendLinkUIBalloon(): void {
    try {
      const linkUI = this._linkUIPlugin;
      // Check if the actions view is visible
      if (!linkUI || !linkUI.actionsView || !linkUI.balloon ||
        !linkUI.balloon.hasView || !linkUI.balloon.hasView(linkUI.actionsView)) return;

      // Get the current link's URL
      const linkCommand = this.editor.commands.get('link') as LinkCommand;
      if (!linkCommand || typeof linkCommand.value !== 'string') return;

      const url = linkCommand.value;

      // Check if it's a predefined link
      if (!predefinedLinkRegistry.hasLink(url)) return;

      // Get the predefined link data
      const linkData = predefinedLinkRegistry.getLink(url);
      if (!linkData) return;

      // Customize the preview button if it exists
      const actionsView = linkUI.actionsView;
      if (actionsView.element) {
        // Find the preview button
        const previewButton = actionsView.element.querySelector('.ck-link-actions__preview');
        if (previewButton) {
          // Add custom class
          previewButton.classList.add('predefined-link-preview');

          // Change the label to show the predefined link name
          const labelElement = previewButton.querySelector('.ck-button__label');
          if (labelElement && linkData.name) {
            labelElement.textContent = linkData.name;
          }

          // Add a tooltip with description and URL
          if (linkData.description) {
            previewButton.setAttribute('title', `${linkData.description} (${url})`);
          }
        }
      }
    } catch (e) {
      console.warn('Error customizing link UI balloon', e);
    }
  }


  // Shows the predefined link modal dialog
  private _showModal(initialValue?: { url?: string }): void {
    try {
      const editor = this.editor;
      const linkCommand = editor.commands.get('link') as LinkCommand;

      if (!linkCommand) {
        console.warn('[AlightPredefinedLinkPluginUI] The "link" command is unavailable.');
        return;
      }

      const initialUrl = initialValue?.url || '';
      console.log('Opening modal with URL:', initialUrl);

      // Clean up existing modal if needed
      if (this._modalDialog) {
        this._modalDialog.hide();
      }

      // Create a new modal dialog if needed
      if (!this._modalDialog) {
        this._modalDialog = new CkAlightModalDialog({
          title: initialUrl ? 'Edit Predefined Link' : 'Add Predefined Link',
          modal: true,
          width: '80vw',
          height: 'auto',
          contentClass: 'predefined-link-content',
          buttons: [
            {
              label: 'Cancel',
              variant: 'outlined',
              shape: 'round',
              disabled: false
            },
            {
              label: 'Continue',
              variant: 'default',
              isPrimary: true,
              shape: 'round',
              closeOnClick: false,
              disabled: false
            }
          ]
        });

        // Handle button clicks
        this._modalDialog.on('buttonClick', (label: string) => {
          if (label === 'Cancel') {
            this._modalDialog?.hide();
            return;
          }

          if (label === 'Continue') {
            const selectedLink = this.linkManager?.getSelectedLink();

            if (selectedLink) {
              // Add to registry
              const linkData: PredefinedLinkData = {
                id: selectedLink.id || '',
                name: selectedLink.title,
                description: selectedLink.description || '',
                url: selectedLink.destination
              };

              predefinedLinkRegistry.setLink(selectedLink.destination, linkData);

              // Execute the regular link command - this is key for compatibility
              linkCommand.execute(selectedLink.destination);

              this._modalDialog?.hide();
            } else {
              console.warn('No link selected');
            }
          }
        });
      } else {
        // Update the title if reusing the dialog
        if (this._modalDialog.element) {
          const titleElement = this._modalDialog.element.querySelector('.ck-alight-modal__title');
          if (titleElement) {
            titleElement.textContent = initialUrl ? 'Edit Predefined Link' : 'Add Predefined Link';
          }
        }
      }

      // Create content manager with initial URL
      this.linkManager = new ContentManager(initialUrl);

      if (this._modalDialog && typeof this._modalDialog.setContent === 'function') {
        this._modalDialog.setContent(this.linkManager.getContent());
        this._modalDialog.show();
      } else {
        console.error('Modal dialog is not properly initialized');
      }
    } catch (e) {
      console.error('Error showing predefined link modal', e);
    }
  }

  public override destroy(): void {
    super.destroy();
    if (this._modalDialog && typeof this._modalDialog.destroy === 'function') {
      try {
        this._modalDialog.destroy();
      } catch (e) {
        console.warn('Error destroying modal dialog', e);
      }
    }
  }
}