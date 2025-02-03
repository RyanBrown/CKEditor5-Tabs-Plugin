// src/plugins/alight-image-plugin/modal-content/existing-image.ts

export async function getExistingImageContent(): Promise<string> {
  // Placeholder content for public website links
  return `
    <div class="existing-image-content">
      <h1>Existing Image Content</h1>
    </div>
  `;
}

// Add the renderContent function
export function renderContent(container: HTMLElement): void {
  // Add any initialization logic for the existing image content here
  // For example, setting up event listeners, initializing components, etc.
  console.log('Initializing existing image content');
}