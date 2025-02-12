// src/plugins/alight-public-link-plugin/modal-content/public-website.ts
import { isValidUrl, sanitizeUrl } from '../alight-public-link-plugin-utils';

interface PublicWebsiteFormData {
  href?: string;
  orgName?: string;
}

function createFormHTML(data: PublicWebsiteFormData = {}): string {
  const { href = '', orgName = '' } = data;

  return `
    <form id="public-link-form" class="ck-form public-link-form">
      <div class="ck-form-group">
        <label for="link-url" class="cka-input-label">
          URL <span class="ck-required">*</span>
        </label>
        <input
          type="url"
          id="link-url"
          name="url"
          class="cka-input-text"
          required
          value="${href}"
          placeholder="https://example.com"
        />
        <div class="error-message" id="url-error" style="display: none; color: red; font-size: 12px; margin-top: 4px;">
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
          value="${orgName}"
          placeholder="Organization name"
        />
      </div>

      <p class="mt-5 mb-0">
        *Enter the third-party organization to inform users the destination of the link.
      </p>
    </form>
  `;
}

function setupFormValidation(container: HTMLElement) {
  const form = container.querySelector('#public-link-form') as HTMLFormElement;
  const urlInput = form.querySelector('#link-url') as HTMLInputElement;
  const errorElement = form.querySelector('#url-error') as HTMLDivElement;
  const submitButton = container.querySelector('button.cka-button-primary') as HTMLButtonElement;

  function validateUrl(input: HTMLInputElement): boolean {
    const url = input.value.trim();

    if (!url) {
      errorElement.textContent = 'URL is required.';
      errorElement.style.display = 'block';
      input.classList.add('error');
      submitButton.disabled = true;
      return false;
    }

    try {
      const urlToValidate = url.startsWith('http') ? url : 'https://' + url;
      new URL(urlToValidate);

      errorElement.style.display = 'none';
      input.classList.remove('error');
      submitButton.disabled = false;
      return true;
    } catch {
      errorElement.textContent = 'Please enter a valid URL.';
      errorElement.style.display = 'block';
      input.classList.add('error');
      submitButton.disabled = true;
      return false;
    }
  }

  urlInput.addEventListener('input', () => validateUrl(urlInput));
  urlInput.addEventListener('change', () => validateUrl(urlInput));

  if (urlInput.value) {
    validateUrl(urlInput);
  }

  return {
    validate: () => validateUrl(urlInput)
  };
}

export function getPublicWebsiteContent(data: PublicWebsiteFormData = {}): {
  html: string;
  setup: (container: HTMLElement) => {
    validate: () => boolean;
  };
} {
  return {
    html: createFormHTML(data),
    setup: setupFormValidation
  };
}