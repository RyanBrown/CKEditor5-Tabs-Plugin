// src/plugins/alight-new-document-link-plugin/tests/alight-new-document-link-plugin-modal-form-validation.spec.ts
import { FormValidator } from '../modal-content/validation/alight-new-document-link-plugin-modal-form-validation';

describe('FormValidator', () => {
  let validator: FormValidator;

  beforeEach(() => {
    validator = new FormValidator();
  });

  describe('validateField', () => {
    it('should validate individual fields', () => {
      const result = validator.validateField('language', '');
      expect(result.isValid).toBeFalse();
      expect(result.errors?.language).toBe('Please select a language');

      const validResult = validator.validateField('language', 'en');
      expect(validResult.isValid).toBeTrue();
      expect(validResult.errors).toBeUndefined();
    });

    it('should validate file field', () => {
      // Test empty file
      const emptyResult = validator.validateField('file', null);
      expect(emptyResult.isValid).toBeFalse();
      expect(emptyResult.errors?.file).toBe('Please choose a file');

      // Test valid file
      const validFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const validResult = validator.validateField('file', validFile);
      expect(validResult.isValid).toBeTrue();
      expect(validResult.errors).toBeUndefined();

      // Test file size
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
      const sizeResult = validator.validateField('file', largeFile);
      expect(sizeResult.isValid).toBeFalse();
      expect(sizeResult.errors?.file).toBe('File size must be less than 5MB');
    });
  });

  describe('validateForm', () => {
    it('should validate a valid form', () => {
      const validForm = {
        language: 'en',
        file: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
        documentTitle: 'Valid Title',
        description: 'Valid description'
      };

      const result = validator.validateForm(validForm);
      expect(result.isValid).toBeTrue();
      expect(result.errors).toBeUndefined();
    });

    it('should validate file size', () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
      const form = {
        language: 'en',
        file: largeFile,
        documentTitle: 'Valid Title',
        description: 'Valid description'
      };

      const result = validator.validateForm(form);
      expect(result.isValid).toBeFalse();
      expect(result.errors?.file).toBe('File size must be less than 5MB');
    });

    it('should validate document title special characters', () => {
      const form = {
        language: 'en',
        file: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
        documentTitle: 'Invalid/Title*With:Special\\Characters',
        description: 'Valid description'
      };

      const result = validator.validateForm(form);
      expect(result.isValid).toBeFalse();
      expect(result.errors?.title).toBe('Title contains invalid characters');
    });
  });
});