// src/plugins/alight-image-plugin/modal-content/predefined-link.ts
import predefinedLinksData from './json/predefined-test-data.json';
import { AlightOverlayPanel } from '../../ui-components/alight-overlay-panel-component/alight-overlay-panel';
import { CKALightSelectMenu } from '../../ui-components/alight-select-menu-component/alight-select-menu-component';
import '../../ui-components/alight-checkbox-component/alight-checkbox-component';
import '../../ui-components/alight-radio-component/alight-radio-component';

// Define interfaces for type safety
interface SelectedFilters {
  [key: string]: string[];
  baseOrClientSpecific: string[];
  pageType: string[];
  domain: string[];
}

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

/**
 * This class encapsulates the entire functionality related to 
 * displaying, filtering, and paginating the predefined links.
 */
export class PredefinedLinkManager {
  // Configuration for the overlay panel
  private overlayPanelConfig = {
    width: '600px',  // Optional: Add your desired width
    height: 'auto'   // Optional: Add your desired height
  };

  // Data from JSON
  private predefinedLinksData: PredefinedLink[] = predefinedLinksData.predefinedLinksDetails;

  // State management
  private filteredLinksData: PredefinedLink[] = [...this.predefinedLinksData];
  private currentSearchQuery = '';
  private currentPage = 1;
  private readonly pageSize = 5;
  private readonly advancedSearchTriggerId = 'advanced-search-trigger-image';

  // Initialize selected filters with empty arrays
  private selectedFilters: SelectedFilters = {
    baseOrClientSpecific: [],
    pageType: [],
    domain: []
  };

  constructor() {
    // Any initialization if needed
  }

  // Returns a sorted array of unique values for a given key.
  private getUniqueValues(data: PredefinedLink[], key: keyof PredefinedLink): string[] {
    return Array.from(new Set(data.map(item => item[key]))).sort();
  }

