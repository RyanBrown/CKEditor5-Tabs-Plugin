import { ILinkManager } from './ILinkManager';
import { CKAlightCard } from '../../ui-components/alight-card-component/alight-card-component';

export class NewDocumentLinkManager implements ILinkManager {
  private container: HTMLElement | null = null;
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

  private createFormGroup(title: string, content: HTMLElement): HTMLDivElement {
    const group = document.createElement('div');
    if (title) {
      const heading = document.createElement('h3');
      heading.textContent = title;
      group.appendChild(heading);
    }

    const card = document.createElement('div');
    card.className = 'card';
    card.appendChild(content);
    group.appendChild(card);

    return group;
  }

  private createLanguageSelect(): HTMLDivElement {
    const select = document.createElement('select');
    const options = [
      { value: 'en', label: 'English (default)' },
      { value: 'fr', label: 'French' },
      { value: 'es', label: 'Spanish' }
    ];

    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      select.appendChild(optionElement);
    });

    select.value = this.formData.language;
    select.addEventListener('change', (e) => {
      this.formData.language = (e.target as HTMLSelectElement).value;
    });

    return this.createFormGroup('Language', select);
  }

  private createFileInput(): HTMLDivElement {
    const container = document.createElement('div');

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.doc,.docx,.xls,.xlsx,.xlsm,.ppt,.pptx,.pdf';
    fileInput.addEventListener('change', (e) => {
      this.formData.file = (e.target as HTMLInputElement).files?.[0] || null;
    });

    const supportedTypes = document.createElement('p');
    supportedTypes.innerHTML = '<em class="control-footer"><strong>Supported file types:</strong> .doc, .docx, .xls, .xlsx, .xlsm, .ppt, .pptx, .pdf</em>';

    container.appendChild(fileInput);
    container.appendChild(supportedTypes);

    return this.createFormGroup('Document & Title', container);
  }

  private createTitleInput(): HTMLDivElement {
    const container = document.createElement('div');

    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'documentTitle';
    input.maxLength = 250;

    const charCount = document.createElement('span');
    charCount.className = 'control-footer';
    charCount.textContent = '250 characters remaining';

    const note = document.createElement('div');
    note.className = 'control-footer';
    note.innerHTML = '<strong>Note:</strong> Special characters such as (\\, ], :, >, /, <, [, |, ?, ", *, comma) are not allowed.';

    container.appendChild(input);
    container.appendChild(charCount);
    container.appendChild(note);

    return this.createFormGroup('', container);
  }

  private createSearchCriteria(): HTMLDivElement {
    const container = document.createElement('div');

    const tagsInput = document.createElement('input');
    tagsInput.type = 'text';
    tagsInput.placeholder = 'Use , for separator';

    const description = document.createElement('textarea');
    description.rows = 5;
    description.cols = 30;

    const categories = document.createElement('a');
    categories.className = 'linkStyle';
    categories.textContent = 'Choose Categories';

    container.appendChild(this.createFormGroup('Search Criteria', tagsInput));
    container.appendChild(this.createFormGroup('', description));
    container.appendChild(this.createFormGroup('', categories));

    return container;
  }

  private createCheckboxGroup(title: string, label: string, checked: boolean, footer?: string): HTMLDivElement {
    const container = document.createElement('div');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = checked;

    const labelElement = document.createElement('label');
    labelElement.textContent = label;

    container.appendChild(checkbox);
    container.appendChild(labelElement);

    if (footer) {
      const footerElement = document.createElement('div');
      footerElement.className = 'control-footer';
      footerElement.textContent = footer;
      container.appendChild(footerElement);
    }

    return this.createFormGroup(title, container);
  }

  private createButtons(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'card';

    const continueBtn = document.createElement('button');
    continueBtn.type = 'button';
    continueBtn.className = 'button';
    continueBtn.textContent = 'Continue';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'button-outlined';
    cancelBtn.textContent = 'Cancel';

    container.appendChild(continueBtn);
    container.appendChild(cancelBtn);

    return container;
  }

  private createCardElement(page: number): HTMLElement {
    const card = new CKAlightCard();
    card.setAttribute('header', 'New Document');

    const form = document.createElement('form');
    form.setAttribute('novalidate', '');

    form.appendChild(this.createLanguageSelect());
    form.appendChild(this.createFileInput());
    form.appendChild(this.createTitleInput());
    form.appendChild(this.createSearchCriteria());
    form.appendChild(this.createCheckboxGroup('Content Library', 'Access from Content Library (optional)', false));
    form.appendChild(this.createCheckboxGroup('Alight Worklife Link', 'Link to Document From a Alight Worklife Link (optional)', false));
    form.appendChild(this.createCheckboxGroup(
      'Search Results',
      'Show in Search Results (optional)',
      true,
      'If this document matches a user\'s search criteria, checking this box makes it eligible to appear in the search results.'
    ));
    form.appendChild(this.createButtons());

    const contentDiv = card.querySelector('.cka-card-content');
    if (contentDiv) {
      contentDiv.appendChild(form);
    }

    return card;
  }

  getLinkContent(page: number): string {
    const card = this.createCardElement(page);
    return card.outerHTML;
  }

  renderContent(container: HTMLElement): void {
    this.container = container;
    container.innerHTML = this.getLinkContent(1);
  }

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