// src/plugins/alight-existing-document-link-plugin/modal-content/alight-existing-document-link-plugin-modal-search.ts
import { AlightOverlayPanel } from '../../ui-components/alight-overlay-panel-component/alight-overlay-panel';
import { PaginationManager } from './alight-existing-document-link-plugin-modal-PaginationManager';
import { DocumentLink } from './alight-existing-document-link-plugin-modal-types';

interface SelectedFilters {
  population: string[];
  fileType: string[];
  locale: string[];
}

export class SearchManager {
  private currentSearchQuery = '';
  private overlayPanel: AlightOverlayPanel | null = null;
  private readonly advancedSearchTriggerId = 'advanced-search-trigger';
  private searchInput: HTMLInputElement | null = null;

  private selectedFilters: SelectedFilters = {
    population: [],
    fileType: [],
    locale: []
  };

  constructor(
    private documentData: DocumentLink[],
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
    searchContainer.innerHTML = `
      <div class="cka-search-input-container">
        <input 
          type="text" 
          id="search-input" 
          class="cka-search-input" 
          placeholder="Search by document title..." 
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
    const populationOptions = Array.from(new Set(this.documentData.map(item => item.population))).sort();
    const fileTypeOptions = Array.from(new Set(this.documentData.map(item => item.fileType))).sort();
    const localeOptions = Array.from(new Set(this.documentData.map(item => item.locale))).sort();

    return `
      <div class="search-filters">
        ${this.createFilterSection('Population', 'population', populationOptions)}
        ${this.createFilterSection('File Type', 'fileType', fileTypeOptions)}
        ${this.createFilterSection('Locale', 'locale', localeOptions)}
      </div>
    `;
  }

  private createFilterSection(title: string, filterType: string, options: string[]): string {
    return `
      <div class="filter-section">
        <h4>${title}</h4>
        <ul class="checkbox-list">
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
      width: '600px',
      height: 'auto',
      onOpen: () => {
        this.setupAdvancedSearchListeners(container);
      }
    });
  }

  private setupEventListeners(container: HTMLElement): void {
    container.querySelector('#search-btn')?.addEventListener('click', () => this.performSearch());
    container.querySelector('#reset-search-btn')?.addEventListener('click', () => this.reset());
  }

  private setupAdvancedSearchListeners(container: HTMLElement): void {
    document.querySelectorAll('#apply-filters').forEach(button => {
      button.addEventListener('click', () => {
        this.applyFilters();
      });
    });

    document.querySelectorAll('#clear-filters').forEach(button => {
      button.addEventListener('click', () => {
        this.clearFilters();
      });
    });

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
          this.selectedFilters[filterType] = this.selectedFilters[filterType].filter(v => v !== value);
        }
      }
    });
  }

  private performSearch(): void {
    this.currentSearchQuery = this.searchInput?.value || '';
    this.updateFilteredData();
  }

  private clearFilters(): void {
    this.selectedFilters = {
      population: [],
      fileType: [],
      locale: []
    };

    document.querySelectorAll('cka-checkbox').forEach(checkbox => {
      (checkbox as any).checked = false;
    });
  }

  private applyFilters(): void {
    this.updateFilteredData();
    this.overlayPanel?.close();
  }

  private updateFilteredData(): void {
    const filteredData = this.documentData.filter(doc => {
      const matchesSearch = !this.currentSearchQuery ||
        doc.title.toLowerCase().includes(this.currentSearchQuery.toLowerCase()) ||
        doc.documentDescription.toLowerCase().includes(this.currentSearchQuery.toLowerCase());

      const matchesFilters =
        (this.selectedFilters.population.length === 0 ||
          this.selectedFilters.population.includes(doc.population)) &&
        (this.selectedFilters.fileType.length === 0 ||
          this.selectedFilters.fileType.includes(doc.fileType)) &&
        (this.selectedFilters.locale.length === 0 ||
          this.selectedFilters.locale.includes(doc.locale));

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
      population: [],
      fileType: [],
      locale: []
    };
    this.updateFilteredData();
  }
}