  // Creates the checkbox list markup for a given filter type.
  private createCheckboxList(options: string[], filterType: keyof SelectedFilters, title: string): string {
    return `
      <div class="filter-section">
        <h4>${title}</h4>
        <ul class="checkbox-list">
          ${options.map(option => `
            <li>
              <cka-checkbox 
                data-filter-type="${filterType}"
                data-value="${option}"
                ${this.selectedFilters[filterType].includes(option) ? 'initialvalue="true"' : ''}
              >${option}</cka-checkbox>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  // Currently it's a private method; make it public to return the HTML string:
  public getPredefinedLinkContent(page: number): string {
    // everything that was previously in the private getPredefinedLinkContent method
    const totalItems = this.filteredLinksData.length;
    const totalPages = Math.ceil(totalItems / this.pageSize) || 1;

    // Validate and adjust page number
    page = Math.max(1, Math.min(page, totalPages));
    this.currentPage = page; // Update state

    // Calculate page slice
    const startIndex = (page - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, totalItems);
    const currentPageData = this.filteredLinksData.slice(startIndex, endIndex);

    // Get filter options
    const baseOrClientSpecificOptions = this.getUniqueValues(this.predefinedLinksData, 'baseOrClientSpecific');
    const pageTypeOptions = this.getUniqueValues(this.predefinedLinksData, 'pageType');
    const domainOptions = this.getUniqueValues(this.predefinedLinksData, 'domain');

    // Create UI components
    const searchContainerMarkup = `
      <div id="search-container" class="cka-search-container">
        <input type="text" id="search-input" placeholder="Search by link name..." value="${this.currentSearchQuery}" />
        <button id="reset-search-btn">Reset</button>
        <button id="${this.advancedSearchTriggerId}" data-panel-id="advanced-search-panel" class="cka-button cka-button-rounded cka-button-text">Advanced Search</button>
        <button id="search-btn" class="cka-button cka-button-rounded cka-button-outlined">Search</button>
      </div>
    `;

    // Create the advanced search panel markup
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
            <input type="text" id="advanced-search-input" placeholder="Search by link name..." />
          </div>
        </main>
        <footer>
          <button id="clear-advanced-search" class="cka-button cka-button-rounded cka-button-outlined cka-button-sm">Clear Filters</button>
          <button id="apply-advanced-search" class="cka-button cka-button-rounded cka-button-sm">Apply Filters</button>
        </footer>
      </div>
    `;

    // Generate HTML for link items
    const linksMarkup = currentPageData.length > 0
      ? currentPageData
        .map(link => `
            <div class="cka-link-item" data-link-name="${link.predefinedLinkName}">
              <div class="radio-container">
                <cka-radio-button
                  name="link-selection"
                  value="${link.predefinedLinkName}"
                  label=""
                ></cka-radio-button>
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

    const paginationMarkup = totalPages > 1 ? `
      <article id="pagination" class="cka-pagination">
        <button id="first-page" class="pagination-btn" data-page="1" ${page === 1 ? 'disabled' : ''}>First</button>
        <button id="prev-page" class="pagination-btn" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>Previous</button>
        <div id="page-select-container" class="cka-select-menu-wrap"></div>
        <button id="next-page" class="pagination-btn" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>Next</button>
        <button id="last-page" class="pagination-btn" data-page="${totalPages}" ${page === totalPages ? 'disabled' : ''}>Last</button>
      </article>
    ` : '';

    return `
      ${searchContainerMarkup}
      ${advancedSearchPanelMarkup}
      <div id="links-container">
        ${linksMarkup}
      </div>
      ${paginationMarkup}
    `;
  }

  // Initialize the custom Select Menu for pagination.
  private initializePageSelect(container: HTMLElement, pageNum: number, totalPages: number): void {
    const pageSelectContainer = container.querySelector('#page-select-container');
    if (!pageSelectContainer || !(pageSelectContainer instanceof HTMLElement)) return;

    const pageOptions = Array.from({ length: totalPages }, (_, i) => ({
      label: `Page ${i + 1} of ${totalPages}`,
      value: i + 1
    }));

    const pageSelect = new CKALightSelectMenu({
      options: pageOptions,
      value: pageNum,
      placeholder: `Page ${pageNum} of ${totalPages}`,
      onChange: (selectedValue) => {
        if (selectedValue && typeof selectedValue === 'number' && selectedValue !== this.currentPage) {
          // Update the internal currentPage
          this.currentPage = selectedValue;
          console.log('Select menu changing page to:', this.currentPage); // Debug log
          this.renderContent(container);
        }
      }
    });

    pageSelectContainer.innerHTML = '';
    pageSelect.mount(pageSelectContainer);
  }

  // Applies the current search and filter criteria to the data.
  private applyFilters(): void {
    this.filteredLinksData = this.predefinedLinksData.filter((link: PredefinedLink) => {
      const nameMatch = !this.currentSearchQuery ||
        link.predefinedLinkName.toLowerCase().includes(this.currentSearchQuery.toLowerCase());

      const baseOrClientSpecificMatch = this.selectedFilters.baseOrClientSpecific.length === 0 ||
        this.selectedFilters.baseOrClientSpecific.includes(link.baseOrClientSpecific);

      const pageTypeMatch = this.selectedFilters.pageType.length === 0 ||
        this.selectedFilters.pageType.includes(link.pageType);

      const domainMatch = this.selectedFilters.domain.length === 0 ||
        this.selectedFilters.domain.includes(link.domain);

      return nameMatch && baseOrClientSpecificMatch && pageTypeMatch && domainMatch;
    });

    // Reset to first page when filters change
    this.currentPage = 1;
  }

  // Event handler for checkbox changes.
  private handleCheckboxChange = (event: Event): void => {
    const checkbox = event.target as HTMLInputElement;
    if (!checkbox || !('checked' in checkbox)) return;

    const filterType = checkbox.dataset.filterType as keyof SelectedFilters;
    const value = checkbox.dataset.value;

    if (!filterType || !value) return;

    if (checkbox.checked) {
      if (!this.selectedFilters[filterType].includes(value)) {
        this.selectedFilters[filterType].push(value);
      }
    } else {
      this.selectedFilters[filterType] = this.selectedFilters[filterType].filter(v => v !== value);
    }
  };

  // Resets all filters and search criteria to default state.
  public resetSearch(): void {
    this.currentSearchQuery = '';
    this.selectedFilters = {
      baseOrClientSpecific: [],
      pageType: [],
      domain: []
    };
    this.filteredLinksData = [...this.predefinedLinksData];
    this.currentPage = 1;
  }

  // Handles pagination button clicks (First, Previous, Next, Last).
  private handlePaginationClick = (event: Event, container: HTMLElement): void => {
    const target = event.target as HTMLElement;
    if (!target.matches('.pagination-btn')) return;

    const pageAttr = target.getAttribute('data-page');
    if (!pageAttr) return;

    const newPage = parseInt(pageAttr, 10);
    const totalPages = Math.ceil(this.filteredLinksData.length / this.pageSize);

    if (isNaN(newPage) || newPage < 1 || newPage > totalPages || newPage === this.currentPage) return;

    console.log(`Changing page from ${this.currentPage} to ${newPage}`); // Debug log
    this.currentPage = newPage;
    this.renderContent(container);
  };

  // Attaches all necessary event listeners to the container.
  private attachEventListeners(container: HTMLElement): void {
    // Link selection
    const linkItems = container.querySelectorAll('.cka-link-item');
    linkItems.forEach(item => {
      item.addEventListener('click', (event) => {
        // Prevent triggering if clicking directly on the radio button
        if ((event.target as HTMLElement).closest('cka-radio-button')) return;

        const linkName = (event.currentTarget as HTMLElement).getAttribute('data-link-name');
        if (!linkName) return;
        // Find the radio button within this link item
        const radio = (event.currentTarget as HTMLElement).querySelector('cka-radio-button') as any;
        if (radio) {
          // Set the radio button's checked state
          radio.checked = true;
          radio.value = linkName;
          // Dispatch both change and input events to ensure proper state updates
          radio.dispatchEvent(new Event('change', { bubbles: true }));
          radio.dispatchEvent(new Event('input', { bubbles: true }));

          container.querySelectorAll('cka-radio-button').forEach(otherRadio => {
            if (otherRadio !== radio) {
              (otherRadio as any).checked = false;
            }
          });
        }
      });
    });

    // Search functionality
    const searchBtn = container.querySelector('#search-btn') as HTMLButtonElement;
    const searchInput = container.querySelector('#search-input') as HTMLInputElement;
    const resetSearchBtn = container.querySelector('#reset-search-btn');
    const applyAdvancedSearch = container.querySelector('#apply-advanced-search');
    const clearAdvancedSearch = container.querySelector('#clear-advanced-search');
    const paginationDiv = container.querySelector('#pagination');

    // Checkbox listeners
    container.querySelectorAll('cka-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', this.handleCheckboxChange);
    });

