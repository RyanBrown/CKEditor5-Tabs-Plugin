// src/plugins/alight-email-link-plugin/link.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import type { DowncastConversionApi } from '@ckeditor/ckeditor5-engine';
import AlightEmailLinkPluginEditing from './linkediting';
import AlightEmailLinkPluginUI from './linkui';
import AlightEmailAutoLink from './autolink';
import EmailLinkHandler from './emaillinkhandler';
import { createLinkElement, ensureSafeUrl } from './utils';
import type AlightEmailLinkPluginCommand from './linkcommand';
import './styles/alight-email-link-plugin.scss';

/**
 * Define the config interface for the plugin
 */
export interface AlightEmailLinkPluginConfig {
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
    const allowedProtocols = ['mailto'];

    // Set higher priority for this plugin's converters to ensure they take precedence
    // over the standard link plugin converters

    // Override dataDowncast using attributeToElement with correct converter priority
    editor.conversion.for('dataDowncast').attributeToElement({
      model: 'alightEmailLinkPluginHref',
      view: (href: string, conversionApi: DowncastConversionApi) => {
        if (!href) return null;
        const linkCommand = editor.commands.get('alight-email-link') as AlightEmailLinkPluginCommand;

        // Build attributes object
        const attrs: Record<string, string> = {};

        // Use the organization name from the link command if available
        if (linkCommand && linkCommand.organization) {
          attrs.orgnameattr = linkCommand.organization;
        }

        return createLinkElement(href, { ...conversionApi, attrs });
      },
      converterPriority: 'high'
    });

    // Add a high-priority editingDowncast converter
    editor.conversion.for('editingDowncast').attributeToElement({
      model: 'alightEmailLinkPluginHref',
      view: (href: string, conversionApi: DowncastConversionApi) => {
        if (!href) return null;
        const linkCommand = editor.commands.get('alight-email-link') as AlightEmailLinkPluginCommand;

        // Build attributes object
        const attrs: Record<string, string> = {};

        // Use the organization name from the link command if available
        if (linkCommand && linkCommand.organization) {
          attrs.orgnameattr = linkCommand.organization;
        }

        return createLinkElement(ensureSafeUrl(href, allowedProtocols), { ...conversionApi, attrs });
      },
      converterPriority: 'high'
    });

    // Process organization names in links after data is loaded
    this._setupOrgNameProcessing();

    // Process links immediately after initialization
    this._processOrgNamesInLinks();

    // Process links when the editor's content changes
    this.listenTo(editor.model, 'change', () => {
      this._processOrgNamesInLinks();
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
   * Sets up processing of organization names in links
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
        if (item.is('$text') && item.hasAttribute('alightEmailLinkPluginHref')) {
          // Check if the text has the format "text (org name)" but no org attribute
          if (!item.hasAttribute('orgnameattr')) {
            // Replace any non-breaking spaces with regular spaces for consistent matching
            const normalizedText = item.data.replace(/\u00A0/g, ' ');
            const match = normalizedText.match(/^(.*?)\s+\(([^)]+)\)$/);

            if (match && match[2]) {
              const orgName = match[2];

              // Get the range of the entire link
              const href = item.getAttribute('alightEmailLinkPluginHref');
              const linkRange = findAttributeRange(
                model.createPositionBefore(item),
                'alightEmailLinkPluginHref',
                href,
                model
              );

              // Apply the organization name attribute
              writer.setAttribute('orgnameattr', orgName, linkRange);
            }
          }
          // If there's an org attribute but the text doesn't have it, add it to the text
          else {
            const orgName = item.getAttribute('orgnameattr');
            // Replace any non-breaking spaces with regular spaces for consistent matching
            const normalizedText = item.data.replace(/\u00A0/g, ' ');
            const match = normalizedText.match(/^(.*?)\s+\([^)]+\)$/);

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
   * Helper function to find attribute range
   */
  private findAttributeRange(position: any, attributeName: string, attributeValue: any, model: any): any {
    const node = position.textNode;

    if (!node) {
      return null;
    }

    // Get current node's attribute value
    const nodeAttributeValue = node.getAttribute(attributeName);

    // If the node doesn't have the attribute or it's a different value
    if (nodeAttributeValue !== attributeValue) {
      return null;
    }

    let start = position.clone();
    let end = position.clone();

    // Find the start position (move backward while attribute value is the same)
    while (start.textNode && start.textNode.getAttribute(attributeName) === attributeValue) {
      start = start.getShiftedBy(-1);
    }

    // Adjust start position - we moved one too far back
    start = start.getShiftedBy(1);

    // Find the end position (move forward while attribute value is the same)
    while (end.textNode && end.textNode.getAttribute(attributeName) === attributeValue) {
      end = end.getShiftedBy(1);
    }

    // The range must be non-empty
    if (start.isEqual(end)) {
      return null;
    }

    return model.createRange(start, end);
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

/**
 * Helper function to find attribute range.
 */
function findAttributeRange(position: any, attributeName: string, attributeValue: any, model: any): any {
  // This is a helper implementation that works with the model API
  const node = position.textNode || position.nodeBefore || position.nodeAfter;

  if (!node || !node.is('$text')) {
    return null;
  }

  // Check if the node has the attribute with matching value
  if (!node.hasAttribute(attributeName) || node.getAttribute(attributeName) !== attributeValue) {
    return null;
  }

  // Find start and end positions of the attribute range
  const start = model.createPositionAt(position.root, node.startOffset);
  let end = model.createPositionAt(position.root, node.endOffset);

  // Check if there are adjacent nodes with the same attribute
  let next = node.nextSibling;
  while (next && next.is('$text') && next.hasAttribute(attributeName) && next.getAttribute(attributeName) === attributeValue) {
    end = model.createPositionAt(position.root, next.endOffset);
    next = next.nextSibling;
  }

  return model.createRange(start, end);
}
