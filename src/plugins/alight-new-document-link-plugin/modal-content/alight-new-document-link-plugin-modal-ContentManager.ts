// src/plugins/alight-new-document-link-plugin/modal-content/alight-new-document-link-plugin-modal-ContentManager.ts
import { LinkManager } from './interfaces/alight-new-document-link-plugin-modal-LinkManager';
import { FormValidator, ValidationResult } from '../modal-content/validation/form-validation';
import { FormSubmissionHandler } from '../modal-content/submission/form-submission';
import { CkAlightSelectMenu } from '../../ui-components/alight-select-menu-component/alight-select-menu-component';
import { CkAlightCheckbox } from '../../ui-components/alight-checkbox-component/alight-checkbox-component';
import { CkAlightChipsMenu } from '../../ui-components/alight-chips-menu-component/alight-chips-menu-component';
import '../../ui-components/alight-checkbox-component/alight-checkbox-component';
import { mockCategories } from './mock/categories';

export class ContentManager implements LinkManager {
  private container: HTMLElement | null = null;
  private languageSelect: CkAlightSelectMenu<{ value: string; label: string }> | null = null;
  private modalDialog: any = null;
  private searchTagsChips: CkAlightChipsMenu | null = null;
  private formValidator: FormValidator;
  private formSubmissionHandler: FormSubmissionHandler;

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
  }

  private createCardHTML(content: string): string {
    return `<article class="cka-card">${content}</article>`;
  }

  private createLanguageSelectHTML(): string {
    return `
      <h3 class="sub-title">Language</h3>
      ${this.createCardHTML(`
        <label for="language-select-container" class="cka-input-label">Language</label>
        <div id="language-select-container" class="cka-width-half"></div>
        <div class="error-message">Choose a language to continue.</div>
      `)}
    `;
  }

  private createFileInputHTML(): string {
    const acceptedFileTypes = '.doc,.docx,.xls,.xlsx,.xlsm,.ppt,.pptx,.pdf';
    const supportedFileTypes = ['doc', 'docx', 'xls', 'xlsx', 'xlsm', 'ppt', 'pptx', 'pdf'];

    return `
      <h3 class="sub-title">Document & Title</h3>
      ${this.createCardHTML(`
        <label for="file-input" class="cka-input-label">Upload Document (5MB Limit)</label>
        <div class="cka-file-input-wrapper cka-width-half" data-text="No file chosen">
          <input 
            accept="${acceptedFileTypes}"
            class="cka-input-file"
            id="file-input"
            placeholder="No file chosen" 
            type="file" 
            required
          />
        </div>
        <div class="cka-control-footer">
          <em>
            <strong>Supported file types:</strong> ${supportedFileTypes.join(', ')}
          </em>
        </div>
        <div class="error-message file-error">Choose a file.</div>
        <div class="error-message file-size-error">Choose a file less than 5MB.</div>

        <label for="document-title" class="cka-input-label mt-4">Document Title</label>
        <input
          class="cka-input-text cka-width-half"
          id="document-title"
          maxlength="250"
          name="documentTitle"
          type="text"
          value="${this.formData.documentTitle}"
          placeholder="Enter document title..."
          required
        />
        <span class="cka-control-footer block character-count">250 characters remaining</span>
        <div class="cka-control-footer">
          <strong>Note:</strong> Special characters such as (\\, ], :, >, /, <, [, |, ?, ", *, comma) are not allowed.
        </div>
        <div class="error-message title-error">Enter title to continue.</div>
      `)}
    `;
  }

  private createSearchCriteriaHTML(): string {
    return `
      <h3 class="sub-title">Search Criteria</h3>
      ${this.createCardHTML(`
        <label for="search-tags-chips" class="cka-input-label">Search Tags (optional)</label>
        <div id="search-tags-chips" class="cka-width-half"></div>
        <span class="cka-control-footer cka-width-half">
          Add search tags to improve the relevancy of search results. 
          Use commas to separate multiple tags.
          Type your tag and press Enter to add it.
        </span>

        <label for="description" class="cka-input-label mt-4">Description</label>
        <textarea 
          class="cka-textarea cka-width-half"
          id="description"
          cols="30"
          required
          rows="5" 
          placeholder="Enter description..."
        >${this.formData.description}</textarea>
        <div class="error-message description-error">Enter a description to continue.</div>

        <label for="categories" class="cka-input-label mt-4">Categories (optional)</label>
        <a href="#" class="cka-categories-toggle">Choose Categories</a>
        <div class="cka-categories-wrapper hidden">
          <ul class="cka-choose-categories-list">
            ${mockCategories.map(category => `
              <li>
                <cka-checkbox 
                  id="category-${category.id}"
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
      `)}
    `;
  }

  private createCheckboxGroupHTML(): string {
    return `
      <h3 class="sub-title">Content Library</h3>
      ${this.createCardHTML(`
        <cka-checkbox id="contentLibraryAccess">
          Access from Content Library (optional)
        </cka-checkbox>
      `)}

      <h3 class="sub-title">Alight Worklife Link</h3>
      ${this.createCardHTML(`
        <cka-checkbox id="worklifeLink">
          Link to Document From a Alight Worklife Link (optional)
        </cka-checkbox>
      `)}

      <h3 class="sub-title">Search Results</h3>
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
          this.validateAndUpdateField('language', selectedValue);
        }
      }
    });
    this.languageSelect.mount(container);
  }

  private validateAndUpdateField(fieldName: string, value: any): void {
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

  private hasUserInteracted = false;

  public validateForm(): ValidationResult {
    const validation = this.formValidator.validateForm(this.formData);

    // Only show validation errors if user has interacted with the form
    if (this.hasUserInteracted && !validation.isValid && validation.errors && this.container) {
      // Clear all existing error messages first
      this.container.querySelectorAll('.error-message').forEach(msg => {
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

  public async submitForm(): Promise<any> {
    const validation = this.validateForm();

    if (!validation.isValid) {
      // Don't throw error, just return early since errors are displayed in UI
      return;
    }

    const result = await this.formSubmissionHandler.submitForm(this.formData);

    if (!result.success) {
      throw new Error(result.error || 'Failed to submit form');
    }

    return result.data;
  }

  private updateSubmitButtonState(): void {
    if (!this.modalDialog) return;

    const validation = this.validateForm();
    const submitButton = this.modalDialog.element?.querySelector('.cka-button-primary');

    if (submitButton) {
      submitButton.disabled = !validation.isValid;
      submitButton.classList.toggle('cka-button-disabled', !validation.isValid);
    }
  }

  private attachEventListeners(): void {
    if (!this.container) return;

    // Add this handler for first interaction
    const form = this.container.querySelector('form');
    if (form) {
      form.addEventListener('change', () => {
        this.hasUserInteracted = true;
      });
      form.addEventListener('input', () => {
        this.hasUserInteracted = true;
      });
    }

    // Initialize search tags chips
    const searchTagsContainer = this.container.querySelector('#search-tags-chips');
    if (!searchTagsContainer) {
      console.warn('Search tags container not found');
      return;
    }

    try {
      // Create a unique ID for the container if it doesn't have one
      if (!searchTagsContainer.id) {
        searchTagsContainer.id = 'search-tags-' + Date.now();
      }

      this.searchTagsChips = new CkAlightChipsMenu(searchTagsContainer.id);

      // Set initial chips if there are any
      if (this.formData.searchTags.length > 0) {
        this.searchTagsChips.setChips(this.formData.searchTags);
      }

      // Add event listeners for chips
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

    // File input
    const fileInput = this.container.querySelector('#file-input');
    if (fileInput instanceof HTMLInputElement) {
      fileInput.addEventListener('change', (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        this.formData.file = file || null;
        this.validateAndUpdateField('file', file);
      });
    }

    // Title input
    const titleInput = this.container.querySelector('#document-title');
    if (titleInput instanceof HTMLInputElement) {
      titleInput.addEventListener('input', (e) => {
        this.formData.documentTitle = (e.target as HTMLInputElement).value;
        this.validateAndUpdateField('documentTitle', this.formData.documentTitle);
        this.updateCharacterCount(titleInput);
      });
    }

    // Description
    const description = this.container.querySelector('#description');
    if (description instanceof HTMLTextAreaElement) {
      description.addEventListener('input', (e) => {
        this.formData.description = (e.target as HTMLTextAreaElement).value;
        this.validateAndUpdateField('description', this.formData.description);
      });
    }

    // Checkboxes
    this.initializeCheckbox('contentLibraryAccess', 'contentLibraryAccess');
    this.initializeCheckbox('worklifeLink', 'worklifeLink');
    this.initializeCheckbox('showInSearch', 'showInSearch');

    // Categories
    mockCategories.forEach(category => {
      this.initializeCheckbox(`category-${category.id}`, 'categories', category.id);
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

  private initializeCheckbox(id: string, dataKey: string, value?: string): void {
    const checkbox = this.container?.querySelector(`#${id}`) as CkAlightCheckbox;
    if (checkbox) {
      checkbox.addEventListener('change', (e: Event) => {
        const customEvent = e as CustomEvent;
        if (value) {
          // Handle array-based checkboxes (like categories)
          if (customEvent.detail) {
            const formDataArray = this.formData[dataKey as keyof typeof this.formData] as string[] | null;
            if (formDataArray && !formDataArray.includes(value)) {
              formDataArray.push(value);
            }
          } else {
            const formDataArray = this.formData[dataKey as keyof typeof this.formData] as string[] | null;
            if (formDataArray) {
              this.formData[dataKey as keyof typeof this.formData] = formDataArray.filter((v: string) => v !== value) as never;
            }
          }
        } else {
          // Handle boolean checkboxes
          this.formData[dataKey as keyof typeof this.formData] = customEvent.detail as never;
        }
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
    ${this.createLanguageSelectHTML()}
    ${this.createFileInputHTML()}
    ${this.createSearchCriteriaHTML()}
    ${this.createCheckboxGroupHTML()}
    <p class="mt-4"><b>Note:</b> Updates will not be reflected in Alight Worklife search results in QA/QC until tomorrow.</p>
  `;

    requestAnimationFrame(() => {
      this.initializeLanguageSelect();
      this.attachEventListeners();

      // Only update submit button state without showing validation errors
      const submitButton = this.modalDialog?.element?.querySelector('.cka-button-primary');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add('cka-button-disabled');
      }
    });
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

        // Reset checkboxes - use setAttribute instead of setValue
        const checkboxes = this.container.querySelectorAll('cka-checkbox') as NodeListOf<HTMLElement>;
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
        const errorMessages = this.container.querySelectorAll('.error-message');
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
    this.updateSubmitButtonState();
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