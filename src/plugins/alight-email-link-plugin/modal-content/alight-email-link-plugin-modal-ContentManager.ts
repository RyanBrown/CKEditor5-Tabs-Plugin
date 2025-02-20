// src/plugins/alight-email-link-plugin/modal-content/alight-email-link-plugin-modal-content-manager.ts

export function ContentManager(initialValue?: string, initialOrgName?: string): HTMLElement {
  const container = document.createElement('div');

  // HTML structure for the form
  const formContent = `
      <form id="email-link-form" class="ck-form">
        <div class="ck-form-group">
          <label for="link-email" class="cka-input-label">
            Email Address
          </label>
          <input 
            type="email" 
            id="link-email" 
            name="email" 
            class="cka-input-text block" 
            required
            value="${initialValue || ''}"
            placeholder="user@example.com"
          />
          <div 
            class="error-message" 
            id="email-error" 
            style="display: none;"
          >
            Please enter a valid email address.
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

        <p class="note-text">
          Organization Name (optional): Specify the third-party organization to inform users about the email's origin.
        </p>
      </form>
  `;

  container.innerHTML = formContent;
  return container;
}

/**
 * Validates an email address using a regular expression.
 * This checks for basic email format requirements.
 *
 * @param email - The email address to validate.
 * @returns A boolean indicating whether the email is valid.
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates the form input by checking if a valid email address is provided.
 *
 * @param form - The HTML form element containing the email input field.
 * @returns A boolean indicating whether the form is valid.
 */
export function validateForm(form: HTMLFormElement): boolean {
  const emailInput = form.querySelector('#link-email') as HTMLInputElement;
  const emailError = form.querySelector('#email-error') as HTMLDivElement;
  const value = emailInput.value.trim();

  // Reset any previous error messages
  hideError(emailInput, emailError);

  // Check if the email field is empty (it's required)
  if (!value) {
    showError(emailInput, emailError, 'Email address is required.');
    return false;
  }

  // Validate the email format
  if (!isValidEmail(value)) {
    showError(emailInput, emailError, 'Please enter a valid email address.');
    return false;
  }

  return true;
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