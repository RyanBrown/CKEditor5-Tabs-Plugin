// src/plugins/alight-balloon-link-plugin/alight-balloon-link-plugin-editing.ts

import { Plugin } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';

/**
 * A plugin that extends the built-in Link plugin’s conversion for mailto links.
 * It checks if linkHref begins with "mailto:" and, if so, adds a class "email-link".
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
    // If linkHref starts with "mailto:", add a special "email-link" class.
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

        // If it's a mailto link, add the "email-link" class.
        if (href.toLowerCase().startsWith('mailto:')) {
          attributes.class = 'email-link';
        }

        // Return the attribute element for the link.
        return writer.createAttributeElement('a', attributes, { priority: 5 });
      }
    });

    // UPCAST: Convert view <a> -> model linkHref if the href starts with mailto:
    conversion.for('upcast').elementToAttribute({
      view: {
        name: 'a',
        attributes: {
          // Matches any href that begins with "mailto:"
          href: /^mailto:/i
        }
      },
      model: {
        key: 'linkHref',
        value: (viewElement: Element) => {
          // Return the anchor's href to store in the model.
          const hrefVal = viewElement.getAttribute('href');
          return hrefVal || '';
        }
      }
    });
  }
}
