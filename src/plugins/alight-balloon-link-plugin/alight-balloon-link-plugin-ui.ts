// src/plugins/alight-balloon-link-plugin/alight-balloon-link-plugin-ui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView, ContextualBalloon, View } from '@ckeditor/ckeditor5-ui';
import { ClickObserver } from '@ckeditor/ckeditor5-engine';
import type ViewElement from '@ckeditor/ckeditor5-engine/src/view/element';
import { CkAlightModalDialog } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { ContentManager } from './modal-content/balloon-link-modal-ContentManager';
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';
import ToolBarIcon from '@ckeditor/ckeditor5-link/theme/icons/link.svg';

import './styles/alight-balloon-link-plugin.scss';

/**
 * A UI plugin that provides:
 * 1. A "Balloon Link" toolbar button that allows creating custom links
 * 2. Overrides the default LinkUI balloon's "Edit" button to open a modal dialog
 * 3. Leaves balloon auto-handling to LinkUI, except for overridden button behaviors
 */
export default class AlightBalloonLinkPluginUI extends Plugin {
  private _modalDialog?: CkAlightModalDialog;
  private _balloon!: ContextualBalloon;
  private _contentManager?: ContentManager;

  /**
   * Defines required plugins - requires LinkUI for default link balloon functionality
   */
  public static get requires() {
    return [LinkUI] as const;
  }

  public static get pluginName() {
    return 'AlightBalloonLinkPluginUI' as const;
  }

  /**
   * Initializes the plugin:
   * 1. Gets balloon reference
   * 2. Sets up click observer
   * 3. Creates toolbar button
   * 4. Overrides default LinkUI behaviors for custom links
   */
  public init(): void {
    const editor = this.editor;
    this._balloon = editor.plugins.get(ContextualBalloon);

    // Add click observer for handling link clicks
    editor.editing.view.addObserver(ClickObserver);

    // Create the balloon link toolbar button
    this._setupToolbarButton();

    // Setup balloon content change handler
    this._balloon.on('change:visibleView', () => {
      this._extendDefaultActionsView();
    });

    // Get reference to LinkUI plugin
    const linkUI: any = editor.plugins.get('LinkUI');
    if (linkUI) {
      // Override showActions to ensure our custom handlers are added
      const originalShowActions = linkUI.showActions?.bind(linkUI);
      if (originalShowActions) {
        linkUI.showActions = (...args: any[]) => {
          originalShowActions(...args);
          this._extendDefaultActionsView();
        };
      }

      // Override how link previews are displayed in the balloon
      const originalCreateActionsView = linkUI._createActionsView?.bind(linkUI);
      if (originalCreateActionsView) {
        linkUI._createActionsView = () => {
          const actionsView = originalCreateActionsView();

          // Customize the preview button to not be clickable
          actionsView.previewButtonView.delegate('execute').to(this, 'customLinkPreviewHandler');

          // Hook into DOM element creation to modify the <a> element attributes
          const originalRender = actionsView.previewButtonView.render;
          actionsView.previewButtonView.render = function () {
            originalRender.call(this);

            if (this.element) {
              // Add custom class
              this.element.classList.add('cka-disabled-link-preview');

              // Add onClick handler to prevent default behavior
              this.element.addEventListener('click', (event: Event) => {
                event.preventDefault();
                return false;
              });

              // Change appearance to make it clear it's not clickable
              this.element.style.cursor = 'default';
              this.element.style.pointerEvents = 'none'; // This disables interactions

              // Remove target="_blank" and rel attributes
              this.element.removeAttribute('target');
              this.element.removeAttribute('rel');
            }
          };

          // Customize the display of links in the preview
          actionsView.previewButtonView.unbind('label');
          actionsView.previewButtonView.unbind('tooltip');

          // Update the button label (text)
          actionsView.previewButtonView.bind('label').to(actionsView, 'href', (href: string) => {
            if (!href) {
              return editor.t('This link has no URL');
            }

            // Show only the email address part for mailto links
            if (href.toLowerCase().startsWith('mailto:')) {
              return href.substring(7);
            }

            return href;
          });

          // Update the button tooltip (title)
          actionsView.previewButtonView.bind('tooltip').to(actionsView, 'href', (href: string) => {
            return 'Link preview (disabled)';
          });

          return actionsView;
        };
      }
    }
  }

