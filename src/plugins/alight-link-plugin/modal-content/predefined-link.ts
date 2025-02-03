// src/plugins/alight-link-plugin/modal-content/predefined-link.ts

import predefinedLinksData from './json/predefined-test-data.json';
import { AlightOverlayPanel } from '../../ui-components/alight-overlay-panel-component/alight-overlay-panel';
import { CKALightSelectMenu } from '../../ui-components/alight-select-menu-component/alight-select-menu-component';
import '../../ui-components/alight-checkbox-component/alight-checkbox-component';
import '../../ui-components/alight-radio-component/alight-radio-component';
import { ILinkManager } from './ILinkManager';

// Interface for selected filters.
interface SelectedFilters {
  [key: string]: string[];
  baseOrClientSpecific: string[];
  pageType: string[];
  domain: string[];
}

// A single Predefined Link record from JSON.
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
 * Manages all logic for Predefined Links (filters, search, pagination).
 * Implements ILinkManager so it can be used by a CKEditor command.
 */
export class PredefinedLinkManager implements ILinkManager {
  // Overlay panel configuration
  private overlayPanelConfig = {
    width: '600px',
    height: 'auto'
  };

  // Data from JSON
  private predefinedLinksData: PredefinedLink[] = predefinedLinksData.predefinedLinksDetails;
  // Filtered subset
  private filteredLinksData: PredefinedLink[] = [...this.predefinedLinksData];

  // Internal state
  private currentSearchQuery = '';
  private currentPage = 1;
  private readonly pageSize = 5;
  private readonly advancedSearchTriggerId = 'advanced-search-trigger';

  // Selected filters
  private selectedFilters: SelectedFilters = {
    baseOrClientSpecific: [],
    pageType: [],
    domain: []
  };

  // Returns raw HTML for a particular page of data.
  public getLinkContent(page: number): string {
    return this.buildContentForPage(page);
  }

  /**
   * Renders the HTML into the container, then sets up
   * the overlay panel, pagination, and event handlers.
   */
  public renderContent(container: HTMLElement): void {
    // 1. Insert the HTML
    container.innerHTML = this.buildContentForPage(this.currentPage);

    // 2. If AlightOverlayPanel needs a global selector string:
    //    it calls document.querySelector('#advanced-search-trigger')
    //    to find the button. This will only work if the container is
    //    actually appended to the DOM, so that ID can be found globally.
    new AlightOverlayPanel(`#${this.advancedSearchTriggerId}`, this.overlayPanelConfig);

    // 3. Pagination
    const totalPages = Math.ceil(this.filteredLinksData.length / this.pageSize);
    this.initializePageSelect(container, this.currentPage, totalPages);

    // 4. Event listeners (search, advanced search, checkboxes, etc.)
    this.attachEventListeners(container);
  }

  // Resets all search/filter state to defaults.
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

  // -------------------------------------------------------
  // PRIVATE HELPERS for building UI, applying filters, etc.
  // -------------------------------------------------------

