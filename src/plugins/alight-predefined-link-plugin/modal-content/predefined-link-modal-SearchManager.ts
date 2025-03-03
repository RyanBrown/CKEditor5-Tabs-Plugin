// src/plugins/alight-predefined-link-plugin/modal-content/predefined-link-modal-SearchManager.ts
import { AlightOverlayPanel } from '../../ui-components/alight-overlay-panel-component/alight-overlay-panel';
import { PaginationManager } from './predefined-link-modal-PaginationManager';
import { PredefinedLink, SelectedFilters } from './predefined-link-modal-types';

export class SearchManager {
  private currentSearchQuery = '';
  private overlayPanel: AlightOverlayPanel | null = null;
  private readonly advancedSearchTriggerId = 'advanced-search-trigger';
  private searchInput: HTMLInputElement | null = null;

  private selectedFilters: SelectedFilters = {
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
    console.log('Initializing SearchManager...');
    const searchContainer = container.querySelector('#search-container-root');
    if (!searchContainer) {
      console.error('Search container not found');
      return;
    }

    this.injectSearchUI(searchContainer as HTMLElement);

    // Give the DOM time to update before setting up the overlay panel
    setTimeout(() => {
      this.setupOverlayPanel(container);
    }, 100);

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
          placeholder="Search by link name..." 
          value="${this.currentSearchQuery}"
        />
        <button id="reset-search-btn" class="cka-button cka-button-rounded cka-button-text"><i class="fa-regular fa-xmark"></i></button>
        <button id="${this.advancedSearchTriggerId}" 
                class="cka-button cka-button-rounded cka-button-text"
                data-panel-id="advanced-search-panel">
          Advanced Search
        </button>
      </div>
      <button id="search-btn" class="cka-button cka-button-rounded cka-button-outlined">Search</button>
      <div class="cka-overlay-panel" data-id="advanced-search-panel">
        <header>
          <h3>Advanced Search</h3>
          <button class="cka-close-btn">&times;</button>
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

    this.searchInput = searchContainer.querySelector('#search-input');
  }

  private createAdvancedSearchFilters(): string {
    const baseOrClientSpecificOptions = Array.from(new Set(this.predefinedLinksData.map(item => item.baseOrClientSpecific))).sort();
    const pageTypeOptions = Array.from(new Set(this.predefinedLinksData.map(item => item.pageType))).sort();
    const domainOptions = Array.from(new Set(this.predefinedLinksData.map(item => item.domain))).sort();

    return `
      <div class="search-filters">
        ${this.createFilterSection('Base/Client Specific', 'baseOrClientSpecific', baseOrClientSpecificOptions)}
        ${this.createFilterSection('Page Type', 'pageType', pageTypeOptions)}
        ${this.createFilterSection('Domain', 'domain', domainOptions)}
      </div>
    `;
  }

  private createFilterSection(title: string, filterType: string, options: string[]): string {
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
    try {
      // Make sure we're looking in the right container
      const triggerEl = container.querySelector(`#${this.advancedSearchTriggerId}`);
      if (!triggerEl) {
        console.error('Advanced search trigger not found');
        return;
      }

      // Find the panel in the document
      const panelElement = container.querySelector('.cka-overlay-panel[data-id="advanced-search-panel"]');
      if (!panelElement) {
        console.error('Panel with data-id="advanced-search-panel" not found in container');
        // Debugging help
        console.log('Container children:', container.children);
        return;
      }

      // Create the overlay panel
      this.overlayPanel = new AlightOverlayPanel(triggerEl as HTMLElement, {
        width: '600px',
        height: 'auto',
        onOpen: () => {
          this.setupAdvancedSearchListeners(container);
        }
      });
    } catch (e) {
      console.error('Error setting up overlay panel:', e);
    }
  }

  private setupEventListeners(container: HTMLElement): void {
    // Basic search functionality
    container.querySelector('#search-btn')?.addEventListener('click', () => this.performSearch());
    container.querySelector('#reset-search-btn')?.addEventListener('click', () => this.reset());
  }

  private setupAdvancedSearchListeners(container: HTMLElement): void {
    try {
      // Handle the apply filters button click
      document.querySelectorAll('#apply-filters').forEach(button => {
        button.addEventListener('click', () => {
          this.applyFilters();
        });
      });

      // Handle the clear filters button click
      document.querySelectorAll('#clear-filters').forEach(button => {
        button.addEventListener('click', () => {
          this.clearFilters();
        });
      });

      // Setup checkbox listeners for all checkboxes in the document
      document.querySelectorAll('cka-checkbox').forEach(checkbox => {
        this.setupSingleCheckboxListener(checkbox);
      });
    } catch (e) {
      console.error('Error setting up advanced search listeners:', e);
    }
  }

  private setupSingleCheckboxListener(checkbox: Element): void {
    try {
      checkbox.addEventListener('change', (event: Event) => {
        const target = event.target as HTMLElement;
        const filterType = target.getAttribute('data-filter-type') as keyof SelectedFilters;
        const value = target.getAttribute('data-value');
        const isChecked = (target as any).checked;

        if (filterType && value) {
          if (isChecked && !this.selectedFilters[filterType].includes(value)) {
            this.selectedFilters[filterType].push(value);
          } else if (!isChecked) {
            this.selectedFilters[filterType] = this.selectedFilters[filterType].filter(v => v !== value);
          }
        }
      });
    } catch (e) {
      console.error('Error setting up checkbox listener:', e);
    }
  }

  private performSearch(): void {
    this.currentSearchQuery = this.searchInput?.value || '';
    this.updateFilteredData();
  }

  private clearFilters(): void {
    this.selectedFilters = {
      baseOrClientSpecific: [],
      pageType: [],
      domain: []
    };

    // Update all checkboxes in the document
    try {
      document.querySelectorAll('cka-checkbox').forEach(checkbox => {
        if (checkbox && typeof (checkbox as any).checked !== 'undefined') {
          (checkbox as any).checked = false;
        }
      });
    } catch (e) {
      console.error('Error clearing filters:', e);
    }
  }

  private applyFilters(): void {
    this.updateFilteredData();
    if (this.overlayPanel && typeof this.overlayPanel.close === 'function') {
      this.overlayPanel.close();
    }
  }

  private updateFilteredData(): void {
    try {
      const filteredData = this.predefinedLinksData.filter(link => {
        const matchesSearch = !this.currentSearchQuery ||
          link.predefinedLinkName.toLowerCase().includes(this.currentSearchQuery.toLowerCase());

        const matchesFilters =
          (this.selectedFilters.baseOrClientSpecific.length === 0 ||
            this.selectedFilters.baseOrClientSpecific.includes(link.baseOrClientSpecific)) &&
          (this.selectedFilters.pageType.length === 0 ||
            this.selectedFilters.pageType.includes(link.pageType)) &&
          (this.selectedFilters.domain.length === 0 ||
            this.selectedFilters.domain.includes(link.domain));

        return matchesSearch && matchesFilters;
      });

      this.onSearch(filteredData);
      this.paginationManager.setPage(1, filteredData.length);
    } catch (e) {
      console.error('Error updating filtered data:', e);
    }
  }

  public reset(): void {
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    this.currentSearchQuery = '';
    this.selectedFilters = {
      baseOrClientSpecific: [],
      pageType: [],
      domain: []
    };
    this.updateFilteredData();
  }
}