// src/plugins/alight-predefined-link-plugin/alight-predefined-link-plugin-ui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView, ContextualBalloon, View } from '@ckeditor/ckeditor5-ui';
import { ClickObserver } from '@ckeditor/ckeditor5-engine';
import type ViewElement from '@ckeditor/ckeditor5-engine/src/view/element';
import { CkAlightModalDialog } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { ContentManager } from './modal-content/predefined-link-modal-ContentManager';
import { PredefinedLink } from './modal-content/predefined-link-modal-types';
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';
import ToolBarIcon from '@ckeditor/ckeditor5-link/theme/icons/link.svg';
import predefinedLinksData from './modal-content/json/predefined-test-data.json';
import './styles/alight-predefined-link-plugin.scss';

/**
 * A UI plugin that provides:
 * 1. A "Predefined Link" toolbar button that allows creating custom links
 * 2. Overrides the default LinkUI balloon's "Edit" button to open a modal dialog
 * 3. Leaves balloon auto-handling to LinkUI, except for overridden button behaviors
 */
export default class AlightPredefinedLinkPluginUI extends Plugin {
  private _modalDialog?: CkAlightModalDialog;
  private _balloon!: ContextualBalloon;
  private linkManager?: ContentManager;
  private _predefinedLinksData: PredefinedLink[] = predefinedLinksData.predefinedLinksDetails;

  // Defines required plugins - requires LinkUI for default link balloon functionality
  public static get requires() {
    return [LinkUI] as const;
  }

  public static get pluginName() {
    return 'AlightPredefinedLinkPluginUI' as const;
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
              // Add custom class to the <a> element
              this.element.classList.add('cka-disabled-link-preview');

              // Find and add class to the span.ck-button__label
              const labelElement = this.element.querySelector('.ck-button__label');
              if (labelElement) {
                labelElement.classList.add('cka-custom-link-label');
              }

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

          // Update the button label (text) - Use predefinedLinkName instead of URL
          actionsView.previewButtonView.bind('label').to(actionsView, 'href', (href: string) => {
            if (!href) {
              return editor.t('This link has no URL');
            }

            // // Show only the url address part for mailto links
            // if (href.toLowerCase().startsWith('mailto:')) {
            //   return href.substring(7);
            // }

            // Find the predefined link with this URL and use its name instead
            const predefinedLink = this._findPredefinedLinkByUrl(href);
            if (predefinedLink) {
              return predefinedLink.predefinedLinkName;
            }

            return href;
          });

          // Update the button tooltip (title)
          actionsView.previewButtonView.bind('tooltip').to(actionsView, 'href', (href: string) => {
            if (href) {
              const predefinedLink = this._findPredefinedLinkByUrl(href);
              if (predefinedLink) {
                return `${predefinedLink.predefinedLinkDescription} (${href})`;
              }
            }
            return 'Link preview (disabled)';
          });

          return actionsView;
        };
      }
    }
  }

  // Find predefined link by URL
  private _findPredefinedLinkByUrl(url: string): PredefinedLink | null {
    return this._predefinedLinksData.find(link => link.destination === url) || null;
  }

  // Custom handler for link preview clicks - prevents default behavior
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

    editor.ui.componentFactory.add('alightPredefinedLinkPlugin', locale => {
      const button = new ButtonView(locale);

      // Get reference to link command for state binding
      const linkCommand = editor.commands.get('link');
      if (!linkCommand) {
        console.warn('[AlightPredefinedLinkPluginUI] The built-in "link" command is unavailable.');
        return button;
      }

      // Configure button appearance
      button.set({
        label: t('Predefined Link'),
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

    let linkValue = linkCommand.value.trim();

    // Apply additional transformations to the actionsView DOM elements
    if (actionsView.element) {
      // Find the preview link element
      const previewLinkElement = actionsView.element.querySelector('.ck-link-actions__preview');
      if (previewLinkElement) {
        // Add custom class to the link
        previewLinkElement.classList.add('cka-disabled-link-preview');

        // Find and add class to the span.ck-button__label
        const labelSpan = previewLinkElement.querySelector('.ck-button__label');
        if (labelSpan) {
          labelSpan.classList.add('cka-custom-link-label');

          // Update the label to show the predefined link name if available
          const predefinedLink = this._findPredefinedLinkByUrl(linkValue);
          if (predefinedLink) {
            labelSpan.textContent = predefinedLink.predefinedLinkName;
            // Add tooltip with URL
            previewLinkElement.setAttribute('title', `${predefinedLink.predefinedLinkDescription} (${linkValue})`);
          }
        }

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
      console.warn('[AlightPredefinedLinkPluginUI] The built-in "link" command is unavailable.');
      return;
    }

    const initialUrl = initialValue?.url || '';

    // Create modal dialog if it doesn't exist
    if (!this._modalDialog) {
      this._modalDialog = new CkAlightModalDialog({
        title: 'Predefined Link',
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

      // Handle modal button clicks
      this._modalDialog.on('buttonClick', (label: string) => {
        if (label === 'Cancel') {
          this._modalDialog?.hide();
          return;
        }

        if (label === 'Continue') {
          // Get the selected link from the content manager
          const selectedLink = this.linkManager?.getSelectedLink();

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
    this.linkManager = new ContentManager(initialUrl);

    // Set the content to the modal dialog using the getContent method
    this._modalDialog.setContent(this.linkManager.getContent());

    // Show the modal
    this._modalDialog.show();
  }

  // Cleanup when plugin is destroyed
  public override destroy(): void {
    super.destroy();
    this._modalDialog?.destroy();
  }
}