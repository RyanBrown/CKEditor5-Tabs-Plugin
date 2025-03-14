// src/plugins/alight-existing-document-link/ui/linkmodal-SearchManager.ts
import { AlightOverlayPanel } from '../../ui-components/alight-overlay-panel-component/alight-overlay-panel';
import { PaginationManager } from './linkmodal-PaginationManager';
import { DocumentLink, SelectedFilters } from './linkmodal-modal-types';

export class SearchManager {
  private currentSearchQuery = '';
  private overlayPanel: AlightOverlayPanel | null = null;
  private readonly advancedSearchTriggerId = 'advanced-search-trigger';
  private searchInput: HTMLInputElement | null = null;

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
        // Optionally trigger search on input change (debounced if needed)
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

    const populationOptions = Array.from(
      new Set(this.existingDocumentLinksData.map(item => item.population))
    ).filter(Boolean).sort();

    const localeOptions = Array.from(
      new Set(this.existingDocumentLinksData.map(item => item.locale))
    ).filter(Boolean).sort();

    return `
      <div class="search-filters">
        ${this.createFilterSection('File Type', 'fileType', fileTypeOptions)}
        ${this.createFilterSection('Population', 'population', populationOptions)}
        ${this.createFilterSection('Locale', 'locale', localeOptions)}
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
      width: '38rem',
      height: 'auto',
      onShow: () => {
        this.setupAdvancedSearchListeners(container);
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
    // Handle the apply filters button click
    document.querySelectorAll('#apply-filters').forEach(button => {
      button.addEventListener('click', () => {
        this.applyFilters();
      });
    });

    // Handle the clear filters button click
    document.querySelectorAll('#clear-filters').forEach(button => {
      button.addEventListener('click', () => {
        this.clearFilters(container);
      });
    });

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

  private clearFilters(container: HTMLElement): void {
    // Reset all filters
    this.selectedFilters = {
      fileType: [],
      population: [],
      locale: []
    };

    // Uncheck all checkboxes within the advanced search panel
    const advancedSearchPanel = container.querySelector('.cka-overlay-panel[data-id="advanced-search-panel"]');
    if (advancedSearchPanel) {
      document.querySelectorAll('cka-checkbox').forEach(checkbox => {
        (checkbox as any).checked = false;
      });
    }

    // Update the filtered data and UI
    this.updateFilteredData();
  }

  private applyFilters(): void {
    this.updateFilteredData();
    this.overlayPanel?.hide();
  }

  private updateFilteredData(): void {
    const filteredData = this.existingDocumentLinksData.filter(link => {
      const matchesSearch = !this.currentSearchQuery ||
        link.title.toLowerCase().includes(this.currentSearchQuery.toLowerCase()) ||
        (link.documentDescription && link.documentDescription.toLowerCase().includes(this.currentSearchQuery.toLowerCase())) ||
        (link.serverFilePath && link.serverFilePath.toLowerCase().includes(this.currentSearchQuery.toLowerCase()));

      const matchesFilters =
        (this.selectedFilters.fileType.length === 0 ||
          this.selectedFilters.fileType.includes(link.fileType)) &&
        (this.selectedFilters.population.length === 0 ||
          this.selectedFilters.population.includes(link.population)) &&
        (this.selectedFilters.locale.length === 0 ||
          this.selectedFilters.locale.includes(link.locale));

      return matchesSearch && matchesFilters;
    });

    this.onSearch(filteredData);
    this.paginationManager.setPage(1, filteredData.length);
  }

  public reset(): void {
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    this.currentSearchQuery = '';
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
