// src/plugins/alight-new-document-link-plugin/linkui.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import {
  ClickObserver,
  type ViewAttributeElement,
  type ViewDocumentClickEvent
} from '@ckeditor/ckeditor5-engine';
import {
  ButtonView,
  ContextualBalloon,
  MenuBarMenuListItemButtonView,
  clickOutsideHandler
} from '@ckeditor/ckeditor5-ui';
import { isWidget } from '@ckeditor/ckeditor5-widget';

import AlightNewDocumentLinkPluginEditing from './linkediting';
import LinkActionsView from './ui/linkactionsview';
import type AlightNewDocumentLinkPluginCommand from './linkcommand';
import type AlightNewDocumentUnlinkCommand from './unlinkcommand';
import {
  isLinkElement,
  FormValidator,
  FormSubmissionHandler,
  handleFormSubmission,
  type ValidationResult
} from './utils';
import { CkAlightModalDialog } from './../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { CkAlightSelectMenu } from './../ui-components/alight-select-menu-component/alight-select-menu-component';
import { CkAlightCheckbox } from './../ui-components/alight-checkbox-component/alight-checkbox-component';
import { CkAlightChipsMenu } from './../ui-components/alight-chips-menu-component/alight-chips-menu-component';

import ToolBarIcon from '@ckeditor/ckeditor5-link/theme/icons/link.svg';

// Use a unique marker name to avoid conflicts with standard link plugin
const VISUAL_SELECTION_MARKER_NAME = 'alight-new-document-link-ui';
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Returns a link element if there's one among the ancestors of the provided `Position`.
 */
function findLinkElementAncestor(position: any): ViewAttributeElement | null {
  const linkElement = position.getAncestors().find((ancestor: any) => isLinkElement(ancestor));
  return linkElement && linkElement.is('attributeElement') ? linkElement : null;
}

// Add category interface and ContentManager class
interface CategoryItem {
  id: string;
  label: string;
}

class ContentManager {
  private container: HTMLElement | null = null;
  private languageSelect: CkAlightSelectMenu<{ value: string; label: string }> | null = null;
  private searchTagsChips: CkAlightChipsMenu | null = null;
  private modalDialog: any = null;
  private formValidator: FormValidator;
  private formSubmissionHandler: FormSubmissionHandler;
  public hasUserInteracted = false;
  private categories: CategoryItem[] = [];

  private formData = {
    language: 'en',
    file: null as File | null,
    documentTitle: '',
    searchTags: [] as string[],
    description: '',
    categories: [] as string[],
    contentLibraryAccess: false,
    worklifeLink: false,
    showInSearch: true
  };

  constructor() {
    this.formValidator = new FormValidator();
    this.formSubmissionHandler = new FormSubmissionHandler();

    // Initialize with some default categories
    this.categories = [
      { id: 'id-benefits', label: 'Benefits' },
      { id: 'id-hr', label: 'HR' },
      { id: 'id-payroll', label: 'Payroll' },
      { id: 'id-legal', label: 'Legal' }
    ];
  }

  public async setModalContents(): Promise<any[]> {
    // In a real implementation, fetch categories from an API
    return this.categories;
  }

  private createCardHTML(content: string): string {
    return `<article class="cka-card">${content}</article>`;
  }

  private createLanguageSelectHTML(): string {
    return `
      <h3 class="cka-sub-title">Language</h3>
      ${this.createCardHTML(`
        <div class="cka-form-group">
          <label for="language-select-container" class="cka-input-label">Language</label>
          <div id="language-select-container" class="cka-width-50"></div>
          <div class="cka-error-message language-error">Choose a language to continue.</div>
        </div>
      `)}
    `;
  }

