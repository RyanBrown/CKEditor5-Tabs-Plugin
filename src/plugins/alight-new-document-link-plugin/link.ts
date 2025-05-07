// src/plugins/alight-new-document-link-plugin/link.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import type { DowncastConversionApi } from '@ckeditor/ckeditor5-engine';
import AlightNewDocumentLinkPluginEditing from './linkediting';
import AlightNewDocumentLinkPluginUI from './linkui';
import AlightNewDocumentAutoLink from './autolink';
import NewDocumentLinkHandler from './newdocumentlinkhandler';
import { createLinkElement, ensureSafeUrl } from './utils';
import './styles/alight-new-document-link-plugin.scss';

/**
 * Define the config interface for the plugin
 */
export interface AlightNewDocumentLinkPluginConfig {
  allowCreatingEmptyLinks?: boolean;
  addTargetToExternalLinks?: boolean;
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
export default class AlightNewDocumentLinkPlugin extends Plugin {
  /**
   * @inheritDoc
   */
  public static get requires() {
    return [
      AlightNewDocumentLinkPluginEditing,
      AlightNewDocumentLinkPluginUI,
      AlightNewDocumentAutoLink,
      NewDocumentLinkHandler
    ] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightNewDocumentLinkPlugin' as const;
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
    const allowedProtocols = ['mailto'];

    // Set higher priority for this plugin's converters to ensure they take precedence
    // over the standard link plugin converters

    // Override dataDowncast using attributeToElement with correct converter priority
    editor.conversion.for('dataDowncast').attributeToElement({
      model: 'alightNewDocumentLinkPluginHref',
      view: (href: string, conversionApi: DowncastConversionApi) => {
        if (!href) return null;
        return createLinkElement(href, conversionApi);
      },
      converterPriority: 'high'
    });

    // Add a high-priority editingDowncast converter
    editor.conversion.for('editingDowncast').attributeToElement({
      model: 'alightNewDocumentLinkPluginHref',
      view: (href: string, conversionApi: DowncastConversionApi) => {
        if (!href) return null;
        return createLinkElement(ensureSafeUrl(href, allowedProtocols), conversionApi);
      },
      converterPriority: 'high'
    });

    // Register the UI component with a unique name to avoid conflicts
    editor.ui.componentFactory.add('alightNewDocumentLink', locale => {
      const view = editor.plugins.get(AlightNewDocumentLinkPluginUI).createButtonView(locale);
      return view;
    });

    // Register toolbar button (if needed)
    this._registerToolbarButton();
  }

  /**
   * Registers the toolbar button for the AlightNewDocumentLinkPlugin
   */
  private _registerToolbarButton(): void {
    const editor = this.editor;

    // Add to the toolbar if config requires it
    const config = editor.config.get('alightNewDocumentLink') as AlightNewDocumentLinkPluginConfig | undefined;

    if (config?.toolbar?.shouldAppearInToolbar) {
      editor.ui.componentFactory.add('alightNewDocumentLinkButton', locale => {
        const buttonView = editor.plugins.get(AlightNewDocumentLinkPluginUI).createButtonView(locale);

        // Add a special class to differentiate from standard link button
        buttonView.set({
          class: 'ck-alight-new-document-link-button',
          tooltip: locale.t('Insert New Document Link')
        });

        return buttonView;
      });
    }
  }
}
