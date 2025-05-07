// src/plugins/alight-new-document-link-plugin/utils.ts
import type {
  DowncastConversionApi,
  Element,
  Schema,
  ViewAttributeElement,
  ViewNode,
  ViewDocumentFragment
} from '@ckeditor/ckeditor5-engine';

import type { Editor } from '@ckeditor/ckeditor5-core';
import type { LocaleTranslate } from '@ckeditor/ckeditor5-utils';
import type { BookmarkEditing } from '@ckeditor/ckeditor5-bookmark';

import type {
  LinkDecoratorAutomaticDefinition,
  LinkDecoratorDefinition,
  LinkDecoratorManualDefinition
} from './linkconfig';

import type { LinkActionsViewOptions } from './ui/linkactionsview';

import { upperFirst } from 'lodash-es';

const ATTRIBUTE_WHITESPACES = /[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205f\u3000]/g; // eslint-disable-line no-control-regex

// SAFE_URL_TEMPLATE to only allow http and https protocols
const SAFE_URL_TEMPLATE = '^(?:(?:<protocols>):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))';

// The regex checks for the protocol syntax ('xxxx://' or 'xxxx:')
// or non-word characters at the beginning of the link ('/', '#' etc.).
const PROTOCOL_REG_EXP = /^((\w+:(\/{2,})?)|(\W))/i;

const DEFAULT_LINK_PROTOCOLS = [
  'http',
  'https'
];

/**
 * Returns `true` if a given view node is the link element.
 */
export function isLinkElement(node: ViewNode | ViewDocumentFragment): boolean {
  return node.is('attributeElement') &&
    !!node.getCustomProperty('alight-new-document-link');
}

/**
 * Creates a link {@link module:engine/view/attributeelement~AttributeElement} with the provided href attribute
 * and optionally a document title.
 */
export function createLinkElement(href: string, conversionApi: DowncastConversionApi, documentTitle?: string): ViewAttributeElement {
  const { writer } = conversionApi;

  // Start with default attributes
  const attributes: Record<string, string> = {
    href,
    'data-id': 'new-document_link'
  };

  // Add document title attribute if provided
  if (documentTitle) {
    attributes['data-document-title'] = documentTitle;
    console.log('Creating link element with documentTitle:', documentTitle);
  }

  // Priority 5 - https://github.com/ckeditor/ckeditor5-link/issues/121.
  const linkElement = writer.createAttributeElement('a', attributes, { priority: 5 });

  writer.setCustomProperty('alight-new-document-link', true, linkElement);

  return linkElement;
}

/**
 * Returns a safe URL based on a given value.
 *
 * A URL is considered safe if it is safe for the user (does not contain any malicious code).
 * Only http and https protocols are allowed.
 *
 * If a URL is considered unsafe, a simple `"#"` is returned.
 *
 * @internal
 */
export function ensureSafeUrl(url: unknown, allowedProtocols: Array<string> = []): string {
  // For document links, we don't enforce protocol restrictions
  // Just return the URL as-is if it doesn't have a protocol
  const urlString = String(url);

  // Check if URL has a protocol
  if (!urlString.includes('://')) {
    return urlString;
  }

  // If it has a protocol, apply standard safety checks
  const protocolsList = allowedProtocols.length ? allowedProtocols.join('|') : 'https|http';
  const customSafeRegex = new RegExp(`${SAFE_URL_TEMPLATE.replace('<protocols>', protocolsList)}`, 'i');

  return isSafeUrl(urlString, customSafeRegex) ? urlString : '#';
}

/**
 * Checks whether the given URL is safe for the user (does not contain any malicious code).
 */
function isSafeUrl(url: string, customRegexp: RegExp): boolean {
  const normalizedUrl = url.replace(ATTRIBUTE_WHITESPACES, '');

  return !!normalizedUrl.match(customRegexp);
}

/**
 * Returns the {@link module:link/linkconfig~LinkConfig#decorators `config.link.decorators`} configuration processed
 * to respect the locale of the editor, i.e. to display the {@link module:link/linkconfig~LinkDecoratorManualDefinition label}
 * in the correct language.
 *
 * **Note**: Only the few most commonly used labels are translated automatically. Other labels should be manually
 * translated in the {@link module:link/linkconfig~LinkConfig#decorators `config.link.decorators`} configuration.
 *
 * @param t Shorthand for {@link module:utils/locale~Locale#t Locale#t}.
 * @param decorators The decorator reference where the label values should be localized.
 */
export function getLocalizedDecorators(
  t: LocaleTranslate,
  decorators: Array<NormalizedLinkDecoratorDefinition>
): Array<NormalizedLinkDecoratorDefinition> {
  const localizedDecoratorsLabels: Record<string, string> = {
    'Open in a new tab': t('Open in a new tab'),
    'Downloadable': t('Downloadable')
  };

  decorators.forEach(decorator => {
    if ('label' in decorator && localizedDecoratorsLabels[decorator.label]) {
      decorator.label = localizedDecoratorsLabels[decorator.label];
    }

    return decorator;
  });

  return decorators;
}

