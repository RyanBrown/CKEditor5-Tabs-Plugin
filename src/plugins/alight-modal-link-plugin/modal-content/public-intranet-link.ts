// src/plugins/alight-link-plugin/modal-content/public-intranet-link.ts
import { ILinkManager } from './ILinkManager';

export class PublicIntranetLinkManager implements ILinkManager {
  private selectedLink: { destination: string; title: string } | null = null;
  private isIntranet: boolean;
  private baseUrl: string;
  private existingHref: string = '';
  private existingOrgName: string = '';

  constructor(baseUrl: string, isIntranet: boolean) {
    this.isIntranet = isIntranet;
    this.baseUrl = baseUrl;
  }

  public getSelectedLink(): { destination: string; title: string } | null {
    return this.selectedLink;
  }

  public getLinkContent(page: number): string {
    const urlInputValue = this.existingHref || '';
    const orgNameValue = this.existingOrgName || '';

    return `
      <div class="cka-url-link-content">
        <div class="form-group">
          <label for="url-input">URL:</label>
          <input 
            type="text" 
            id="url-input" 
            class="cka-input-text" 
            value="${urlInputValue}"
            placeholder="Enter URL..." 
          />
        </div>
        <div class="form-group">
          <label for="org-name-input">Organization Name:</label>
          <input 
            type="text" 
            id="org-name-input" 
            class="cka-input-text" 
            value="${orgNameValue}"
            placeholder="Enter organization name..." 
          />
        </div>
      </div>
    `;
  }

  public renderContent(container: HTMLElement): void {
    // Add URL input listener
    const urlInput = container.querySelector('#url-input') as HTMLInputElement;
    const orgNameInput = container.querySelector('#org-name-input') as HTMLInputElement;

    if (urlInput) {
      urlInput.addEventListener('change', (e) => {
        const url = (e.target as HTMLInputElement).value;
        const title = orgNameInput?.value || url;
        this.handleUrlSelection(url, title);
        this.existingHref = url;
      });
    }

    if (orgNameInput) {
      orgNameInput.addEventListener('change', (e) => {
        const orgName = (e.target as HTMLInputElement).value;
        this.existingOrgName = orgName;
        if (this.selectedLink) {
          this.selectedLink.title = orgName;
        }
      });
    }
  }

  private handleUrlSelection(url: string, title: string): void {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    this.selectedLink = { destination: fullUrl, title };
  }

  public resetSearch(): void {
    this.selectedLink = null;
    this.existingHref = '';
    this.existingOrgName = '';
  }

  // Helper method to prevent XSS
  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Getters for form values
  getUrl(): string {
    return this.existingHref;
  }

  getOrgName(): string {
    return this.existingOrgName;
  }

  getIsIntranet(): boolean {
    return this.isIntranet;
  }
}