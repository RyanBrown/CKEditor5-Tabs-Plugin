// src/plugins/alight-balloon-link-plugin/alight-balloon-link-plugin-ui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView, ContextualBalloon, View } from '@ckeditor/ckeditor5-ui';
import { ClickObserver } from '@ckeditor/ckeditor5-engine';
import type ViewElement from '@ckeditor/ckeditor5-engine/src/view/element';
import { CkAlightModalDialog } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { ContentManager } from './modal-content/alight-balloon-link-plugin-modal-ContentManager';
import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';
import ToolBarIcon from '@ckeditor/ckeditor5-link/theme/icons/link.svg';

import './styles/alight-balloon-link-plugin.scss';

/**
 * A UI plugin that provides:
 * 1. A "Email Link" toolbar button that calls the built-in 'link' command with mailto: addresses.
 * 2. Overrides the default LinkUI balloon's "Edit" button so it opens a modal dialog.
 * 3. Leaves balloon auto-handling to LinkUI, except for our overridden button behaviors.
 */
export default class AlightBalloonLinkPluginUI extends Plugin {
  private _modalDialog?: CkAlightModalDialog;
  private _balloon!: ContextualBalloon;

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
   * 4. Overrides default LinkUI behaviors for mailto links
   */
  public init(): void {
    const editor = this.editor;
    this._balloon = editor.plugins.get(ContextualBalloon);

    // Add click observer for handling link clicks
    editor.editing.view.addObserver(ClickObserver);

    // Create the email link toolbar button
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

          // Customize the display of mailto links by stripping the mailto: prefix
          actionsView.previewButtonView.unbind('label');
          actionsView.previewButtonView.unbind('tooltip');

          // Update the button label (text)
          actionsView.previewButtonView.bind('label').to(actionsView, 'href', (href: string) => {
            if (!href) {
              return editor.t('This link has no URL');
            }
            // Show only the email address part for mailto links
            return href.toLowerCase().startsWith('mailto:') ?
              href.substring(7) : href;
          });

          // Update the button tooltip (title)
          actionsView.previewButtonView.bind('tooltip').to(actionsView, 'href', (href: string) => {
            if (href && href.toLowerCase().startsWith('mailto:')) {
              return editor.t('Open email in client');
            }
            return editor.t('Open link in new tab');
          });

          return actionsView;
        };
      }
    }
  }

  /**
   * Creates and configures the email link toolbar button:
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
   * Extends the default link actions view to handle mailto links differently:
   * - For mailto links: Shows custom modal for editing
   * - For regular links: Uses default LinkUI behavior
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

    // Handle non-mailto links by removing our custom handlers
    if (!linkValue.startsWith('mailto:')) {
      if (actionsView.editButtonView) {
        actionsView.editButtonView.off('execute');
        actionsView.off('edit');
      }
      return;
    }

    // Setup custom handling for mailto links
    if (actionsView.editButtonView) {
      // Clean up existing handlers
      actionsView.editButtonView.off('execute');
      actionsView.off('edit');

      // Add custom edit handler for mailto links
      actionsView.editButtonView.on('execute', (evt: { stop: () => void }) => {
        evt.stop();

        // Extract email from mailto link
        let email = '';
        if (linkCommand && typeof linkCommand.value === 'string') {
          email = linkCommand.value.replace(/^mailto:/i, '');
        }

        // Show edit modal with current email
        this._showModal({ email });
      }, { priority: 'highest' });

      // Prevent default edit behavior
      actionsView.on('edit', (evt: { stop: () => void }) => {
        evt.stop();
      }, { priority: 'highest' });
    }
  }

  /**
   * Shows modal dialog for creating/editing email links:
   * - Creates modal if it doesn't exist
   * - Configures modal buttons and handlers
   * - Handles form validation and link creation
   * 
   * @param initialValue Optional initial values for email
   */
  private _showModal(initialValue?: { email?: string }): void {
    const editor = this.editor;

    // Get link command for creating/editing links
    const linkCommand = editor.commands.get('link');
    if (!linkCommand) {
      console.warn('[AlightBalloonLinkPluginUI] The built-in "link" command is unavailable.');
      return;
    }

    const initialEmail = initialValue?.email || '';

    // Create modal dialog if it doesn't exist
    if (!this._modalDialog) {
      this._modalDialog = new CkAlightModalDialog({
        title: 'Balloon Link',
        modal: true,
        width: '500px',
        height: 'auto',
        contentClass: 'email-link-content',
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
          const form = this._modalDialog?.element?.querySelector('#email-link-form') as HTMLFormElement;
        }
      });
    }

    // Set modal content and show
    const content = ContentManager(initialEmail);
    this._modalDialog.setContent(content);
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