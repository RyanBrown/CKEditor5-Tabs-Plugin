// src/plugins/alight-predefined-link-plugin/modal-content/predefined-link-modal-content.ts
import { CKAlightModalDialog } from '../../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { ILinkManager } from './ILinkManager';
import { PredefinedLink } from './types';
import { SearchManager } from './search';
import { PaginationManager } from './pagination';
import predefinedLinksData from './json/predefined-test-data.json';

export class PredefinedLinkModalContent implements ILinkManager {
  private selectedLink: PredefinedLink | null = null;
  private predefinedLinksData: PredefinedLink[] = predefinedLinksData.predefinedLinksDetails;
  private filteredLinksData: PredefinedLink[] = [...this.predefinedLinksData];
  private dialog?: CKAlightModalDialog;
  private searchManager: SearchManager;
  private paginationManager: PaginationManager;

  constructor() {
    this.searchManager = new SearchManager(this.predefinedLinksData, this.handleSearchResults);
    this.paginationManager = new PaginationManager(this.handlePageChange);
  }

  public setDialog(dialog: CKAlightModalDialog): void {
    this.dialog = dialog;
  }

  public getSelectedLink(): { destination: string; title: string } | null {
    if (!this.selectedLink) return null;
    return {
      destination: this.selectedLink.destination,
      title: this.selectedLink.predefinedLinkName
    };
  }

  private handleSearchResults = (filteredData: PredefinedLink[]): void => {
    this.filteredLinksData = filteredData;
    this.paginationManager.setPage(1, filteredData.length);
    this.renderContent(document.querySelector('.cka-predefined-link-content') as HTMLElement);
  };

  private handlePageChange = (page: number): void => {
    this.renderContent(document.querySelector('.cka-predefined-link-content') as HTMLElement);
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
  }

  private buildContentForPage(): string {
    const currentPage = this.paginationManager.getCurrentPage();
    const pageSize = this.paginationManager.getPageSize();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, this.filteredLinksData.length);
    const currentPageData = this.filteredLinksData.slice(startIndex, endIndex);

    // Get unique filter options
    const baseOrClientSpecificOptions = Array.from(new Set(this.predefinedLinksData.map(item => item.baseOrClientSpecific))).sort();
    const pageTypeOptions = Array.from(new Set(this.predefinedLinksData.map(item => item.pageType))).sort();
    const domainOptions = Array.from(new Set(this.predefinedLinksData.map(item => item.domain))).sort();

    const currentSearchQuery = this.searchManager.getCurrentSearchQuery();
    const selectedFilters = this.searchManager.getSelectedFilters();

    // Basic search container
    // Search container
    const searchContainerMarkup = `<div id="search-container-root"></div>`;

    // Links list
    const linksMarkup = currentPageData.length > 0
      ? currentPageData
        .map(link => `
            <div class="cka-link-item" data-link-name="${link.predefinedLinkName}">
              <div class="radio-container">
                <cka-radio-button 
                  name="link-selection" 
                  value="${link.predefinedLinkName}" 
                  ${this.selectedLink?.predefinedLinkName === link.predefinedLinkName ? 'initialvalue="true"' : ''}
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
    const paginationMarkup = `<div id="pagination-container"></div>`;

    return `
      ${searchContainerMarkup}
      <div id="links-container" class="cka-links-container">
        ${linksMarkup}
      </div>
      ${paginationMarkup}
    `;
  }

  private createCheckboxList(
    options: string[],
    filterType: string,
    title: string,
    selectedFilters: Record<string, string[]>
  ): string {
    return `
      <div class="filter-section">
        <h4>${title}</h4>
        <ul class="checkbox-list">
          ${options.map(option => {
      const checked = selectedFilters[filterType].includes(option) ? 'initialvalue="true"' : '';
      return `
              <li>
                <cka-checkbox data-filter-type="${filterType}" data-value="${option}" ${checked}>
                  ${option}
                </cka-checkbox>
              </li>
            `;
    }).join('')}
        </ul>
      </div>
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
      });
    });
  }
}