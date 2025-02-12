// src/plugins/alight-public-link-plugin/modal-content/public-website.ts

interface PublicLinkData {
  url?: string;
  orgName?: string;
}

export function createPublicLinkModalContent(initialValue?: string, initialOrgName?: string): HTMLElement {
  const container = document.createElement('div');

  const formContent = `
        <form id="public-link-form" class="ck-form">
            <div class="ck-form-group">
                <label for="link-url" class="cka-input-label">
                    URL
                    <span class="ck-required">*</span>
                </label>
                <input 
                    type="url" 
                    id="link-url" 
                    name="url" 
                    class="cka-input-text" 
                    required
                    value="${initialValue || ''}"
                    placeholder="https://example.com"
                />
                <div 
                    class="error-message" 
                    id="url-error" 
                    style="display: none; color: red; font-size: 12px; margin-top: 4px;"
                >
                    Please enter a valid URL.
                </div>
            </div>
            
            <div class="ck-form-group mt-3">
                <label for="org-name" class="cka-input-label">
                    Organization Name (optional)*
                </label>
                <input 
                    type="text" 
                    id="org-name" 
                    name="displayText" 
                    class="cka-input-text"
                    value="${initialOrgName || ''}"
                    placeholder="Organization name"
                />
            </div>
            
            <p class="mt-5 mb-0">
                *Enter the third-party organization to inform users the destination of the link.
            </p>
        </form>
    `;

  container.innerHTML = formContent;

  // Add validation
  setupFormValidation(container);

  return container;
}

function setupFormValidation(container: HTMLElement): void {
  const form = container.querySelector('#public-link-form') as HTMLFormElement;
  const urlInput = form.querySelector('#link-url') as HTMLInputElement;
  const urlError = form.querySelector('#url-error') as HTMLDivElement;

  urlInput.addEventListener('input', () => {
    validateUrl(urlInput, urlError);
  });

  urlInput.addEventListener('blur', () => {
    validateUrl(urlInput, urlError);
  });
}

function validateUrl(input: HTMLInputElement, errorElement: HTMLElement): boolean {
  const value = input.value.trim();

  // Empty check - required field
  if (!value) {
    showError(input, errorElement, 'URL is required.');
    return false;
  }

  // URL format check
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
      showError(input, errorElement, 'URL must start with http:// or https://');
      return false;
    }
    hideError(input, errorElement);
    return true;
  } catch {
    showError(input, errorElement, 'Please enter a valid URL.');
    return false;
  }
}

function showError(input: HTMLInputElement, errorElement: HTMLElement, message: string): void {
  input.classList.add('is-invalid');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
}

function hideError(input: HTMLInputElement, errorElement: HTMLElement): void {
  input.classList.remove('is-invalid');
  errorElement.style.display = 'none';
}