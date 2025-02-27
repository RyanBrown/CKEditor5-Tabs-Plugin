// src/plugins/alight-balloon-link-plugin/modal-content/alight-balloon-link-plugin-modal-content-manager.ts

// Generates the modal content for the email link plugin.
// It creates a container with a form for entering an email address and an optional organization name.
// @param initialValue - An optional initial value for the email input.
// @param initialOrgName - An optional initial value for the organization name input.
// @returns An HTMLElement containing the form.

export function ContentManager(initialValue?: string, initialOrgName?: string): HTMLElement {
  // console.log('[ContentManager] Creating modal content with initialValue:', initialValue, 'and initialOrgName:', initialOrgName);
  // Create a container element for the form content.
  const container = document.createElement('div');

  // HTML structure for the form.
  // Uses template literals to inject initial values into the input fields.
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
            class="cka-input-text cka-width-100" 
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
            class="cka-input-text cka-width-100"
            value="${initialOrgName || ''}"
            placeholder="Organization name"
          />
        </div>

        <p class="note-text">
          Organization Name (optional): Specify the third-party organization to inform users about the email's origin.
        </p>
      </form>
  `;

  // Insert the form content into the container.
  container.innerHTML = formContent;
  // console.log('[ContentManager] Modal content created successfully.');

  return container;
}

// Validates an email address using a regular expression.
// This function checks for basic email format requirements.
// @param email - The email address to validate.
// @returns A boolean indicating whether the email is valid.
function isValidEmail(email: string): boolean {
  // console.log('[isValidEmail] Validating email:', email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
  // console.log('[isValidEmail] Email is valid:', isValid);
}

// Validates the form input by checking if a valid email address is provided.
// If the email starts with "mailto:" (in any variation of case), the prefix is stripped.
// Displays appropriate error messages if validation fails.
// @param form - The HTML form element containing the email input field.
// @returns A boolean indicating whether the form is valid.
export function validateForm(form: HTMLFormElement): boolean {
  // console.log('[validateForm] Validating form input.');

  // Retrieve the email input element and error message element.
  const emailInput = form.querySelector('#link-email') as HTMLInputElement;
  const emailError = form.querySelector('#email-error') as HTMLDivElement;
  let value = emailInput.value.trim();

  // If the email starts with "mailto:" (case-insensitive), strip the prefix.
  if (value.toLowerCase().startsWith('mailto:')) {
    // Log that a mailto: prefix was detected and is being stripped.
    console.log('[validateForm] "mailto:" prefix detected. Stripping it from the email address.');
    value = value.replace(/^mailto:/i, '').trim();
    emailInput.value = value; // Update the input field value.
  }

  // Reset any previous error messages.
  hideError(emailInput, emailError);
  // console.log('[validateForm] Previous errors cleared.');

  // Check if the email field is empty (it's required).
  if (!value) {
    // console.log('[validateForm] Email input is empty.');
    showError(emailInput, emailError, 'Email address is required.');
    return false;
  }

  // Validate the email format.
  if (!isValidEmail(value)) {
    // console.log('[validateForm] Email format is invalid.');
    showError(emailInput, emailError, 'Please enter a valid email address.');
    return false;
  }

  // console.log('[validateForm] Form input is valid.');
  return true;
}

// Displays an error message for an input field.
// Marks the input as invalid and shows the error message element.
// @param input - The input field to mark as invalid.
// @param errorElement - The corresponding error message element.
// @param message - The error message to display.
function showError(input: HTMLInputElement, errorElement: HTMLElement, message: string): void {
  // console.log('[showError] Showing error for input:', input, 'with message:', message);
  input.classList.add('invalid');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
}

// Hides any displayed error message for an input field.
// Removes the invalid state from the input.
// @param input - The input field to remove the error state from.
// @param errorElement - The error message element to hide.
function hideError(input: HTMLInputElement, errorElement: HTMLElement): void {
  // console.log('[hideError] Hiding error for input:', input);
  input.classList.remove('invalid');
  errorElement.style.display = 'none';
}
