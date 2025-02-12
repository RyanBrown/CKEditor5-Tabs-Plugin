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
                </label>
                <input 
                    type="url" 
                    id="link-url" 
                    name="url" 
                    class="cka-input-text block" 
                    required
                    value="${initialValue || ''}"
                    placeholder="https://example.com"
                />
                <div 
                    class="error-message" 
                    id="url-error" 
                    style="display: none;"
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
                    class="cka-input-text block"
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
  return container;
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

export function validateForm(form: HTMLFormElement): boolean {
  const urlInput = form.querySelector('#link-url') as HTMLInputElement;
  const urlError = form.querySelector('#url-error') as HTMLDivElement;
  const value = urlInput.value.trim();

  // Reset previous validation state
  hideError(urlInput, urlError);

  // Empty check - required field
  if (!value) {
    showError(urlInput, urlError, 'URL is required.');
    return false;
  }

  // URL format check
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
      showError(urlInput, urlError, 'URL must start with http:// or https://');
      return false;
    }
    return true;
  } catch {
    showError(urlInput, urlError, 'Please enter a valid URL.');
    return false;
  }
}

function showError(input: HTMLInputElement, errorElement: HTMLElement, message: string): void {
  input.classList.add('invalid');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
}

function hideError(input: HTMLInputElement, errorElement: HTMLElement): void {
  input.classList.remove('invalid');
  errorElement.style.display = 'none';
}