  // Generates the HTML for a given page.
  private buildContentForPage(page: number): string {
    // Clamp the requested page
    const totalItems = this.filteredLinksData.length;
    const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
    page = Math.max(1, Math.min(page, totalPages));
    this.currentPage = page;

    // Slice out the subset for the current page
    const startIndex = (page - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, totalItems);
    const currentPageData = this.filteredLinksData.slice(startIndex, endIndex);

    // Unique filter options
    const baseOrClientSpecificOptions = this.getUniqueValues(
      this.predefinedLinksData,
      'baseOrClientSpecific'
    );
    const pageTypeOptions = this.getUniqueValues(
      this.predefinedLinksData,
      'pageType'
    );
    const domainOptions = this.getUniqueValues(
      this.predefinedLinksData,
      'domain'
    );

    // Basic + Advanced Search markup
    const searchContainerMarkup = `
      <div id="search-container" class="cka-search-container">
        <input
          type="text"
          id="search-input"
          placeholder="Search by link name..."
          value="${this.currentSearchQuery}"
        />
        <button id="reset-search-btn">Reset</button>
        <button
          id="${this.advancedSearchTriggerId}"
          data-panel-id="advanced-search-panel"
          class="cka-button cka-button-rounded cka-button-text"
        >
          Advanced Search
        </button>
        <button
          id="search-btn"
          class="cka-button cka-button-rounded cka-button-outlined"
        >
          Search
        </button>
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
            ${this.createCheckboxList(
      baseOrClientSpecificOptions,
      'baseOrClientSpecific',
      'Base/Client Specific'
    )}
            ${this.createCheckboxList(
      pageTypeOptions,
      'pageType',
      'Page Type'
    )}
            ${this.createCheckboxList(domainOptions, 'domain', 'Domain')}
          </div>
          <div class="form-group">
            <input
              type="text"
              id="advanced-search-input"
              placeholder="Search by link name..."
            />
          </div>
        </main>
        <footer>
          <button
            id="clear-advanced-search"
            class="cka-button cka-button-rounded cka-button-outlined cka-button-sm"
          >
            Clear Filters
          </button>
          <button
            id="apply-advanced-search"
            class="cka-button cka-button-rounded cka-button-sm"
          >
            Apply Filters
          </button>
        </footer>
      </div>
    `;

    // Link items (radio selection)
    const linksMarkup =
      currentPageData.length > 0
        ? currentPageData
          .map(link => {
            return `
              <div
                class="cka-link-item"
                data-link-name="${link.predefinedLinkName}"
              >
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
            `;
          })
          .join('')
        : '<p>No results found.</p>';

    // Pagination controls
    const paginationMarkup =
      totalPages > 1
        ? `
        <article id="pagination" class="cka-pagination">
          <button
            id="first-page"
            class="pagination-btn"
            data-page="1"
            ${page === 1 ? 'disabled' : ''}
          >
            First
          </button>
          <button
            id="prev-page"
            class="pagination-btn"
            data-page="${page - 1}"
            ${page === 1 ? 'disabled' : ''}
          >
            Previous
          </button>
          <div id="page-select-container" class="cka-select-menu-wrap"></div>
          <button
            id="next-page"
            class="pagination-btn"
            data-page="${page + 1}"
            ${page === totalPages ? 'disabled' : ''}
          >
            Next
          </button>
          <button
            id="last-page"
            class="pagination-btn"
            data-page="${totalPages}"
            ${page === totalPages ? 'disabled' : ''}
          >
            Last
          </button>
        </article>
      `
        : '';

    // Return the final HTML
    return `
      ${searchContainerMarkup}
      ${advancedSearchPanelMarkup}
      <div id="links-container">
        ${linksMarkup}
      </div>
      ${paginationMarkup}
    `;
  }

  // Recomputes the filtered list (search + checkboxes) and resets to page 1.
  private applyFilters(): void {
    this.filteredLinksData = this.predefinedLinksData.filter(link => {
      const nameMatch =
        !this.currentSearchQuery ||
        link.predefinedLinkName
          .toLowerCase()
          .includes(this.currentSearchQuery.toLowerCase());

      const baseOrClientSpecificMatch =
        this.selectedFilters.baseOrClientSpecific.length === 0 ||
        this.selectedFilters.baseOrClientSpecific.includes(link.baseOrClientSpecific);

      const pageTypeMatch =
        this.selectedFilters.pageType.length === 0 ||
        this.selectedFilters.pageType.includes(link.pageType);

      const domainMatch =
        this.selectedFilters.domain.length === 0 ||
        this.selectedFilters.domain.includes(link.domain);

      return nameMatch && baseOrClientSpecificMatch && pageTypeMatch && domainMatch;
    });

    this.currentPage = 1;
  }

