// src/plugins/alight-predefined-link-plugin/ui/linkmodal-SearchManager.ts
import { AlightOverlayPanel } from '../../ui-components/alight-overlay-panel-component/alight-overlay-panel';
import { PaginationManager } from './linkmodal-PaginationManager';
import { PredefinedLink, SelectedFilters } from './linkmodal-modal-types';

export class SearchManager {
  private currentSearchQuery = '';
  private tempSearchQuery = ''; // Temporary storage for search input before applying
  private overlayPanel: AlightOverlayPanel | null = null;
  private readonly advancedSearchTriggerId = 'predefined-advanced-search-trigger';
  private searchInput: HTMLInputElement | null = null;
  private containerRef: HTMLElement | null = null;
  private isInitialized = false;

  private selectedFilters: SelectedFilters = {
    baseOrClientSpecific: [],
    pageType: [],
    domain: []
  };

  private tempSelectedFilters: SelectedFilters = {
    baseOrClientSpecific: [],
    pageType: [],
    domain: []
  };

  constructor(
    private predefinedLinksData: PredefinedLink[],
    private onSearch: (filteredData: PredefinedLink[]) => void,
    private paginationManager: PaginationManager
  ) { }

  public initialize(container: HTMLElement): void {
    console.log('Initializing Predefined SearchManager...');

    // Store container reference
    this.containerRef = container;

    const searchContainer = container.querySelector('#predefined-search-container-root');
    if (!searchContainer) {
      console.error('Predefined search container not found');
      return;
    }

    // Check if UI is already initialized and searchContainer already has content
    const hasExistingUI = searchContainer.children.length > 0;

    // Only inject UI if not already initialized or if the container is empty
    if (!this.isInitialized || !hasExistingUI) {
      this.injectSearchUI(searchContainer as HTMLElement);
      this.setupOverlayPanel(container);
    }

    // Always refresh event listeners
    this.setupEventListeners(container);
    this.isInitialized = true;
  }

  // Helper method to check if any advanced filters are active
  private hasActiveFilters(): boolean {
    return !!(
      this.selectedFilters.baseOrClientSpecific.length > 0 ||
      this.selectedFilters.pageType.length > 0 ||
      this.selectedFilters.domain.length > 0
    );
  }

  // Add getter method to expose current search query
  public getCurrentSearchQuery(): string {
    return this.currentSearchQuery;
  }

  private injectSearchUI(searchContainer: HTMLElement): void {
    // Basic search UI
    searchContainer.innerHTML = `
      <div class="cka-search-input-container">
        <input 
          type="text" 
          id="search-input" 
          class="cka-search-input" 
          placeholder="Search by link name..." 
          value="${this.currentSearchQuery}"
        />
        <button id="reset-search-btn" class="cka-button cka-button-rounded cka-button-secondary cka-button-icon-only cka-button-text" style="display: none;">
          <i class="fa-regular fa-xmark"></i>
        </button>
        <button id="${this.advancedSearchTriggerId}" 
                class="cka-button cka-button-rounded cka-button-text cka-text-no-wrap"
                data-panel-id="advanced-search-panel">
          Advanced Search
        </button>
      </div>
      <button id="search-btn" class="cka-button cka-button-rounded cka-button-outlined">Search</button>
      <div class="cka-overlay-panel" data-id="advanced-search-panel">
        <header>
          <h3>Advanced Search</h3>
          <button class="cka-close-btn"><i class="fa-regular fa-xmark"></i></button>
        </header>
        <main class="cka-advanced-search-content">
          ${this.createAdvancedSearchFilters()}
        </main>
        <footer>
          <button id="clear-filters" class="cka-button cka-button-rounded cka-button-outlined cka-button-sm">
            Clear Filters
          </button>
          <button id="apply-filters" class="cka-button cka-button-rounded cka-button-sm">
            Apply Filters
          </button>
        </footer>
      </div>
    `;

    this.searchInput = searchContainer.querySelector('#search-input') as HTMLInputElement;
    const resetButton = searchContainer.querySelector('#reset-search-btn') as HTMLButtonElement;

    // Ensure reset button visibility is set correctly initially
    if (this.searchInput && resetButton) {
      resetButton.style.display = this.searchInput.value.length > 0 ? 'inline-flex' : 'none';
    }
  }

  private createAdvancedSearchFilters(): string {
    // Extract unique filter values from predefined links data
    const baseOrClientSpecificOptions = Array.from(
      new Set(this.predefinedLinksData.map(item => item.baseOrClientSpecific))
    ).filter(Boolean).sort();

    const pageTypeOptions = Array.from(
      new Set(this.predefinedLinksData.map(item => item.pageType))
    ).filter(Boolean).sort();

    const domainOptions = Array.from(
      new Set(this.predefinedLinksData.map(item => item.domain))
    ).filter(Boolean).sort();

    return `
      <div class="cka-search-filters">
        ${this.createFilterSection('Base/Client Specific', 'baseOrClientSpecific', baseOrClientSpecificOptions)}
        ${this.createFilterSection('Page Type', 'pageType', pageTypeOptions)}
        ${this.createFilterSection('Domain', 'domain', domainOptions)}
      </div>
    `;
  }