  private createFileInputHTML(): string {
    const acceptedFileTypes = '.doc,.docx,.xls,.xlsx,.xlsm,.ppt,.pptx,.pdf';
    const supportedFileTypes = ['doc', 'docx', 'xls', 'xlsx', 'xlsm', 'ppt', 'pptx', 'pdf'];

    return `
      <h3 class="cka-sub-title">Document & Title</h3>
      ${this.createCardHTML(`
        <div class="cka-form-group">
          <label for="file-input" class="cka-input-label">Upload Document (5MB Limit)</label>
          <div class="cka-file-input-wrapper cka-width-50" data-text="No file chosen">
            <input 
              accept="${acceptedFileTypes}"
              class="cka-input-file"
              id="file-input"
              name="file"
              type="file" 
              required
            />
          </div>
          <div class="cka-control-footer">
            <em>
              <strong>Supported file types:</strong> ${supportedFileTypes.join(', ')}
            </em>
          </div>
          <div class="cka-error-message file-error">Choose a file.</div>
          <div class="cka-error-message file-size-error">File size must be less than 5MB.</div>
        </div>

        <div class="cka-form-group mt-4">
          <label for="document-title" class="cka-input-label">Document Title</label>
          <input
            class="cka-input-text cka-width-50"
            id="document-title"
            maxlength="250"
            name="documentTitle"
            type="text"
            value="${this.formData.documentTitle}"
            placeholder="Enter document title..."
            required
          />
          <span class="cka-control-footer cka-width-100 character-count">250 characters remaining</span>
          <div class="cka-control-footer">
            <strong>Note:</strong> Special characters such as (\\, ], :, >, /, <, [, |, ?, ", *, comma) are not allowed.
          </div>
          <div class="cka-error-message documentTitle-error">Enter title to continue.</div>
        </div>
      `)}
    `;
  }

  private createSearchCriteriaHTML(): string {
    return `
      <h3 class="cka-sub-title">Search Criteria</h3>
      ${this.createCardHTML(`
        <div class="cka-form-group">
          <label for="search-tags-chips" class="cka-input-label">Search Tags (optional)</label>
          <div id="search-tags-chips" class="cka-width-50"></div>
          <span class="cka-control-footer cka-width-50">
            Add search tags to improve the relevancy of search results. 
            Use commas to separate multiple tags.
            Type your tag and press Enter to add it.
          </span>
        </div>

        <div class="cka-form-group mt-4">
          <label for="description" class="cka-input-label">Description</label>
          <textarea 
            class="cka-textarea cka-width-50"
            id="description"
            name="description"
            cols="30"
            required
            rows="5" 
            placeholder="Enter description..."
          >${this.formData.description}</textarea>
          <div class="cka-error-message description-error">Enter a description to continue.</div>
        </div>

        <div class="cka-form-group mt-4">
          <label for="categories" class="cka-input-label">Categories (optional)</label>
          <a href="#" class="cka-categories-toggle">Choose Categories</a>
          <div class="cka-categories-wrapper hidden">
            <ul class="cka-choose-categories-list">
              ${this.categories.map(category => `
                <li>
                  <cka-checkbox 
                    id="${category.id}" 
                    ${this.formData.categories.includes(category.id) ? 'initialvalue="true"' : ''}
                  >
                    ${category.label}
                  </cka-checkbox>
                </li>
              `).join('')}
            </ul>
          </div>
          <div class="cka-control-footer">
            <strong>Note:</strong> Categories apply to both search and Content Library.
          </div>
        </div>
      `)}
    `;
  }

  private createCheckboxGroupHTML(): string {
    return `
      <h3 class="cka-sub-title">Content Library</h3>
      ${this.createCardHTML(`
        <cka-checkbox id="contentLibraryAccess">
          Access from Content Library (optional)
        </cka-checkbox>
      `)}

      <h3 class="cka-sub-title">Alight Worklife Link</h3>
      ${this.createCardHTML(`
        <cka-checkbox id="worklifeLink">
          Link to Document From a Alight Worklife Link (optional)
        </cka-checkbox>
      `)}

      <h3 class="cka-sub-title">Search Results</h3>
      ${this.createCardHTML(`
        <cka-checkbox id="showInSearch" initialvalue="true">
          Show in Search Results (optional)
        </cka-checkbox>
        <div class="cka-control-footer">
          If this document matches a user's search criteria, checking this box makes it
          eligible to appear in the search results.
        </div>
      `)}
    `;
  }

  private initializeLanguageSelect(): void {
    const container = document.getElementById('language-select-container');
    if (!container) return;

    if (this.languageSelect) {
      this.languageSelect.destroy();
    }

    this.languageSelect = new CkAlightSelectMenu({
      options: [
        { value: 'en', label: 'English (default)' },
        { value: 'fr', label: 'French' },
        { value: 'es', label: 'Spanish' }
      ],
      placeholder: 'Select language',
      value: this.formData.language,
      optionLabel: 'label',
      optionValue: 'value',
      onChange: (selectedValue) => {
        if (selectedValue && typeof selectedValue === 'string') {
          this.formData.language = selectedValue;
          this.hasUserInteracted = true;
          this.validateAndUpdateField('language', selectedValue);
        }
      }
    });
    this.languageSelect.mount(container);
  }

  private validateAndUpdateField(fieldName: string, value: any): void {
    if (!this.hasUserInteracted) return;

    const validation = this.formValidator.validateField(fieldName, value);

    if (!this.container) return;

    // Find the input element
    const inputElement = this.container.querySelector(`[name="${fieldName}"]`);

    // Find the error message element
    const errorElement = this.container.querySelector(`.${fieldName}-error`);

    if (inputElement) {
      inputElement.classList.toggle('error', !validation.isValid);
    }

    if (errorElement) {
      if (!validation.isValid && validation.errors?.[fieldName]) {
        errorElement.textContent = validation.errors[fieldName];
        errorElement.classList.add('visible');
      } else {
        errorElement.classList.remove('visible');
      }
    }

    this.updateSubmitButtonState();
  }

  public validateForm(): ValidationResult {
    const validation = this.formValidator.validateForm(this.formData);

    if (this.hasUserInteracted && !validation.isValid && validation.errors && this.container) {
      // Clear all existing error messages first
      this.container.querySelectorAll('.cka-error-message').forEach(msg => {
        msg.classList.remove('visible');
      });

      // Show new error messages
      Object.entries(validation.errors).forEach(([field, message]) => {
        const errorElement = this.container?.querySelector(`.${field}-error`);
        if (errorElement) {
          errorElement.textContent = message;
          errorElement.classList.add('visible');
        }
      });
    }

    return validation;
  }

  private updateSubmitButtonState(): void {
    if (!this.modalDialog) return;

    const submitButton = this.modalDialog.element?.querySelector('.cka-button-primary');

    if (submitButton) {
      // Always enable the button regardless of validation result
      submitButton.disabled = false;
      submitButton.classList.remove('cka-button-disabled');
    }
  }

  private attachEventListeners(): void {
    if (!this.container) return;

    // Add form interaction listeners
    const form = this.container.querySelector('form');
    if (form) {
      form.addEventListener('change', () => {
        this.hasUserInteracted = true;
      });
      form.addEventListener('input', () => {
        this.hasUserInteracted = true;
      });
    }

    // File input
    const fileInput = this.container.querySelector('#file-input');
    if (fileInput instanceof HTMLInputElement) {
      fileInput.addEventListener('change', (e) => {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];

        // Update the wrapper text to show selected filename
        const wrapper = input.closest('.cka-file-input-wrapper');
        if (wrapper) {
          wrapper.setAttribute('data-text', file ? file.name : 'No file chosen');
        }

        this.formData.file = file || null;
        this.hasUserInteracted = true;
        this.validateAndUpdateField('file', file);
      });
    }

    // Title input
    const titleInput = this.container.querySelector('#document-title');
    if (titleInput instanceof HTMLInputElement) {
      titleInput.addEventListener('input', (e) => {
        this.formData.documentTitle = (e.target as HTMLInputElement).value;
        this.hasUserInteracted = true;
        this.validateAndUpdateField('documentTitle', this.formData.documentTitle);
        this.updateCharacterCount(titleInput);
      });
    }

    // Initialize search tags chips
    const searchTagsContainer = this.container.querySelector('#search-tags-chips');
    if (searchTagsContainer) {
      try {
        if (!searchTagsContainer.id) {
          searchTagsContainer.id = 'search-tags-' + Date.now();
        }

        this.searchTagsChips = new CkAlightChipsMenu(searchTagsContainer.id);

        if (this.formData.searchTags.length > 0) {
          this.searchTagsChips.setChips(this.formData.searchTags);
        }

        searchTagsContainer.addEventListener('add', (e: Event) => {
          const customEvent = e as CustomEvent;
          if (!this.formData.searchTags.includes(customEvent.detail)) {
            this.formData.searchTags.push(customEvent.detail);
          }
        });

        searchTagsContainer.addEventListener('remove', (e: Event) => {
          const customEvent = e as CustomEvent;
          this.formData.searchTags = this.formData.searchTags.filter(tag => tag !== customEvent.detail);
        });

        searchTagsContainer.addEventListener('clear', () => {
          this.formData.searchTags = [];
        });
      } catch (error) {
        console.warn('Failed to initialize search tags:', error);
      }
    }

    // Description
    const description = this.container.querySelector('#description');
    if (description instanceof HTMLTextAreaElement) {
      description.addEventListener('input', (e) => {
        this.formData.description = (e.target as HTMLTextAreaElement).value;
        this.hasUserInteracted = true;
        this.validateAndUpdateField('description', this.formData.description);
      });
    }

    // Checkboxes
    this.initializeCheckbox('contentLibraryAccess', 'contentLibraryAccess');
    this.initializeCheckbox('worklifeLink', 'worklifeLink');
    this.initializeCheckbox('showInSearch', 'showInSearch');

    // Categories
    this.categories.forEach(category => {
      this.initializeCategoryCheckbox(category.id);
    });

    // Categories toggle
    const toggleButton = this.container.querySelector('.cka-categories-toggle');
    const categoriesWrapper = this.container.querySelector('.cka-categories-wrapper');

    if (toggleButton && categoriesWrapper) {
      toggleButton.addEventListener('click', (e) => {
        e.preventDefault();
        categoriesWrapper.classList.toggle('hidden');
      });
    }
  }

