import { LinkManager } from './alight-new-document-link-plugin-modal-LinkManager';
import { CkAlightSelectMenu } from '../../ui-components/alight-select-menu-component/alight-select-menu-component';
import { CkAlightCheckbox } from '../../ui-components/alight-checkbox-component/alight-checkbox-component';
import '../../ui-components/alight-checkbox-component/alight-checkbox-component';
import '../../ui-components/alight-radio-component/alight-radio-component';

export class ContentManager implements LinkManager {
  private container: HTMLElement | null = null;
  private selectedLink: { destination: string; title: string } | null = null;
  private languageSelect: CkAlightSelectMenu<{ value: string; label: string }> | null = null;
  private modalDialog: any = null;

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

  private createCardHTML(content: string): string {
    return `<article class="cka-card">${content}</article>`;
  }

  private createLanguageSelectHTML(): string {
    return `
      <h3 class="sub-title">Language</h3>
      ${this.createCardHTML(`
        <label for="language-select" class="cka-input-label">Language</label>
        <div id="language-select-container" class="cka-width-half"></div>
        <div class="error-message">Choose a language to continue.</div>
      `)}
    `;
  }

  private initializeLanguageSelect(): void {
    const container = document.getElementById('language-select-container');
    if (!container) {
      console.warn('Language select container not found');
      return;
    }

    if (this.languageSelect) {
      this.languageSelect.destroy();
    }

    try {
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
            this.updateSubmitButtonState();
          }
        }
      });
      this.languageSelect.mount(container);
    } catch (error) {
      console.error('Error initializing language select:', error);
    }
  }

  private createFileInputHTML(): string {
    const acceptedFileTypes = '.doc,.docx,.xls,.xlsx,.xlsm,.ppt,.pptx,.pdf';
    const supportedFileTypes = ['doc', 'docx', 'xls', 'xlsx', 'xlsm', 'ppt', 'pptx', 'pdf'];

    return `
      <h3 class="sub-title">Document & Title</h3>
      ${this.createCardHTML(`
        <label for="file-input" class="cka-input-label">Upload Document (5MB Limit)</label>
        <input 
          accept="${acceptedFileTypes}"
          class="cka-input-file cka-width-half"
          placeholder="No file chosen" 
          type="file" 
          required
        />
        <p>
          <em class="cka-control-footer">
            <strong>Supported file types:</strong> ${supportedFileTypes.join(', ')}
          </em>
        </p>
        <div class="error-message">Choose a file.</div>
        <div class="error-message">Choose a file less than 5MB.</div>

        <input
          class="cka-input-text cka-width-half"
          maxlength="250"
          name="documentTitle"
          type="text"
          value="${this.formData.documentTitle}"
          placeholder="Enter document title"
          required
        />
        <span class="cka-control-footer block">250 characters remaining</span>
        <div class="cka-control-footer">
          <strong>Note:</strong> Special characters such as (\\, ], :, >, /, <, [, |, ?, ", *, comma) are not allowed.
        </div>
        <div class="error-message">Enter title to continue.</div>
      `)}
    `;
  }

  private createSearchCriteriaHTML(): string {
    return `
      <h3 class="sub-title">Search Criteria</h3>
      ${this.createCardHTML(`
        <label for="searchTags" class="cka-input-label">Search Tags (optional)</label>
        <input
          class="cka-input-text cka-width-half"
          placeholder="Use , for separator" 
          value="${this.formData.searchTags.join(', ')}"
          type="text"
        />
        <span class="cka-control-footer">
          Add search tags to improve the relevancy of search results. 
          Type your one-word search tag and then press Enter.
        </span>

        <label for="description" class="cka-input-label">Description</label>
        <textarea 
          class="cka-textarea cka-width-half"
          cols="30"
          required
          rows="5" 
          placeholder="Enter description"
        >${this.formData.description}</textarea>
        <div class="error-message block">Enter a description to continue.</div>

        <label for="categories" class="cka-input-label">Categories (optional)</label>
        <a class="linkStyle block">Choose Categories</a>
        <div>
          <ul class="cka-choose-categories-list">
            <li>
              <cka-checkbox id="contentLibraryAccess">
                Access from 
              </cka-checkbox>
            </li>
            <li>
              <cka-checkbox id="contentLibraryAccess">
                Access from Content Library
              </cka-checkbox>
            </li>
            <li>
              <cka-checkbox id="contentLibraryAccess">
                Access from Content
              </cka-checkbox>
            </li>
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

  private attachEventListeners(): void {
    if (!this.container) return;

    // File input
    const fileInput = this.container.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        const errorMessages = fileInput.parentElement?.querySelectorAll('.error-message');

        // Reset error messages
        errorMessages?.forEach(msg => msg.classList.remove('visible'));

        if (file) {
          // Check file size (5MB = 5 * 1024 * 1024 bytes)
          const maxSize = 5 * 1024 * 1024; // 5MB in bytes
          if (file.size > maxSize) {
            this.formData.file = null;
            errorMessages?.[1]?.classList.add('visible');
            (e.target as HTMLInputElement).value = ''; // Clear the file input
          } else {
            this.formData.file = file;
          }
        } else {
          this.formData.file = null;
          errorMessages?.[0]?.classList.add('visible');
        }

        this.updateSubmitButtonState();
      });
    }

    // Title input
    const titleInput = this.container.querySelector('input[name="documentTitle"]');
    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        this.formData.documentTitle = (e.target as HTMLInputElement).value;
        this.updateCharacterCount(titleInput as HTMLInputElement);
        this.updateSubmitButtonState();
      });
    }

    // Description
    const description = this.container.querySelector('textarea');
    if (description) {
      description.addEventListener('input', (e) => {
        this.formData.description = (e.target as HTMLTextAreaElement).value;
        this.updateSubmitButtonState();
      });
    }

    // Checkboxes
    const contentLibraryCheckbox = this.container.querySelector('#contentLibraryAccess') as CkAlightCheckbox;
    const worklifeLinkCheckbox = this.container.querySelector('#worklifeLink') as CkAlightCheckbox;
    const showInSearchCheckbox = this.container.querySelector('#showInSearch') as CkAlightCheckbox;

    if (contentLibraryCheckbox) {
      contentLibraryCheckbox.addEventListener('change', (e: Event) => {
        const customEvent = e as CustomEvent;
        this.formData.contentLibraryAccess = customEvent.detail;
        this.updateSubmitButtonState();
      });
    }

    if (worklifeLinkCheckbox) {
      worklifeLinkCheckbox.addEventListener('change', (e: Event) => {
        const customEvent = e as CustomEvent;
        this.formData.worklifeLink = customEvent.detail;
        this.updateSubmitButtonState();
      });
    }

    if (showInSearchCheckbox) {
      showInSearchCheckbox.addEventListener('change', (e: Event) => {
        const customEvent = e as CustomEvent;
        this.formData.showInSearch = customEvent.detail;
        this.updateSubmitButtonState();
      });
    }
  }

  private updateCharacterCount(input: HTMLInputElement): void {
    const span = input.nextElementSibling;
    if (span) {
      span.textContent = `${250 - this.formData.documentTitle.length} characters remaining`;
    }
  }

  private updateSubmitButtonState(): void {
    if (!this.modalDialog) return;

    const isValid = this.validateForm().isValid;
    const submitButton = this.modalDialog.element?.querySelector('.cka-button-primary');

    if (submitButton) {
      submitButton.disabled = !isValid;
      submitButton.classList.toggle('cka-button-disabled', !isValid);
    }
  }

  setModalDialog(dialog: any): void {
    this.modalDialog = dialog;
  }

  renderContent(container: HTMLElement): void {
    this.container = container;
    container.innerHTML = `
      <form novalidate>
        ${this.createLanguageSelectHTML()}
        ${this.createFileInputHTML()}
        ${this.createSearchCriteriaHTML()}
        ${this.createCheckboxGroupHTML()}
        <p><b>Note:</b> Updates will not be reflected in Alight Worklife search results in QA/QC until tomorrow.</p>
      </form>
    `;

    requestAnimationFrame(() => {
      this.initializeLanguageSelect();
      this.attachEventListeners();
      this.updateSubmitButtonState();
    });
  }

  validateForm(): { isValid: boolean; message?: string } {
    if (!this.formData.file) {
      return { isValid: false, message: 'Please choose a file' };
    }

    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (this.formData.file.size > maxSize) {
      return { isValid: false, message: 'File size must be less than 5MB' };
    }
    if (!this.formData.documentTitle.trim()) {
      return { isValid: false, message: 'Please enter a document title' };
    }
    if (!this.formData.description.trim()) {
      return { isValid: false, message: 'Please enter a description' };
    }
    if (!this.formData.language) {
      return { isValid: false, message: 'Please select a language' };
    }
    return { isValid: true };
  }

  getLinkContent(page: number): string {
    return '';
  }

  resetSearch(): void {
    this.selectedLink = null;
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

  getFormData() {
    // Create a clean copy of the form data
    const formDataCopy = {
      language: this.formData.language,
      file: this.formData.file,
      documentTitle: this.formData.documentTitle.trim(),
      searchTags: this.formData.searchTags,
      description: this.formData.description.trim(),
      categories: this.formData.categories,
      contentLibraryAccess: this.formData.contentLibraryAccess,
      worklifeLink: this.formData.worklifeLink,
      showInSearch: this.formData.showInSearch
    };

    // Verify all values are properly set
    console.log('Form data being submitted:', formDataCopy);
    return formDataCopy;
  }

  getSelectedLink(): { destination: string; title: string } | null {
    return this.selectedLink;
  }
}