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

    // Process organization names in links after data is loaded
    this._setupOrgNameProcessing();
  }

  /**
   * Sets up event listeners to process organization names in links
   */
  private _setupOrgNameProcessing(): void {
    const editor = this.editor;

    // Process links when the editor data is ready
    this.listenTo(editor, 'ready', () => {
      this._processOrgNamesInLinks();
    });

    // Process links when data is loaded
    this.listenTo(editor.data, 'loaded', () => {
      this._processOrgNamesInLinks();
    });
  }

  /**
   * Processes all links in the editor to ensure organization names are properly applied
   */
  private _processOrgNamesInLinks(): void {
    const editor = this.editor;
    const model = editor.model;

    model.change(writer => {
      const root = model.document.getRoot();
      if (!root) return;

      const range = model.createRangeIn(root);

      for (const item of range.getItems()) {
        // Only process text nodes with links
        if (item.is('$text') && item.hasAttribute('alightExternalLinkPluginHref')) {
          // Check if the text has the format "text (org name)" but no org attribute
          if (!item.hasAttribute('alightExternalLinkPluginOrgName')) {
            const match = item.data.match(/^(.*?)\s+\(([^)]+)\)$/);
            if (match && match[2]) {
              const orgName = match[2];

              // Get the range of the entire link
              const href = item.getAttribute('alightExternalLinkPluginHref');
              const linkRange = model.createRange(
                model.createPositionBefore(item),
                model.createPositionAfter(item)
              );

              // Apply the organization name attribute
              writer.setAttribute('alightExternalLinkPluginOrgName', orgName, linkRange);
            }
          }
          // If there's an org attribute but the text doesn't have it, add it to the text
          else {
            const orgName = item.getAttribute('alightExternalLinkPluginOrgName');
            const match = item.data.match(/^(.*?)\s+\([^)]+\)$/);

            // Only modify if no organization is already in the text
            if (!match && orgName) {
              // Extract base text (remove any existing org names)
              let baseText = item.data;

              // Add the organization name to the text
              const newText = `${baseText} (${orgName})`;

              // Replace the text while preserving attributes
              const attributes: Record<string, unknown> = {};
              for (const [key, value] of item.getAttributes()) {
                attributes[key] = value;
              }

              const position = model.createPositionBefore(item);

              // Remove the old text and insert the new one
              writer.remove(item);
              writer.insert(writer.createText(newText, attributes), position);
            }
          }
        }
      }
    });
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
