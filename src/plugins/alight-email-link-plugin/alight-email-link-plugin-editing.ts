// src/plugins/alight-email-link-plugin/alight-email-link-plugin-editing.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import AlightEmailLinkPluginCommand from './alight-email-link-plugin-command';
import { Element } from '@ckeditor/ckeditor5-engine';
import { OrganizationNameHandler, LinkData } from './alight-email-link-plugin-utils';

/**
 * Plugin handling the editing functionality for email links.
 * Sets up commands, schema, and conversion rules.
 */
export default class AlightEmailLinkPluginEditing extends Plugin {
  // The unique plugin name for registration with CKEditor.
  public static get pluginName() {
    return 'AlightEmailLinkPluginEditing' as const;
  }

  // Required plugins that must be loaded for this plugin to work correctly.
  public static get requires() {
    return [Link] as const;
  }

  // Plugin initialization.
  // Sets up commands, schema, and conversion rules.
  public init(): void {
    const editor = this.editor;
    const conversion = editor.conversion;

    // Register the email link command
    const emailLinkCommand = new AlightEmailLinkPluginCommand(editor);
    editor.commands.add('applyEmailLinkPlugin', emailLinkCommand);

    // Register the email form model elements (only needed for the form creation)
    this._registerEmailFormSchema(editor.model.schema);

    // Setup email form conversions (only downcasts needed)
    this._setupEmailFormConversions(conversion);

    // Setup downcast conversion for email links
    conversion.for('downcast').attributeToElement({
      model: 'linkHref',
      view: (href, { writer }) => {
        if (!href) return;

        if (href.toLowerCase().startsWith('mailto:')) {
          return writer.createAttributeElement('a', {
            href,
            class: 'email-link'
          });
        }

        return writer.createAttributeElement('a', { href });
      }
    });

    // Setup upcast conversion for email links
    conversion.for('upcast').elementToAttribute({
      view: {
        name: 'a',
        attributes: {
          href: /^mailto:/i
        }
      },
      model: {
        key: 'linkHref',
        value: (viewElement: { getAttribute: (arg0: string) => any; }) => viewElement.getAttribute('href')
      }
    });
  }

  /**
   * Gets data from a link element.
   * 
   * @param linkElement The link element to extract data from
   * @returns Object containing email and orgName
   */
  public getLinkData(linkElement: Element): LinkData {
    const orgNameHandler = new OrganizationNameHandler(this.editor);
    return orgNameHandler.extractLinkData(linkElement);
  }

  // Removes an email link.
  public removeEmailLink(): void {
    const emailLinkCommand = this.editor.commands.get('applyEmailLinkPlugin') as AlightEmailLinkPluginCommand;
    if (emailLinkCommand) {
      emailLinkCommand.removeEmailLink();
    } else {
      // Fallback to basic unlink if the command isn't available
      this.editor.execute('unlink');
    }
  }

  /**
   * Register schema definitions for email form elements.
   * 
   * @param schema The editor's schema
   */
  private _registerEmailFormSchema(schema: any): void {
    schema.register('emailFormContainer', { allowAttributes: ['class'], allowWhere: '$block', isBlock: true, isObject: true, });
    schema.register('emailForm', { allowAttributes: ['id', 'class'], allowIn: 'emailFormContainer', isObject: true, });
    schema.register('formGroup', { allowAttributes: ['class'], allowIn: 'emailForm', isObject: true, });
    schema.register('formLabel', { allowAttributes: ['for', 'class', 'text'], allowIn: 'formGroup', isObject: true, });
    schema.register('formInput', { allowAttributes: ['type', 'id', 'name', 'class', 'required', 'value', 'placeholder', 'style'], allowIn: 'formGroup', isObject: true, });
    schema.register('errorMessage', { allowAttributes: ['id', 'class', 'style', 'text'], allowIn: 'formGroup', isObject: true, });
    schema.register('noteText', { allowAttributes: ['class', 'text'], allowIn: 'emailForm', isObject: true, });
  }

