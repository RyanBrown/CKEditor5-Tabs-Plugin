// src/plugins/alight-existing-document-link/link.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import AlightExistingDocumentLinkPluginEditing from './linkediting';
import AlightExistingDocumentLinkPluginUI from './linkui';
import AlightExistingDocumentLinkPluginAutoLink from './autolink';
import AlightExternalLinkPluginIntegration from './linkpluginintegration';
import './styles/alight-existing-document-link-plugin.scss';
import { isExistingDocumentLink, extractExternalDocumentLinkId } from './utils';

/**
 * The Alight Existing Document link plugin.
 *
 * This is a "glue" plugin that loads the modified link editing and UI features.
 */
export default class AlightExistingDocumentLinkPlugin extends Plugin {
  /**
   * @inheritDoc
   */
  public static get requires() {
    return [
      AlightExistingDocumentLinkPluginEditing,
      AlightExistingDocumentLinkPluginUI,
      AlightExistingDocumentLinkPluginAutoLink,
      AlightExternalLinkPluginIntegration
    ] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightExistingDocumentLinkPlugin' as const;
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
    // The UI component is already registered by AlightExistingDocumentPluginUI plugin

    // Register additional plugin-specific behaviors
    this._handleLinkInterception();
  }

  /**
   * Configures the editor to intercept link creation/editing of existing document links
   */
  private _handleLinkInterception(): void {
    const editor = this.editor;

    editor.model.document.on('change', () => {
      editor.model.change(writer => {
        const changes = editor.model.document.differ.getChanges();
        const updatedNodes = new Set();

        for (const change of changes) {
          if (change.type === 'insert' || change.type === 'attribute') {
            const range = change.type === 'insert' ?
              editor.model.createRange(change.position, change.position.getShiftedBy(1)) :
              change.range;

            if (!range) continue;

            for (const item of range.getItems()) {
              if (item.is('$text') && !updatedNodes.has(item)) {
                if (item.hasAttribute('alightExistingDocumentLinkPluginHref')) {
                  const href = item.getAttribute('alightExistingDocumentLinkPluginHref');

                  if (isExistingDocumentLink(href as string)) {
                    // Always set document_tag format for existing document links
                    writer.setAttribute('alightExistingDocumentLinkPluginFormat', 'document_tag', item);

                    // Extract and set link name
                    const linkId = extractExternalDocumentLinkId(href as string);
                    if (linkId) {
                      writer.setAttribute('alightExistingDocumentPluginLinkName', linkId, item);
                    }
                  }

                  updatedNodes.add(item);
                }
              }
            }
          }
        }
      });
    });
  }
}
