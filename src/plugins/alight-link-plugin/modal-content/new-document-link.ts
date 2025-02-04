// src/plugins/alight-link-plugin/modal-content/new-document-link.ts

// This file defines the NewDocumentLinkManager class which renders a document upload form
// using innerHTML. It now leverages the custom card (<cka-card>), checkbox (<cka-checkbox>),
// and select (<cka-light-select-menu>) components for rendering the UI.

// Note: Since innerHTML is used, any event listeners attached directly to rendered HTML elements
// will not persist when the HTML is re-parsed. We reattach event listeners in attachEventListeners().

import { ILinkManager } from './ILinkManager';
import { CKAlightCard } from '../../ui-components/alight-card-component/alight-card-component';
import { CKALightSelectMenu } from '../../ui-components/alight-select-menu-component/alight-select-menu-component';
import '../../ui-components/alight-checkbox-component/alight-checkbox-component';

export class NewDocumentLinkManager implements ILinkManager {
  // Reference to the container element where the form is rendered.
  private container: HTMLElement | null = null;
  private languageSelect: CKALightSelectMenu<{ value: string; label: string }> | null = null;

  // Holds the state of the form data.
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

  // Creates a form group with an optional title and wraps the provided content inside a container.
  // @param title - The title of the form group.
  // @param content - The HTML string for the group content.
  // @returns A string representing the form group.
  private createFormGroupHTML(title: string, content: string): string {
    let groupHTML = `<div class="form-group">`;
    if (title) {
      groupHTML += `<h3>${title}</h3>`;
    }
    // Wrap content in a div for styling purposes.
    groupHTML += `<div class="form-group-content">${content}</div></div>`;
    return groupHTML;
  }

  private createLanguageSelectContainer(): string {
    // Create a container for the select menu to be mounted later
    return this.createFormGroupHTML('Language', '<div id="language-select-container"></div>');
  }

