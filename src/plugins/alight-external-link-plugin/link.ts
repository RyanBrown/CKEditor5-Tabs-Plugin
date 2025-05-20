// src/plugins/alight-external-link-plugin/link.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import type { DowncastConversionApi } from '@ckeditor/ckeditor5-engine';
import AlightExternalLinkPluginEditing from './linkediting';
import AlightExternalLinkPluginUI from './linkui';
import AlightExternalAutoLink from './autolink';
import ExternalLinkHandler from './externallinkhandler';
import { createLinkElement, ensureSafeUrl } from './utils';
import type AlightExternalLinkPluginCommand from './linkcommand';
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
    const allowedProtocols = ['https?'];

    // Set higher priority for this plugin's converters to ensure they take precedence
    // over the standard link plugin converters

    // Override dataDowncast using attributeToElement with correct converter priority
    editor.conversion.for('dataDowncast').attributeToElement({
      model: 'alightExternalLinkPluginHref',
      view: (href: string, conversionApi: DowncastConversionApi) => {
        if (!href) return null;
        const linkCommand = editor.commands.get('alight-external-link') as AlightExternalLinkPluginCommand;

        // Build attributes object with target and rel
        const attrs: Record<string, string> = {
          'target': '_blank',
          'rel': 'noopener noreferrer'
        };

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
      model: 'alightExternalLinkPluginHref',
      view: (href: string, conversionApi: DowncastConversionApi) => {
        if (!href) return null;
        const linkCommand = editor.commands.get('alight-external-link') as AlightExternalLinkPluginCommand;

        // Build attributes object with target and rel
        const attrs: Record<string, string> = {
          'target': '_blank',
          'rel': 'noopener noreferrer'
        };

        // Use the organization name from the link command if available
        if (linkCommand && linkCommand.organization) {
          attrs.orgnameattr = linkCommand.organization;
        }

        return createLinkElement(ensureSafeUrl(href, allowedProtocols), { ...conversionApi, attrs });
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

    // Process links immediately after initialization
    this._processOrgNamesInLinks();

    // Process links when the editor's content changes
    this.listenTo(editor.model, 'change', () => {
      this._processOrgNamesInLinks();
    });

    // Also process links when the view is rendered
    this.listenTo(editor.editing.view, 'render', () => {
      // Additional processing in the view
      this._processOrgNamesInView();
    });

    // Add a DOM mutation observer to fix any links that might be missed
    this._setupDomMutationObserver();
  }

  /**
   * Sets up a DOM mutation observer to catch any links that might be missed
   * by the other processing methods
   */
  private _setupDomMutationObserver(): void {
    const editor = this.editor;

    // Wait for editor to be ready before setting up the observer
    editor.on('ready', () => {
      setTimeout(() => {
        const editorElement = editor.editing.view.getDomRoot();
        if (!editorElement) return;

        // Create a mutation observer to watch for changes to the DOM
        const observer = new MutationObserver(mutations => {
          // Process new or changed links
          const links = editorElement.querySelectorAll('a[data-id="external_link"]:not([orgnameattr])');

          if (links.length > 0) {
            links.forEach(link => {
              // Clean the text by replacing non-breaking spaces
              const linkText = link.textContent.replace(/\u00A0/g, ' ');
              const match = linkText.match(/^(.*?)\s+\(([^)]+)\)$/);

              if (match && match[2]) {
                const orgName = match[2];

                // Set the attribute directly in the DOM
                link.setAttribute('orgnameattr', orgName);

                // Update the model if possible
                try {
                  editor.editing.view.change(writer => {
                    // Find the corresponding view element
                    const viewRoot = editor.editing.view.document.getRoot();
                    if (!viewRoot) return;

                    const range = editor.editing.view.createRangeIn(viewRoot);

                    for (const item of range.getItems()) {
                      if (item.is('element', 'a') &&
                        item.getAttribute('data-id') === 'external_link' &&
                        !item.hasAttribute('orgnameattr')) {

                        // Check if this is the same DOM element
                        const domElement = editor.editing.view.domConverter.mapViewToDom(item);
                        if (domElement === link) {
                          writer.setAttribute('orgnameattr', orgName, item);
                          break;
                        }
                      }
                    }
                  });
                } catch (error) {
                  console.warn('Error updating model for link', error);
                }
              }
            });
          }
        });

        // Start observing the editor element
        observer.observe(editorElement, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: true,
          attributeFilter: ['data-id', 'orgnameattr', 'href']
        });

        // Store observer reference for cleanup
        this._mutationObserver = observer;
      }, 300);
    });

    // Clean up the observer when the editor is destroyed
    editor.on('destroy', () => {
      if (this._mutationObserver) {
        this._mutationObserver.disconnect();
      }
    });
  }

  /**
   * Mutation observer instance
   */
  private _mutationObserver: MutationObserver | null = null;

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
   * Processes organization names in the view
   */
  private _processOrgNamesInView(): void {
    const editor = this.editor;
    const view = editor.editing.view;

    view.change(writer => {
      const viewRoot = view.document.getRoot();
      if (!viewRoot) return;

      const viewRange = view.createRangeIn(viewRoot);

      // Find all links that don't have orgnameattr but have text with (org name) pattern
      for (const item of viewRange.getItems()) {
        if (item.is('element', 'a') &&
          item.getAttribute('data-id') === 'external_link' &&
          !item.hasAttribute('orgnameattr')) {

          // Extract the text content from the link
          let linkText = '';
          for (const child of item.getChildren()) {
            if (child.is('$text')) {
              // Replace any non-breaking spaces with regular spaces
              linkText += child.data.replace(/\u00A0/g, ' ');
            }
          }

          // Check for organization name pattern
          const match = linkText.match(/^(.*?)\s+\(([^)]+)\)$/);
          if (match && match[2]) {
            const orgName = match[2];

            // Set the orgnameattr attribute
            writer.setAttribute('orgnameattr', orgName, item);

            // Find the corresponding model element and set the attribute there as well
            try {
              const position = view.createPositionBefore(item);
              const modelPosition = editor.editing.mapper.toModelPosition(position);

              if (modelPosition) {
                editor.model.change(modelWriter => {
                  const node = modelPosition.nodeAfter || modelPosition.textNode;
                  if (node && node.hasAttribute('alightExternalLinkPluginHref')) {
                    const linkRange = editor.model.createRange(
                      editor.model.createPositionBefore(node),
                      editor.model.createPositionAfter(node)
                    );
                    modelWriter.setAttribute('alightExternalLinkPluginOrgName', orgName, linkRange);
                  }
                });
              }
            } catch (error) {
              // Ignore errors in the mapping process
              console.warn('Error mapping view to model:', error);
            }
          }
        }
      }
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
            // Replace any non-breaking spaces with regular spaces for consistent matching
            const normalizedText = item.data.replace(/\u00A0/g, ' ');
            const match = normalizedText.match(/^(.*?)\s+\(([^)]+)\)$/);

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
