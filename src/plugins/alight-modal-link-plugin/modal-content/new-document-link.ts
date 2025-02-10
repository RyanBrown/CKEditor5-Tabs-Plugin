// src/plugins/alight-link-plugin/modal-content/new-document-link.ts

// This file defines the NewDocumentLinkManager class which renders a document upload form
// using innerHTML. It now leverages the custom card (<cka-card>), checkbox (<cka-checkbox>),
// and select (<cka-light-select-menu>) components for rendering the UI.

// Note: Since innerHTML is used, any event listeners attached directly to rendered HTML elements
// will not persist when the HTML is re-parsed. We reattach event listeners in attachEventListeners().

import { ILinkManager } from './ILinkManager';
import { CKALightSelectMenu } from '../../ui-components/alight-select-menu-component/alight-select-menu-component';
import '../../ui-components/alight-checkbox-component/alight-checkbox-component';

export class NewDocumentLinkManager implements ILinkManager {
  // Reference to the container element where the form is rendered.
  private container: HTMLElement | null = null;
  private languageSelect: CKALightSelectMenu<{ value: string; label: string }> | null = null;
  private selectedLink: { destination: string; title: string } | null = null;

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
  private createFormGroupHTML(title: string, content: string, errorMessage?: string): string {
    let groupHTML = '<div class="form-group">';
    if (title) {
      groupHTML += `<h3>${title}</h3>`;
    }
    // Wrap content in a cka-card component
    groupHTML += `<div class="cka-card">
      <div class="form-group-content">
        ${content}
        ${errorMessage ? `<div class="error-message">${errorMessage}</div>` : ''}
      </div>
    </div></div>`;
    return groupHTML;
  }

  private createLanguageSelectContainer(): string {
    return this.createFormGroupHTML(
      'Language',
      '<div id="language-select-container"></div>',
      'Choose a language to continue.'
    );
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
    const fileInputHTML = `
      <input id="file-input" class="cka-input-text" type="file" 
        accept=".doc,.docx,.xls,.xlsx,.xlsm,.ppt,.pptx,.pdf" />
      <p><em class="control-footer">
        <strong>Supported file types:</strong> .doc, .docx, .xls, .xlsx, .xlsm, .ppt, .pptx, .pdf
      </em></p>`;
    return this.createFormGroupHTML(
      'Document & Title',
      fileInputHTML,
      'Choose a file.'
    );
  }

  private createTitleInputHTML(): string {
    const titleInputHTML = `
      <input id="title-input" class="cka-input-text" type="text" 
        name="documentTitle" maxlength="250" value="${this.formData.documentTitle}" />
      <span id="char-count" class="control-footer">${250 - this.formData.documentTitle.length} characters remaining</span>
      <div class="control-footer">
        <strong>Note:</strong> Special characters such as (\, ], :, >, /, <, [, |, ?, ", *, comma) are not allowed.
      </div>`;
    return this.createFormGroupHTML(
      '',
      titleInputHTML,
      'Enter title to continue.'
    );
  }

  private createSearchCriteriaHTML(): string {
    const tagsCard = this.createFormGroupHTML(
      'Search Criteria',
      `<input id="tags-input" class="cka-input-text" type="text" 
        placeholder="Use , for separator" value="${this.formData.searchTags.join(', ')}" />
      <span class="control-footer">Add search tags to improve the relevancy of search results. 
        Type your one-word search tag and then press Enter.</span>
      <div class="control-footer"><strong>Note:</strong> Special characters such as (&, #, @, +, /, %, >, <, [, ], \\) are not allowed.</div>`
    );

    const descriptionCard = this.createFormGroupHTML(
      '',
      `<textarea id="description" class="cka-input-text" rows="5" cols="30">${this.formData.description}</textarea>`,
      'Enter a description to continue.'
    );

    const categoriesCard = this.createFormGroupHTML(
      '',
      `<a id="choose-categories" class="linkStyle" href="#">Choose Categories</a>
      <div class="control-footer"><strong>Note:</strong> Categories apply to both search and Content Library.</div>`
    );

    return `<div>${tagsCard}${descriptionCard}${categoriesCard}</div>`;
  }

  private createCheckboxGroupHTML(title: string, label: string, checked: boolean, footer?: string, errorMessage?: string): string {
    const checkboxId = `${label.replace(/\s+/g, '-').toLowerCase()}-checkbox`;
    const checkboxHTML = `
      <cka-checkbox id="${checkboxId}" initialvalue="${checked}">${label}</cka-checkbox>
      ${footer ? `<div class="control-footer">${footer}</div>` : ''}`;

    return this.createFormGroupHTML(title, checkboxHTML, errorMessage);
  }

  private createCardElementHTML(page: number): string {
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
      'If this document matches a user\'s search criteria, checking this box makes it eligible to appear in the search results.',
      'Choose show in search results (optional) to continue. The document needs to appear as a search result, as it is accessible from the Content Library.'
    )}
      <p><b>Note:</b> Updates will not be reflected in Alight Worklife search results in QA/QC until tomorrow.</p>
    `;

    return `<form novalidate>${formContent}</form>`;
  }

  // Rest of the class implementation remains the same...
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
  }

  resetSearch(): void {
    this.selectedLink = null;
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

  public getSelectedLink(): { destination: string; title: string } | null {
    return this.selectedLink;
  }

  private handleDocumentCreation(destination: string, title: string): void {
    this.selectedLink = { destination, title };
  }
}