  // Separate method for category checkboxes to handle them specifically
  private initializeCategoryCheckbox(categoryId: string): void {
    const checkbox = this.container?.querySelector(`#${categoryId}`) as CkAlightCheckbox;
    if (checkbox) {
      checkbox.addEventListener('change', (e: Event) => {
        this.hasUserInteracted = true;
        const customEvent = e as CustomEvent;

        if (customEvent.detail) {
          // Add category ID if it's not already in the list
          if (!this.formData.categories.includes(categoryId)) {
            this.formData.categories.push(categoryId);
          }
        } else {
          // Remove category ID from the list
          this.formData.categories = this.formData.categories.filter(id => id !== categoryId);
        }
      });
    }
  }

  private initializeCheckbox(id: string, dataKey: string): void {
    const checkbox = this.container?.querySelector(`#${id}`) as CkAlightCheckbox;
    if (checkbox) {
      checkbox.addEventListener('change', (e: Event) => {
        this.hasUserInteracted = true;
        const customEvent = e as CustomEvent;
        // Handle boolean checkboxes
        this.formData[dataKey as keyof typeof this.formData] = customEvent.detail as never;
      });
    }
  }

  private updateCharacterCount(input: HTMLInputElement): void {
    const countSpan = input.parentElement?.querySelector('.character-count');
    if (countSpan) {
      countSpan.textContent = `${250 - input.value.length} characters remaining`;
    }
  }