  /**
   * Custom handler for link preview clicks - prevents default behavior
   */
  public customLinkPreviewHandler(event: any): void {
    // This function intentionally does nothing to prevent the default link preview behavior
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Creates and configures the balloon link toolbar button:
   * - Sets up button appearance and behavior
   * - Binds to link command for state management
   * - Handles button click to show modal
   */
  private _setupToolbarButton(): void {
    const editor = this.editor;
    const t = editor.t;

    editor.ui.componentFactory.add('alightBalloonLinkPlugin', locale => {
      const button = new ButtonView(locale);

      // Get reference to link command for state binding
      const linkCommand = editor.commands.get('link');
      if (!linkCommand) {
        console.warn('[AlightBalloonLinkPluginUI] The built-in "link" command is unavailable.');
        return button;
      }

      // Configure button appearance
      button.set({
        label: t('Balloon Link'),
        icon: ToolBarIcon,
        tooltip: true,
        withText: true
      });

      // Bind button state to link command
      button.bind('isEnabled').to(linkCommand);
      button.bind('isOn').to(linkCommand, 'value', value => !!value);

      // Show modal dialog when clicked
      button.on('execute', () => {
        this._showModal();
      });

      return button;
    });
  }

  /**
   * Extends the default link actions view to handle links differently:
   * - Shows custom modal for editing http, and https links
   * This is called whenever the balloon content changes
   */
  private _extendDefaultActionsView(): void {
    const editor = this.editor;
    const linkUI: any = editor.plugins.get('LinkUI');
    if (!linkUI || !linkUI.actionsView) {
      console.log('no linkUI or actionsView');
      return;
    }

    const actionsView: any = linkUI.actionsView;
    const linkCommand = editor.commands.get('link');

    // Validate link command and value
    if (!linkCommand || typeof linkCommand.value !== 'string') {
      return;
    }

    let linkValue = linkCommand.value.trim().toLowerCase();
    const validProtocols = ['mailto:', 'http://', 'https://'];
    const isOurLink = validProtocols.some(protocol => linkValue.startsWith(protocol));

    // Apply additional transformations to the actionsView DOM elements
    if (actionsView.element) {
      const previewLinkElement = actionsView.element.querySelector('.ck-link-actions__preview');
      if (previewLinkElement) {
        // Add your custom class
        previewLinkElement.classList.add('cka-disabled-link-preview');

        // Disable the link behavior
        previewLinkElement.addEventListener('click', (event: Event) => {
          event.preventDefault();
          return false;
        });

        // Visual indication that it's not clickable
        previewLinkElement.style.cursor = 'default';
        previewLinkElement.style.pointerEvents = 'none';

        // Remove target and rel attributes
        previewLinkElement.removeAttribute('target');
        previewLinkElement.removeAttribute('rel');
      }
    }

    // Setup custom handling for our links
    if (actionsView.editButtonView) {
      // Clean up existing handlers
      actionsView.editButtonView.off('execute');
      actionsView.off('edit');

      // Add custom edit handler for our links
      actionsView.editButtonView.on('execute', (evt: { stop: () => void }) => {
        evt.stop();

        // Extract the URL from the link
        let url = '';
        if (linkCommand && typeof linkCommand.value === 'string') {
          url = linkCommand.value;
        }

        // Show edit modal with current URL
        this._showModal({ url });
      }, { priority: 'highest' });

      // Prevent default edit behavior
      actionsView.on('edit', (evt: { stop: () => void }) => {
        evt.stop();
      }, { priority: 'highest' });
    }
  }

  /**
   * Shows modal dialog for creating/editing links:
   * - Creates modal if it doesn't exist
   * - Configures modal buttons and handlers
   * - Handles form validation and link creation
   * 
   * @param initialValue Optional initial values for the link
   */
  private _showModal(initialValue?: { url?: string }): void {
    const editor = this.editor;

    // Get link command for creating/editing links
    const linkCommand = editor.commands.get('link');
    if (!linkCommand) {
      console.warn('[AlightBalloonLinkPluginUI] The built-in "link" command is unavailable.');
      return;
    }

    const initialUrl = initialValue?.url || '';

    // Create modal dialog if it doesn't exist
    if (!this._modalDialog) {
      this._modalDialog = new CkAlightModalDialog({
        title: 'Balloon Link',
        modal: true,
        width: '80vw',
        height: 'auto',
        contentClass: 'balloon-link-content',
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

      // Handle modal button clicks
      this._modalDialog.on('buttonClick', (label: string) => {
        if (label === 'Cancel') {
          this._modalDialog?.hide();
          return;
        }

        if (label === 'Continue') {
          // Get the selected link from the content manager
          const selectedLink = this._contentManager?.getSelectedLink();

          if (selectedLink) {
            // Create the link in the editor using the built-in link command
            linkCommand.execute(selectedLink.destination);

            // Hide the modal after creating the link
            this._modalDialog?.hide();
          } else {
            // Show some feedback that no link was selected
            console.warn('No link selected');
            // You could add UI feedback here
          }
        }
      });
    }

    // Create a new instance of ContentManager with the initial URL
    this._contentManager = new ContentManager(initialUrl);

    // Set the content to the modal dialog using the getContent method
    this._modalDialog.setContent(this._contentManager.getContent());

    // Show the modal
    this._modalDialog.show();
  }

  /**
   * Cleanup when plugin is destroyed
   */
  public override destroy(): void {
    super.destroy();
    this._modalDialog?.destroy();
  }
}