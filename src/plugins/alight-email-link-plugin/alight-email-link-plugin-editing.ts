// src/plugins/alight-email-link-plugin/alight-email-link-plugin-editing.ts

import { Plugin } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import type { Element } from '@ckeditor/ckeditor5-engine';
import AlightEmailLinkPluginCommand from './alight-email-link-plugin-command';

// Form template for the email link dialog
const EMAIL_FORM_TEMPLATE = `
<form id="email-link-form" class="ck-form">
  <div class="ck-form-group">
    <label class="cka-input-label" for="email">Email Address</label>
    <input type="email" id="email" class="cka-input-text block" required />
    <div class="error-message" style="display: none; color: red; margin-top: 4px;"></div>
  </div>
  <div class="ck-form-group mt-3">
    <label class="cka-input-label" for="orgName">Organization Name (optional)</label>
    <input type="text" id="orgName" class="cka-input-text block" />
  </div>
  <p class="note-text mt-3">
    Specify the third-party organization to inform users about the email's origin.
  </p>
</form>
`;

// Form style definitions
const FORM_STYLES = {
  form: {
    classes: ['ck-form']
  },
  group: {
    classes: ['ck-form-group']
  },
  label: {
    classes: ['cka-input-label']
  },
  input: {
    classes: ['cka-input-text', 'block']
  },
  error: {
    classes: ['error-message']
  },
  note: {
    classes: ['note-text', 'mt-3']
  }
};

/**
 * A plugin that extends the built-in Link plugin's conversion for mailto links.
 * It handles the editing, schema, and conversion setup for email links.
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

  private _registerCommands(): void {
    this.editor.commands.add('alightEmailLink', new AlightEmailLinkPluginCommand(this.editor));
  }

  private _setupSchema(): void {
    const schema = this.editor.model.schema;

    // Allow basic text attributes
    schema.extend('$text', {
      allowAttributes: [
        'alightEmailLink',
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

    // Form container conversion
    conversion.for('upcast').elementToElement({
      model: 'emailForm',
      view: {
        name: 'form',
        classes: FORM_STYLES.form.classes
      }
    });

    conversion.for('downcast').elementToElement({
      model: 'emailForm',
      view: (modelElement, { writer }) => {
        return writer.createContainerElement('form', {
          class: FORM_STYLES.form.classes.join(' '),
          id: 'email-link-form'
        });
      }
    });

    // Form group conversion
    conversion.for('upcast').elementToElement({
      model: 'formGroup',
      view: {
        name: 'div',
        classes: FORM_STYLES.group.classes
      }
    });

    conversion.for('downcast').elementToElement({
      model: 'formGroup',
      view: (modelElement, { writer }) => {
        return writer.createContainerElement('div', {
          class: FORM_STYLES.group.classes.join(' ')
        });
      }
    });

    // Label conversion
    conversion.for('upcast').elementToElement({
      model: 'formLabel',
      view: {
        name: 'label',
        classes: FORM_STYLES.label.classes
      }
    });

    conversion.for('downcast').elementToElement({
      model: 'formLabel',
      view: (modelElement, { writer }) => {
        return writer.createContainerElement('label', {
          class: FORM_STYLES.label.classes.join(' ')
        });
      }
    });

    // Input conversion
    conversion.for('upcast').elementToElement({
      model: 'formInput',
      view: {
        name: 'input',
        classes: FORM_STYLES.input.classes
      }
    });

    conversion.for('downcast').elementToElement({
      model: 'formInput',
      view: (modelElement, { writer }) => {
        const inputAttributes = {
          class: FORM_STYLES.input.classes.join(' '),
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
      const emailLinkAttr = parent.is('element') ? parent.getAttribute('alightEmailLink') : null;

      if (orgNameAttr && !emailLinkAttr && parent.is('element')) {
        writer.removeAttribute('orgNameText', parent);
        changed = true;
      }

      return changed;
    });
  }

  /**
   * Returns the HTML template for the email link form.
   * This is used by the UI component to create the modal dialog.
   */
  public getFormTemplate(): string {
    return EMAIL_FORM_TEMPLATE;
  }

  /**
   * Returns the style definitions for form elements.
   * This can be used by other components that need to maintain consistent styling.
   */
  public getFormStyles(): typeof FORM_STYLES {
    return FORM_STYLES;
  }
}