  public setModalDialog(dialog: any): void {
    this.modalDialog = dialog;
  }

  public renderContent(container: HTMLElement): void {
    this.container = container;
    container.innerHTML = `
      <form novalidate>
        ${this.createLanguageSelectHTML()}
        ${this.createFileInputHTML()}
        ${this.createSearchCriteriaHTML()}
        ${this.createCheckboxGroupHTML()}
        <p class="mt-4"><b>Note:</b> Updates will not be reflected in Alight Worklife search results in QA/QC until tomorrow.</p>
      </form>
    `;

    // Initially hide all error messages
    container.querySelectorAll('.cka-error-message').forEach(msg => {
      msg.classList.remove('visible');
    });

    requestAnimationFrame(() => {
      this.initializeLanguageSelect();
      this.attachEventListeners();

      // Initialize submit button state without showing validation errors
      const submitButton = this.modalDialog?.element?.querySelector('.cka-button-primary');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.classList.remove('cka-button-disabled');
      }
    });
  }

  /**
   * Submits the form data
   * @returns A promise that resolves to a submission result
   */
  public async submitForm(): Promise<any> {
    const validation = this.validateForm();

    if (!validation.isValid) {
      return;
    }

    // Get a complete copy of the form data for logging
    const formDataCopy = this.getFormData();

    // Log all form data that will be posted
    console.log('Submitting complete form data:', formDataCopy);

    const result = await this.formSubmissionHandler.submitForm(this.formData);

    if (!result.success) {
      console.error('Form submission failed:', result.error);
      throw new Error(result.error || 'Failed to submit form');
    }

    // Log the successful response
    console.log('Form submission successful, received response:', result);

    return result.data;
  }

  public resetForm(): void {
    // Reset form data to initial state
    this.formData = {
      language: 'en',
      file: null,
      documentTitle: '',
      searchTags: [],
      description: '',
      categories: [],
      contentLibraryAccess: false,
      worklifeLink: false,
      showInSearch: true
    };

    this.hasUserInteracted = false;

    // Reset UI components
    if (this.languageSelect) {
      try {
        this.languageSelect.setValue('en');
      } catch (error) {
        console.warn('Error resetting language select:', error);
      }
    }

    if (this.searchTagsChips) {
      try {
        this.searchTagsChips.clearChips();
      } catch (error) {
        console.warn('Error clearing search tags:', error);
      }
    }

    // Reset form element values
    if (this.container) {
      try {
        // Reset file input
        const fileInput = this.container.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
          const wrapper = fileInput.closest('.cka-file-input-wrapper');
          if (wrapper) {
            wrapper.setAttribute('data-text', 'No file chosen');
          }
        }

        // Reset text inputs
        const titleInput = this.container.querySelector('#document-title') as HTMLInputElement;
        if (titleInput) {
          titleInput.value = '';
          this.updateCharacterCount(titleInput);
        }

        // Reset textarea
        const description = this.container.querySelector('#description') as HTMLTextAreaElement;
        if (description) {
          description.value = '';
        }

        // Reset checkboxes
        const checkboxes = this.container.querySelectorAll('cka-checkbox') as NodeListOf<CkAlightCheckbox>;
        checkboxes.forEach(checkbox => {
          if (checkbox.id === 'showInSearch') {
            checkbox.setAttribute('checked', 'true');
          } else {
            checkbox.removeAttribute('checked');
          }
        });

        // Hide categories wrapper
        const categoriesWrapper = this.container.querySelector('.cka-categories-wrapper');
        if (categoriesWrapper) {
          categoriesWrapper.classList.add('hidden');
        }

        // Reset error messages
        const errorMessages = this.container.querySelectorAll('.cka-error-message');
        errorMessages.forEach(message => {
          message.classList.remove('visible');
        });

        // Reset input error states
        const inputs = this.container.querySelectorAll('.cka-input-text, .cka-textarea');
        inputs.forEach(input => {
          input.classList.remove('error');
        });
      } catch (error) {
        console.warn('Error resetting form elements:', error);
      }
    }

    // Update submit button state
    const submitButton = this.modalDialog?.element?.querySelector('.cka-button-primary');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.classList.remove('cka-button-disabled');
    }
  }

  public getFormData(): any {
    // Create a clean copy of the form data
    const formDataCopy = {
      language: this.formData.language,
      file: this.formData.file,
      documentTitle: this.formData.documentTitle.trim(),
      searchTags: [...this.formData.searchTags],
      description: this.formData.description.trim(),
      categories: [...this.formData.categories],
      contentLibraryAccess: this.formData.contentLibraryAccess,
      worklifeLink: this.formData.worklifeLink,
      showInSearch: this.formData.showInSearch
    };

    return formDataCopy;
  }

  public destroy(): void {
    // Cleanup language select
    if (this.languageSelect) {
      this.languageSelect.destroy();
      this.languageSelect = null;
    }

    // Cleanup search tags chips
    if (this.searchTagsChips) {
      this.searchTagsChips.destroy();
      this.searchTagsChips = null;
    }

    // Remove event listeners
    if (this.container) {
      const form = this.container.querySelector('form');
      if (form) {
        const newForm = form.cloneNode(true);
        form.parentNode?.replaceChild(newForm, form);
      }
    }

    // Cleanup form submission handler
    this.formSubmissionHandler.cancelSubmission();

    // Clear references
    this.container = null;
    this.modalDialog = null;
  }
}