/**
 * Converts an object with defined decorators to a normalized array of decorators. The `id` key is added for each decorator and
 * is used as the attribute's name in the model.
 */
export function normalizeDecorators(decorators?: Record<string, LinkDecoratorDefinition>): Array<NormalizedLinkDecoratorDefinition> {
  const retArray: Array<NormalizedLinkDecoratorDefinition> = [];

  if (decorators) {
    for (const [key, value] of Object.entries(decorators)) {
      const decorator = Object.assign(
        {},
        value,
        { id: `link${upperFirst(key)}` }
      );

      retArray.push(decorator);
    }
  }

  return retArray;
}

/**
 * Returns `true` if the specified `element` can be linked (the element allows the `alightNewDocumentLinkPluginHref` attribute).
 */
export function isLinkableElement(element: Element | null, schema: Schema): element is Element {
  if (!element) {
    return false;
  }

  return schema.checkAttribute(element.name, 'alightNewDocumentLinkPluginHref');
}

/**
 * Adds the protocol prefix to the specified `link` when:
 * 
 * it does not contain it already, and there is a {@link module:link/linkconfig~LinkConfig#defaultProtocol `defaultProtocol` }
 * configuration value provided.
 */
export function addLinkProtocolIfApplicable(link: string, defaultProtocol?: string): string {
  const isProtocolNeeded = !!defaultProtocol && !linkHasProtocol(link);
  return link && isProtocolNeeded ? defaultProtocol + link : link;
}

/**
 * Checks if protocol is already included in the link.
 */
export function linkHasProtocol(link: string): boolean {
  return PROTOCOL_REG_EXP.test(link);
}

/**
 * Creates the bookmark callbacks for handling link opening experience.
 */
export function createBookmarkCallbacks(editor: Editor): LinkActionsViewOptions {
  const bookmarkEditing: BookmarkEditing | null = editor.plugins.has('BookmarkEditing') ?
    editor.plugins.get('BookmarkEditing') :
    null;

  /**
   * Returns `true` when bookmark `id` matches the hash from `link`.
   */
  function isScrollableToTarget(link: string | undefined): boolean {
    return !!link &&
      link.startsWith('#') &&
      !!bookmarkEditing &&
      !!bookmarkEditing.getElementForBookmarkId(link.slice(1));
  }

  /**
   * Scrolls the view to the desired bookmark or open a link in new window.
   */
  function scrollToTarget(link: string): void {
    const bookmarkId = link.slice(1);
    const modelBookmark = bookmarkEditing!.getElementForBookmarkId(bookmarkId);

    editor.model.change(writer => {
      writer.setSelection(modelBookmark!, 'on');
    });

    editor.editing.view.scrollToTheSelection({
      alignToTop: true,
      forceScroll: true
    });
  }

  return {
    isScrollableToTarget,
    scrollToTarget
  };
}

/**
 * Gets only the domain part from a URL
 * @param url The URL to process
 * @returns Simplified domain display
 */
