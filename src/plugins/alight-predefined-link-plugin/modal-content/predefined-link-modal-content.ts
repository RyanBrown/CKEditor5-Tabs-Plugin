// src/plugins/alight-link-plugin/modal-content/predefined-link.ts

import predefinedLinksData from './json/predefined-test-data.json';
import { CKAlightModalDialog } from '../../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
import { CKALightSelectMenu } from '../../ui-components/alight-select-menu-component/alight-select-menu-component';
import { AlightOverlayPanel } from '../../ui-components/alight-overlay-panel-component/alight-overlay-panel';
import '../../ui-components/alight-checkbox-component/alight-checkbox-component';
import '../../ui-components/alight-radio-component/alight-radio-component';
import { ILinkManager } from './ILinkManager';

// Interface for selected filters
interface SelectedFilters {
  [key: string]: string[];
  baseOrClientSpecific: string[];
  pageType: string[];
  domain: string[];
}

// A single Predefined Link record from JSON
interface PredefinedLink {
  predefinedLinkName: string;
  predefinedLinkDescription: string;
  baseOrClientSpecific: string;
  pageType: string;
  destination: string;
  domain: string;
  uniqueId: string;
  attributeName: string;
  attributeValue: string;
}

// Manages all logic for Predefined Links (filters, search, pagination)
export class PredefinedLinkModalContent implements ILinkManager {
  // Overlay panel configuration
  private overlayPanelConfig = {
    width: '600px',
    height: 'auto'
  };

  // Currently selected link
  private selectedLink: PredefinedLink | null = null;

  // Data from JSON
  private predefinedLinksData: PredefinedLink[] = predefinedLinksData.predefinedLinksDetails;
  // Filtered subset
  private filteredLinksData: PredefinedLink[] = [...this.predefinedLinksData];

  // Internal state
  private currentSearchQuery = '';
  private currentPage = 1;
  private readonly pageSize = 5;
  private readonly advancedSearchTriggerId = 'advanced-search-trigger';
  private overlayPanel: AlightOverlayPanel | null = null;

  // Selected filters
  private selectedFilters: SelectedFilters = {
    baseOrClientSpecific: [],
    pageType: [],
    domain: []
  };

  private dialog?: CKAlightModalDialog;

  // Add method to set dialog reference
  public setDialog(dialog: CKAlightModalDialog): void {
    this.dialog = dialog;
  }

  // Returns the currently selected link or null if none selected
  public getSelectedLink(): { destination: string; title: string } | null {
    if (!this.selectedLink) return null;
    return {
      destination: this.selectedLink.destination,
      title: this.selectedLink.predefinedLinkName
    };
  }

  private closeOverlayPanel(): void {
    const container = document.querySelector('.cka-predefined-link-content');
    if (container) {
      const overlayPanel = container.querySelector('.cka-overlay-panel');
      if (overlayPanel) {
        const closeBtn = overlayPanel.querySelector('.cka-close-btn') as HTMLButtonElement;
        if (closeBtn) {
          closeBtn.click();
        }
      }
    }
  }

  private updateFilteredData(): void {
    this.filteredLinksData = this.predefinedLinksData.filter(link => {
      // Check search query match
      const searchMatch = !this.currentSearchQuery || [
        link.predefinedLinkName,
        link.predefinedLinkDescription
      ].some(field => field.toLowerCase().includes(this.currentSearchQuery.toLowerCase()));

      // Check filter matches
      const baseOrClientSpecificMatch =
        this.selectedFilters.baseOrClientSpecific.length === 0 ||
        this.selectedFilters.baseOrClientSpecific.includes(link.baseOrClientSpecific);

      const pageTypeMatch =
        this.selectedFilters.pageType.length === 0 ||
        this.selectedFilters.pageType.includes(link.pageType);

      const domainMatch =
        this.selectedFilters.domain.length === 0 ||
        this.selectedFilters.domain.includes(link.domain);

      return searchMatch && baseOrClientSpecificMatch && pageTypeMatch && domainMatch;
    });

    // Reset to first page when filters change
    this.currentPage = 1;
  }

