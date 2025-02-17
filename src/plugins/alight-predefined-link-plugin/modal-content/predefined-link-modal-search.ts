// src/plugins/alight-predefined-link-plugin/modal-content/search.ts
import { AlightOverlayPanel } from '../../ui-components/alight-overlay-panel-component/alight-overlay-panel';
import { PredefinedLink, SelectedFilters } from './predefined-link-modal-types';

export class SearchManager {
  private currentSearchQuery = '';
  private overlayPanel: AlightOverlayPanel | null = null;
  private readonly advancedSearchTriggerId = 'advanced-search-trigger';

  private selectedFilters: SelectedFilters = {
    baseOrClientSpecific: [],
    pageType: [],
    domain: []
  };
  paginationManager: any;

  constructor(
    private predefinedLinksData: PredefinedLink[],
    private onSearch: (filteredData: PredefinedLink[]) => void
  ) { }

  public initialize(container: HTMLElement): void {
    const searchContainer = container.querySelector('#search-container-root');
    if (searchContainer) {
      searchContainer.innerHTML = this.getSearchMarkup();
      this.setupOverlayPanel(container);
      this.attachSearchEventListeners(container);
    }
  }

  private getSearchMarkup(): string {
    // Basic search container
    const searchContainerMarkup = `
        <div class="cka-search-input-container">
          <input 
            type="text" 
            id="search-input" 
            class="cka-search-input" 
            placeholder="Search by link name..." 
            value="${this.currentSearchQuery}" 
          />
          <button id="reset-search-btn" class="cka-button cka-button-rounded cka-button-text">
            Reset
          </button>
          <button 
            id="advanced-search-trigger" 
            data-panel-id="advanced-search-panel" 
            class="cka-button cka-button-rounded cka-button-text"
          >
            Advanced Search
          </button>
        </div>
        <button id="search-btn" class="cka-button cka-button-rounded cka-button-outlined">
          Search
        </button>
      ${this.getAdvancedSearchPanelMarkup()}
    `;

    return searchContainerMarkup;
  }

  private getAdvancedSearchPanelMarkup(): string {
    const baseOrClientSpecificOptions = Array.from(new Set(this.predefinedLinksData.map(item => item.baseOrClientSpecific))).sort();
    const pageTypeOptions = Array.from(new Set(this.predefinedLinksData.map(item => item.pageType))).sort();
    const domainOptions = Array.from(new Set(this.predefinedLinksData.map(item => item.domain))).sort();

    return `
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
            <input 
              type="text" 
              id="advanced-search-input" 
              placeholder="Search by link name..." 
              value="${this.currentSearchQuery}" 
            />
          </div>
        </main>
        <footer>
          <button id="clear-advanced-search" class="cka-button cka-button-rounded cka-button-outlined cka-button-sm">
            Clear Filters
          </button>
          <button id="apply-advanced-search" class="cka-button cka-button-rounded cka-button-sm">
            Apply Filters
          </button>
        </footer>
      </div>
    `;
  }

  private createCheckboxList(options: string[], filterType: string, title: string): string {
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

  public reset(): void {
    this.currentSearchQuery = '';
    this.selectedFilters = {
      baseOrClientSpecific: [],
      pageType: [],
      domain: []
    };

    // Clear search inputs in UI
    const container = document.querySelector('.cka-predefined-link-content');
    if (container) {
      const searchInputs = container.querySelectorAll('input[type="text"]');
      searchInputs.forEach(input => {
        if (input instanceof HTMLInputElement) {
          input.value = '';
        }
      });

      const checkboxes = container.querySelectorAll('cka-checkbox');
      checkboxes.forEach(checkbox => {
        if (checkbox instanceof HTMLInputElement) {
          checkbox.checked = false;
        }
      });
    }

    // Update filtered data & pagination
    this.updateFilteredData();
  }

  private setupOverlayPanel(container: HTMLElement): void {
    const triggerEl = container.querySelector(`#${this.advancedSearchTriggerId}`);
    if (triggerEl) {
      this.overlayPanel = new AlightOverlayPanel(triggerEl as HTMLElement, {
        width: '600px',
        height: 'auto'
      });
    }
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
    const filteredData = this.predefinedLinksData.filter(link => {
      // Convert to lowercase for case-insensitive search
      const query = this.currentSearchQuery.toLowerCase();

      // Check if search query matches the link name or description
      const searchMatch = !query ||
        link.predefinedLinkName.toLowerCase().includes(query) ||
        link.predefinedLinkDescription.toLowerCase().includes(query);

      // Filter by advanced search selections
      const baseOrClientSpecificMatch =
        this.selectedFilters.baseOrClientSpecific.length === 0 ||
        this.selectedFilters.baseOrClientSpecific.includes(link.baseOrClientSpecific);

      const pageTypeMatch =
        this.selectedFilters.pageType.length === 0 ||
        this.selectedFilters.pageType.includes(link.pageType);

      const domainMatch =
        this.selectedFilters.domain.length === 0 ||
        this.selectedFilters.domain.includes(link.domain);

      // Return true only if all conditions match
      return searchMatch && baseOrClientSpecificMatch && pageTypeMatch && domainMatch;
    });

    // Update search results
    this.onSearch(filteredData);

    // Reset pagination to page 1 after filtering
    const container = document.querySelector('.cka-predefined-link-content');
    if (container) {
      this.paginationManager.setPage(1, filteredData.length);
    }
  }

  private attachSearchEventListeners(container: HTMLElement): void {
    // Search inputs
    const searchInputs = container.querySelectorAll('input[type="text"]');
    searchInputs.forEach(input => {
      input.addEventListener('input', (e: Event) => {
        const value = (e.target as HTMLInputElement).value;
        this.currentSearchQuery = value;

        // Sync both input fields (normal & advanced search)
        searchInputs.forEach(otherInput => {
          if (otherInput !== e.target) {
            (otherInput as HTMLInputElement).value = value;
          }
        });

        // Trigger search update
        this.updateFilteredData();
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
            this.selectedFilters[filterType] = this.selectedFilters[filterType].filter(
              v => v !== value
            );
          }
        }
      });
    });

    // Apply Filters button
    const applyFiltersBtn = container.querySelector('#apply-advanced-search');
    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener('click', () => {
        this.updateFilteredData();
        this.closeOverlayPanel();
      });
    }

    // Clear Filters button
    const clearFiltersBtn = container.querySelector('#clear-advanced-search');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        this.reset();
        this.closeOverlayPanel();
      });
    }

    // Main search button
    const searchBtn = container.querySelector('#search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.updateFilteredData();
      });
    }

    // Reset search button
    const resetSearchBtn = container.querySelector('#reset-search-btn');
    if (resetSearchBtn) {
      resetSearchBtn.addEventListener('click', () => {
        this.reset();
      });
    }
  }

  public getCurrentSearchQuery(): string {
    return this.currentSearchQuery;
  }

  public getSelectedFilters(): SelectedFilters {
    return { ...this.selectedFilters };
  }
}