/**
 * The link UI plugin. It introduces the `'alight-new-document-link'` and `'alight-new-document-unlink'` buttons.
 * 
 * Uses a balloon for unlink actions, and a modal dialog for create/edit functions.
 */
export default class AlightNewDocumentLinkPluginUI extends Plugin {
  /**
   * The modal dialog instance.
   */
  private _modalDialog: CkAlightModalDialog | null = null;

  /**
   * The content manager for form handling
   */
  private _contentManager: ContentManager | null = null;

  /**
   * The actions view displayed inside of the balloon.
   */
  public actionsView: LinkActionsView | null = null;

  /**
   * The contextual balloon plugin instance.
   */
  private _balloon!: ContextualBalloon;

  /**
   * Track if we are currently updating the UI to prevent recursive calls
   */
  private _isUpdatingUI: boolean = false;

  /**
   * Tracks whether we're editing an existing link (true) or creating a new one (false)
   */
  private _isEditing: boolean = false;

  /**
   * @inheritDoc
   */
  public static get requires() {
    return [AlightNewDocumentLinkPluginEditing, ContextualBalloon] as const;
  }

  /**
   * @inheritDoc
   */
  public static get pluginName() {
    return 'AlightNewDocumentLinkPluginUI' as const;
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
    const t = this.editor.t;

    editor.editing.view.addObserver(ClickObserver);
    this._balloon = editor.plugins.get(ContextualBalloon);

    // Create the actions view for the balloon
    this.actionsView = this._createActionsView();

    // Create toolbar buttons.
    this._createToolbarLinkButton();
    this._enableUIActivators();

    // Renders a fake visual selection marker on an expanded selection.
    editor.conversion.for('editingDowncast').markerToHighlight({
      model: VISUAL_SELECTION_MARKER_NAME,
      view: {
        classes: ['ck-fake-alight-new-document-link-selection']
      }
    });

    // Renders a fake visual selection marker on a collapsed selection.
    editor.conversion.for('editingDowncast').markerToElement({
      model: VISUAL_SELECTION_MARKER_NAME,
      view: (data, { writer }) => {
        if (!data.markerRange.isCollapsed) {
          return null;
        }

        const markerElement = writer.createUIElement('span');

        writer.addClass(
          ['ck-fake-alight-new-document-link-selection', 'ck-fake-alight-new-document-link-selection_collapsed'],
          markerElement
        );

        return markerElement;
      }
    });

    // Listen to selection changes to ensure UI state is updated
    this.listenTo(editor.model.document, 'change:data', () => {
      // Force refresh the command on selection changes
      const linkCommand = editor.commands.get('alight-new-document-link');
      if (linkCommand) {
        linkCommand.refresh();
      }
    });

    // Enable balloon-modal interactions
    this._enableBalloonInteractions();

    // Add the information about the keystrokes to the accessibility database
    editor.accessibility.addKeystrokeInfos({
      keystrokes: [
        {
          label: t('Move out of an new document link'),
          keystroke: [
            ['arrowleft', 'arrowleft'],
            ['arrowright', 'arrowright']
          ]
        }
      ]
    });

    // Register the UI component
    editor.ui.componentFactory.add('alightNewDocumentLinkPlugin', locale => {
      return this.createButtonView(locale);
    });
  }

