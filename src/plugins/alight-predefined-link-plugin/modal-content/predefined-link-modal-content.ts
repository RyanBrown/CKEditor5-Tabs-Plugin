// src/plugins/alight-predefined-link-plugin/modal-content/predefined-link-modal-content.ts
import { ILinkManager } from './predefined-link-modal-ILinkManager';
import { PredefinedLink } from './predefined-link-modal-types';
import { SearchManager } from './predefined-link-modal-search';
import { PaginationManager } from './predefined-link-modal-pagination';
import predefinedLinksData from './json/predefined-test-data.json';
import './../styles/alight-predefined-link-plugin.scss';
export class PredefinedLinkModalContent implements ILinkManager {
  private selectedLink: PredefinedLink | null = null;
  private predefinedLinksData: PredefinedLink[] = predefinedLinksData.predefinedLinksDetails;
  private filteredLinksData: PredefinedLink[] = [...this.predefinedLinksData];
  private searchManager: SearchManager;
  private paginationManager: PaginationManager;

  constructor() {
    this.paginationManager = new PaginationManager(this.handlePageChange);
    this.searchManager = new SearchManager(this.predefinedLinksData, this.handleSearchResults, this.paginationManager);
  }

  public getSelectedLink(): { destination: string; title: string } | null {
    if (!this.selectedLink) return null;
    return {
      destination: this.selectedLink.destination,
      title: this.selectedLink.predefinedLinkName
    };
  }

  private handleSearchResults = (filteredData: PredefinedLink[]): void => {
    console.log('Search results updated:', filteredData.length, 'items'); // Debugging log

    this.filteredLinksData = filteredData;

    // Maintain selected link if still in filtered results, otherwise clear selection
    if (this.selectedLink && !filteredData.some(link => link.predefinedLinkName === this.selectedLink?.predefinedLinkName)) {
      this.selectedLink = null;
    }

    // Reset pagination
    this.paginationManager.setPage(1, filteredData.length);

    // Re-render the UI
    const container = document.querySelector('.cka-predefined-link-content') as HTMLElement;
    if (container) {
      console.log('Re-rendering content'); // Debugging log
      this.renderContent(container);
    }
  };

  private handlePageChange = (page: number): void => {
    const container = document.querySelector('.cka-predefined-link-content');
    if (container) {
      this.renderContent(container as HTMLElement);
    }
  };

  public resetSearch(): void {
    this.searchManager.reset();
    this.selectedLink = null;
    this.filteredLinksData = [...this.predefinedLinksData];

    const container = document.querySelector('.cka-predefined-link-content');
    if (container) {
      this.renderContent(container as HTMLElement);
    }
  }

  public renderContent(container: HTMLElement): void {
    container.innerHTML = this.buildContentForPage();
    this.searchManager.initialize(container);
    this.paginationManager.initialize(container, this.filteredLinksData.length);
    this.attachLinkSelectionListeners(container);

    // Ensure radio buttons reflect current selection after page change
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
        .map(link => `
            <div class="cka-link-item ${this.selectedLink?.predefinedLinkName === link.predefinedLinkName ? 'selected' : ''}" data-link-name="${link.predefinedLinkName}">
              <div class="radio-container">
                <cka-radio-button 
                  name="link-selection" 
                  value="${link.predefinedLinkName}" 
                  ${this.selectedLink?.predefinedLinkName === link.predefinedLinkName ? 'checked' : ''}
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
          `)
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

  private attachLinkSelectionListeners(container: HTMLElement): void {
    // Link item click handlers
    container.querySelectorAll('.cka-link-item').forEach(item => {
      item.addEventListener('click', (e: Event) => {
        if ((e.target as HTMLElement).closest('cka-radio-button')) return;

        const linkName = (e.currentTarget as HTMLElement).dataset.linkName;
        if (!linkName) return;

        this.selectedLink = this.predefinedLinksData.find(
          link => link.predefinedLinkName === linkName
        ) || null;

        // Update selected state visually
        container.querySelectorAll('.cka-link-item').forEach(otherItem => {
          otherItem.classList.remove('selected');
        });
        (e.currentTarget as HTMLElement).classList.add('selected');

        // Update radio buttons
        const radio = (e.currentTarget as HTMLElement).querySelector('cka-radio-button') as any;
        if (radio) {
          radio.checked = true;
          container.querySelectorAll('cka-radio-button').forEach(otherRadio => {
            if (otherRadio !== radio) {
              (otherRadio as any).checked = false;
            }
          });
        }
      });
    });

    // Radio button change handlers
    container.querySelectorAll('cka-radio-button').forEach(radio => {
      radio.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (!target.checked) return;

        const linkName = target.value;
        this.selectedLink = this.predefinedLinksData.find(
          link => link.predefinedLinkName === linkName
        ) || null;

        // Update selected state visually
        const linkItem = (target as HTMLElement).closest('.cka-link-item');
        if (linkItem) {
          container.querySelectorAll('.cka-link-item').forEach(item => {
            item.classList.remove('selected');
          });
          linkItem.classList.add('selected');
        }
      });
    });
  }
}