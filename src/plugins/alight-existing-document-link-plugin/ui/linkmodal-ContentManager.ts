// src/plugins/alight-existing-document-link/ui/linkmodal-ContentManager.ts
import { ILinkManager } from './linkmodal-ILinkManager';
import { DocumentLink } from './linkmodal-modal-types';
import { SearchManager } from './linkmodal-SearchManager';
import { PaginationManager } from './linkmodal-PaginationManager';
import '../../ui-components/alight-radio-component/alight-radio-component';

export class ContentManager implements ILinkManager {
  private selectedLink: DocumentLink | null = null;
  private existingDocumentLinksData: DocumentLink[] = [];
  private filteredLinksData: DocumentLink[] = [];
  private searchManager: SearchManager;
  private paginationManager: PaginationManager;
  private container: HTMLElement | null = null;
  private initialUrl: string = '';
  private loadingIndicator: HTMLElement | null = null;

  constructor(initialUrl: string = '', existingDocumentLinksData: DocumentLink[] = []) {
    this.initialUrl = initialUrl;
    this.existingDocumentLinksData = existingDocumentLinksData;
    this.filteredLinksData = [...this.existingDocumentLinksData];

    // If we have an initial URL, try to find and preselect the matching link
    if (initialUrl) {
      this.selectedLink = this.existingDocumentLinksData.find(
        link => link.serverFilePath === initialUrl
      ) || null;
    }

    this.paginationManager = new PaginationManager(this.handlePageChange.bind(this));
    this.searchManager = new SearchManager(
      this.existingDocumentLinksData,
      this.handleSearchResults.bind(this),
      this.paginationManager
    );
  }

  public getSelectedLink(): { destination: string; title: string } | null {
    if (!this.selectedLink) return null;
    return {
      destination: this.selectedLink.serverFilePath,
      title: this.selectedLink.title
    };
  }

  // Helper for URL normalization - this is used by external callers
  public normalizeUrl(url: string): string {
    if (!url) return '';

    // Remove trailing slash
    let normalized = url.endsWith('/') ? url.slice(0, -1) : url;

    // Simplify protocol for comparison
    normalized = normalized.replace(/^https?:\/\//, '');

    return normalized.toLowerCase();
  }

  private handleSearchResults = (filteredData: DocumentLink[]): void => {
    console.log('Search results updated:', filteredData.length, 'items');

    this.filteredLinksData = filteredData;

    // Maintain selected link if still in filtered results, otherwise clear selection
    if (this.selectedLink && !filteredData.some(link => link.serverFilePath === this.selectedLink?.serverFilePath)) {
      this.selectedLink = null;
    }

    // Re-render the UI
    if (this.container) {
      console.log('Re-rendering content');
      this.renderContent(this.container);
    }
  };

  private handlePageChange = (page: number): void => {
    if (this.container) {
      this.renderContent(this.container);
    }
  };

  public resetSearch(): void {
    this.searchManager.reset();
    this.selectedLink = null;
    this.filteredLinksData = [...this.existingDocumentLinksData];

    if (this.container) {
      this.renderContent(this.container);
    }
  }

  public renderContent(container: HTMLElement): void {
    this.container = container;
    container.innerHTML = this.buildContentForPage();

    // Initialize components in correct order
    this.initializeComponents(container);
  }

  private initializeComponents(container: HTMLElement): void {
    // Initialize search first as it sets up the search container
    this.searchManager.initialize(container);

    // Then initialize pagination
    this.paginationManager.initialize(container, this.filteredLinksData.length);

    // Finally attach link selection listeners
    this.attachLinkSelectionListeners(container);

    // Ensure radio buttons reflect current selection
    if (this.selectedLink) {
      const selectedRadio = container.querySelector(`cka-radio-button[value="${this.selectedLink.serverFilePath}"]`) as any;
      if (selectedRadio) {
        selectedRadio.checked = true;
      }
    }
  }

  private buildContentForPage(): string {
    // Check if we have data yet
    if (this.existingDocumentLinksData.length === 0) {
      return `
      <div class="cka-loading-container">
        <div class="cka-loading-spinner"></div>
      </div>
    `;
    }

    const currentPage = this.paginationManager.getCurrentPage();
    const pageSize = this.paginationManager.getPageSize();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, this.filteredLinksData.length);
    const currentPageData = this.filteredLinksData.slice(startIndex, endIndex);

    // Search container
    const searchContainerMarkup = `<div id="search-container-root" class="cka-search-container"></div>`;

    // Current URL info if we have an initial URL
    const currentUrlInfo = this.initialUrl ? this.buildCurrentUrlInfoMarkup() : '';

    // Links list
    const linksMarkup = currentPageData.length > 0
      ? currentPageData
        .map(link => this.buildLinkItemMarkup(link))
        .join('')
      : '<div class="cka-no-results">No results found.</div>';

    // Pagination container
    const paginationMarkup = `<div id="pagination-container" class="cka-pagination"></div>`;

    return `
    ${searchContainerMarkup}
    ${currentUrlInfo}
    <div id="links-container">
      ${linksMarkup}
    </div>
    ${paginationMarkup}
  `;
  }

