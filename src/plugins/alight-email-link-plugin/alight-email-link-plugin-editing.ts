// src/plugins/alight-email-link-plugin/alight-email-link-plugin-editing.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import type { Element } from '@ckeditor/ckeditor5-engine';
import AlightEmailLinkPluginCommand from './alight-email-link-plugin-command';

/**
 * A plugin that extends the built-in Link plugin's conversion for mailto links.
 * It handles the editing, schema, and conversion setup for email links.
 */
export default class AlightEmailLinkPluginEditing extends Plugin {
  public static get pluginName() {
    return 'AlightEmailLinkPluginEditing' as const;
  }

  public static get requires() {
    return [Link] as const;
  }

  public init(): void {
    const editor = this.editor;

    // Register schema rules
    this._setupSchema();

    // Configure link plugin
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

    // Register commands and set up conversions
    this._registerCommands();
    this._setupConversion();
    this._setupFormElementConversion();
  }

  /**
   * Returns the HTML template for the email link form.
   * This is used by the UI component to create the modal dialog.
   * @param initialValue - Initial email value
   * @param initialOrgName - Initial organization name
   */
  public getFormTemplate(initialValue: string = '', initialOrgName: string = ''): string {
    return `
      <form id="email-link-form" class="ck-form">
        <div class="ck-form-group">
          <label for="email" class="cka-input-label">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            class="cka-input-text block"
            required
            value="${initialValue}"
            placeholder="user@example.com"
          />
          <div class="error-message" id="email-error" style="display: none;">
            Please enter a valid email address.
          </div>
        </div>
        <div class="ck-form-group mt-3">
          <label for="orgNameText" class="cka-input-label">
            Organization Name (optional)
          </label>
          <input 
            type="text" 
            id="orgNameText" 
            name="orgNameText" 
            class="cka-input-text block"
            value="${initialOrgName}"
            placeholder="Organization name"
          />
        </div>
        <p class="note-text">
          Organization Name (optional): Specify the third-party organization to inform users about the email's origin.
        </p>
      </form>
    `;
  }

  private _registerCommands(): void {
    this.editor.commands.add('alightEmailLinkPlugin', new AlightEmailLinkPluginCommand(this.editor));
  }

  private _setupSchema(): void {
    const schema = this.editor.model.schema;

    // Allow basic text attributes
    schema.extend('$text', {
      allowAttributes: [
        'alightEmailLinkPlugin',
        'linkHref',
        'orgNameText'
      ]
    });

    // Register form elements in schema
    schema.register('emailForm', {
      isLimit: true,
      allowWhere: '$block',
      allowContentOf: '$block'
    });

    schema.register('formGroup', {
      isLimit: true,
      allowIn: 'emailForm',
      allowContentOf: '$block'
    });

    schema.register('formLabel', {
      isLimit: true,
      allowIn: 'formGroup',
      allowContentOf: '$block'
    });

    schema.register('formInput', {
      isLimit: true,
      allowIn: 'formGroup',
      allowAttributes: ['type', 'id', 'required', 'class']
    });
  }

  private _setupFormElementConversion(): void {
    const conversion = this.editor.conversion;

    // Input conversion
    conversion.for('upcast').elementToElement({
      model: 'formInput',
      view: {
        name: 'input',
        classes: ['cka-input-text', 'block']
      }
    });

    conversion.for('downcast').elementToElement({
      model: 'formInput',
      view: (modelElement, { writer }) => {
        const inputAttributes = {
          class: 'cka-input-text block',
          type: modelElement.getAttribute('type') || 'text',
          id: modelElement.getAttribute('id')
        };
        if (modelElement.getAttribute('required')) {
          (inputAttributes as unknown as Record<string, string>)['required'] = 'required';
        }

        return writer.createEmptyElement('input', inputAttributes);
      }
    });
  }

  private _setupConversion(): void {
    const conversion = this.editor.conversion;

    // DATA -> MODEL (Upcast)
    conversion.for('upcast').elementToAttribute({
      view: {
        name: 'a',
        attributes: {
          href: /^mailto:/i
        }
      },
      model: {
        key: 'alightEmailLinkPlugin',
        value: (viewElement: Element) => {
          const href = viewElement.getAttribute('href') || '';
          const email = href ? (href as string).replace(/^mailto:/i, '') : '';
          const orgNameText = viewElement.getAttribute('data-org-name') || '';

          return {
            email,
            orgNameText: orgNameText
          };
        }
      }
    });

    // MODEL -> DATA (Downcast)
    conversion.for('downcast').attributeToElement({
      model: 'alightEmailLinkPlugin',
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
      model: 'alightEmailLinkPlugin',
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

    // Register post-fixer for attribute preservation
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
      const emailLinkAttr = parent.is('element') ? parent.getAttribute('alightEmailLinkPlugin') : null;

      if (orgNameAttr && !emailLinkAttr && parent.is('element')) {
        writer.removeAttribute('orgNameText', parent);
        changed = true;
      }

      return changed;
    });
  }
}