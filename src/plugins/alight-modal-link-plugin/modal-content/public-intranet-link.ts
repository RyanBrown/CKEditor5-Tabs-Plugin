// src/plugins/alight-link-plugin/modal-content/public-intranet-link.ts
import { BalloonLinkManager, BalloonAction } from './ILinkManager';
import editIcon from '../assets/icon-pencil.svg';
import unlinkIcon from '../assets/icon-unlink.svg';
import type { Editor } from '@ckeditor/ckeditor5-core';

export class PublicIntranetLinkManager extends BalloonLinkManager {
  private selectedLink: { destination: string; title: string } | null = null;
  private isIntranet: boolean;
  private baseUrl: string;
  private existingHref: string = '';
  private existingOrgName: string = '';

  constructor(editor: Editor, baseUrl: string, isIntranet: boolean) {
    super(editor);
    this.isIntranet = isIntranet;
    this.baseUrl = baseUrl;
  }

  override getEditActions(): BalloonAction[] {
    return [
      {
        label: 'Edit Link',
        icon: editIcon,
        execute: () => {
          const link = this.getSelectedLink();
          if (link) {
            // Depending on intranet vs. public:
            this.editor.execute(this.isIntranet ? 'linkOption3' : 'linkOption2');
          }
          this.hideBalloon();
        }
      },
      {
        label: 'Remove Link',
        icon: unlinkIcon,
        execute: () => {
          this.editor.execute('unlink');
          this.hideBalloon();
        }
      }
    ];
  }

  // Override showBalloon() so we can apply custom balloon classes for intranet or public website links.
  override showBalloon(selection: any): void {
    // Call the parent method to position/show the default balloon.
    super.showBalloon(selection);

    // Once the balloon is shown, add the custom class.
    const balloonPanel = this.balloon.view.element;
    if (balloonPanel) {
      // If it's intranet, use `.intranet-link-balloon`; otherwise `.public-website-link-balloon`.
      balloonPanel.classList.add(
        this.isIntranet ? 'intranet-link-balloon' : 'public-website-link-balloon'
      );
    }
  }

  override getLinkContent(page: number): string {
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
            value="${this.escapeHtml(urlInputValue)}"
            placeholder="Enter URL..." 
          />
        </div>
        <div class="form-group">
          <label for="org-name-input">Organization Name:</label>
          <input 
            type="text" 
            id="org-name-input" 
            class="cka-input-text" 
            value="${this.escapeHtml(orgNameValue)}"
            placeholder="Enter organization name..." 
          />
        </div>
      </div>
    `;
  }

  override renderContent(container: HTMLElement): void {
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

  override resetSearch(): void {
    this.selectedLink = null;
    this.existingHref = '';
    this.existingOrgName = '';
  }

  override getSelectedLink(): { destination: string; title: string } | null {
    return this.selectedLink;
  }

  private handleUrlSelection(url: string, title: string): void {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    this.selectedLink = { destination: fullUrl, title };
  }

  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

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
