import { LinkManager } from './alight-new-document-link-plugin-modal-LinkManager';
import { CkAlightSelectMenu } from '../../ui-components/alight-select-menu-component/alight-select-menu-component';
import '../../ui-components/alight-checkbox-component/alight-checkbox-component';
import '../../ui-components/alight-radio-component/alight-radio-component';

export class ContentManager implements LinkManager {
  private container: HTMLElement | null = null;
  private selectedLink: { destination: string; title: string } | null = null;
  private languageSelect: CkAlightSelectMenu<{ value: string; label: string }> | null = null;

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
      <h3>Language</h3>
      ${this.createCardHTML(`
        <div id="language-select-container"></div>
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

    // Cleanup previous instance if it exists
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
          } else {
            this.formData.language = 'en';
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
      <h3>Document & Title</h3>
      ${this.createCardHTML(`
        <input 
          accept="${acceptedFileTypes}"
          class="cka-input-file"
          placeholder="No file chosen" 
          type="file" 
        />
        <p>
          <em class="control-footer">
            <strong>Supported file types:</strong> ${supportedFileTypes.join(', ')}
          </em>
        </p>
        <div class="error-message">Choose a file.</div>
        <div class="error-message">Choose a file less than 5MB.</div>

        <input
          class="cka-input-text"
          maxlength="250"
          name="documentTitle"
          type="text"
          value="${this.formData.documentTitle}"
        />
        <span class="control-footer">250 characters remaining</span>
        <div class="control-footer">
          <strong>Note:</strong> Special characters such as (\\, ], :, >, /, <, [, |, ?, ", *, comma) are not allowed.
        </div>
        <div class="error-message">Enter title to continue.</div>
        <div class="error-message">Your document can't be uploaded because the Title includes special characters.</div>
      `)}
    `;
  }

  private createSearchCriteriaHTML(): string {
    return `
      <h3>Search Criteria</h3>
      ${this.createCardHTML(`
        <input
          class="cka-input-text"
          placeholder="Use , for separator" value="${this.formData.searchTags.join(', ')}"
          type="text"
        />
        <span class="control-footer">
          Add search tags to improve the relevancy of search results. 
          Type your one-word search tag and then press Enter.
        </span>
        <div class="error-message"></div>
        <div class="control-footer">
          <strong>Note:</strong> Special characters such as (&, #, @, +, /, %, >, <, [, ], \\) are not allowed.
        </div>

        <textarea rows="5" cols="30">${this.formData.description}</textarea>
        <div class="error-message">Enter a description to continue.</div>

        <a class="linkStyle">Choose Categories</a>
        <div class="control-footer">
          <strong>Note:</strong> Categories apply to both search and Content Library.
        </div>
      `)}
    `;
  }

  private createCheckboxGroupHTML(): string {
    return `
      <h3>Content Library</h3>
      ${this.createCardHTML(`
        <input type="checkbox" ${this.formData.contentLibraryAccess ? 'checked' : ''} />
        <label>Access from Content Library (optional)</label>
      `)}

      <h3>Alight Worklife Link</h3>
      ${this.createCardHTML(`
        <input type="checkbox" ${this.formData.worklifeLink ? 'checked' : ''} />
        <label>Link to Document From a Alight Worklife Link (optional)</label>
      `)}

      <h3>Search Results</h3>
      ${this.createCardHTML(`
        <input type="checkbox" ${this.formData.showInSearch ? 'checked' : ''} />
        <label>Show in Search Results (optional)</label>
        <div class="control-footer">
          If this document matches a user's search criteria, checking this box makes it
          eligible to appear in the search results.
        </div>
        <div class="error-message">
          Choose show in search results (optional) to continue. The document needs to appear
          as a search result, as it is accessible from the Content Library.
        </div>
      `)}
    `;
  }

  private createButtonsHTML(): string {
    return this.createCardHTML(`
      <button type="button" class="button">Continue</button>
      <button type="button" class="button-outlined">Cancel</button>
    `);
  }

  private createFormHTML(): string {
    return `
      <form novalidate>
        <div>
          ${this.createLanguageSelectHTML()}
          ${this.createFileInputHTML()}
          ${this.createSearchCriteriaHTML()}
          ${this.createCheckboxGroupHTML()}
          <p><b>Note:</b> Updates will not be reflected in Alight Worklife search results in QA/QC until tomorrow.</p>
          ${this.createButtonsHTML()}
        </div>
      </form>
    `;
  }

  renderContent(container: HTMLElement): void {
    this.container = container;
    container.innerHTML = this.createFormHTML();

    // Initialize the language select after the form is rendered
    requestAnimationFrame(() => {
      this.initializeLanguageSelect();
      this.attachEventListeners();
    });
  }

  private attachEventListeners(): void {
    if (!this.container) return;

    // File input
    const fileInput = this.container.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        this.formData.file = (e.target as HTMLInputElement).files?.[0] || null;
      });
    }

    // Title input
    const titleInput = this.container.querySelector('input[name="documentTitle"]');
    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        this.formData.documentTitle = (e.target as HTMLInputElement).value;
        const span = titleInput.nextElementSibling;
        if (span) {
          span.textContent = `${250 - this.formData.documentTitle.length} characters remaining`;
        }
      });
    }

    // Search tags
    const tagsInput = this.container.querySelector('input[placeholder="Use , for separator"]');
    if (tagsInput) {
      tagsInput.addEventListener('input', (e) => {
        this.formData.searchTags = (e.target as HTMLInputElement).value
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean);
      });
    }

    // Description
    const description = this.container.querySelector('textarea');
    if (description) {
      description.addEventListener('input', (e) => {
        this.formData.description = (e.target as HTMLTextAreaElement).value;
      });
    }

    // Checkboxes
    const checkboxes = this.container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox, index) => {
      checkbox.addEventListener('change', (e) => {
        const isChecked = (e.target as HTMLInputElement).checked;
        switch (index) {
          case 0:
            this.formData.contentLibraryAccess = isChecked;
            break;
          case 1:
            this.formData.worklifeLink = isChecked;
            break;
          case 2:
            this.formData.showInSearch = isChecked;
            break;
        }
      });
    });
  }

  getLinkContent(page: number): string {
    return this.createFormHTML();
  }

  resetSearch(): void {
    this.selectedLink = null;

    // Clean up the language select
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

  validateForm(): { isValid: boolean; message?: string } {
    if (!this.formData.file) {
      return { isValid: false, message: 'Please choose a file' };
    }
    if (!this.formData.documentTitle.trim()) {
      return { isValid: false, message: 'Please enter a document title' };
    }
    return { isValid: true };
  }

  getFormData() {
    return { ...this.formData };
  }

  getSelectedLink(): { destination: string; title: string } | null {
    return this.selectedLink;
  }
}