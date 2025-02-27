// src/plugins/alight-balloon-link-plugin/alight-balloon-link-plugin-editing.ts

import { Plugin } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';

/**
 * A plugin that extends the built-in Link plugin's conversion.
 * It adds specific class names based on the link type (mailto, http, https).
 */
export default class AlightBalloonLinkPluginEditing extends Plugin {
  public static get pluginName() {
    return 'AlightBalloonLinkPluginEditing' as const;
  }

  public static get requires() {
    // We require the built-in Link plugin so we can extend its linkHref logic.
    return [Link] as const;
  }

  public init(): void {
    const editor = this.editor;
    const conversion = editor.conversion;

    // DOWNCAST: Convert model linkHref -> view <a>.
    // Add specific classes based on link type
    conversion.for('downcast').attributeToElement({
      model: 'linkHref', // The built-in Link plugin uses this attribute name.
      view: (href: string, { writer }) => {
        if (!href) {
          // If there's no href, return nothing so no <a> is created.
          return;
        }

        // Basic <a> with href=...
        const attributes: Record<string, string> = {
          href
        };

        // Add appropriate class based on link type
        if (href.toLowerCase().startsWith('https://')) {
          attributes.class = 'predefined-link';
        }

        // Return the attribute element for the link.
        return writer.createAttributeElement('a', attributes, { priority: 5 });
      }
    });
  }
}