    // Search button
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.currentSearchQuery = searchInput?.value || '';
        this.applyFilters();
        this.renderContent(container);
      });
    }

    // Search input enter key
    if (searchInput) {
      searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && searchBtn) {
          event.preventDefault();
          searchBtn.click();
        }
      });
    }

    // Reset button
    if (resetSearchBtn instanceof HTMLElement) {
      resetSearchBtn.addEventListener('click', () => {
        this.resetSearch();
        if (searchInput) searchInput.value = '';
        this.renderContent(container);
      });
    }

    // Advanced search buttons
    if (applyAdvancedSearch instanceof HTMLElement) {
      applyAdvancedSearch.addEventListener('click', () => {
        this.applyFilters();
        this.renderContent(container);
      });
    }

    if (clearAdvancedSearch instanceof HTMLElement) {
      clearAdvancedSearch.addEventListener('click', () => {
        this.resetSearch();
        this.renderContent(container);
      });
    }

    // Pagination
    if (paginationDiv) {
      paginationDiv.addEventListener('click', (event) => this.handlePaginationClick(event, container));
    }
  }

  // Renders the main content (filters, search, pagination, etc.) into the given container.
  public renderContent(container: HTMLElement): void {
    const content = this.getPredefinedLinkContent(this.currentPage);
    container.innerHTML = content;

    // Initialize overlay panel
    const trigger = document.getElementById(this.advancedSearchTriggerId);
    if (trigger) {
      new AlightOverlayPanel(this.advancedSearchTriggerId, this.overlayPanelConfig);
    }

    // Initialize page select
    const totalPages = Math.ceil(this.filteredLinksData.length / this.pageSize);
    this.initializePageSelect(container, this.currentPage, totalPages);

    // Attach event listeners
    this.attachEventListeners(container);
  }
}