  private initializeLanguageSelect() {
    const container = document.getElementById('language-select-container');
    if (!container) return;

    this.languageSelect = new CKALightSelectMenu({
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
        if (selectedValue) {
          if (Array.isArray(selectedValue)) {
            // If it's an array, take the first item's value property
            this.formData.language = selectedValue[0]?.value || 'en';
          } else {
            // If it's a single object, take its value property
            this.formData.language = selectedValue.value;
          }
        } else {
          this.formData.language = 'en';
        }
      }
    });
    this.languageSelect.mount(container);
  }

  private createFileInputHTML(): string {
    const fileInputHTML = `<input id="file-input" class="cka-input-text" type="file" accept=".doc,.docx,.xls,.xlsx,.xlsm,.ppt,.pptx,.pdf" />`;
    const supportedTypesHTML = `<p><em class="control-footer"><strong>Supported file types:</strong> .doc, .docx, .xls, .xlsx, .xlsm, .ppt, .pptx, .pdf</em></p>`;
    return this.createFormGroupHTML('Document & Title', fileInputHTML + supportedTypesHTML);
  }

  // Creates the title input for the document.
  // @returns The HTML string for the title input form group.
  private createTitleInputHTML(): string {
    const titleInputHTML = `<input id="title-input" class="cka-input-text" type="text" name="documentTitle" maxlength="250" value="${this.formData.documentTitle}" />`;
    const charCountHTML = `<span id="char-count" class="control-footer">${250 - this.formData.documentTitle.length} characters remaining</span>`;
    const noteHTML = `<div class="control-footer"><strong>Note:</strong> Special characters such as (\\, ], :, >, /, <, [, |, ?, ", //, comma) are not allowed.</div>`;
    return this.createFormGroupHTML('', titleInputHTML + charCountHTML + noteHTML);
  }

  // Creates the search criteria inputs including tags, description, and a link to choose categories.
  // @returns The HTML string for the search criteria.
  private createSearchCriteriaHTML(): string {
    const tagsInputHTML = `<input id="tags-input" class="cka-input-text" type="text" placeholder="Use , for separator" value="${this.formData.searchTags.join(', ')}" />`;
    const descriptionHTML = `<textarea id="description" class="cka-input-text" rows="5" cols="30">${this.formData.description}</textarea>`;
    const categoriesHTML = `<a id="choose-categories" class="linkStyle" href="#">Choose Categories</a>`;
    return `<div>
      ${this.createFormGroupHTML('Search Criteria', tagsInputHTML)}
      ${this.createFormGroupHTML('', descriptionHTML)}
      ${this.createFormGroupHTML('', categoriesHTML)}
    </div>`;
  }

  // Creates a checkbox group using the custom <cka-checkbox> component.
  // @param title - The title for the group.
  // @param label - The label text for the checkbox.
  // @param checked - Whether the checkbox is initially checked.
  // @param footer - Optional footer text.
  // @returns The HTML string for the checkbox group.
  private createCheckboxGroupHTML(title: string, label: string, checked: boolean, footer?: string): string {
    // Generate an ID from the label for event attachment.
    const checkboxId = `${label.replace(/\s+/g, '-').toLowerCase()}-checkbox`;
    // Create the checkbox using the custom component. The initial value is set via the "initialvalue" attribute.
    const checkboxHTML = `<cka-checkbox id="${checkboxId}" initialvalue="${checked}">${label}</cka-checkbox>`;
    let footerHTML = '';
    if (footer) {
      footerHTML = `<div class="control-footer">${footer}</div>`;
    }
    // Wrap everything in a form group container.
    return this.createFormGroupHTML(title, checkboxHTML + footerHTML);
  }

  // Creates the button group for the form.
  // @returns The HTML string for the button group.
  private createButtonsHTML(): string {
    const cancelBtnHTML = `<button id="cancel-btn" type="button" class="cka-button cka-button-rounded cka-button-outlined">Cancel</button>`;
    const continueBtnHTML = `<button id="continue-btn" type="button" class="cka-button cka-button-rounded">Create Document</button>`;
    return `<div class="button-group">${continueBtnHTML + cancelBtnHTML}</div>`;
  }

  // Creates the <cka-card> element and appends the form as an HTML string.
  // @param page - The page number (not used in this example).
  // @returns The HTML string representing the card element with the form.
  private createCardElementHTML(page: number): string {
    // Build the inner form HTML from the various pieces.
    const formContent = `
      ${this.createLanguageSelectContainer()}
      ${this.createFileInputHTML()}
      ${this.createTitleInputHTML()}
      ${this.createSearchCriteriaHTML()}
      ${this.createCheckboxGroupHTML('Content Library', 'Access from Content Library (optional)', this.formData.contentLibraryAccess)}
      ${this.createCheckboxGroupHTML('Alight Worklife Link', 'Link to Document From a Alight Worklife Link (optional)', this.formData.worklifeLink)}
      ${this.createCheckboxGroupHTML(
      'Search Results',
      'Show in Search Results (optional)',
      this.formData.showInSearch,
      'If this document matches a user\'s search criteria, checking this box makes it eligible to appear in the search results.'
    )}
      ${this.createButtonsHTML()}
    `;

    // Use the custom card component.
    return `<cka-card header="New Document">
      <div class="cka-card-content">
        <form novalidate>
          ${formContent}
        </form>
      </div>
    </cka-card>`;
  }

  // Returns the complete HTML string representation of the card element.
  // @param page - The page number.
  // @returns The HTML string for the card.
  getLinkContent(page: number): string {
    return this.createCardElementHTML(page);
  }

  // Renders the content into the provided container using innerHTML.
  // Note: Using innerHTML means that event listeners added in the HTML string will not be preserved.
  // You may need to use event delegation or reattach events after rendering.
  // @param container - The container where the form will be rendered.
  renderContent(container: HTMLElement): void {
    this.container = container;
    container.innerHTML = this.getLinkContent(1);

    // Initialize select menu after the container is rendered
    this.initializeLanguageSelect();

    // Attach other event listeners
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    // File input change event
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        this.formData.file = (e.target as HTMLInputElement).files?.[0] || null;
      });
    }

    // Title input events
    const titleInput = document.getElementById('title-input') as HTMLInputElement;
    const charCount = document.getElementById('char-count');
    if (titleInput && charCount) {
      titleInput.addEventListener('input', () => {
        const remaining = 250 - titleInput.value.length;
        charCount.textContent = `${remaining} characters remaining`;
        this.formData.documentTitle = titleInput.value;
      });
    }

    // Tags input event
    const tagsInput = document.getElementById('tags-input') as HTMLInputElement;
    if (tagsInput) {
      tagsInput.addEventListener('input', () => {
        this.formData.searchTags = tagsInput.value
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag !== '');
      });
    }

    // Description textarea event
    const description = document.getElementById('description') as HTMLTextAreaElement;
    if (description) {
      description.addEventListener('input', () => {
        this.formData.description = description.value;
      });
    }

    // Checkbox events
    const contentLibraryCheckbox = document.getElementById('access-from-content-library-(optional)-checkbox');
    if (contentLibraryCheckbox) {
      contentLibraryCheckbox.addEventListener('change', (e: Event) => {
        const customEvent = e as CustomEvent;
        this.formData.contentLibraryAccess = customEvent.detail;
      });
    }
    const worklifeCheckbox = document.getElementById('link-to-document-from-a-alight-worklife-link-(optional)-checkbox');
    if (worklifeCheckbox) {
      worklifeCheckbox.addEventListener('change', (e: Event) => {
        const customEvent = e as CustomEvent;
        this.formData.worklifeLink = customEvent.detail;
      });
    }
    const searchResultsCheckbox = document.getElementById('show-in-search-results-(optional)-checkbox');
    if (searchResultsCheckbox) {
      searchResultsCheckbox.addEventListener('change', (e: Event) => {
        const customEvent = e as CustomEvent;
        this.formData.showInSearch = customEvent.detail;
      });
    }

    // Button events
    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        this.submitForm();
      });
    }
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.resetSearch();
      });
    }
  }

  resetSearch(): void {
    // Clean up existing select menu
    if (this.languageSelect) {
      this.languageSelect.destroy();
      this.languageSelect = null;
    }

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

    if (this.container) {
      this.renderContent(this.container);
    }
  }

  // Validates the form data.
  // @returns An object indicating whether the form is valid and an optional message.
  validateForm(): { isValid: boolean; message?: string } {
    if (!this.formData.file) {
      return { isValid: false, message: 'Please choose a file' };
    }
    if (!this.formData.documentTitle.trim()) {
      return { isValid: false, message: 'Please enter a document title' };
    }
    return { isValid: true };
  }

  // Returns a copy of the form data.
  getFormData() {
    return { ...this.formData };
  }

  // Submits the form after validation.
  // @returns True if submission is successful, false otherwise.
  submitForm(): boolean {
    const validation = this.validateForm();
    if (!validation.isValid) {
      if (validation.message) {
        alert(validation.message);
      }
      return false;
    }

    console.log('Form submitted with data:', this.formData);
    return true;
  }
}