  public resetSearch(): void {
    this.currentSearchQuery = '';
    this.selectedLink = null;
    this.selectedFilters = {
      baseOrClientSpecific: [],
      pageType: [],
      domain: []
    };
    this.filteredLinksData = [...this.predefinedLinksData];
    this.currentPage = 1;

    // Reset UI elements if they exist
    const container = document.querySelector('.cka-predefined-link-content');
    if (container) {
      // Reset search inputs
      const inputs = container.querySelectorAll('input[type="text"]') as NodeListOf<HTMLInputElement>;
      inputs.forEach(input => {
        input.value = '';
      });

      // Reset checkboxes
      const checkboxes = container.querySelectorAll('cka-checkbox') as NodeListOf<any>;
      checkboxes.forEach(checkbox => {
        checkbox.checked = false;
      });

      // Re-render content
      this.renderContent(container as HTMLElement);
    }
  }

  public renderContent(container: HTMLElement): void {
    // Update filtered data before rendering
    this.updateFilteredData();

    // Insert HTML
    container.innerHTML = this.buildContentForPage(this.currentPage);

    // Setup overlay panel
    const triggerEl = container.querySelector(`#${this.advancedSearchTriggerId}`);
    if (triggerEl) {
      this.overlayPanel = new AlightOverlayPanel(triggerEl as HTMLElement, this.overlayPanelConfig);
    }

    // Initialize pagination
    const totalPages = Math.ceil(this.filteredLinksData.length / this.pageSize);
    this.initializePageSelect(container, this.currentPage, totalPages);

    // Attach event listeners
    this.attachEventListeners(container);
  }

