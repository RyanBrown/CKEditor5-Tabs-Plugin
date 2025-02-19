// src/plugins/alight-new-document-link-plugin/modal-content/tests/alight-new-document-link-plugin-modal-ContentManager.spec.ts
import { ContentManager } from '../alight-new-document-link-plugin-modal-ContentManager';
import { CkAlightSelectMenu } from './../../../ui-components/alight-select-menu-component/alight-select-menu-component';
import { CkAlightCheckbox } from './../../../ui-components/alight-checkbox-component/alight-checkbox-component';

describe('ContentManager', () => {
  let contentManager: ContentManager;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    contentManager = new ContentManager();
    contentManager.renderContent(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Form Validation', () => {
    it('should return invalid when required fields are empty', () => {
      const validation = contentManager.validateForm();
      expect(validation.isValid).toBeFalse();
      expect(validation.message).toBe('Please choose a file');
    });

    // it('should validate file size', () => {
    //   const file = new File([''], 'test.pdf', { type: 'application/pdf' });
    //   Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 }); // 6MB

    //   const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    //   const event = new Event('change');
    //   Object.defineProperty(event, 'target', { value: { files: [file] } });
    //   fileInput.dispatchEvent(event);

    //   const validation = contentManager.validateForm();
    //   expect(validation.isValid).toBeFalse();
    //   expect(validation.message).toBe('File size must be less than 5MB');
    // });

    it('should validate all required fields correctly', () => {
      // Set up valid form data
      const formData = contentManager['formData'];
      formData.file = new File([''], 'test.pdf', { type: 'application/pdf' });
      formData.documentTitle = 'Test Document';
      formData.description = 'Test Description';
      formData.language = 'en';

      const validation = contentManager.validateForm();
      expect(validation.isValid).toBeTrue();
    });
  });

  describe('Language Selection', () => {
    it('should initialize with English as default language', () => {
      const formData = contentManager['formData'];
      expect(formData.language).toBe('en');
    });

    it('should update language when selection changes', () => {
      const languageSelect = contentManager['languageSelect'];
      const container = document.getElementById('language-select-container');

      // Simulate language change
      if (languageSelect && container) {
        const changeEvent = new CustomEvent('change', { detail: 'fr' });
        container.dispatchEvent(changeEvent);

        expect(contentManager['formData'].language).toBe('fr');
      }
    });
  });

  describe('Category Management', () => {
    // it('should toggle categories visibility', () => {
    //   const toggleButton = container.querySelector('.cka-categories-toggle') as HTMLElement;
    //   const categoriesWrapper = container.querySelector('.cka-categories-wrapper') as HTMLElement;

    //   toggleButton.click();
    //   expect(categoriesWrapper.classList.contains('hidden')).toBeFalse();

    //   toggleButton.click();
    //   expect(categoriesWrapper.classList.contains('hidden')).toBeTrue();
    // });

    it('should update categories when checkboxes are clicked', () => {
      const categoryCheckbox = container.querySelector('#category-1') as CkAlightCheckbox;
      if (categoryCheckbox) {
        const event = new CustomEvent('change', { detail: true });
        categoryCheckbox.dispatchEvent(event);

        expect(contentManager['formData'].categories).toContain('1');
      }
    });
  });

  describe('Form Reset', () => {
    it('should reset form to initial state', () => {
      // Set some values first
      const formData = contentManager['formData'];
      formData.documentTitle = 'Test';
      formData.description = 'Description';
      formData.categories = ['1', '2'];

      // Reset the form
      contentManager.resetSearch();

      // Verify reset state
      const resetFormData = contentManager['formData'];
      expect(resetFormData.documentTitle).toBe('');
      expect(resetFormData.description).toBe('');
      expect(resetFormData.categories).toEqual([]);
      expect(resetFormData.language).toBe('en');
      expect(resetFormData.showInSearch).toBeTrue();
    });
  });

  // describe('Character Count', () => {
  //   it('should update remaining character count for document title', () => {
  //     const titleInput = container.querySelector('input[name="documentTitle"]') as HTMLInputElement;
  //     const countSpan = titleInput.nextElementSibling as HTMLElement;

  //     titleInput.value = 'Test Title';
  //     const event = new Event('input');
  //     titleInput.dispatchEvent(event);

  //     expect(countSpan.textContent).toBe('241 characters remaining');
  //   });
  // });

  describe('Form Data Retrieval', () => {
    it('should return clean form data', () => {
      // Set up form data
      const formData = contentManager['formData'];
      formData.documentTitle = '  Test Document  ';
      formData.description = '  Test Description  ';
      formData.categories = ['1'];
      formData.language = 'en';

      const cleanData = contentManager.getFormData();

      expect(cleanData.documentTitle).toBe('Test Document');
      expect(cleanData.description).toBe('Test Description');
      expect(cleanData.categories).toEqual(['1']);
      expect(cleanData.language).toBe('en');
    });
  });
});