  private createFilterSection(title: string, filterType: string, options: string[]): string {
    if (options.length === 0) {
      return `
        <div class="cka-filter-section">
          <h4>${title}</h4>
          <p>No options available</p>
        </div>
      `;
    }

    return `
      <div class="cka-filter-section">
        <h4>${title}</h4>
        <ul class="cka-checkbox-list">
          ${options.map(option => `
            <li>
              <cka-checkbox 
                data-filter-type="${filterType}" 
                data-value="${option}"
                ${this.tempSelectedFilters[filterType as keyof SelectedFilters].includes(option) ? 'checked' : ''}
              >
                ${option}
              </cka-checkbox>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  private setupOverlayPanel(container: HTMLElement): void {
    // Clean up existing overlay panel to prevent duplicates
    if (this.overlayPanel) {
      try {
        this.overlayPanel = null;
      } catch (error) {
        console.error('Error cleaning up overlay panel:', error);
      }
    }

    const triggerEl = container.querySelector(`#${this.advancedSearchTriggerId}`);
    if (!triggerEl) {
      console.error('Advanced search trigger not found');
      return;
    }

    this.overlayPanel = new AlightOverlayPanel(triggerEl as HTMLElement, {
      width: '38rem',
      height: 'auto',
      onShow: () => {
        // Copy current filter values to temporary ones when opening the panel
        this.tempSelectedFilters = {
          baseOrClientSpecific: [...this.selectedFilters.baseOrClientSpecific],
          pageType: [...this.selectedFilters.pageType],
          domain: [...this.selectedFilters.domain]
        };
        this.setupAdvancedSearchListeners(container);
      }
    });
  }

  private setupEventListeners(container: HTMLElement): void {
    // Remove any existing listeners first
    this.removeEventListeners();

    // Get the search button and input elements
    const searchBtn = container.querySelector('#search-btn');
    const searchInput = container.querySelector('#search-input') as HTMLInputElement;
    const resetBtn = container.querySelector('#reset-search-btn') as HTMLButtonElement;

    if (searchBtn) {
      // Add click handler for search button
      searchBtn.addEventListener('click', this.handleSearchBtnClick);
    }

    if (searchInput) {
      // Store reference to search input
      this.searchInput = searchInput;

      // Set input value from temporary search query to maintain state
      searchInput.value = this.tempSearchQuery || this.currentSearchQuery || '';

      // Add input handler
      searchInput.addEventListener('input', this.handleSearchInputChange);

      // Add keypress handler for Enter key
      searchInput.addEventListener('keypress', this.handleSearchInputKeypress);
    }

    if (resetBtn) {
      // Add click handler for reset button
      resetBtn.addEventListener('click', this.handleResetBtnClick);

      // Set initial visibility
      resetBtn.style.display =
        searchInput && searchInput.value.length > 0 ? 'inline-flex' : 'none';
    }
  }

  private handleSearchBtnClick = (): void => {
    this.performSearch();
  };

  private handleSearchInputChange = (e: Event): void => {
    const target = e.target as HTMLInputElement;
    this.tempSearchQuery = target.value;

    // Update reset button visibility based on input value
    const resetBtn = this.containerRef?.querySelector('#reset-search-btn') as HTMLButtonElement;
    if (resetBtn) {
      resetBtn.style.display = target.value.length > 0 ? 'inline-flex' : 'none';
    }
  };

  private handleSearchInputKeypress = (e: KeyboardEvent): void => {
    if (e.key === 'Enter') {
      this.performSearch();
    }
  };

  private handleResetBtnClick = (): void => {
    if (this.searchInput) {
      this.searchInput.value = '';
      this.tempSearchQuery = '';
      this.currentSearchQuery = '';

      // Update reset button visibility
      const resetBtn = this.containerRef?.querySelector('#reset-search-btn') as HTMLButtonElement;
      if (resetBtn) {
        resetBtn.style.display = 'none';
      }

      // Update search results
      this.updateFilteredData();
    }
  };

  private setupAdvancedSearchListeners(container: HTMLElement): void {
    // Apply filters button
    const applyFiltersBtn = document.querySelector('#apply-filters');
    if (applyFiltersBtn) {
      applyFiltersBtn.removeEventListener('click', this.handleApplyFilters);
      applyFiltersBtn.addEventListener('click', this.handleApplyFilters);
    }

    // Clear filters button
    const clearFiltersBtn = document.querySelector('#clear-filters');
    if (clearFiltersBtn) {
      clearFiltersBtn.removeEventListener('click', this.handleClearFilters);
      clearFiltersBtn.addEventListener('click', this.handleClearFilters);
    }

    // Setup checkbox listeners
    document.querySelectorAll('cka-checkbox').forEach(checkbox => {
      checkbox.removeEventListener('change', this.handleCheckboxChange);
      checkbox.addEventListener('change', this.handleCheckboxChange);
    });
  }

  private handleApplyFilters = (): void => {
    // Apply the temporary filter values to the actual filters
    this.selectedFilters = {
      baseOrClientSpecific: [...this.tempSelectedFilters.baseOrClientSpecific],
      pageType: [...this.tempSelectedFilters.pageType],
      domain: [...this.tempSelectedFilters.domain]
    };

    this.updateFilteredData();
    if (this.overlayPanel) {
      this.overlayPanel.hide();
    }
  };

  private handleClearFilters = (): void => {
    this.clearFilters();
  };

  private handleCheckboxChange = (event: Event): void => {
    const target = event.target as HTMLElement;
    const filterType = target.getAttribute('data-filter-type') as keyof SelectedFilters;
    const value = target.getAttribute('data-value');
    const isChecked = (target as any).checked;

    if (filterType && value) {
      if (isChecked && !this.tempSelectedFilters[filterType].includes(value)) {
        this.tempSelectedFilters[filterType].push(value);
      } else if (!isChecked) {
        this.tempSelectedFilters[filterType] = this.tempSelectedFilters[filterType].filter((v: string) => v !== value);
      }
    }
  };

  private performSearch(): void {
    // Apply the temporary search query to the actual search query
    if (this.searchInput) {
      this.tempSearchQuery = this.searchInput.value;
    }
    this.currentSearchQuery = this.tempSearchQuery;
    this.updateFilteredData();
  }

  private clearFilters(): void {
    // Reset temporary filters first
    this.tempSelectedFilters = {
      baseOrClientSpecific: [],
      pageType: [],
      domain: []
    };

    // Uncheck all checkboxes within the advanced search panel
    document.querySelectorAll('cka-checkbox').forEach(checkbox => {
      (checkbox as any).checked = false;
    });

    // Update the filtered data
    this.updateFilteredData();
  }

  private updateFilteredData(): void {
    console.log('Filtering data with query:', this.currentSearchQuery);
    console.log('Selected filters:', this.selectedFilters);

    const filteredData = this.predefinedLinksData.filter(link => {
      const matchesSearch = !this.currentSearchQuery ||
        (link.predefinedLinkName && link.predefinedLinkName.toLowerCase().includes(this.currentSearchQuery.toLowerCase())) ||
        (link.predefinedLinkDescription && link.predefinedLinkDescription.toLowerCase().includes(this.currentSearchQuery.toLowerCase())) ||
        (link.destination && link.destination.toLowerCase().includes(this.currentSearchQuery.toLowerCase()));

      const matchesFilters =
        (this.selectedFilters.baseOrClientSpecific.length === 0 ||
          this.selectedFilters.baseOrClientSpecific.includes(link.baseOrClientSpecific)) &&
        (this.selectedFilters.pageType.length === 0 ||
          this.selectedFilters.pageType.includes(link.pageType)) &&
        (this.selectedFilters.domain.length === 0 ||
          this.selectedFilters.domain.includes(link.domain));

      return matchesSearch && matchesFilters;
    });

    console.log('Filtered data count:', filteredData.length);

    // The pagination will be handled by the ContentManager since it knows about
    // the selected link and whether it should be excluded from the count

    // First notify callback about new filtered data
    this.onSearch(filteredData);
  }

  public reset(): void {
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    this.currentSearchQuery = '';
    this.tempSearchQuery = '';
    this.selectedFilters = {
      baseOrClientSpecific: [],
      pageType: [],
      domain: []
    };
    this.tempSelectedFilters = {
      baseOrClientSpecific: [],
      pageType: [],
      domain: []
    };

    // Reset input field in the DOM
    if (this.containerRef) {
      const searchInput = this.containerRef.querySelector('#search-input') as HTMLInputElement;
      if (searchInput) {
        searchInput.value = '';
      }

      // Hide reset button
      const resetButton = this.containerRef.querySelector('#reset-search-btn') as HTMLButtonElement;
      if (resetButton) {
        resetButton.style.display = 'none';
      }
    }

    this.updateFilteredData();
  }

  private removeEventListeners(): void {
    // Search button
    if (this.containerRef) {
      const searchBtn = this.containerRef.querySelector('#search-btn');
      if (searchBtn) {
        searchBtn.removeEventListener('click', this.handleSearchBtnClick);
      }

      // Search input
      if (this.searchInput) {
        this.searchInput.removeEventListener('input', this.handleSearchInputChange);
        this.searchInput.removeEventListener('keypress', this.handleSearchInputKeypress);
      }

      // Reset button
      const resetBtn = this.containerRef.querySelector('#reset-search-btn');
      if (resetBtn) {
        resetBtn.removeEventListener('click', this.handleResetBtnClick);
      }
    }
  }

  // Add destroy method for cleanup
  public destroy(): void {
    this.removeEventListeners();

    // Clean up overlay panel
    if (this.overlayPanel) {
      try {
        this.overlayPanel = null;
      } catch (error) {
        console.error('Error cleaning up overlay panel:', error);
      }
    }

    // Clear references
    this.searchInput = null;
    this.containerRef = null;
    this.isInitialized = false;
  }
}