  private attachEventListeners(container: HTMLElement): void {
    // Search inputs
    const searchInputs = container.querySelectorAll('input[type="text"]');
    searchInputs.forEach(input => {
      input.addEventListener('input', (e: Event) => {
        const value = (e.target as HTMLInputElement).value;
        this.currentSearchQuery = value;

        // Sync other search input if it exists
        searchInputs.forEach(otherInput => {
          if (otherInput !== e.target) {
            (otherInput as HTMLInputElement).value = value;
          }
        });
      });
    });

    // Checkboxes
    const checkboxes = container.querySelectorAll('cka-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLInputElement;
        const filterType = target.dataset.filterType as keyof SelectedFilters;
        const value = target.dataset.value;

        if (filterType && value) {
          if (target.checked) {
            if (!this.selectedFilters[filterType].includes(value)) {
              this.selectedFilters[filterType].push(value);
            }
          } else {
            this.selectedFilters[filterType] = this.selectedFilters[filterType].filter(v => v !== value);
          }
        }
      });
    });

    // Apply Filters button
    const applyFiltersBtn = container.querySelector('#apply-advanced-search');
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', () => {
        this.updateFilteredData();
        this.renderContent(container);
        this.closeOverlayPanel();
      });
    }

    // Clear Filters button
    const clearFiltersBtn = container.querySelector('#clear-advanced-search');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        this.resetSearch();
        this.closeOverlayPanel();
      });
    }

    // Main search button
    const searchBtn = container.querySelector('#search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.updateFilteredData();
        this.renderContent(container);
      });
    }

    // Reset search button
    const resetSearchBtn = container.querySelector('#reset-search-btn');
    if (resetSearchBtn) {
      resetSearchBtn.addEventListener('click', () => {
        this.resetSearch();
      });
    }

    // Link selection
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

    // Attach pagination listeners
    this.attachPaginationListeners(container);
  }

  private buildContentForPage(page: number): string {
    // Clamp the requested page
    const totalItems = this.filteredLinksData.length;
    const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
    page = Math.max(1, Math.min(page, totalPages));
    this.currentPage = page;

    // Get the current page subset
    const startIndex = (page - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, totalItems);
    const currentPageData = this.filteredLinksData.slice(startIndex, endIndex);

    // Compute unique filter options
    const baseOrClientSpecificOptions = this.getUniqueValues(this.predefinedLinksData, 'baseOrClientSpecific');
    const pageTypeOptions = this.getUniqueValues(this.predefinedLinksData, 'pageType');
    const domainOptions = this.getUniqueValues(this.predefinedLinksData, 'domain');

    // Basic and Advanced Search markup
    const searchContainerMarkup = `
      <div id="search-container" class="cka-search-container">
        <div class="cka-search-input-container">
          <input type="text" id="search-input" class="cka-search-input" placeholder="Search by link name..." value="${this.currentSearchQuery}" />
          <button id="reset-search-btn" class="cka-button cka-button-rounded cka-button-text">Reset</button>
          <button id="${this.advancedSearchTriggerId}" data-panel-id="advanced-search-panel" class="cka-button cka-button-rounded cka-button-text">
            Advanced Search
          </button>
        </div>
        <button id="search-btn" class="cka-button cka-button-rounded cka-button-outlined">Search</button>
      </div>
    `;

    const advancedSearchPanelMarkup = `
      <div class="cka-overlay-panel" data-id="advanced-search-panel">
        <header>
          <h3>Advanced Search</h3>
          <button class="cka-close-btn">×</button>
        </header>
        <main class="advanced-search-content">
          <div class="search-filters">
            ${this.createCheckboxList(baseOrClientSpecificOptions, 'baseOrClientSpecific', 'Base/Client Specific')}
            ${this.createCheckboxList(pageTypeOptions, 'pageType', 'Page Type')}
            ${this.createCheckboxList(domainOptions, 'domain', 'Domain')}
          </div>
          <div class="form-group">
            <input type="text" id="advanced-search-input" placeholder="Search by link name..." value="${this.currentSearchQuery}" />
          </div>
        </main>
        <footer>
          <button id="clear-advanced-search" class="cka-button cka-button-rounded cka-button-outlined cka-button-sm">Clear Filters</button>
          <button id="apply-advanced-search" class="cka-button cka-button-rounded cka-button-sm">Apply Filters</button>
        </footer>
      </div>
    `;

    // Render link items
    const linksMarkup = currentPageData.length > 0
      ? currentPageData
        .map(link => `
            <div class="cka-link-item" data-link-name="${link.predefinedLinkName}">
              <div class="radio-container">
                <cka-radio-button name="link-selection" value="${link.predefinedLinkName}" 
                  ${this.selectedLink?.predefinedLinkName === link.predefinedLinkName ? 'initialvalue="true"' : ''}>
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

    // Pagination controls
    const paginationMarkup = totalPages > 1
      ? `
        <article id="pagination" class="cka-pagination">
          <button id="first-page" class="first pagination-btn cka-button cka-button-text" data-page="1" ${page === 1 ? 'disabled' : ''}>First</button>
          <button id="prev-page" class="previous pagination-btn cka-button cka-button-text" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>Previous</button>
          <div id="page-select-container" class="cka-select-menu-wrap"></div>
          <button id="next-page" class="next pagination-btn cka-button cka-button-text" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>Next</button>
          <button id="last-page" class="last pagination-btn cka-button cka-button-text" data-page="${totalPages}" ${page === totalPages ? 'disabled' : ''}>Last</button>
        </article>
      `
      : '';

    return `
      ${searchContainerMarkup}
      ${advancedSearchPanelMarkup}
      <div id="links-container" class="cka-links-container">
        ${linksMarkup}
      </div>
      ${paginationMarkup}
    `;
  }

  private attachPaginationListeners(container: HTMLElement): void {
    const paginationDiv = container.querySelector('#pagination');
    paginationDiv?.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      if (!target.matches('.pagination-btn')) return;
      const pageAttr = target.getAttribute('data-page');
      if (!pageAttr) return;
      const newPage = parseInt(pageAttr, 10);
      const totalPages = Math.ceil(this.filteredLinksData.length / this.pageSize);
      if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages && newPage !== this.currentPage) {
        this.currentPage = newPage;
        this.renderContent(container);
      }
    });
  }

  // Creates the select menu for pagination
  private initializePageSelect(container: HTMLElement, pageNum: number, totalPages: number): void {
    const pageSelectContainer = container.querySelector('#page-select-container') as HTMLElement | null;
    if (!pageSelectContainer) return;

    const pageOptions = Array.from({ length: totalPages }, (_, i) => ({
      label: `${i + 1} of ${totalPages}`,
      value: i + 1
    }));

    const pageSelect = new CKALightSelectMenu({
      options: pageOptions,
      value: pageNum,
      placeholder: `Page ${pageNum} of ${totalPages}`,
      onChange: (selectedValue) => {
        if (selectedValue && typeof selectedValue === 'number' && selectedValue !== this.currentPage) {
          this.currentPage = selectedValue;
          this.renderContent(container);
        }
      }
    });

    pageSelectContainer.innerHTML = '';
    pageSelect.mount(pageSelectContainer);
  }

  // Returns a sorted array of unique values for a given key
  private getUniqueValues(data: PredefinedLink[], key: keyof PredefinedLink): string[] {
    return Array.from(new Set(data.map(item => item[key]))).sort();
  }

  // Builds a set of checkboxes for a given filter type
  private createCheckboxList(options: string[], filterType: keyof SelectedFilters, title: string): string {
    return `
      <div class="filter-section">
        <h4>${title}</h4>
        <ul class="checkbox-list">
          ${options.map(option => {
      const checked = this.selectedFilters[filterType].includes(option) ? 'initialvalue="true"' : '';
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
}