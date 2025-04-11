// src/plugins/alight-new-document-link-plugin/modal-content/validation/form-validation.ts
export interface ValidationErrors {
  [key: string]: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: ValidationErrors;
}

export class FormValidator {
  validateForm(formData: any): ValidationResult {
    const errors: ValidationErrors = {};

    // Language validation
    if (!formData.language) {
      errors['language'] = 'Please select a language';
    }

    // File validation
    if (!formData.file) {
      errors['file'] = 'Please choose a file';
    } else if (formData.file.size > 5 * 1024 * 1024) {
      errors['file'] = 'File size must be less than 5MB';
    }

    // Document title validation
    if (!formData.documentTitle?.trim()) {
      errors['title'] = 'Please enter a document title';
    } else if (formData.documentTitle.length > 250) {
      errors['title'] = 'Title must be less than 250 characters';
    } else {
      // Check for invalid characters and identify them in the error message
      const invalidChars = formData.documentTitle.match(/[\\[\]:><\/\|\?"*,]/g);
      if (invalidChars) {
        const uniqueInvalidChars = [...new Set(invalidChars)].join(', ');
        errors['title'] = `Title contains invalid characters: ${uniqueInvalidChars}`;
      }
    }

    // Description validation
    if (!formData.description?.trim()) {
      errors['description'] = 'Please enter a description';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors: Object.keys(errors).length > 0 ? errors : undefined
    };
  }

  validateField(fieldName: string, value: any): ValidationResult {
    const errors: ValidationErrors = {};

    switch (fieldName) {
      case 'language':
        if (!value) {
          errors[fieldName] = 'Please select a language';
        }
        break;

      case 'file':
        if (!value) {
          errors[fieldName] = 'Please choose a file';
        } else if (value.size > 5 * 1024 * 1024) {
          errors[fieldName] = 'File size must be less than 5MB';
        }
        break;

      case 'documentTitle':
        if (!value?.trim()) {
          errors[fieldName] = 'Please enter a document title';
        } else if (value.length > 250) {
          errors[fieldName] = 'Title must be less than 250 characters';
        } else {
          // Check for invalid characters and identify them in the error message
          const invalidChars = value.match(/[\\[\]:><\/\|\?"*,]/g);
          if (invalidChars) {
            const uniqueInvalidChars = [...new Set(invalidChars)].join(', ');
            errors[fieldName] = `Title contains invalid characters: ${uniqueInvalidChars}`;
          }
        }
        break;

      case 'description':
        if (!value?.trim()) {
          errors[fieldName] = 'Please enter a description';
        }
        break;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors: Object.keys(errors).length > 0 ? errors : undefined
    };
  }
}
