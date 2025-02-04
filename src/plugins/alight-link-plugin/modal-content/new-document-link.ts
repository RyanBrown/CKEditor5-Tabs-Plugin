// src/plugins/alight-link-plugin/modal-content/new-document-link.ts

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
   * @param content - The HTMLElement to be included in the group.
   * @returns A div element containing the form group.
   */
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

  /**
   * Creates a language selection dropdown.
   * @returns A div element containing the language select form group.
   */
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


  // Creates the file input for document selection.
  // @returns A div element containing the file input form group.
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

  // Creates the title input for the document.
  // @returns A div element containing the title input form group.
  private createTitleInput(): HTMLDivElement {
    const container = document.createElement('div');

    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'documentTitle';
    input.maxLength = 250;
    input.addEventListener('input', () => {
      const remaining = 250 - input.value.length;
      charCount.textContent = `${remaining} characters remaining`;
      this.formData.documentTitle = input.value;
    });

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

  /**
   * Creates the search criteria inputs including tags, description, and a link to choose categories.
   * @returns A div element containing the search criteria.
   */
  private createSearchCriteria(): HTMLDivElement {
    const container = document.createElement('div');

    const tagsInput = document.createElement('input');
    tagsInput.type = 'text';
    tagsInput.placeholder = 'Use , for separator';
    tagsInput.addEventListener('input', () => {
      // Update searchTags by splitting input value by comma.
      this.formData.searchTags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    });

    const description = document.createElement('textarea');
    description.rows = 5;
    description.cols = 30;
    description.addEventListener('input', () => {
      this.formData.description = description.value;
    });

    const categories = document.createElement('a');
    categories.className = 'linkStyle';
    categories.textContent = 'Choose Categories';
    // You can attach an event listener here to handle category selection.

    container.appendChild(this.createFormGroup('Search Criteria', tagsInput));
    container.appendChild(this.createFormGroup('', description));
    container.appendChild(this.createFormGroup('', categories));

    return container;
  }

  /**
   * Creates a checkbox group with an optional footer.
   * @param title - The title for the group.
   * @param label - The label text for the checkbox.
   * @param checked - Whether the checkbox is initially checked.
   * @param footer - Optional footer text.
   * @returns A div element containing the checkbox group.
   */
  private createCheckboxGroup(title: string, label: string, checked: boolean, footer?: string): HTMLDivElement {
    const container = document.createElement('div');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = checked;
    checkbox.addEventListener('change', () => {
      // Update corresponding formData property based on the label.
      if (label.includes('Content Library')) {
        this.formData.contentLibraryAccess = checkbox.checked;
      } else if (label.includes('Worklife')) {
        this.formData.worklifeLink = checkbox.checked;
      } else if (label.includes('Search Results')) {
        this.formData.showInSearch = checkbox.checked;
      }
    });

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

  /**
   * Creates the button group for the form.
   * @returns A div element containing the buttons.
   */
  private createButtons(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'card';

    const continueBtn = document.createElement('button');
    continueBtn.type = 'button';
    continueBtn.className = 'button';
    continueBtn.textContent = 'Continue';
    continueBtn.addEventListener('click', () => {
      this.submitForm();
    });

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'button-outlined';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => {
      this.resetSearch();
    });

    container.appendChild(continueBtn);
    container.appendChild(cancelBtn);

    return container;
  }

  /**
   * Creates the CKAlightCard element and appends the form to its content container.
   * @param page - The page number (not used in this example).
   * @returns The CKAlightCard element with the form appended.
   */
  private createCardElement(page: number): HTMLElement {
    // Create a new CKAlightCard instance.
    const card = new CKAlightCard();
    card.setAttribute('header', 'New Document');

    // Create the form element.
    const form = document.createElement('form');
    form.setAttribute('novalidate', '');

    // Append the various form groups to the form.
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

    // Append the form to the card's content container.
    const contentDiv = card.querySelector('.cka-card-content');
    if (contentDiv) {
      contentDiv.appendChild(form);
    } else {
      // If the content container is not found, you might want to append directly.
      card.appendChild(form);
    }

    return card;
  }

  /**
   * Returns the HTML string representation of the card element.
   * (This method is no longer needed if we append the element directly.)
   * @param page - The page number.
   * @returns The outer HTML of the card element.
   */
  getLinkContent(page: number): string {
    const card = this.createCardElement(page);
    return card.outerHTML;
  }

  /**
   * Renders the content into the provided container.
   * Updated to directly append the element rather than setting innerHTML.
   * @param container - The container where the form will be rendered.
   */
  renderContent(container: HTMLElement): void {
    this.container = container;
    container.innerHTML = ''; // Clear the container.
    // Append the card element directly to avoid issues with re-parsing and duplicate rendering.
    container.appendChild(this.createCardElement(1));
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
