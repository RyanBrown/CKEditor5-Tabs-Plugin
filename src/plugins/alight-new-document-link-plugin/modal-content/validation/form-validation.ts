// src/plugins/alight-new-document-link-plugin/validation/form-validator.ts

export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

export interface FieldValidation {
  rules: ValidationRule[];
  required?: boolean;
  customValidator?: (value: any) => { isValid: boolean; message?: string } | undefined;
}

export interface ValidationSchema {
  [key: string]: FieldValidation;
}

export interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
  firstError?: string;
}

export const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB in bytes

// Reusable validation rules
export const ValidationRules = {
  required: (fieldName: string): ValidationRule => ({
    validate: (value: any) => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string') return value.trim().length > 0;
      if (value instanceof File) return true;
      return !!value;
    },
    message: `${fieldName} is required`
  }),

  maxLength: (length: number): ValidationRule => ({
    validate: (value: string) => !value || value.length <= length,
    message: `Maximum length is ${length} characters`
  }),

  fileSize: (): ValidationRule => ({
    validate: (file: File) => file.size <= FILE_SIZE_LIMIT,
    message: 'File size must be less than 5MB'
  }),

  noSpecialChars: (): ValidationRule => ({
    validate: (value: string) => !/[\\[\]:><\/\|\?"*,]/.test(value),
    message: 'Special characters are not allowed'
  })
};

// Form validation schema
export const documentFormSchema: ValidationSchema = {
  language: {
    required: true,
    rules: [ValidationRules.required('Language')]
  },
  file: {
    required: true,
    rules: [
      ValidationRules.required('File'),
      ValidationRules.fileSize()
    ]
  },
  documentTitle: {
    required: true,
    rules: [
      ValidationRules.required('Document title'),
      ValidationRules.maxLength(250),
      ValidationRules.noSpecialChars()
    ]
  },
  description: {
    required: true,
    rules: [
      ValidationRules.required('Description'),
      ValidationRules.maxLength(1000)
    ]
  }
};

export class FormValidator {
  private schema: ValidationSchema;

  constructor(schema: ValidationSchema) {
    this.schema = schema;
  }

  validateField(fieldName: string, value: any): { isValid: boolean; message?: string } {
    const fieldValidation = this.schema[fieldName];
    if (!fieldValidation) return { isValid: true };

    // Check required field
    if (fieldValidation.required && !ValidationRules.required(fieldName).validate(value)) {
      return { isValid: false, message: ValidationRules.required(fieldName).message };
    }

    // Check all validation rules
    for (const rule of fieldValidation.rules) {
      if (!rule.validate(value)) {
        return { isValid: false, message: rule.message };
      }
    }

    // Run custom validator if provided
    if (fieldValidation.customValidator) {
      const customValidation = fieldValidation.customValidator(value);
      if (customValidation && !customValidation.isValid) {
        return customValidation;
      }
    }

    return { isValid: true };
  }

  validateForm(formData: any): ValidationResult {
    const errors: { [key: string]: string } = {};
    let isValid = true;

    for (const [fieldName, fieldValidation] of Object.entries(this.schema)) {
      const validation = this.validateField(fieldName, formData[fieldName]);

      if (!validation.isValid) {
        isValid = false;
        errors[fieldName] = validation.message || `Invalid ${fieldName}`;
      }
    }

    return {
      isValid,
      errors,
      firstError: Object.values(errors)[0]
    };
  }
}