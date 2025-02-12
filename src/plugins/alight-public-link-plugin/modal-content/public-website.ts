// src/plugins/alight-public-link-plugin/modal-content/public-website.ts
export function createPublicLinkModalContent(initialValue?: string): HTMLElement {
  const container = document.createElement('div');
  container.className = 'public-link-form';

  const formContent = `
        <div class="form-group">
            <label for="url">Website URL</label>
            <input 
                type="url" 
                name="url" 
                id="url" 
                class="form-control" 
                placeholder="https://"
                value="${initialValue || ''}"
                required
            />
            <div class="form-help">
                Enter the full URL including http:// or https://
            </div>
        </div>
    `;

  container.innerHTML = formContent;

  // Add validation
  const input = container.querySelector('input[name="url"]') as HTMLInputElement;
  input.addEventListener('input', () => {
    const isValid = isValidUrl(input.value);
    input.classList.toggle('is-invalid', !isValid);
  });

  return container;
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}