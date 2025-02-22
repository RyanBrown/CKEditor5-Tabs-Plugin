// src/plugins/alight-email-link-plugin/alight-email-link-plugin-editing.ts

import { Plugin } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import type { Element } from '@ckeditor/ckeditor5-engine';
import AlightEmailLinkPluginCommand from './alight-email-link-plugin-command';

/**
 * A plugin that extends the built-in Link plugin’s conversion for mailto links.
 * It checks if linkHref begins with "mailto:" and, if so, adds a class "email-link".
 */
export default class AlightEmailLinkPluginEditing extends Plugin {
  public static get pluginName() {
    return 'AlightEmailLinkPluginEditing' as const;
  }

  public static get requires() {
    // We require the built-in Link plugin so we can extend its linkHref logic.
    return [Link] as const;
  }

  public init(): void {
    const editor = this.editor;
    const schema = editor.model.schema;

    // Register schema rules
    schema.extend('$text', {
      allowAttributes: ['alightEmailLink', 'linkHref']
    });

    // Make sure the link plugin is configured
    editor.config.define('link', {
      decorators: {
        isEmail: {
          mode: 'manual',
          label: 'Email Link',
          attributes: {
            class: 'email-link'
          }
        }
      }
    });

    this._registerCommands();
    this._setupSchema();
    this._setupConversion();
  }

  private _registerCommands(): void {
    this.editor.commands.add('alightEmailLink', new AlightEmailLinkPluginCommand(this.editor));
  }

  private _setupSchema(): void {
    const schema = this.editor.model.schema;

    schema.extend('$text', {
      allowAttributes: [
        'alightEmailLink',
        'linkHref',
        'orgNameText'
      ]
    });
  }

  private _setupConversion(): void {
    const conversion = this.editor.conversion;

    // DATA -> MODEL (Upcast)
    conversion.for('upcast').elementToAttribute({
      view: {
        name: 'a',
        attributes: {
          // Matches any href that begins with "mailto:"
          href: /^mailto:/i
        }
      },
      model: {
        key: 'alightEmailLink',
        value: (viewElement: Element) => {
          const href = viewElement.getAttribute('href') || '';
          const email = href ? (href as string).replace(/^mailto:/i, '') : '';
          const orgName = viewElement.getAttribute('data-org-name') || '';

          return {
            email,
            orgNameText: orgName
          };
        }
      }
    });

    // MODEL -> DATA (Downcast)
    conversion.for('downcast').attributeToElement({
      model: 'alightEmailLink',
      view: (modelAttributeValue, { writer }) => {
        if (!modelAttributeValue) {
          return;
        }

        const { email, orgNameText } = modelAttributeValue;
        const attributes: Record<string, string> = {
          class: 'email-link',
          href: `mailto:${email}`
        };

        if (orgNameText) {
          attributes['data-org-name'] = orgNameText;
        }

        return writer.createAttributeElement('a', attributes, {
          priority: 5
        });
      }
    });

    // MODEL -> EDITING (Editing downcast)
    conversion.for('editingDowncast').attributeToElement({
      model: 'alightEmailLink',
      view: (modelAttributeValue, { writer }) => {
        if (!modelAttributeValue) {
          return;
        }

        const { email, orgNameText } = modelAttributeValue;
        const attributes: Record<string, string> = {
          class: 'email-link',
          href: `mailto:${email}`,
          title: orgNameText ? `Email: ${email} (${orgNameText})` : `Email: ${email}`
        };

        if (orgNameText) {
          attributes['data-org-name'] = orgNameText;
        }

        return writer.createAttributeElement('a', attributes, {
          priority: 5
        });
      }
    });

    // Post-fixer for attribute preservation
    this.editor.model.document.registerPostFixer(writer => {
      let changed = false;
      const selection = this.editor.model.document.selection;

      if (!selection.isCollapsed) {
        return changed;
      }

      const position = selection.getFirstPosition();
      if (!position) {
        return changed;
      }

      const parent = position.parent;
      if (!parent) {
        return changed;
      }

      const orgNameAttr = parent.is('element') ? parent.getAttribute('orgNameText') : null;
      const emailLinkAttr = parent.is('element') ? parent.getAttribute('alightEmailLink') : null;

      if (orgNameAttr && !emailLinkAttr && parent.is('element')) {
        writer.removeAttribute('orgNameText', parent);
        changed = true;
      }

      return changed;
    });
  }
}