  /**
   * Setup conversion rules for email form elements (downcast only).
   * 
   * @param conversion The editor's conversion manager
   */
  private _setupEmailFormConversions(conversion: any): void {
    // Container element conversion
    conversion.for('downcast').elementToElement({
      model: 'emailFormContainer',
      view: (modelElement: any, { writer }: any) => {
        const containerElement = writer.createContainerElement('div', {
          class: 'cka-email-link-content'
        });
        return containerElement;
      }
    });

    // Form element conversion
    conversion.for('downcast').elementToElement({
      model: 'emailForm',
      view: (modelElement: any, { writer }: any) => {
        return writer.createContainerElement('form', {
          id: 'email-link-form',
          class: 'ck-form'
        });
      }
    });

    // Form group conversion
    conversion.for('downcast').elementToElement({
      model: 'formGroup',
      view: (modelElement: any, { writer }: any) => {
        const classAttribute = modelElement.getAttribute('class') || 'ck-form-group';
        return writer.createContainerElement('div', { class: classAttribute });
      }
    });

    // Label conversion
    conversion.for('downcast').elementToElement({
      model: 'formLabel',
      view: (modelElement: any, { writer }: any) => {
        const labelElement = writer.createContainerElement('label', {
          for: modelElement.getAttribute('for'),
          class: modelElement.getAttribute('class') || 'cka-input-label'
        });
        writer.insert(
          writer.createPositionAt(labelElement, 0),
          writer.createText(modelElement.getAttribute('text') || '')
        );
        return labelElement;
      }
    });

    // Input conversion
    conversion.for('downcast').elementToElement({
      model: 'formInput',
      view: (modelElement: any, { writer }: any) => {
        return writer.createEmptyElement('input', {
          type: modelElement.getAttribute('type') || 'text',
          id: modelElement.getAttribute('id') || '',
          name: modelElement.getAttribute('name') || '',
          class: modelElement.getAttribute('class') || '',
          value: modelElement.getAttribute('value') || '',
          placeholder: modelElement.getAttribute('placeholder') || '',
          required: modelElement.getAttribute('required') ? 'required' : undefined,
          style: modelElement.getAttribute('style') || ''
        });
      }
    });

    // Error message conversion
    conversion.for('downcast').elementToElement({
      model: 'errorMessage',
      view: (modelElement: any, { writer }: any) => {
        const errorElement = writer.createContainerElement('div', {
          id: modelElement.getAttribute('id') || '',
          class: modelElement.getAttribute('class') || 'cka-error-message',
          style: modelElement.getAttribute('style') || 'display: none;'
        });
        writer.insert(
          writer.createPositionAt(errorElement, 0),
          writer.createText(modelElement.getAttribute('text') || 'Please enter a valid email address.')
        );
        return errorElement;
      }
    });

    // Note text conversion
    conversion.for('downcast').elementToElement({
      model: 'noteText',
      view: (modelElement: any, { writer }: any) => {
        const noteElement = writer.createContainerElement('p', {
          class: modelElement.getAttribute('class') || 'cka-note-text'
        });
        writer.insert(
          writer.createPositionAt(noteElement, 0),
          writer.createText(modelElement.getAttribute('text') || '')
        );
        return noteElement;
      }
    });
  }

  /**
   * Creates a full email form model structure for the modal dialog.
   * 
   * @param writer The model writer
   * @param initialEmail Optional initial email value
   * @param initialOrgName Optional initial organization name value
   * @returns The created model fragment
   */
  public createEmailFormModel(writer: any, initialEmail: string = '', initialOrgName: string = '') {
    // Create the root container
    const formContainer = writer.createElement('emailFormContainer');

    // Create the form element
    const form = writer.createElement('emailForm', { id: 'email-link-form' });

    // Email form group
    const emailGroup = writer.createElement('formGroup', { class: 'ck-form-group' });

    // Email label
    const emailLabel = writer.createElement('formLabel', {
      for: 'email',
      class: 'cka-input-label',
      text: 'Email Address'
    });

    // Email input - notice we're stripping mailto: prefix if present
    const cleanInitialEmail = initialEmail.replace(/^mailto:/i, '');
    const emailInput = writer.createElement('formInput', {
      type: 'email',
      id: 'email',
      name: 'email',
      class: 'cka-input-text block',
      required: true,
      value: cleanInitialEmail,
      placeholder: 'user@example.com'
    });

    // Error message
    const emailError = writer.createElement('errorMessage', {
      id: 'email-error',
      class: 'cka-error-message',
      style: 'display: none;',
      text: 'Please enter a valid email address.'
    });

    // Add email elements to group
    writer.append(emailLabel, emailGroup);
    writer.append(emailInput, emailGroup);
    writer.append(emailError, emailGroup);

    // Organization form group
    const orgGroup = writer.createElement('formGroup', { class: 'ck-form-group mt-3' });

    // Organization label
    const orgLabel = writer.createElement('formLabel', {
      for: 'org-name',
      class: 'cka-input-label',
      text: 'Organization Name (optional)'
    });

    // Organization input
    const orgInput = writer.createElement('formInput', {
      type: 'text',
      id: 'org-name',
      name: 'orgNameInput',
      class: 'cka-input-text block',
      value: initialOrgName,
      placeholder: 'Organization name'
    });

    // Add org elements to group
    writer.append(orgLabel, orgGroup);
    writer.append(orgInput, orgGroup);

    // Note text
    const noteText = writer.createElement('noteText', {
      text: 'Organization Name (optional): Specify the third-party organization to inform users about the email\'s origin.'
    });

    // Assemble the form
    writer.append(emailGroup, form);
    writer.append(orgGroup, form);
    writer.append(noteText, form);

    // Add form to container
    writer.append(form, formContainer);

    return formContainer;
  }
}