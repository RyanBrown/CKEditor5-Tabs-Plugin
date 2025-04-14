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

  // Add callback for link selection events
  public onLinkSelected: ((link: DocumentLink | null) => void) | null = null;

  constructor(initialUrl: string = '', existingDocumentLinksData: DocumentLink[] = []) {
    this.initialUrl = initialUrl;
    ` `
    // Log the received data for debugging
    console.log('ContentManager constructor - received document links count:', existingDocumentLinksData?.length || 0);
    if (existingDocumentLinksData && existingDocumentLinksData.length > 0) {
      console.log('Sample of first document link:', existingDocumentLinksData[0]);
    }

    // Ensure we store all document links - add extra safety to handle potential null/undefined
    this.existingDocumentLinksData = existingDocumentLinksData?.length ? [...existingDocumentLinksData] : [];
    this.filteredLinksData = [...this.existingDocumentLinksData];

    console.log('ContentManager initialized with links:', {
      received: existingDocumentLinksData?.length || 0,
      stored: this.existingDocumentLinksData.length,
      filtered: this.filteredLinksData.length,
      sample: this.existingDocumentLinksData.slice(0, 2)
    });

    // If we have an initial URL, try to find and preselect the matching link
    if (initialUrl) {
      this.selectedLink = this.existingDocumentLinksData.find(
        link => link.serverFilePath === initialUrl
      ) || null;

      if (this.selectedLink) {
        console.log('Found matching link for initial URL:', this.selectedLink);
      } else {
        console.log('No matching link found for initial URL:', initialUrl);
      }
    }

    // We want to show all documents without pagination
    const largePageSize = Number.MAX_SAFE_INTEGER;
    this.paginationManager = new PaginationManager(this.handlePageChange.bind(this), largePageSize);
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

      // Notify of link deselection
      if (this.onLinkSelected) {
        this.onLinkSelected(null);
      }
    }

    // Re-render the UI
    if (this.container) {
      console.log('Re-rendering content after search');
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

    // Notify of link deselection
    if (this.onLinkSelected) {
      this.onLinkSelected(null);
    }

    if (this.container) {
      this.renderContent(this.container);
    }
  }

  public renderContent(container: HTMLElement): void {
    console.log('Rendering content with filtered links:', this.filteredLinksData.length);
    this.container = container;
    container.innerHTML = this.buildContentForPage();

    // Initialize components in correct order
    this.initializeComponents(container);
  }

  private initializeComponents(container: HTMLElement): void {
    // Initialize search first as it sets up the search container
    this.searchManager.initialize(container);

    // Pagination is hidden since we're showing all items

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

    // Show all filtered links at once instead of paginating
    const linksToDisplay = this.filteredLinksData;
    console.log('Building page content with links to display:', linksToDisplay.length);

    // Search container
    const searchContainerMarkup = `<div id="search-container-root" class="cka-search-container"></div>`;

    // Current URL info if we have an initial URL
    const currentUrlInfo = this.initialUrl ? this.buildCurrentUrlInfoMarkup() : '';

    // Add a count of displayed items
    const itemCountMarkup = `
      <div class="cka-links-count">
        Showing ${linksToDisplay.length} of ${this.existingDocumentLinksData.length} documents
      </div>
    `;

    // Links list
    const linksMarkup = linksToDisplay.length > 0
      ? linksToDisplay
        .map(link => this.buildLinkItemMarkup(link))
        .join('')
      : '<div class="cka-center-modal-message">No results found.</div>';

    // Pagination container - hidden but kept for compatibility
    const paginationMarkup = `<div id="pagination-container" class="cka-pagination" style="display:none;"></div>`;

    return `
    ${searchContainerMarkup}
    ${currentUrlInfo}
    ${itemCountMarkup}
    <div id="links-container" class="cka-links-container" style="max-height: 60vh; overflow-y: auto;">
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
    // Safety check for link properties
    if (!link) return '';

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
          <li><strong>${link.title || 'No Title'}</strong></li>
          <li><strong>Population:</strong> ${link.population || 'Unknown'}</li>
          <li><strong>Language:</strong> ${link.locale || 'Unknown'}</li>
          <li><strong>File Type:</strong> ${link.fileType || 'Unknown'}</li>
          ${link.documentDescription ? `<li><strong>Description:</strong> ${link.documentDescription}</li>` : ''}
          <li class="wrap-text"><strong>Path:</strong> ${link.serverFilePath || 'No URL'}</li>
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

    console.log('Link selected:', this.selectedLink);

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

    // Call the selection callback if it exists
    if (this.onLinkSelected) {
      this.onLinkSelected(this.selectedLink);
    }
  }
}
