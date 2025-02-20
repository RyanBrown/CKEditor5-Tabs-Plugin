// src/plugins/alight-new-document-link-plugin/tests/alight-new-document-link-plugin-modal-ContentManager.spec.ts
import { ContentManager } from '../modal-content/alight-new-document-link-plugin-modal-ContentManager';
import { FormValidator } from '../modal-content/validation/alight-new-document-link-plugin-modal-form-validation';
import { FormSubmissionHandler } from '../modal-content/submission/alight-new-document-link-plugin-modal-form-submission';

describe('ContentManager', () => {
  let contentManager: ContentManager;
  let container: HTMLElement;
  let mockFormValidator: jasmine.SpyObj<FormValidator>;
  let mockFormSubmissionHandler: jasmine.SpyObj<FormSubmissionHandler>;

  beforeEach(() => {
    // Create test container
    container = document.createElement('div');
    document.body.appendChild(container);

    // Create spies for dependencies
    mockFormValidator = jasmine.createSpyObj('FormValidator', ['validateForm', 'validateField']);
    mockFormSubmissionHandler = jasmine.createSpyObj('FormSubmissionHandler', ['submitForm', 'cancelSubmission']);

    // Initialize content manager
    contentManager = new ContentManager();
  });

  afterEach(() => {
    document.body.removeChild(container);
    contentManager.destroy();
  });

  describe('renderContent', () => {
    it('should render all form sections', () => {
      contentManager.renderContent(container);

      // Check if all major sections are rendered
      expect(container.querySelector('form')).toBeTruthy();
      expect(container.querySelector('#language-select-container')).toBeTruthy();
      expect(container.querySelector('#file-input')).toBeTruthy();
      expect(container.querySelector('#document-title')).toBeTruthy();
      expect(container.querySelector('#search-tags-chips')).toBeTruthy();
      expect(container.querySelector('#description')).toBeTruthy();
    });

    it('should initialize with default values', () => {
      contentManager.renderContent(container);

      const formData = contentManager.getFormData();
      expect(formData.language).toBe('en');
      expect(formData.file).toBeNull();
      expect(formData.documentTitle).toBe('');
      expect(formData.searchTags).toEqual([]);
      expect(formData.description).toBe('');
      expect(formData.categories).toEqual([]);
      expect(formData.showInSearch).toBeTrue();
    });
  });

  describe('form validation', () => {
    it('should validate required fields', () => {
      contentManager.renderContent(container);
      const validation = contentManager.validateForm();

      expect(validation.isValid).toBeFalse();
      expect(validation.errors).toBeDefined();
      if (validation.errors) {
        expect(validation.errors['file']).toBeDefined();
        expect(validation.errors['title']).toBeDefined();
        expect(validation.errors['description']).toBeDefined();
      }
    });

    it('should validate file size', () => {
      contentManager.renderContent(container);

      // Create a mock file that exceeds 5MB
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'test.pdf', { type: 'application/pdf' });
      const fileInput = container.querySelector('#file-input') as HTMLInputElement;

      // Trigger file selection
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(largeFile);
      fileInput.files = dataTransfer.files;

      // Dispatch change event
      fileInput.dispatchEvent(new Event('change'));

      const validation = contentManager.validateForm();
      expect(validation.isValid).toBeFalse();
      expect(validation.errors?.['file']).toContain('5MB');
    });

    it('should validate document title special characters', () => {
      contentManager.renderContent(container);

      const titleInput = container.querySelector('#document-title') as HTMLInputElement;
      titleInput.value = 'Invalid/Title*With:Special\\Characters';
      titleInput.dispatchEvent(new Event('input'));

      const validation = contentManager.validateForm();
      expect(validation.isValid).toBeFalse();
      expect(validation.errors?.['title']).toContain('invalid characters');
    });
  });

  describe('form submission', () => {
    it('should submit valid form data', async () => {
      contentManager.renderContent(container);

      // Set up valid form data
      const validFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const fileInput = container.querySelector('#file-input') as HTMLInputElement;
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(validFile);
      fileInput.files = dataTransfer.files;
      fileInput.dispatchEvent(new Event('change'));

      const titleInput = container.querySelector('#document-title') as HTMLInputElement;
      titleInput.value = 'Valid Document Title';
      titleInput.dispatchEvent(new Event('input'));

      const descInput = container.querySelector('#description') as HTMLTextAreaElement;
      descInput.value = 'Valid document description';
      descInput.dispatchEvent(new Event('input'));

      // Mock successful submission
      mockFormSubmissionHandler.submitForm.and.returnValue(Promise.resolve({
        success: true,
        data: { id: 'test-doc-1' }
      }));

      const result = await contentManager.submitForm();
      expect(result.success).toBeTrue();
      expect(result.data.id).toBe('test-doc-1');
    });

    it('should handle submission errors', async () => {
      contentManager.renderContent(container);

      // Mock failed submission
      mockFormSubmissionHandler.submitForm.and.returnValue(Promise.resolve({
        success: false,
        error: 'Network error'
      }));

      try {
        await contentManager.submitForm();
        fail('Should have thrown an error');
      } catch (error: unknown) {
        if (error instanceof Error) {
          expect(error.message).toContain('Network error');
        } else {
          fail('Expected error to be instance of Error');
        }
      }
    });
  });

  describe('form reset', () => {
    it('should reset form to initial state', () => {
      contentManager.renderContent(container);

      // Set some form values
      const titleInput = container.querySelector('#document-title') as HTMLInputElement;
      titleInput.value = 'Test Title';
      titleInput.dispatchEvent(new Event('input'));

      const descInput = container.querySelector('#description') as HTMLTextAreaElement;
      descInput.value = 'Test Description';
      descInput.dispatchEvent(new Event('input'));

      // Reset form
      contentManager.resetForm();

      // Verify reset state
      const formData = contentManager.getFormData();
      expect(formData.language).toBe('en');
      expect(formData.file).toBeNull();
      expect(formData.documentTitle).toBe('');
      expect(formData.searchTags).toEqual([]);
      expect(formData.description).toBe('');
      expect(formData.categories).toEqual([]);
      expect(formData.showInSearch).toBeTrue();

      // Verify UI reset
      expect(titleInput.value).toBe('');
      expect(descInput.value).toBe('');
    });
  });
});

