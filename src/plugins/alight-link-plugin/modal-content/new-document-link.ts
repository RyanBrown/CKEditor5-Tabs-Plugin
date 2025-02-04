// src/plugins/alight-link-plugin/modal-content/new-document-link.ts
// This file defines the NewDocumentLinkManager class which renders a document upload form 
// using innerHTML. Note that using innerHTML means any event listeners attached via addEventListener 
// will be lost when the HTML is re-parsed. You may need to reattach event listeners if you rely on them.

import { ILinkManager } from './ILinkManager';
import { CKAlightCard } from '../../ui-components/alight-card-component/alight-card-component';

export class NewDocumentLinkManager implements ILinkManager {
  // Reference to the container element where the form is rendered.
  private container: HTMLElement | null = null;

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

  /**
   * Creates a form group with an optional title and wraps the provided content inside a card.
   * @param title - The title of the form group.
   * @param content - The HTML string for the group content.
   * @returns A string representing the form group.
   */
  private createFormGroupHTML(title: string, content: string): string {
    let groupHTML = `<div>`;
    if (title) {
      groupHTML += `<h3>${title}</h3>`;
    }
    groupHTML += `<div class="card">${content}</div></div>`;
    return groupHTML;
  }

  /**
   * Creates a language selection dropdown.
   * @returns The HTML string for the language select form group.
   */
  private createLanguageSelectHTML(): string {
    const options = [
      { value: 'en', label: 'English (default)' },
      { value: 'fr', label: 'French' },
      { value: 'es', label: 'Spanish' }
    ];
    let optionsHTML = '';
    options.forEach(option => {
      optionsHTML += `<option value="${option.value}">${option.label}</option>`;
    });
    const selectHTML = `<select id="language-select">${optionsHTML}</select>`;
    return this.createFormGroupHTML('Language', selectHTML);
  }

  /**
   * Creates the file input for document selection.
   * @returns The HTML string for the file input form group.
   */
  private createFileInputHTML(): string {
    const fileInputHTML = `<input id="file-input" type="file" accept=".doc,.docx,.xls,.xlsx,.xlsm,.ppt,.pptx,.pdf" />`;
    const supportedTypesHTML = `<p><em class="control-footer"><strong>Supported file types:</strong> .doc, .docx, .xls, .xlsx, .xlsm, .ppt, .pptx, .pdf</em></p>`;
    return this.createFormGroupHTML('Document & Title', fileInputHTML + supportedTypesHTML);
  }

  /**
   * Creates the title input for the document.
   * @returns The HTML string for the title input form group.
   */
  private createTitleInputHTML(): string {
    const titleInputHTML = `<input id="title-input" type="text" name="documentTitle" maxlength="250" />`;
    const charCountHTML = `<span id="char-count" class="control-footer">250 characters remaining</span>`;
    const noteHTML = `<div class="control-footer"><strong>Note:</strong> Special characters such as (\\, ], :, >, /, <, [, |, ?, ", *, comma) are not allowed.</div>`;
    return this.createFormGroupHTML('', titleInputHTML + charCountHTML + noteHTML);
  }

  /**
   * Creates the search criteria inputs including tags, description, and a link to choose categories.
   * @returns The HTML string for the search criteria.
   */
  private createSearchCriteriaHTML(): string {
    const tagsInputHTML = `<input id="tags-input" type="text" placeholder="Use , for separator" />`;
    const descriptionHTML = `<textarea id="description" rows="5" cols="30"></textarea>`;
    const categoriesHTML = `<a id="choose-categories" class="linkStyle" href="#">Choose Categories</a>`;
    return `<div>
      ${this.createFormGroupHTML('Search Criteria', tagsInputHTML)}
      ${this.createFormGroupHTML('', descriptionHTML)}
      ${this.createFormGroupHTML('', categoriesHTML)}
    </div>`;
  }

  /**
   * Creates a checkbox group with an optional footer.
   * @param title - The title for the group.
   * @param label - The label text for the checkbox.
   * @param checked - Whether the checkbox is initially checked.
   * @param footer - Optional footer text.
   * @returns The HTML string for the checkbox group.
   */
  private createCheckboxGroupHTML(title: string, label: string, checked: boolean, footer?: string): string {
    const checkboxHTML = `<input id="${label.replace(/\s+/g, '-').toLowerCase()}-checkbox" type="checkbox" ${checked ? 'checked' : ''} />`;
    const labelHTML = `<label for="${label.replace(/\s+/g, '-').toLowerCase()}-checkbox">${label}</label>`;
    let footerHTML = '';
    if (footer) {
      footerHTML = `<div class="control-footer">${footer}</div>`;
    }
    return this.createFormGroupHTML(title, checkboxHTML + labelHTML + footerHTML);
  }

  /**
   * Creates the button group for the form.
   * @returns The HTML string for the button group.
   */
  private createButtonsHTML(): string {
    const continueBtnHTML = `<button id="continue-btn" type="button" class="button">Continue</button>`;
    const cancelBtnHTML = `<button id="cancel-btn" type="button" class="button-outlined">Cancel</button>`;
    return `<div class="card">${continueBtnHTML + cancelBtnHTML}</div>`;
  }