  /**
   * @inheritDoc
   */
  public override destroy(): void {
    super.destroy();

    // Destroy created UI components
    if (this._modalDialog) {
      this._modalDialog.destroy();
      this._modalDialog = null;
    }

    if (this.actionsView) {
      this.actionsView.destroy();
    }

    if (this._contentManager) {
      this._contentManager.destroy();
      this._contentManager = null;
    }
  }

  /**
   * Creates a button view for the plugin
   */
  public createButtonView(locale: any): ButtonView {
    return this._createButton(ButtonView);
  }

  /**
   * Creates a toolbar AlightNewDocumentLinkPlugin button. Clicking this button will show the modal dialog.
   */
  private _createToolbarLinkButton(): void {
    const editor = this.editor;

    editor.ui.componentFactory.add('menuBar:alightNewDocumentLinkPlugin', () => {
      const button = this._createButton(MenuBarMenuListItemButtonView);

      button.set({
        role: 'menuitemcheckbox'
      });

      return button;
    });
  }

  /**
   * Creates a button for link command to use either in toolbar or in menu bar.
   */
  private _createButton<T extends typeof ButtonView>(ButtonClass: T): InstanceType<T> {
    const editor = this.editor;
    const locale = editor.locale;
    const command = editor.commands.get('alight-new-document-link')!;
    const view = new ButtonClass(editor.locale) as InstanceType<T>;
    const t = locale.t;

    view.set({
      class: 'ck-alight-new-document-link-button',
      icon: ToolBarIcon,
      isToggleable: true,
      label: t('New document link'),
      withText: true,
    });

    view.bind('isEnabled').to(command, 'isEnabled');
    view.bind('isOn').to(command, 'value', value => !!value);

    // Listen to selection changes to update button state
    this.listenTo(editor.model.document, 'change:data', () => {
      view.set('isEnabled', this._shouldEnableButton());
    });

    // Show the modal dialog on button click for creating new links
    this.listenTo(view, 'execute', () => this._showUI());

    return view;
  }

  /**
   * Returns the link element under the editing view's selection or `null`
   * if there is none.
   */
  private _getSelectedLinkElement(): ViewAttributeElement | null {
    const view = this.editor.editing.view;
    const selection = view.document.selection;
    const selectedElement = selection.getSelectedElement();

    // The selection is collapsed or some widget is selected (especially inline widget).
    if (selection.isCollapsed || (selectedElement && isWidget(selectedElement))) {
      return findLinkElementAncestor(selection.getFirstPosition()!);
    } else {
      // The range for fully selected link is usually anchored in adjacent text nodes.
      // Trim it to get closer to the actual link element.
      const range = selection.getFirstRange()!.getTrimmed();
      const startLink = findLinkElementAncestor(range.start);
      const endLink = findLinkElementAncestor(range.end);

      if (!startLink || startLink != endLink) {
        return null;
      }

      // Check if the link element is fully selected.
      if (view.createRangeIn(startLink).getTrimmed().isEqual(range)) {
        return startLink;
      } else {
        return null;
      }
    }
  }

  /**
   * Determines whether the button should be enabled based on selection state
   * @returns True if the button should be enabled, false otherwise
   */
  private _shouldEnableButton(): boolean {
    const editor = this.editor;
    const command = editor.commands.get('alight-new-document-link')!;
    const selection = editor.model.document.selection;

    // If the command itself is disabled, button should be disabled too
    if (!command.isEnabled) {
      return false;
    }

    // Enable if text is selected (not collapsed) or cursor is in an existing link
    const hasSelection = !selection.isCollapsed;
    const isInLink = selection.hasAttribute('alightNewDocumentLinkPluginHref');

    return hasSelection || isInLink;
  }

