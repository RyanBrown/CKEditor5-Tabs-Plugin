// src/plugins/alight-existing-document-link/ui/linkmodal-SearchManager.ts
import { AlightOverlayPanel } from '../../ui-components/alight-overlay-panel-component/alight-overlay-panel';
import { PaginationManager } from './linkmodal-PaginationManager';
import { DocumentLink, SelectedFilters } from './linkmodal-modal-types';

export class SearchManager {
  private currentSearchQuery = '';
  private populationSearchQuery = ''; // Field for population text input
  private overlayPanel: AlightOverlayPanel | null = null;
  private readonly advancedSearchTriggerId = 'advanced-search-trigger';
  private searchInput: HTMLInputElement | null = null;
  private populationInput: HTMLInputElement | null = null; // Reference to the population input

  private selectedFilters: SelectedFilters = {
    fileType: [],
    population: [],
    locale: []
  };

  constructor(
    private existingDocumentLinksData: DocumentLink[],
    private onSearch: (filteredData: DocumentLink[]) => void,
    private paginationManager: PaginationManager
  ) { }

  public initialize(container: HTMLElement): void {
    console.log('Initializing SearchManager...');
    const searchContainer = container.querySelector('#search-container-root');
    if (!searchContainer) {
      console.error('Search container not found');
      return;
    }

    this.injectSearchUI(searchContainer as HTMLElement);
    this.setupOverlayPanel(container);
    this.setupEventListeners(container);
  }

  private injectSearchUI(searchContainer: HTMLElement): void {
    // Basic search UI
    searchContainer.innerHTML = `
      <div class="cka-search-input-container">
        <input 
          type="text" 
          id="search-input" 
          class="cka-search-input" 
          placeholder="Search by document title..." 
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
        <main class="advanced-search-content">
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

    // Add event listeners for search input and reset button
    if (this.searchInput && resetButton) {
      // Ensure reset button visibility is tied to input value
      this.searchInput.addEventListener('input', () => {
        this.currentSearchQuery = this.searchInput.value;
        resetButton.style.display = this.searchInput.value.length > 0 ? 'inline-flex' : 'none';
      });

      // Clear input and hide reset button when clicked
      resetButton.addEventListener('click', () => {
        this.searchInput.value = '';
        this.currentSearchQuery = '';
        resetButton.style.display = 'none';
        this.searchInput.dispatchEvent(new Event('input')); // Trigger input event
        this.updateFilteredData(); // Update search results
      });

      // Ensure reset button is hidden initially, even if there's a value from currentSearchQuery
      resetButton.style.display = this.searchInput.value.length > 0 ? 'inline-flex' : 'none';
    }
  }

  private createAdvancedSearchFilters(): string {
    // Extract unique filter values from existing document links data
    const fileTypeOptions = Array.from(
      new Set(this.existingDocumentLinksData.map(item => item.fileType))
    ).filter(Boolean).sort();

    const localeOptions = Array.from(
      new Set(this.existingDocumentLinksData.map(item => item.locale))
    ).filter(Boolean).sort();

    return `
      <div class="search-filters">
        ${this.createFilterSection('File Type', 'fileType', fileTypeOptions)}
        ${this.createPopulationFilterSection()}
        ${this.createFilterSection('Locale', 'locale', localeOptions)}
      </div>
    `;
  }

  // Method to create the Population filter with text input
  private createPopulationFilterSection(): string {
    return `
      <div class="filter-section">
        <h4>Population</h4>
        <div class="population-input-container">
          <input 
            class="cka-input-text cka-width-75"
            id="population-filter-input" 
            placeholder="Filter by population..." 
            type="text" 
            value="${this.populationSearchQuery || ''}"
          />
        </div>
      </div>
    `;
  }

  private createFilterSection(title: string, filterType: string, options: string[]): string {
    if (options.length === 0) {
      return `
        <div class="filter-section">
          <h4>${title}</h4>
          <p>No options available</p>
        </div>
      `;
    }

    return `
      <div class="filter-section">
        <h4>${title}</h4>
        <ul class="cka-checkbox-list">
          ${options.map(option => `
            <li>
              <cka-checkbox 
                data-filter-type="${filterType}" 
                data-value="${option}"
                ${this.selectedFilters[filterType as keyof SelectedFilters].includes(option) ? 'checked' : ''}
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
    const triggerEl = container.querySelector(`#${this.advancedSearchTriggerId}`);
    if (!triggerEl) {
      console.error('Advanced search trigger not found');
      return;
    }

    this.overlayPanel = new AlightOverlayPanel(triggerEl as HTMLElement, {
      width: '24rem',
      height: 'auto',
      onShow: () => {
        // Use a small timeout to ensure the DOM is ready
        setTimeout(() => {
          this.setupAdvancedSearchListeners(container);
        }, 50);
      }
    });
  }

  private setupEventListeners(container: HTMLElement): void {
    // Basic search functionality
    container.querySelector('#search-btn')?.addEventListener('click', () => this.performSearch());
    // Add enter key listener for search input
    this.searchInput?.addEventListener('keypress', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        this.performSearch();
      }
    });
  }

