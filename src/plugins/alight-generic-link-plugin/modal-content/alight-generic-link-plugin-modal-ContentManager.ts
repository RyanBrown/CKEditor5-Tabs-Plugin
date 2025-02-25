// src/plugins/alight-generic-link-plugin/modal-content/public-website.ts
import './../../ui-components/alight-radio-component/alight-radio-component';

interface PublicLinkData {
  url?: string;
  orgName?: string;
}

/**
 * Creates and returns an HTML form element to collect public link information.
 * This form includes fields for a URL and an optional organization name.
 *
 * @param initialValue - The initial value for the URL input field.
 * @param initialOrgName - The initial value for the organization name input field.
 * @returns A container div element containing the form.
 */
export function ContentManager(initialValue?: string, initialOrgName?: string): HTMLElement {
  const container = document.createElement('div');

  // HTML structure for the form
  const formContent = `
      <form id="generic-link-form" class="ck-form">
        <div class="ck-form-group">
          <label for="link-url" class="cka-input-label">
            URL
          </label>
          <input 
            type="url" 
            id="link-url" 
            name="url" 
            class="cka-input-text block" 
            required
            value="${initialValue || ''}"
            placeholder="example.com"
          />
          <div 
            class="cka-error-message" 
            id="url-error" 
            style="display: none;"
          >
            Please enter a valid URL.
          </div>
        </div>
          
        <div class="ck-form-group mt-3">
          <label for="org-name" class="cka-input-label">
            Organization Name (optional)
          </label>
          <input 
            type="text" 
            id="org-name" 
            name="displayText" 
            class="cka-input-text block"
            value="${initialOrgName || ''}"
            placeholder="Organization name"
          />
        </div>

        <div>
          <h3 class="cka-link-type-heading">Choose a Link Type</h3>

          <ul class="cka-radio-group">
            <li>
              <div class="radio-container">
                <cka-radio-button 
                  name="link-type" 
                  value="external" 
                  label="External link"
                ></cka-radio-button>
              </div>
            </li>
            <li>
              <div class="radio-container">
                <cka-radio-button 
                  name="link-type" 
                  value="internal" 
                  label="Internal Link"
                ></cka-radio-button>
              </div>
            </li>
            <li>
              <div class="radio-container">
                <cka-radio-button 
                  name="link-type" 
                  value="email" 
                  label="Email Link"
                ></cka-radio-button>
              </div>
            </li>
          </ul>
        </div>
          
        <p class="cka-note-text">
          Organization Name (optional): Specify the third-party organization to inform users about the link's destination.
        </p>
      </form>
  `;

  container.innerHTML = formContent;
  return container;
}

/**
 * Normalizes a given URL by ensuring it has a proper protocol.
 * If no protocol is provided, it defaults to 'https://'.
 *
 * @param value - The input URL string.
 * @returns A properly formatted URL string.
 */
function normalizeUrl(value: string): string {
  const trimmedValue = value.trim();

  // If it already has a protocol, return as is
  if (trimmedValue.startsWith('http://') || trimmedValue.startsWith('https://')) {
    return trimmedValue;
  }

  // Remove any accidental protocol fragments if user partially typed them
  const cleanValue = trimmedValue
    .replace(/^(http:|https:|http|https|\/\/)/i, '')
    .replace(/^\/+/, '');

  // Add default protocol
  return `https://${cleanValue}`;
}

/**
 * Validates the form input by checking if a valid URL is provided.
 * Normalizes the URL if necessary and updates the input field accordingly.
 *
 * @param form - The HTML form element containing the URL input field.
 * @returns A boolean indicating whether the form is valid.
 */
export function validateForm(form: HTMLFormElement): boolean {
  const urlInput = form.querySelector('#link-url') as HTMLInputElement;
  const urlError = form.querySelector('#url-error') as HTMLDivElement;
  let value = urlInput.value.trim();

  // Reset any previous error messages
  hideError(urlInput, urlError);

  // Check if the URL field is empty (it's required)
  if (!value) {
    showError(urlInput, urlError, 'URL is required.');
    return false;
  }

  // Normalize the URL input
  value = normalizeUrl(value);

  // Validate the URL format
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
      showError(urlInput, urlError, 'Invalid URL format.');
      return false;
    }

    // If valid, update the input field with the normalized URL
    urlInput.value = value;
    return true;
  } catch (error) { // Added error parameter to catch block to satisfy the parser
    showError(urlInput, urlError, 'Please enter a valid URL.');
    return false;
  }
}

/**
 * Displays an error message for an input field.
 *
 * @param input - The input field to mark as invalid.
 * @param errorElement - The corresponding error message element.
 * @param message - The error message to display.
 */
function showError(input: HTMLInputElement, errorElement: HTMLElement, message: string): void {
  input.classList.add('invalid');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
}

/**
 * Hides any displayed error message for an input field.
 *
 * @param input - The input field to remove the error state from.
 * @param errorElement - The error message element to hide.
 */
function hideError(input: HTMLInputElement, errorElement: HTMLElement): void {
  input.classList.remove('invalid');
  errorElement.style.display = 'none';
}