  /**
   * Creates the {@link module:link/ui/linkactionsview~LinkActionsView} instance.
   */
  private _createActionsView(): LinkActionsView {
    const editor = this.editor;
    const actionsView = new LinkActionsView(editor.locale);
    const linkCommand = editor.commands.get('alight-new-document-link') as AlightNewDocumentLinkPluginCommand;
    const unlinkCommand = editor.commands.get('alight-new-document-unlink') as AlightNewDocumentUnlinkCommand;

    // This is the key binding - ensure it's correctly bound to the command's value
    actionsView.bind('href').to(linkCommand, 'value');

    actionsView.editButtonView.bind('isEnabled').to(linkCommand);
    actionsView.unlinkButtonView.bind('isEnabled').to(unlinkCommand);

    // Execute editing in a modal dialog after clicking the "Edit" button
    this.listenTo(actionsView, 'edit', () => {
      this._hideUI();
      this._showUI(true);
    });

    // Execute unlink command after clicking on the "Unlink" button
    this.listenTo(actionsView, 'unlink', () => {
      editor.execute('alight-new-document-unlink');
      this._hideUI();
    });

    // Close the balloon on Esc key press
    actionsView.keystrokes.set('Esc', (data, cancel) => {
      this._hideUI();
      cancel();
    });

    return actionsView;
  }

  /**
   * Public method to show UI - needed for compatibility with linkimageui.ts
   * 
   * @param isEditing Whether we're editing an existing link
   */
  public showUI(isEditing: boolean = false): void {
    this._showUI(isEditing);
  }

  /**
   * Attaches actions that control whether the modal dialog should be displayed.
   */
  private _enableUIActivators(): void {
    const editor = this.editor;
    const viewDocument = editor.editing.view.document;

    // Handle click on view document to show balloon
    this.listenTo<ViewDocumentClickEvent>(viewDocument, 'click', () => {
      const selectedLink = this._getSelectedLinkElement();

      // Check if it's our document link by looking for the data-id attribute
      if (selectedLink && selectedLink.hasAttribute('href') &&
        selectedLink.hasAttribute('data-id') &&
        selectedLink.getAttribute('data-id') === 'new-document_link') {
        // Show balloon with actions (edit/unlink) when clicking on a link
        this._showBalloon();
      }
    });
  }

  /**
   * Enable interactions between the balloon and modal interface.
   */
  private _enableBalloonInteractions(): void {
    // Skip if actionsView is not initialized yet
    if (!this.actionsView) {
      return;
    }

    // Allow clicking outside the balloon to close it
    clickOutsideHandler({
      emitter: this.actionsView,
      activator: () => this._areActionsInPanel,
      contextElements: () => [this._balloon.view.element!],
      callback: () => this._hideUI()
    });
  }

  /**
   * Shows balloon with link actions.
   */
  private _showBalloon(): void {
    if (this.actionsView && this._balloon && !this._balloon.hasView(this.actionsView)) {
      // Make sure the link is still selected before showing balloon
      const selectedLink = this._getSelectedLinkElement();
      if (!selectedLink) {
        return;
      }

      // Verify it's a new document link
      const href = selectedLink.getAttribute('href');
      if (!href) {
        return;
      }

      // First add the view to the balloon (this renders it in the DOM)
      this._balloon.add({
        view: this.actionsView,
        position: this._getBalloonPositionData()
      });

      // Set the href on the actionsView (needed for core functionality)
      this.actionsView.set('href', href as string);

      // AFTER the balloon is in the DOM, update the title text
      setTimeout(() => {
        this._updateBalloonTitle(selectedLink);
      }, 0);

      // Begin responding to UI updates
      this._startUpdatingUI();
    }
  }

  /**
   * Updates the title displayed in the balloon
   */
  private _updateBalloonTitle(selectedLink: ViewAttributeElement): void {
    // Make sure everything exists
    if (!this.actionsView || !this.actionsView.element) {
      return;
    }

    // Get link attributes
    const href = selectedLink.getAttribute('href') as string;

    // Try to get document title attribute if available
    const documentTitle = selectedLink.getAttribute('data-document-title');

    // Find the title element in the balloon
    const titleElement = this.actionsView.element.querySelector('.cka-button-title-text');
    if (!titleElement) {
      return;
    }

    // Format title text based on href pattern
    let displayTitle = '';

    if (documentTitle) {
      // Use the document title if available
      displayTitle = documentTitle as string;
      console.log('Displaying document title in balloon:', displayTitle);
    } else if (href.includes('/')) {
      const parts = href.split('/');
      const folder = parts[0];
      // Fallback to folder-based format if no document title
      displayTitle = `${folder}: Document`;
      console.log('No document title found, using folder format:', displayTitle);
    } else {
      // Use the href as fallback
      displayTitle = href;
      console.log('Using href as fallback title:', displayTitle);
    }

    // Update the DOM element directly
    titleElement.textContent = displayTitle || this.editor.t('This link has no title');
  }

