// src/plugins/alight-new-document-link-plugin/tests/alight-new-document-link-plugin-modal-form-validation.spec.ts

import { FormValidator } from '../modal-content/validation/alight-new-document-link-plugin-modal-form-validation';

describe('FormValidator', () => {
  let validator: FormValidator;

  beforeEach(() => {
    validator = new FormValidator();
  });

  describe('validateForm', () => {
    it('should validate required fields', () => {
      const result = validator.validateForm({
        language: '',
        file: null,
        documentTitle: '',
        description: ''
      });

      expect(result.isValid).toBeFalse();
      expect(result.errors).toBeDefined();
      if (result.errors) {
        expect(result.errors['language']).toBeDefined();
        expect(result.errors['file']).toBeDefined();
        expect(result.errors['title']).toBeDefined();
        expect(result.errors['description']).toBeDefined();
      }
    });

    it('should validate a valid form', () => {
      const result = validator.validateForm({
        language: 'en',
        file: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
        documentTitle: 'Valid Title',
        description: 'Valid description',
        searchTags: ['tag1', 'tag2'],
        categories: ['cat1'],
        contentLibraryAccess: true,
        worklifeLink: false,
        showInSearch: true
      });

      expect(result.isValid).toBeTrue();
      expect(result.errors).toBeUndefined();
    });

    it('should validate file size', () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
      const result = validator.validateForm({
        language: 'en',
        file: largeFile,
        documentTitle: 'Valid Title',
        description: 'Valid description'
      });

      expect(result.isValid).toBeFalse();
      expect(result.errors?.['file']).toContain('5MB');
    });

    it('should validate document title length', () => {
      const longTitle = 'x'.repeat(251);
      const result = validator.validateForm({
        language: 'en',
        file: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
        documentTitle: longTitle,
        description: 'Valid description'
      });

      expect(result.isValid).toBeFalse();
      expect(result.errors?.['title']).toContain('250 characters');
    });

    it('should validate document title special characters', () => {
      const result = validator.validateForm({
        language: 'en',
        file: new File(['test'], 'test.pdf', { type: 'application/pdf' }),
        documentTitle: 'Invalid/Title*With:Special\\Characters',
        description: 'Valid description'
      });

      expect(result.isValid).toBeFalse();
      expect(result.errors?.['title']).toContain('invalid characters');
    });
  });

  describe('validateField', () => {
    it('should validate individual fields', () => {
      expect(validator.validateField('language', '')).toEqual({
        isValid: false,
        errors: { language: 'Please select a language' }
      });

      expect(validator.validateField('documentTitle', '')).toEqual({
        isValid: false,
        errors: { documentTitle: 'Please enter a document title' }
      });

      expect(validator.validateField('description', '')).toEqual({
        isValid: false,
        errors: { description: 'Please enter a description' }
      });

      expect(validator.validateField('language', 'en')).toEqual({
        isValid: true
      });
    });

    it('should validate file field', () => {
      const validFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      expect(validator.validateField('file', validFile)).toEqual({
        isValid: true
      });

      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
      expect(validator.validateField('file', largeFile)).toEqual({
        isValid: false,
        errors: { file: 'File size must be less than 5MB' }
      });
    });
  });
});