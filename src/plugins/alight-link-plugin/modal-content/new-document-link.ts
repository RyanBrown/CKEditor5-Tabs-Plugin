// src/plugins/alight-link-plugin/modal-content/new-document-link.ts
import { ILinkManager } from './ILinkManager';

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

  getLinkContent(page: number): string {
    return `
      <cka-card header="Create New Document">
        <div class="new-document-form">
          <div class="form-group">
            <label for="doc-title" class="cka-input-label">Document Title</label>
            <input
              id="doc-title"
              type="text"
              class="cka-input-text"
              value="${this.formData.title}"
              required
            />
          </div>

          <div class="form-group">
            <label for="doc-type" class="cka-input-label">Document Type</label>
            <select id="doc-type" class="cka-input-select">
              <option value="article" ${this.formData.documentType === 'article' ? 'selected' : ''}>Article</option>
              <option value="policy" ${this.formData.documentType === 'policy' ? 'selected' : ''}>Policy</option>
              <option value="procedure" ${this.formData.documentType === 'procedure' ? 'selected' : ''}>Procedure</option>
              <option value="form" ${this.formData.documentType === 'form' ? 'selected' : ''}>Form</option>
            </select>
          </div>

          <div class="form-group">
            <label for="doc-description" class="cka-input-label">Description</label>
            <textarea
              id="doc-description"
              class="cka-input-textarea"
              rows="4"
            >${this.formData.description}</textarea>
          </div>
        </div>
      </cka-card>
    `;
  }

  renderContent(container: HTMLElement): void {
    this.container = container;
    container.innerHTML = this.getLinkContent(1);

    // Add event listeners for form inputs
    const titleInput = container.querySelector('#doc-title') as HTMLInputElement;
    const typeSelect = container.querySelector('#doc-type') as HTMLSelectElement;
    const descriptionTextarea = container.querySelector('#doc-description') as HTMLTextAreaElement;

    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        this.formData.title = (e.target as HTMLInputElement).value;
      });
    }

    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        this.formData.documentType = (e.target as HTMLSelectElement).value;
      });
    }

    if (descriptionTextarea) {
      descriptionTextarea.addEventListener('input', (e) => {
        this.formData.description = (e.target as HTMLTextAreaElement).value;
      });
    }
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

  // Method to validate the form data
  validateForm(): { isValid: boolean; message?: string } {
    if (!this.formData.title.trim()) {
      return {
        isValid: false,
        message: 'Please enter a document title'
      };
    }

    return { isValid: true };
  }

  // Method to get the current form data
  getFormData() {
    return { ...this.formData };
  }

  // Method to submit the form - can be called from the modal's continue button
  submitForm(): boolean {
    const validation = this.validateForm();

    if (!validation.isValid) {
      if (validation.message) {
        alert(validation.message);
      }
      return false;
    }

    // Here you would typically handle the form submission
    console.log('Form submitted with data:', this.formData);

    return true;
  }
}