  // Attaches event listeners for basic search, advanced search, pagination, etc.
  private attachEventListeners(container: HTMLElement): void {
    // BASIC SEARCH
    const searchInput = container.querySelector('#search-input') as HTMLInputElement | null;
    const searchBtn = container.querySelector('#search-btn') as HTMLButtonElement | null;
    const resetSearchBtn = container.querySelector('#reset-search-btn') as HTMLButtonElement | null;

    searchBtn?.addEventListener('click', () => {
      this.currentSearchQuery = searchInput?.value || '';
      this.applyFilters();
      this.renderContent(container);
    });

    // Press Enter in search box
    searchInput?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchBtn?.click();
      }
    });

    // Reset search
    resetSearchBtn?.addEventListener('click', () => {
      this.resetSearch();
      if (searchInput) {
        searchInput.value = '';
      }
      this.renderContent(container);
    });

    // ADVANCED SEARCH
    const applyAdvancedSearchBtn = container.querySelector('#apply-advanced-search') as HTMLButtonElement | null;
    const clearAdvancedSearchBtn = container.querySelector('#clear-advanced-search') as HTMLButtonElement | null;
    const advancedSearchInput = container.querySelector('#advanced-search-input') as HTMLInputElement | null;

    applyAdvancedSearchBtn?.addEventListener('click', () => {
      if (advancedSearchInput) {
        this.currentSearchQuery = advancedSearchInput.value;
      }
      this.applyFilters();
      this.renderContent(container);
    });

    clearAdvancedSearchBtn?.addEventListener('click', () => {
      this.resetSearch();
      this.renderContent(container);
    });

    // CHECKBOX FILTERS
    const checkboxes = container.querySelectorAll('cka-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', event => {
        const target = event.target as HTMLInputElement;
        if (!target) return;

        const filterType = target.dataset.filterType as keyof SelectedFilters;
        const value = target.dataset.value;
        if (!filterType || !value) return;

        if (target.checked) {
          this.selectedFilters[filterType].push(value);
        } else {
          this.selectedFilters[filterType] = this.selectedFilters[filterType].filter(
            v => v !== value
          );
        }
      });
    });

    // PAGINATION
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

    // RADIO SELECTION ON CLICK
    const linkItems = container.querySelectorAll('.cka-link-item');
    linkItems.forEach(item => {
      item.addEventListener('click', event => {
        // If directly on <cka-radio-button>, skip
        if ((event.target as HTMLElement).closest('cka-radio-button')) return;

        const linkName = (event.currentTarget as HTMLElement).getAttribute('data-link-name');
        if (!linkName) return;

        // Mark that radio as checked, uncheck others
        const radio = (event.currentTarget as HTMLElement).querySelector(
          'cka-radio-button'
        ) as any;
        if (radio) {
          radio.checked = true;
          radio.value = linkName;

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
  }

  /**
   * Creates the select menu for pagination.
   * NOTE: we must use .mount(...) if CKALightSelectMenu does not have .render(...).
   */
  private initializePageSelect(
    container: HTMLElement,
    pageNum: number,
    totalPages: number
  ): void {
    const pageSelectContainer = container.querySelector('#page-select-container') as HTMLElement | null;
    if (!pageSelectContainer) return;

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
          this.currentPage = selectedValue;
          this.renderContent(container);
        }
      }
    });

    // CKALightSelectMenu might require .mount(...) instead of .render(...)
    pageSelectContainer.innerHTML = '';
    pageSelect.mount(pageSelectContainer);  // <--- "mount" is correct for many libraries
  }

  // Returns a sorted array of unique values for a given key.
  private getUniqueValues(data: PredefinedLink[], key: keyof PredefinedLink): string[] {
    return Array.from(new Set(data.map(item => item[key]))).sort();
  }

  // Builds a set of checkboxes for a given filter type (Base/Client, PageType, Domain).
  private createCheckboxList(
    options: string[],
    filterType: keyof SelectedFilters,
    title: string
  ): string {
    return `
      <div class="filter-section">
        <h4>${title}</h4>
        <ul class="checkbox-list">
          ${options
        .map(option => {
          const checked = this.selectedFilters[filterType].includes(option)
            ? 'initialvalue="true"'
            : '';
          return `
              <li>
                <cka-checkbox
                  data-filter-type="${filterType}"
                  data-value="${option}"
                  ${checked}
                >
                  ${option}
                </cka-checkbox>
              </li>
              `;
        })
        .join('')}
        </ul>
      </div>
    `;
  }
}
