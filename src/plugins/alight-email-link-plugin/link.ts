// src/plugins/alight-email-link-plugin/link.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import type { DowncastConversionApi } from '@ckeditor/ckeditor5-engine';
import AlightEmailLinkPluginEditing from './linkediting';
import AlightEmailLinkPluginUI from './linkui';
import AlightEmailAutoLink from './autolink';
import EmailLinkHandler from './emaillinkhandler';
import { createLinkElement } from './utils';
import './styles/alight-email-link-plugin.scss';

/**
 * Define the config interface for the plugin
 */
export interface AlightEmailLinkPluginConfig {
  allowCreatingEmptyLinks?: boolean;
  addTargetToExternalLinks?: boolean; // Add this missing property
  defaultProtocol?: string;
  allowedProtocols?: string[];
  toolbar?: {
    shouldAppearInToolbar?: boolean;
  };
  decorators?: Record<string, any>;
}

/**
 * The Alight Email link plugin.
 *
 * This is a "glue" plugin that loads the modified link editing and UI features.
 * It's designed to work independently of the standard CKEditor link plugin.
 */
export default class AlightEmailLinkPlugin extends Plugin {
  /**
   * @inheritDoc
   */
  public static get requires() {
    return [
      AlightEmailLinkPluginEditing,
      AlightEmailLinkPluginUI,
      AlightEmailAutoLink,
      EmailLinkHandler
    ] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightEmailLinkPlugin' as const;
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

    // Set higher priority for this plugin's converters to ensure they take precedence
    // over the standard link plugin converters

    // Override dataDowncast using attributeToElement with correct converter priority
    editor.conversion.for('dataDowncast').attributeToElement({
      model: 'alightEmailLinkPluginHref',
      view: (href: string, conversionApi: DowncastConversionApi) => {
        if (!href) return null;
        return createLinkElement(href, conversionApi);
      },
      converterPriority: 'high'
    });

    // Register the UI component with a unique name to avoid conflicts
    editor.ui.componentFactory.add('alightEmailLink', locale => {
      const view = editor.plugins.get(AlightEmailLinkPluginUI).createButtonView(locale);
      return view;
    });

    // Register toolbar button (if needed)
    this._registerToolbarButton();
  }

  /**
   * Registers the toolbar button for the AlightEmailLinkPlugin
   */
  private _registerToolbarButton(): void {
    const editor = this.editor;

    // Add to the toolbar if config requires it
    const config = editor.config.get('alightEmailLink') as AlightEmailLinkPluginConfig | undefined;

    if (config?.toolbar?.shouldAppearInToolbar) {
      editor.ui.componentFactory.add('alightEmailLinkButton', locale => {
        const buttonView = editor.plugins.get(AlightEmailLinkPluginUI).createButtonView(locale);

        // Add a special class to differentiate from standard link button
        buttonView.set({
          class: 'ck-alight-email-link-button',
          tooltip: locale.t('Insert Email Link')
        });

        return buttonView;
      });
    }
  }
}