export function getDomainForDisplay(url: string): string {
  if (!url) return '';

  // Remove protocol
  let domain = url.replace(/^https?:\/\//, '');

  // Remove paths, query params, etc.
  const firstSlash = domain.indexOf('/');
  if (firstSlash > 0) {
    domain = domain.substring(0, firstSlash);
  }

  // If domain starts with www., remove it for cleaner display
  domain = domain.replace(/^www\./, '');

  return domain;
}

// ----- Form Validation and Submission Utilities -----

/**
 * Interface for validation errors
 */
export interface ValidationErrors {
  [key: string]: string;
}

/**
 * Interface for validation results
 */
export interface ValidationResult {
  isValid: boolean;
  errors?: ValidationErrors;
}

/**
 * Form validation utility class
 */
export class FormValidator {
  /**
   * Validates the entire form
   * @param formData The form data to validate
   * @returns Validation result with errors if any
   */
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
      errors['documentTitle'] = 'Please enter a document title';
    } else if (formData.documentTitle.length > 250) {
      errors['documentTitle'] = 'Title must be less than 250 characters';
    } else {
      // Check for invalid characters and identify them in the error message
      const invalidChars = formData.documentTitle.match(/[\\[\]:><\/\|\?"*,]/g);
      if (invalidChars) {
        const uniqueInvalidChars = [...new Set(invalidChars)].join(', ');
        errors['documentTitle'] = `Title contains invalid characters: ${uniqueInvalidChars}`;
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

  /**
   * Validates a single field
   * @param fieldName The name of the field to validate
   * @param value The value to validate
   * @returns Validation result with errors if any
   */
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

/**
 * Interface for form submission results
 */
export interface SubmissionResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Form submission handler utility class
 */
export class FormSubmissionHandler {
  private isSubmitting = false;
  private submitTimeout: number | null = null;

  /**
   * Creates a new FormSubmissionHandler instance
   * @param debounceTime Time in ms to prevent rapid resubmissions
   */
  constructor(private readonly debounceTime: number = 1000) { }

  /**
   * Simulates an API call for form submission
   * @param formData The form data to submit
   * @returns A promise that resolves to a submission result
   */
  private async mockApiCall(formData: FormData): Promise<SubmissionResult> {
    // Log the complete FormData before submission
    console.log('FormData being submitted:');
    for (const [key, value] of formData.entries()) {
      console.log(`${key}: ${value instanceof File ? value.name : value}`);
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // Convert FormData to a plain object for response
      const responseData: { [key: string]: any } = {
        id: `doc-${Date.now()}`,
        url: `https://example.com/documents/doc-${Date.now()}`,
        status: 'success',
        dnmDtoList: [{
          folderPath: formData.get('categories') ? "Categorized" : "Uncategorized",
          fileId: `file-${Date.now()}`,
          documentTitle: formData.get('documentTitle') || "SampleDoc",
          documentLanguage: formData.get('language') || "en_US",
          documentDescription: formData.get('description') || "",
          searchTags: formData.get('searchTags') || [],
          categories: formData.get('categories') || [],
          includeInContentLibrary: formData.get('contentLibraryAccess') === 'true',
          upointLink: formData.get('worklifeLink') === 'true',
          searchable: formData.get('showInSearch') === 'true'
        }]
      };

      // Log the response data
      console.log('API response data:', responseData);

      return {
        success: true,
        data: responseData
      };
    } catch (error) {
      console.error('Error in mock API call:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process form data'
      };
    }
  }

  /**
   * Submits the form data
   * @param formData The form data to submit
   * @returns A promise that resolves to a submission result
   */
  public async submitForm(formData: any): Promise<SubmissionResult> {
    // Prevent duplicate submissions
    if (this.isSubmitting) {
      return {
        success: false,
        error: 'Form submission already in progress'
      };
    }

    try {
      this.isSubmitting = true;

      // Log the raw form data before creating FormData
      console.log('Raw form data before submission:', formData);

      // Create FormData instance for file upload
      const submission = new FormData();

      // Append all form fields to FormData
      Object.entries(formData).forEach(([key, value]) => {
        if (value instanceof File) {
          submission.append(key, value);
        } else if (Array.isArray(value)) {
          submission.append(key, JSON.stringify(value));
        } else if (value !== null && value !== undefined) {
          submission.append(key, String(value));
        }
      });

      // Submit the form data
      const result = await this.mockApiCall(submission);

      // Set a timeout to prevent rapid resubmission
      this.submitTimeout = window.setTimeout(() => {
        this.resetSubmitState();
      }, this.debounceTime);

      return result;
    } catch (error) {
      console.error('Error in submitForm:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
    } finally {
      // Reset submission state after debounce time
      setTimeout(() => {
        this.resetSubmitState();
      }, this.debounceTime);
    }
  }

  /**
   * Resets the submission state
   */
  private resetSubmitState(): void {
    this.isSubmitting = false;
    if (this.submitTimeout) {
      window.clearTimeout(this.submitTimeout);
      this.submitTimeout = null;
    }
  }

  /**
   * Cancels an ongoing submission
   */
  public cancelSubmission(): void {
    this.resetSubmitState();
  }
}

/**
 * Handles form submission and creates a link with the result
 * @param contentManager The content manager instance
 * @param editor The editor instance
 * @param modalDialog The modal dialog instance
 */
export async function handleFormSubmission(contentManager: any, editor: any, modalDialog: any): Promise<void> {
  if (!contentManager) {
    return;
  }

  // Set hasUserInteracted to true when Continue is clicked
  contentManager.hasUserInteracted = true;

  // Validate the form
  const validation = contentManager.validateForm();
  if (!validation.isValid) {
    // Don't proceed if validation fails
    return;
  }

  try {
    // Get complete form data before submission
    const formData = contentManager.getFormData();

    // Log the complete form data to console
    console.log('Submitting new document link data:', formData);

    // Submit the form and get the result
    const result = await contentManager.submitForm();

    // Log the submission result
    console.log('New document link submission result:', result);

    if (result) {
      // Get folder path and document ID from the result
      const folderPath = result.dnmDtoList?.[0]?.folderPath || "";
      const documentId = result.id || `doc-${Date.now()}`;

      // Get document title from the form
      const documentTitle = formData.documentTitle || "";

      // Create direct link with folder path (no protocol)
      const href = `${folderPath}/${documentId}`;

      // Log the link that will be created
      console.log('Creating link with href:', href, 'and title:', documentTitle);

      // Execute the link command with document title
      editor.execute('alight-new-document-link', href, { documentTitle });

      // Close the modal
      if (modalDialog) {
        modalDialog.hide();
      }
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    // Show error in the modal
  }
}

export type NormalizedLinkDecoratorAutomaticDefinition = LinkDecoratorAutomaticDefinition & { id: string };
export type NormalizedLinkDecoratorManualDefinition = LinkDecoratorManualDefinition & { id: string };
export type NormalizedLinkDecoratorDefinition = NormalizedLinkDecoratorAutomaticDefinition | NormalizedLinkDecoratorManualDefinition;
