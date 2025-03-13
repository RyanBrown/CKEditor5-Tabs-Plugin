// src/plugins/alight-external-link-plugin/link.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import type { DowncastConversionApi } from '@ckeditor/ckeditor5-engine';
import AlightExternalLinkPluginEditing from './linkediting';
import AlightExternalLinkPluginUI from './linkui';
import AlightExternalAutoLink from './autolink';
import ExternalLinkHandler from './externallinkhandler';
import { createLinkElement } from './utils';
import './styles/alight-external-link-plugin.scss';

/**
 * Define the config interface for the plugin
 */
export interface AlightExternalLinkPluginConfig {
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
 * The Alight External link plugin.
 *
 * This is a "glue" plugin that loads the modified link editing and UI features.
 * It's designed to work independently of the standard CKEditor link plugin.
 */
export default class AlightExternalLinkPlugin extends Plugin {
  /**
   * @inheritDoc
   */
  public static get requires() {
    return [
      AlightExternalLinkPluginEditing,
      AlightExternalLinkPluginUI,
      AlightExternalAutoLink,
      ExternalLinkHandler
    ] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightExternalLinkPlugin' as const;
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
      model: 'alightExternalLinkPluginHref',
      view: (href: string, conversionApi: DowncastConversionApi) => {
        if (!href) return null;
        return createLinkElement(href, conversionApi);
      },
      converterPriority: 'high'
    });

    // Register the UI component with a unique name to avoid conflicts
    editor.ui.componentFactory.add('alightExternalLink', locale => {
      const view = editor.plugins.get(AlightExternalLinkPluginUI).createButtonView(locale);
      return view;
    });

    // Register toolbar button (if needed)
    this._registerToolbarButton();
  }

  /**
   * Registers the toolbar button for the AlightExternalLinkPlugin
   */
  private _registerToolbarButton(): void {
    const editor = this.editor;

    // Add to the toolbar if config requires it
    const config = editor.config.get('alightExternalLink') as AlightExternalLinkPluginConfig | undefined;

    if (config?.toolbar?.shouldAppearInToolbar) {
      editor.ui.componentFactory.add('alightExternalLinkButton', locale => {
        const buttonView = editor.plugins.get(AlightExternalLinkPluginUI).createButtonView(locale);

        // Add a special class to differentiate from standard link button
        buttonView.set({
          class: 'ck-alight-external-link-button',
          tooltip: locale.t('Insert External Link')
        });

        return buttonView;
      });
    }
  }
}
