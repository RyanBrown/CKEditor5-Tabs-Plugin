// src/plugins/alight-balloon-link-plugin/modal-content/alight-balloon-link-plugin-modal-content-manager.ts

// Generates the modal content for the email link plugin.
// It creates a container with a form for entering an email address.
// @param initialValue - An optional initial value for the email input.
// @returns An HTMLElement containing the form.

export function ContentManager(initialValue?: string): HTMLElement {
  // console.log('[ContentManager] Creating modal content with initialValue:', initialValue);
  // Create a container element for the form content.
  const container = document.createElement('div');

  // HTML structure for the form.
  // Uses template literals to inject initial values into the input fields.
  const formContent = `
     <h1>Balloon Modal Plugin</h1></h1>
  `;

  // Insert the form content into the container.
  container.innerHTML = formContent;
  // console.log('[ContentManager] Modal content created successfully.');

  return container;
}