  /**
   * Creates the CKAlightCard element and appends the form as an HTML string.
   * @param page - The page number (not used in this example).
   * @returns The HTML string representing the card element with the form.
   */
  private createCardElementHTML(page: number): string {
    // Build the inner form HTML from the various pieces.
    const formContent = `
      ${this.createLanguageSelectHTML()}
      ${this.createFileInputHTML()}
      ${this.createTitleInputHTML()}
      ${this.createSearchCriteriaHTML()}
      ${this.createCheckboxGroupHTML('Content Library', 'Access from Content Library (optional)', false)}
      ${this.createCheckboxGroupHTML('Alight Worklife Link', 'Link to Document From a Alight Worklife Link (optional)', false)}
      ${this.createCheckboxGroupHTML(
      'Search Results',
      'Show in Search Results (optional)',
      true,
      'If this document matches a user\'s search criteria, checking this box makes it eligible to appear in the search results.'
    )}
      ${this.createButtonsHTML()}
    `;

    // Assume CKAlightCard is a custom element that uses a slot or a dedicated content container.
    // Here we are wrapping the form content in a card container.
    return `<ck-a-light-card header="New Document">
      <div class="cka-card-content">
        <form novalidate>
          ${formContent}
        </form>
      </div>
    </ck-a-light-card>`;
  }

  /**
   * Returns the complete HTML string representation of the card element.
   * @param page - The page number.
   * @returns The HTML string for the card.
   */
  getLinkContent(page: number): string {
    return this.createCardElementHTML(page);
  }

  /**
   * Renders the content into the provided container using innerHTML.
   * Note: Using innerHTML means that event listeners added in the HTML string will not be preserved.
   * You may need to use event delegation or reattach events after rendering.
   * @param container - The container where the form will be rendered.
   */
  renderContent(container: HTMLElement): void {
    this.container = container;
    container.innerHTML = this.getLinkContent(1);
    // Optionally, call a method to reattach event listeners if needed.
    this.attachEventListeners();
  }

  /**
   * Reattaches event listeners for elements that were created via innerHTML.
   * This is necessary because innerHTML does not preserve event listeners.
   */
  private attachEventListeners(): void {
    // Language select change event
    const languageSelect = document.getElementById('language-select') as HTMLSelectElement | null;
    if (languageSelect) {
      languageSelect.value = this.formData.language;
      languageSelect.addEventListener('change', (e) => {
        this.formData.language = (e.target as HTMLSelectElement).value;
      });
    }

    // File input change event
    const fileInput = document.getElementById('file-input') as HTMLInputElement | null;
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        this.formData.file = (e.target as HTMLInputElement).files?.[0] || null;
      });
    }

    // Title input events
    const titleInput = document.getElementById('title-input') as HTMLInputElement | null;
    const charCount = document.getElementById('char-count') as HTMLElement | null;
    if (titleInput && charCount) {
      titleInput.addEventListener('input', () => {
        const remaining = 250 - titleInput.value.length;
        charCount.textContent = `${remaining} characters remaining`;
        this.formData.documentTitle = titleInput.value;
      });
    }

    // Tags input event
    const tagsInput = document.getElementById('tags-input') as HTMLInputElement | null;
    if (tagsInput) {
      tagsInput.addEventListener('input', () => {
        this.formData.searchTags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      });
    }

    // Description textarea event
    const description = document.getElementById('description') as HTMLTextAreaElement | null;
    if (description) {
      description.addEventListener('input', () => {
        this.formData.description = description.value;
      });
    }

    // Checkbox events
    const contentLibraryCheckbox = document.getElementById('access-from-content-library-(optional)-checkbox') as HTMLInputElement | null;
    if (contentLibraryCheckbox) {
      contentLibraryCheckbox.addEventListener('change', () => {
        this.formData.contentLibraryAccess = contentLibraryCheckbox.checked;
      });
    }
    const worklifeCheckbox = document.getElementById('link-to-document-from-a-alight-worklife-link-(optional)-checkbox') as HTMLInputElement | null;
    if (worklifeCheckbox) {
      worklifeCheckbox.addEventListener('change', () => {
        this.formData.worklifeLink = worklifeCheckbox.checked;
      });
    }
    const searchResultsCheckbox = document.getElementById('show-in-search-results-(optional)-checkbox') as HTMLInputElement | null;
    if (searchResultsCheckbox) {
      searchResultsCheckbox.addEventListener('change', () => {
        this.formData.showInSearch = searchResultsCheckbox.checked;
      });
    }

    // Button events
    const continueBtn = document.getElementById('continue-btn') as HTMLButtonElement | null;
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        this.submitForm();
      });
    }
    const cancelBtn = document.getElementById('cancel-btn') as HTMLButtonElement | null;
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.resetSearch();
      });
    }
  }

  /**
   * Resets the form to its initial state and re-renders the content.
   */
  resetSearch(): void {
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

  /**
   * Validates the form data.
   * @returns An object indicating whether the form is valid and an optional message.
   */
  validateForm(): { isValid: boolean; message?: string } {
    if (!this.formData.file) {
      return { isValid: false, message: 'Please choose a file' };
    }
    if (!this.formData.documentTitle.trim()) {
      return { isValid: false, message: 'Please enter a document title' };
    }
    return { isValid: true };
  }

  /**
   * Returns a copy of the form data.
   */
  getFormData() {
    return { ...this.formData };
  }

  /**
   * Submits the form after validation.
   * @returns True if submission is successful, false otherwise.
   */
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
