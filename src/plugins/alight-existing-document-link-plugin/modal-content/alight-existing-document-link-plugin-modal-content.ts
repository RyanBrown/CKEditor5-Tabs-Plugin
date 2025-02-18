// src/plugins/alight-predefined-link-plugin/modal-content/predefined-link-modal-content.ts
import { LinkManager } from './alight-existing-document-link-plugin-modal-LinkManager';
import { PredefinedLink } from './alight-existing-document-link-plugin-modal-types';
import { SearchManager } from './alight-existing-document-link-plugin-modal-search';
import { PaginationManager } from './alight-existing-document-link-plugin-modal-pagination';
import predefinedLinksData from './json/predefined-test-data.json';
import './../styles/alight-existing-document-link-plugin.scss';

export class PredefinedLinkModalContent implements LinkManager {
  private selectedLink: PredefinedLink | null = null;
  private predefinedLinksData: PredefinedLink[] = predefinedLinksData.predefinedLinksDetails;
  private filteredLinksData: PredefinedLink[] = [...this.predefinedLinksData];
  private searchManager: SearchManager;
  private paginationManager: PaginationManager;
  private container: HTMLElement | null = null;

  constructor() {
    this.paginationManager = new PaginationManager(this.handlePageChange.bind(this));
    this.searchManager = new SearchManager(
      this.predefinedLinksData,
      this.handleSearchResults.bind(this),
      this.paginationManager
    );
  }

  public getSelectedLink(): { destination: string; title: string } | null {
    if (!this.selectedLink) return null;
    return {
      destination: this.selectedLink.destination,
      title: this.selectedLink.predefinedLinkName
    };
  }

  private handleSearchResults = (filteredData: PredefinedLink[]): void => {
    console.log('Search results updated:', filteredData.length, 'items');

    this.filteredLinksData = filteredData;

    // Maintain selected link if still in filtered results, otherwise clear selection
    if (this.selectedLink && !filteredData.some(link => link.predefinedLinkName === this.selectedLink?.predefinedLinkName)) {
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
    this.filteredLinksData = [...this.predefinedLinksData];

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
      const selectedRadio = container.querySelector(`cka-radio-button[value="${this.selectedLink.predefinedLinkName}"]`) as any;
      if (selectedRadio) {
        selectedRadio.checked = true;
      }
    }
  }

  private buildContentForPage(): string {
    const currentPage = this.paginationManager.getCurrentPage();
    const pageSize = this.paginationManager.getPageSize();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, this.filteredLinksData.length);
    const currentPageData = this.filteredLinksData.slice(startIndex, endIndex);

    // Search container
    const searchContainerMarkup = `<div id="search-container-root" class="cka-search-container"></div>`;

    // Links list
    const linksMarkup = currentPageData.length > 0
      ? currentPageData
        .map(link => this.buildLinkItemMarkup(link))
        .join('')
      : '<p>No results found.</p>';

    // Pagination container
    const paginationMarkup = `<div id="pagination-container" class="cka-pagination"></div>`;

    return `
      ${searchContainerMarkup}
      <div id="links-container" class="cka-links-container">
        ${linksMarkup}
      </div>
      ${paginationMarkup}
    `;
  }

  private buildLinkItemMarkup(link: PredefinedLink): string {
    const isSelected = this.selectedLink?.predefinedLinkName === link.predefinedLinkName;

    return `
      <div class="cka-link-item ${isSelected ? 'selected' : ''}" data-link-name="${link.predefinedLinkName}">
        <div class="radio-container">
          <cka-radio-button 
            name="link-selection" 
            value="${link.predefinedLinkName}" 
            ${isSelected ? 'checked' : ''}
          >
          </cka-radio-button>
        </div>
        <ul>
          <li><strong>${link.predefinedLinkName}</strong></li>
          <li><strong>Description:</strong> ${link.predefinedLinkDescription}</li>
          <li><strong>Base/Client Specific:</strong> ${link.baseOrClientSpecific}</li>
          <li><strong>Page Type:</strong> ${link.pageType}</li>
          <li><strong>Destination:</strong> ${link.destination}</li>
          <li><strong>Domain:</strong> ${link.domain}</li>
          <li><strong>Unique ID:</strong> ${link.uniqueId}</li>
          <li><strong>Attribute Name:</strong> ${link.attributeName}</li>
          <li><strong>Attribute Value:</strong> ${link.attributeValue}</li>
        </ul>
      </div>
    `;
  }

  private attachLinkSelectionListeners(container: HTMLElement): void {
    // Link item click handlers
    container.querySelectorAll('.cka-link-item').forEach(item => {
      item.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;
        // Ignore clicks on the radio button itself
        if (target.closest('cka-radio-button')) return;

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
    this.selectedLink = this.predefinedLinksData.find(
      link => link.predefinedLinkName === linkName
    ) || null;

    // Update selected state visually
    const container = linkItem.closest('.cka-predefined-link-content');
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