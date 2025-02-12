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
                    placeholder="example.com"
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
                Organization Name (optional): Specify the third-party organization to inform users about the link's destination.
            </p>
        </form>
    `;

  container.innerHTML = formContent;
  return container;
}

function normalizeUrl(value: string): string {
  const trimmedValue = value.trim();

  // If it already has a protocol, leave it as is
  if (trimmedValue.startsWith('http://') || trimmedValue.startsWith('https://')) {
    return trimmedValue;
  }

  // Remove any accidental protocol fragments if user partially typed them
  const cleanValue = trimmedValue
    .replace(/^(http:|https:|http|https|\/\/)/i, '')
    .replace(/^\/+/, '');

  // Add https:// protocol
  return `https://${cleanValue}`;
}

// function isValidUrl(value: string): boolean {
//   try {
//     const url = new URL(value);
//     return ['http:', 'https:'].includes(url.protocol);
//   } catch {
//     return false;
//   }
// }

export function validateForm(form: HTMLFormElement): boolean {
  const urlInput = form.querySelector('#link-url') as HTMLInputElement;
  const urlError = form.querySelector('#url-error') as HTMLDivElement;
  let value = urlInput.value.trim();

  // Reset previous validation state
  hideError(urlInput, urlError);

  // Empty check - required field
  if (!value) {
    showError(urlInput, urlError, 'URL is required.');
    return false;
  }

  // Normalize URL (add https:// if missing)
  value = normalizeUrl(value);

  // Check if it's a valid URL
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) {
      showError(urlInput, urlError, 'Invalid URL format.');
      return false;
    }

    // Update input with normalized URL
    urlInput.value = value;
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