  /**
   * Returns positioning options for the balloon.
   */
  private _getBalloonPositionData() {
    const view = this.editor.editing.view;
    const viewDocument = view.document;
    let target = null;

    // Get the position based on selected link
    const targetLink = this._getSelectedLinkElement();

    if (targetLink) {
      target = view.domConverter.mapViewToDom(targetLink);
    } else {
      target = view.domConverter.viewRangeToDom(viewDocument.selection.getFirstRange()!);
    }

    return { target };
  }

  /**
   * Determines whether the balloon is visible in the editor.
   */
  private get _areActionsInPanel(): boolean {
    return !!this.actionsView && !!this._balloon && this._balloon.hasView(this.actionsView);
  }

  /**
   * Makes the UI respond to editor document changes.
   */
  private _startUpdatingUI(): void {
    if (this._isUpdatingUI) {
      return;
    }

    const editor = this.editor;
    let prevSelectedLink = this._getSelectedLinkElement();

    const update = () => {
      // Prevent recursive updates
      if (this._isUpdatingUI) {
        return;
      }

      this._isUpdatingUI = true;

      try {
        const selectedLink = this._getSelectedLinkElement();

        // Hide the panel if the selection moved out of the link element
        if (prevSelectedLink && !selectedLink) {
          this._hideUI();
        } else if (this._areActionsInPanel) {
          // Update the balloon position as the selection changes
          this._balloon.updatePosition(this._getBalloonPositionData());
        }

        prevSelectedLink = selectedLink;
      } finally {
        this._isUpdatingUI = false;
      }
    };

    this.listenTo(editor.ui, 'update', update);

    // Only listen to balloon changes if we have a balloon
    if (this._balloon) {
      this.listenTo(this._balloon, 'change:visibleView', update);
    }
  }

  /**
   * Shows the modal dialog for link editing.
   */
  private _showUI(isEditing: boolean = false): void {
    const editor = this.editor;
    const t = editor.t;
    const linkCommand = editor.commands.get('alight-new-document-link') as AlightNewDocumentLinkPluginCommand;

    // Store edit mode state
    this._isEditing = isEditing;

    // Create modal if it doesn't exist
    if (!this._modalDialog) {
      this._modalDialog = new CkAlightModalDialog({
        title: t('Create new document link'),
        width: '60rem',
        contentClass: 'cka-new-document-link-content',
        buttons: [
          { label: t('Cancel') },
          { label: t('Continue'), isPrimary: true, closeOnClick: false }
        ]
      });

      // Create content manager
      this._contentManager = new ContentManager();
      this._contentManager.setModalDialog(this._modalDialog);

      // Initialize modal contents
      this._contentManager.setModalContents();

      // Add event listener for when the modal is shown
      this._modalDialog.on('show', () => {
        if (this._contentManager && this._modalDialog) {
          const contentElement = this._modalDialog.getContentElement();
          if (contentElement) {
            this._contentManager.renderContent(contentElement);
          }
        }
      });

      // Handle button clicks via the buttonClick event
      this._modalDialog.on('buttonClick', (data: { button: string; }) => {
        if (data.button === t('Continue')) {
          // Use the imported form submission handler
          if (this._contentManager) {
            handleFormSubmission(this._contentManager, this.editor, this._modalDialog);
          }
        } else if (data.button === t('Cancel')) {
          if (this._modalDialog) {
            this._modalDialog.hide();
          }
        }
      });

      // Add event listener for when the modal is closed
      this._modalDialog.on('close', () => {
        // Reset edit mode when modal is closed
        this._isEditing = false;

        // Reset the form
        if (this._contentManager) {
          this._contentManager.resetForm();
        }
      });
    }

    // Update modal title based on whether we're editing or creating
    if (this._modalDialog) {
      this._modalDialog.setTitle(isEditing ? t('Edit new document link') : t('Create new document link'));

      // Show the modal
      this._modalDialog.show();
    }
  }

  /**
   * Hides the UI
   */
  private _hideUI(): void {
    // Prevent recursive calls
    if (this._isUpdatingUI) {
      return;
    }

    this._isUpdatingUI = true;

    try {
      // Reset edit mode state
      this._isEditing = false;

      // Hide the balloon if it's showing
      if (this.actionsView && this._balloon && this._balloon.hasView(this.actionsView)) {
        this._balloon.remove(this.actionsView);
        this.stopListening(this.editor.ui, 'update');
        if (this._balloon) {
          this.stopListening(this._balloon, 'change:visibleView');
        }
      }

      // Hide the modal if it's showing
      if (this._modalDialog && this._modalDialog.isVisible) {
        this._modalDialog.hide();
      }
    } catch (error) {
      console.error('Error hiding UI:', error);
    } finally {
      this._isUpdatingUI = false;
    }
  }
}
