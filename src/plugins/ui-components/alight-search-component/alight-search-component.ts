// src/plugins/ui-components/alight-search-component/alight-search-component.ts
import { AlightUIBaseComponent } from '../alight-ui-base-component/alight-ui-base-component';
import { AlightOverlayPanel } from '../alight-overlay-panel-component/alight-overlay-panel';
import type { Locale } from '@ckeditor/ckeditor5-utils';
import './styles/alight-search-component.scss';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterSection {
  id: string;
  title: string;
  options: FilterOption[];
}

export interface SearchConfiguration {
  placeholder?: string;
  advancedSearch?: boolean;
  searchButtonText?: string;
  advancedSearchButtonText?: string;
  filterSections?: FilterSection[];
  searchOnInputChange?: boolean;
  searchDebounceTime?: number;
}

export interface SearchState {
  searchQuery: string;
  selectedFilters: Record<string, string[]>;
}

export interface SearchEvent {
  searchQuery: string;
  selectedFilters: Record<string, string[]>;
}

export class AlightSearchComponent extends AlightUIBaseComponent {
  private searchInput: HTMLInputElement | null = null;
  private resetButton: HTMLButtonElement | null = null;
  private searchButton: HTMLButtonElement | null = null;
  private advancedSearchTrigger: HTMLButtonElement | null = null;
  private overlayPanel: AlightOverlayPanel | null = null;
  private readonly advancedSearchTriggerId = 'alight-advanced-search-trigger';
  private readonly uniqueId: string;
  private debounceTimeout: number | null = null;
  private searchContainer: HTMLElement | null = null;

  private searchState: SearchState = {
    searchQuery: '',
    selectedFilters: {}
  };

  private config: SearchConfiguration = {
    placeholder: 'Search...',
    advancedSearch: false,
    searchButtonText: 'Search',
    advancedSearchButtonText: 'Advanced Search',
    filterSections: [],
    searchOnInputChange: false,
    searchDebounceTime: 300
  };

  constructor(
    locale: Locale,
    config: Partial<SearchConfiguration> = {},
    private onSearch?: (event: SearchEvent) => void
  ) {
    super(locale);

    this.uniqueId = `alight-search-${Math.random().toString(36).substr(2, 9)}`;
    this.config = { ...this.config, ...config };

    // Initialize filter state based on provided sections
    if (this.config.filterSections) {
      this.config.filterSections.forEach(section => {
        this.searchState.selectedFilters[section.id] = [];
      });
    }

    this._createTemplate();
  }

  /**
   * Creates the template for the search component
   */
  private _createTemplate(): void {
    const container = document.createElement('div');
    container.className = 'alight-search-container';
    container.innerHTML = this.createSearchUI();

    this.setTemplate({
      tag: 'div',
      children: [
        container
      ]
    });
  }

  private createSearchUI(): string {
    const hasAdvancedSearch = this.config.advancedSearch && this.config.filterSections && this.config.filterSections.length > 0;

    return `
      <div class="alight-search-input-container">
        <input 
          type="text" 
          id="${this.uniqueId}-search-input" 
          class="alight-search-input" 
          placeholder="${this.config.placeholder}" 
          value="${this.searchState.searchQuery}"
        />
        <button id="${this.uniqueId}-reset-search-btn" class="ck ck-button ck-button-icon-only ck-button-text" style="display: none;">
          <i class="fa-regular fa-xmark"></i>
        </button>
        ${hasAdvancedSearch ? `
          <button id="${this.uniqueId}-${this.advancedSearchTriggerId}" 
                  class="ck ck-button ck-button-text ck-text-no-wrap"
                  data-panel-id="${this.uniqueId}-advanced-search-panel">
            ${this.config.advancedSearchButtonText}
          </button>
        ` : ''}
      </div>
      <button id="${this.uniqueId}-search-btn" class="ck ck-button ck-button-outlined">${this.config.searchButtonText}</button>
      ${hasAdvancedSearch ? this.createAdvancedSearchPanel() : ''}
    `;
  }

  private createAdvancedSearchPanel(): string {
    return `
      <div class="ck-overlay-panel" data-id="${this.uniqueId}-advanced-search-panel">
        <header>
          <h3>Advanced Search</h3>
          <button class="ck-close-btn"><i class="fa-regular fa-xmark"></i></button>
        </header>
        <main class="advanced-search-content">
          ${this.createAdvancedSearchFilters()}
        </main>
        <footer>
          <button id="${this.uniqueId}-clear-filters" class="ck ck-button ck-button-outlined ck-button-sm">
            Clear Filters
          </button>
          <button id="${this.uniqueId}-apply-filters" class="ck ck-button ck-button-sm">
            Apply Filters
          </button>
        </footer>
      </div>
    `;
  }

  private createAdvancedSearchFilters(): string {
    if (!this.config.filterSections || this.config.filterSections.length === 0) {
      return '<p>No filters available</p>';
    }

    return `
      <div class="search-filters">
        ${this.config.filterSections.map(section => this.createFilterSection(section)).join('')}
      </div>
    `;
  }

  private createFilterSection(section: FilterSection): string {
    if (section.options.length === 0) {
      return `
        <div class="filter-section">
          <h4>${section.title}</h4>
          <p>No options available</p>
        </div>
      `;
    }

    return `
      <div class="filter-section">
        <h4>${section.title}</h4>
        <ul class="ck-checkbox-list">
          ${section.options.map(option => `
            <li>
              <label class="ck-checkbox-label">
                <input 
                  type="checkbox" 
                  class="ck-checkbox" 
                  data-filter-type="${section.id}" 
                  data-value="${option.value}"
                  ${this.searchState.selectedFilters[section.id]?.includes(option.value) ? 'checked' : ''}
                />
                <span>${option.label}</span>
              </label>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }
}
