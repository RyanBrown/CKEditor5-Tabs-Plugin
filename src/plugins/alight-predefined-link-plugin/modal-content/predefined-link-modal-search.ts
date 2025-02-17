// src/plugins/alight-predefined-link-plugin/modal-content/search.ts
import { AlightOverlayPanel } from '../../ui-components/alight-overlay-panel-component/alight-overlay-panel';
import { PaginationManager } from './predefined-link-modal-pagination';
import { PredefinedLink, SelectedFilters } from './predefined-link-modal-types';

export class SearchManager {
  private currentSearchQuery = '';
  private overlayPanel: AlightOverlayPanel | null = null;
  private readonly advancedSearchTriggerId = 'advanced-search-trigger';
  private paginationManager: PaginationManager;

  private selectedFilters: SelectedFilters = {
    baseOrClientSpecific: [],
    pageType: [],
    domain: []
  };

  constructor(
    private predefinedLinksData: PredefinedLink[],
    private onSearch: (filteredData: PredefinedLink[]) => void,
    paginationManager: PaginationManager
  ) {
    this.paginationManager = paginationManager;
  }

  public initialize(container: HTMLElement): void {
    console.log('Initializing SearchManager...');

    const searchContainer = container.querySelector('#search-container-root');
    if (!searchContainer) {
      console.error('Search container not found');
      return;
    }

    // First, inject the HTML
    this.injectSearchUI(searchContainer as HTMLElement);

    // Then initialize the overlay panel
    this.setupOverlayPanel(container);

    // Finally attach event listeners
    this.attachSearchEventListeners(container);
  }

  private injectSearchUI(searchContainer: HTMLElement): void {
    console.log('Injecting search UI...');
    searchContainer.innerHTML = this.getSearchMarkup();

    // Force a reflow to ensure the DOM is updated
    searchContainer.getBoundingClientRect();
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

  private async setupOverlayPanel(container: HTMLElement): Promise<void> {
    const triggerEl = container.querySelector(`#${this.advancedSearchTriggerId}`);
    if (triggerEl) {
      this.overlayPanel = new AlightOverlayPanel(triggerEl as HTMLElement, {
        width: '600px',
        height: 'auto',
        onOpen: () => {
          // Re-attach event listeners when the panel opens
          this.attachAdvancedSearchEventListeners(container);
        }
      });
    }
  }

  private attachAdvancedSearchEventListeners(container: HTMLElement): void {
    const panel = container.querySelector('.cka-overlay-panel');
    if (!panel) return;

    // Attach listeners to buttons in the advanced search panel
    const applyFiltersBtn = panel.querySelector('#apply-advanced-search');
    const clearFiltersBtn = panel.querySelector('#clear-advanced-search');

    if (applyFiltersBtn) {
      // Remove existing listeners before adding new ones
      const newApplyBtn = applyFiltersBtn.cloneNode(true);
      applyFiltersBtn.parentNode?.replaceChild(newApplyBtn, applyFiltersBtn);
      newApplyBtn.addEventListener('click', () => {
        console.log('Apply Filters clicked');
        this.updateFilteredData();
        this.closeOverlayPanel();
      });
    }

    if (clearFiltersBtn) {
      // Remove existing listeners before adding new ones
      const newClearBtn = clearFiltersBtn.cloneNode(true);
      clearFiltersBtn.parentNode?.replaceChild(newClearBtn, clearFiltersBtn);
      newClearBtn.addEventListener('click', () => {
        console.log('Clear Filters clicked');
        this.reset();
        this.closeOverlayPanel();
      });
    }

    // Attach checkbox listeners
    const checkboxes = panel.querySelectorAll('cka-checkbox');
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
  }

  private attachSearchEventListeners(container: HTMLElement): void {
    // Main search button
    const searchBtn = container.querySelector('#search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const searchInput = container.querySelector('#search-input') as HTMLInputElement;
        if (searchInput) {
          this.currentSearchQuery = searchInput.value;
        }
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

    // Search input
    const searchInput = container.querySelector('#search-input') as HTMLInputElement;
    if (searchInput) {
      searchInput.addEventListener('keypress', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          this.currentSearchQuery = searchInput.value;
          this.updateFilteredData();
        }
      });
    }
  }

  private updateFilteredData(): void {
    console.log('Updating search results with filters:', this.selectedFilters, 'Search Query:', this.currentSearchQuery);

    const filteredData = this.predefinedLinksData.filter(link => {
      const query = this.currentSearchQuery.toLowerCase();

      const searchMatch = !query ||
        link.predefinedLinkName.toLowerCase().includes(query) ||
        link.predefinedLinkDescription.toLowerCase().includes(query);

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

    console.log('Filtered Data:', filteredData);

    this.onSearch(filteredData);

    // Reset pagination to first page after filtering
    if (this.paginationManager) {
      console.log('Resetting pagination to page 1');
      this.paginationManager.setPage(1, filteredData.length);
    } else {
      console.error("PaginationManager is undefined in SearchManager!");
    }
  }

  public reset(): void {
    console.log('Resetting search and filters');

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

    console.log('Filters reset, updating results');
    this.updateFilteredData();
  }

  private closeOverlayPanel(): void {
    if (this.overlayPanel) {
      this.overlayPanel.close();
    }
  }

  public getCurrentSearchQuery(): string {
    return this.currentSearchQuery;
  }

  public getSelectedFilters(): SelectedFilters {
    return { ...this.selectedFilters };
  }
}