  private setupAdvancedSearchListeners(container: HTMLElement): void {
    // Initialize the population input field
    const populationInputElement = document.getElementById('population-filter-input');
    if (!populationInputElement) {
      console.error('Population input element not found');
      return;
    }

    this.populationInput = populationInputElement as HTMLInputElement;

    // Make sure the value is set correctly
    this.populationInput.value = this.populationSearchQuery || '';
    console.log('Initial population filter value:', this.populationInput.value);

    // Add direct event listener for population input changes
    this.populationInput.addEventListener('input', (event: Event) => {
      const target = event.target as HTMLInputElement;
      this.populationSearchQuery = target.value;
      console.log('Population search query updated:', this.populationSearchQuery);
    });

    // Also add keypress listener for Enter key
    this.populationInput.addEventListener('keypress', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        console.log('Enter key pressed in population input, applying filters');
        this.applyFilters();
      }
    });

    // Handle the apply filters button click
    const applyBtn = document.getElementById('apply-filters');
    if (applyBtn) {
      // Remove existing listeners to prevent duplicates
      const newApplyBtn = applyBtn.cloneNode(true);
      if (applyBtn.parentNode) {
        applyBtn.parentNode.replaceChild(newApplyBtn, applyBtn);
      }

      newApplyBtn.addEventListener('click', () => {
        console.log('Apply filters button clicked');
        this.applyFilters();
      });
    }

    // Handle the clear filters button click
    const clearBtn = document.getElementById('clear-filters');
    if (clearBtn) {
      // Remove existing listeners to prevent duplicates
      const newClearBtn = clearBtn.cloneNode(true);
      if (clearBtn.parentNode) {
        clearBtn.parentNode.replaceChild(newClearBtn, clearBtn);
      }

      newClearBtn.addEventListener('click', () => {
        console.log('Clear filters button clicked');
        this.clearFilters();
      });
    }

    // Setup checkbox listeners for all checkboxes in the document
    document.querySelectorAll('cka-checkbox').forEach(checkbox => {
      this.setupSingleCheckboxListener(checkbox);
    });
  }

  private setupSingleCheckboxListener(checkbox: Element): void {
    checkbox.addEventListener('change', (event: Event) => {
      const target = event.target as HTMLElement;
      const filterType = target.getAttribute('data-filter-type') as keyof SelectedFilters;
      const value = target.getAttribute('data-value');
      const isChecked = (target as any).checked;

      if (filterType && value) {
        if (isChecked && !this.selectedFilters[filterType].includes(value)) {
          this.selectedFilters[filterType].push(value);
        } else if (!isChecked) {
          this.selectedFilters[filterType] = this.selectedFilters[filterType].filter((v: string) => v !== value);
        }
      }
    });
  }

  private performSearch(): void {
    this.currentSearchQuery = this.searchInput?.value || '';
    this.updateFilteredData();
  }

  // Modified to not rely on container parameter and directly use document API
  private clearFilters(): void {
    // First, reset all the internal filter state
    this.selectedFilters = {
      fileType: [],
      population: [],
      locale: []
    };

    // Clear population search query from both state and input element
    this.populationSearchQuery = '';

    // Find and clear the population input element directly using the DOM
    const populationInput = document.getElementById('population-filter-input') as HTMLInputElement;
    if (populationInput) {
      console.log('Clearing population input field, previous value:', populationInput.value);
      populationInput.value = ''; // This should clear the visible field

      // Also dispatch input event to ensure any listeners are triggered
      populationInput.dispatchEvent(new Event('input'));
    } else {
      console.warn('Population input element not found during clearFilters');
    }

    // Uncheck all checkboxes in the advanced search panel
    const checkboxes = document.querySelectorAll('cka-checkbox');
    if (checkboxes && checkboxes.length > 0) {
      console.log('Found', checkboxes.length, 'checkboxes to reset');

      // First try with the .checked property
      checkboxes.forEach((checkbox: any) => {
        if (checkbox.checked) {
          console.log('Unchecking checkbox:', checkbox.textContent);
          checkbox.checked = false;

          // Also dispatch change event to ensure filter state updates
          checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    } else {
      console.warn('No checkboxes found to reset');
    }

    console.log('Filters cleared, data state reset to:', {
      populationQuery: this.populationSearchQuery,
      selectedFilters: this.selectedFilters
    });

    // Update filtered data with cleared filters
    this.updateFilteredData();

    // No need to close panel, just show all data
    console.log('Showing all documents after filter reset');
  }

  private applyFilters(): void {
    // Make sure we grab the current value directly from the input element
    const populationInput = document.getElementById('population-filter-input') as HTMLInputElement;
    if (populationInput) {
      this.populationSearchQuery = populationInput.value;
      console.log('Applying population filter with value:', this.populationSearchQuery);
    } else {
      console.warn('Population input element not found during apply filters');
    }

    // Update filtered data with the current filters
    this.updateFilteredData();

    // Close the panel
    this.overlayPanel?.hide();
  }

  private updateFilteredData(): void {
    // Debugging info
    console.log('Updating filtered data:');
    console.log('- Main search query:', this.currentSearchQuery);
    console.log('- Population query:', this.populationSearchQuery);
    console.log('- File types:', this.selectedFilters.fileType);
    console.log('- Locales:', this.selectedFilters.locale);

    // Get and normalize the population filter query
    const populationQuery = (this.populationSearchQuery || '').toLowerCase().trim();

    // Start with all documents
    let filteredData = [...this.existingDocumentLinksData];

    // Apply each filter independently to ensure equal treatment

    // 1. Apply main search filter if present
    if (this.currentSearchQuery) {
      const query = this.currentSearchQuery.toLowerCase();
      filteredData = filteredData.filter(link =>
        (link.title && link.title.toLowerCase().includes(query)) ||
        (link.documentDescription && link.documentDescription.toLowerCase().includes(query)) ||
        (link.serverFilePath && link.serverFilePath.toLowerCase().includes(query))
      );
      console.log(`After main search filter: ${filteredData.length} items remaining`);
    }

    // 2. Apply population filter if present
    if (populationQuery) {
      filteredData = filteredData.filter(link => {
        const populationValue = (link.population || '').toLowerCase();
        const matches = populationValue.includes(populationQuery);

        // Log for debugging
        if (!matches && Math.random() < 0.1) {
          console.log(`Population filter rejected: "${populationValue}" does not include "${populationQuery}"`);
        }

        return matches;
      });
      console.log(`After population filter: ${filteredData.length} items remaining`);
    }

    // 3. Apply file type filter if any types are selected
    if (this.selectedFilters.fileType.length > 0) {
      filteredData = filteredData.filter(link => {
        const fileType = link.fileType || '';
        return this.selectedFilters.fileType.includes(fileType);
      });
      console.log(`After file type filter: ${filteredData.length} items remaining`);
    }

    // 4. Apply locale filter if any locales are selected
    if (this.selectedFilters.locale.length > 0) {
      filteredData = filteredData.filter(link => {
        const locale = link.locale || '';
        return this.selectedFilters.locale.includes(locale);
      });
      console.log(`After locale filter: ${filteredData.length} items remaining`);
    }

    console.log(`Final filtered data: ${filteredData.length} of ${this.existingDocumentLinksData.length} items match`);

    // Send filtered data to handler
    this.onSearch(filteredData);

    // Update pagination
    this.paginationManager.setPage(1, filteredData.length);
  }

  public reset(): void {
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    this.currentSearchQuery = '';
    this.populationSearchQuery = '';
    this.selectedFilters = {
      fileType: [],
      population: [],
      locale: []
    };
    this.updateFilteredData();

    // Ensure reset button is hidden after reset
    const resetButton = document.querySelector('#reset-search-btn') as HTMLButtonElement;
    if (resetButton) {
      resetButton.style.display = 'none';
    }
  }
}
