// src/plugins/alight-link-plugin/modal-content/new-document-link.ts
import { ILinkManager } from './ILinkManager';
import { CKAlightCard } from '../../ui-components/alight-card-component/alight-card-component';

export class NewDocumentLinkManager implements ILinkManager {
  private container: HTMLElement | null = null;
  private formData: {
    title: string;
    description: string;
    documentType: string;
  } = {
      title: '',
      description: '',
      documentType: 'article'
    };

  private createFormGroup(labelText: string, inputElement: HTMLElement): HTMLDivElement {
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group';

    const label = document.createElement('label');
    label.className = 'cka-input-label';
    label.textContent = labelText;

    // Set the label's 'for' attribute if the input has an id
    if (inputElement instanceof HTMLElement && inputElement.id) {
      label.setAttribute('for', inputElement.id);
    }

    formGroup.appendChild(label);
    formGroup.appendChild(inputElement);

    return formGroup;
  }

  private createTitleInput(): HTMLDivElement {
    const titleInput = document.createElement('input');
    titleInput.id = 'doc-title';
    titleInput.type = 'text';
    titleInput.className = 'cka-input-text';
    titleInput.value = this.formData.title;
    titleInput.required = true;

    titleInput.addEventListener('input', (e) => {
      this.formData.title = (e.target as HTMLInputElement).value;
    });

    return this.createFormGroup('Document Title', titleInput);
  }

  private createTypeSelect(): HTMLDivElement {
    const typeSelect = document.createElement('select');
    typeSelect.id = 'doc-type';
    typeSelect.className = 'cka-input-select';

    const options = [
      { value: 'article', label: 'Article' },
      { value: 'policy', label: 'Policy' },
      { value: 'procedure', label: 'Procedure' },
      { value: 'form', label: 'Form' }
    ];

    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      optionElement.selected = this.formData.documentType === option.value;
      typeSelect.appendChild(optionElement);
    });

    typeSelect.addEventListener('change', (e) => {
      this.formData.documentType = (e.target as HTMLSelectElement).value;
    });

    return this.createFormGroup('Document Type', typeSelect);
  }

  private createDescriptionTextarea(): HTMLDivElement {
    const descriptionTextarea = document.createElement('textarea');
    descriptionTextarea.id = 'doc-description';
    descriptionTextarea.className = 'cka-input-textarea';
    descriptionTextarea.rows = 4;
    descriptionTextarea.value = this.formData.description;

    descriptionTextarea.addEventListener('input', (e) => {
      this.formData.description = (e.target as HTMLTextAreaElement).value;
    });

    return this.createFormGroup('Description', descriptionTextarea);
  }

  private createCardElement(page: number): HTMLElement {
    const card = new CKAlightCard();
    card.setAttribute('header', 'Create New Document');

    const formDiv = document.createElement('div');
    formDiv.className = 'new-document-form';

    // Add form elements
    formDiv.appendChild(this.createTitleInput());
    formDiv.appendChild(this.createTypeSelect());
    formDiv.appendChild(this.createDescriptionTextarea());

    // Get the content div and append to it directly
    const contentDiv = card.querySelector('.cka-card-content');
    if (contentDiv) {
      contentDiv.appendChild(formDiv);
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
      title: '',
      description: '',
      documentType: 'article'
    };

    if (this.container) {
      this.renderContent(this.container);
    }
  }

  validateForm(): { isValid: boolean; message?: string } {
    if (!this.formData.title.trim()) {
      return {
        isValid: false,
        message: 'Please enter a document title'
      };
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