  private buildCurrentUrlInfoMarkup(): string {
    // Find the matching link for this URL
    const matchingLink = this.existingDocumentLinksData.find(link =>
      link.serverFilePath === this.initialUrl
    );

    if (!matchingLink) {
      return `
      <div class="current-url-info">
        <h3><strong>Current Link URL:</strong> ${this.initialUrl}</h3>
        <div class="cka-note-message">This URL is not in the existing document links list.</div>
      </div>
    `;
    }

    // Use the shared link markup function but customize for current link context
    return `
    <div class="current-url-info">
      <h3>Current Selected Link</h3>
      ${this.buildLinkItemMarkup(matchingLink, true, 'current-link')}
    </div>
  `;
  }

  private buildLinkItemMarkup(
    link: DocumentLink,
    forceSelected: boolean = false,
    radioGroupName: string = 'link-selection'
  ): string {
    const isSelected = forceSelected || this.selectedLink?.serverFilePath === link.serverFilePath;

    return `
      <div class="cka-link-item ${isSelected ? 'selected' : ''}" data-link-name="${link.serverFilePath}">
        <div class="radio-container">
          <cka-radio-button 
            name="${radioGroupName}" 
            value="${link.serverFilePath}" 
            ${isSelected ? 'checked' : ''}
          >
          </cka-radio-button>
        </div>
        <ul>
          <li><strong>${link.title}</strong></li>
          <li><strong>Population:</strong> ${link.population}</li>
          <li><strong>Language:</strong> ${link.locale}</li>
          <li><strong>File Type:</strong> ${link.fileType}</li>
        </ul>
      </div>
    `;
  }

  private attachLinkSelectionListeners(container: HTMLElement): void {
    // Link item click handlers
    container.querySelectorAll('.cka-link-item').forEach(item => {
      item.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;
        // Ignore clicks on the radio button itself and on any links
        if (target.closest('cka-radio-button') || target.tagName === 'A') return;

        const linkName = (item as HTMLElement).dataset.linkName;
        if (!linkName) return;

        this.handleLinkSelection(linkName, item as HTMLElement);
      });
    });

    // Radio button change handlers
    container.querySelectorAll('cka-radio-button').forEach(radio => {
      radio.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (!target.checked) return;

        const linkItem = target.closest('.cka-link-item');
        if (!linkItem) return;

        const linkName = (linkItem as HTMLElement).dataset.linkName;
        if (linkName) {
          this.handleLinkSelection(linkName, linkItem as HTMLElement);
        }
      });
    });
  }

  private handleLinkSelection(linkName: string, linkItem: HTMLElement): void {
    this.selectedLink = this.existingDocumentLinksData.find(
      link => link.serverFilePath === linkName
    ) || null;

    // Update selected state visually
    const container = linkItem.closest('.cka-existing-document-link-content');
    if (container) {
      container.querySelectorAll('.cka-link-item').forEach(item => {
        item.classList.remove('selected');
      });
      linkItem.classList.add('selected');

      // Update radio buttons
      container.querySelectorAll('cka-radio-button').forEach(radio => {
        (radio as any).checked = false;
      });
      const radio = linkItem.querySelector('cka-radio-button') as any;
      if (radio) {
        radio.checked = true;
      }
    }
  }
}
