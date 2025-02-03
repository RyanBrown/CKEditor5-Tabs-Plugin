// src/plugins/alight-link-plugin/modal-content/existing-document-link.ts

import { type DocumentData, type DocumentItem } from './types/document-types';
import existingDocumentLinkData from './json/existing-document-test-data.json';
import { AlightOverlayPanel } from '../../ui-components/alight-overlay-panel-component/alight-overlay-panel';
import { CKALightSelectMenu } from '../../ui-components/alight-select-menu-component/alight-select-menu-component';
import '../../ui-components/alight-checkbox-component/alight-checkbox-component';
import '../../ui-components/alight-radio-component/alight-radio-component';
import { ILinkManager } from './ILinkManager';

/**
 * Each document item can be filtered by population, language, fileType, etc.
 */
interface SelectedFilters {
  [key: string]: string[];
  population: string[];
  language: string[];
  fileType: string[];
}

/**
 * This class encapsulates all the logic for filtering/searching
 * "Existing Document Links". It implements the ILinkManager interface
 * so it can be used in the same way as PredefinedLinkManager.
 */
export class ExistingDocumentLinkManager implements ILinkManager {
  // Data from the JSON file
  private documentData: DocumentData;
  // Current, filtered dataset
  private filteredDocsData: DocumentItem[];

  // Internal state
  private currentSearchQuery = '';
  private currentPage = 1;
  private readonly pageSize = 5;
  private readonly advancedSearchTriggerId = 'advanced-search-trigger-document';

  // Which filters have been selected (population, language, fileType)
  private selectedFilters: SelectedFilters = {
    population: [],
    language: [],
    fileType: []
  };

  // Overlay panel configuration
  private overlayPanelConfig = {
    width: '600px',
    height: 'auto'
  };

  /**
   * Constructor loads the test data from existingDocumentLinkData
   * and initializes the filtered list to contain everything.
   */
  constructor() {
    this.documentData = existingDocumentLinkData as DocumentData;
    this.filteredDocsData = [...this.documentData.documentList];
  }

  /**
   * ILinkManager method:
   * Returns the HTML for a given page of the data (without attaching events).
   */
  public getLinkContent(page: number): string {
    return this.buildContentForPage(page);
  }

  /**
   * ILinkManager method:
   * Renders the current page's HTML into the container, then
   * attaches event listeners (checkboxes, search, pagination, etc.).
   */
  public renderContent(container: HTMLElement): void {
    const content = this.buildContentForPage(this.currentPage);
    container.innerHTML = content;

    // Initialize the overlay panel (Advanced Search)
    const trigger = document.getElementById(this.advancedSearchTriggerId);
    if (trigger) {
      new AlightOverlayPanel(this.advancedSearchTriggerId, this.overlayPanelConfig);
    }

    // Set up pagination dropdown
    const totalPages = Math.ceil(this.filteredDocsData.length / this.pageSize);
    this.initializePageSelect(container, this.currentPage, totalPages);

    // Attach event listeners (filters, search, pagination, etc.)
    this.attachEventListeners(container);
  }

  /**
   * ILinkManager method:
   * Resets all filters and search terms to the default empty state.
   */
  public resetSearch(): void {
    this.currentSearchQuery = '';
    this.selectedFilters = {
      population: [],
      language: [],
      fileType: []
    };
    this.filteredDocsData = [...this.documentData.documentList];
    this.currentPage = 1;
  }

  /**
   * Builds the raw HTML for a specified page number (internal helper).
   */
  private buildContentForPage(page: number): string {
    const totalItems = this.filteredDocsData.length;
    const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
    // Clamp page between 1 and totalPages
    page = Math.max(1, Math.min(page, totalPages));
    this.currentPage = page;

    const startIndex = (page - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, totalItems);
    const currentPageData = this.filteredDocsData.slice(startIndex, endIndex);

    // Collect unique values for the filters
    const populationOptions = this.getUniqueValues(this.documentData.documentList, 'Population');
    const languageOptions = this.getUniqueValues(this.documentData.documentList, 'Language');
    const fileTypeOptions = this.getUniqueValues(this.documentData.documentList, 'FileType');

    // Basic search UI
    const searchContainerMarkup = `
      <div id="search-container" class="cka-search-container">
        <input type="text" id="search-input" placeholder="Search by document name..." value="${this.currentSearchQuery}" />
        <button id="reset-search-btn">Reset</button>
        <button id="${this.advancedSearchTriggerId}" data-panel-id="advanced-search-panel">Advanced Search</button>
        <button id="search-btn">Search</button>
      </div>
    `;

    // Advanced search overlay
    const advancedSearchPanelMarkup = `
      <div class="cka-overlay-panel" data-id="advanced-search-panel">
        <header>
          <h3>Advanced Search</h3>
          <button class="cka-close-btn">×</button>
        </header>
        <main class="advanced-search-content">
          <div class="search-filters">
            ${this.createCheckboxList(populationOptions, 'population', 'Population')}
            ${this.createCheckboxList(languageOptions, 'language', 'Language')}
            ${this.createCheckboxList(fileTypeOptions, 'fileType', 'File Type')}
          </div>
          <div class="form-group">
            <input type="text" id="advanced-search-input" placeholder="Search by document name..." />
          </div>
        </main>
        <footer>
          <button id="apply-advanced-search">Apply Filters</button>
          <button id="clear-advanced-search">Clear Filters</button>
        </footer>
      </div>
    `;

    // Document items (radio buttons + details)
    const documentsMarkup = currentPageData.length > 0
      ? currentPageData
        .map(doc => `
            <div class="cka-document-item" data-doc-name="${doc.DocumentName}">
              <div class="radio-container">
                <cka-radio-button
                  name="document-selection"
                  value="${doc.DocumentName}"
                  label=""
                ></cka-radio-button>
              </div>
              <ul>
                <li><strong>${doc.DocumentName}</strong></li>
                <li><strong>Population:</strong> ${doc.Population}</li>
                <li><strong>Language:</strong> ${doc.Language}</li>
                <li><strong>File Type:</strong> ${doc.FileType}</li>
              </ul>
            </div>
          `)
        .join('')
      : '<p>No results found.</p>';

    // Pagination controls
    const paginationMarkup =
      totalPages > 1
        ? `
        <article id="pagination" class="cka-pagination">
          <button id="first-page" class="pagination-btn" data-page="1" ${page === 1 ? 'disabled' : ''}>First</button>
          <button id="prev-page" class="pagination-btn" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>Previous</button>
          <div id="page-select-container" class="cka-select-menu-wrap"></div>
          <button id="next-page" class="pagination-btn" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>Next</button>
          <button id="last-page" class="pagination-btn" data-page="${totalPages}" ${page === totalPages ? 'disabled' : ''}>Last</button>
        </article>
      `
        : '';

    // Return the combined HTML
    return `
      ${searchContainerMarkup}
      ${advancedSearchPanelMarkup}
      <div id="documents-container">
        ${documentsMarkup}
      </div>
      ${paginationMarkup}
    `;
  }

  /**
   * Applies the selected filters + search query to this.filteredDocsData.
   * Resets to page 1 after applying.
   */
  private applyFilters(): void {
    this.filteredDocsData = this.documentData.documentList.filter((doc: DocumentItem) => {
      const nameMatch =
        !this.currentSearchQuery ||
        doc.DocumentName.toLowerCase().includes(this.currentSearchQuery.toLowerCase());

      const populationMatch =
        this.selectedFilters.population.length === 0 ||
        this.selectedFilters.population.includes(doc.Population);

      const languageMatch =
        this.selectedFilters.language.length === 0 ||
        this.selectedFilters.language.includes(doc.Language);

      const fileTypeMatch =
        this.selectedFilters.fileType.length === 0 ||
        this.selectedFilters.fileType.includes(doc.FileType);

      return nameMatch && populationMatch && languageMatch && fileTypeMatch;
    });

    this.currentPage = 1;
  }

  /**
   * Attach event listeners for search, pagination, filters, etc.
   */
  private attachEventListeners(container: HTMLElement): void {
    // SEARCH + RESET
    const searchInput = container.querySelector('#search-input') as HTMLInputElement;
    const searchBtn = container.querySelector('#search-btn');
    const resetBtn = container.querySelector('#reset-search-btn');

    searchBtn?.addEventListener('click', () => {
      this.currentSearchQuery = searchInput.value;
      this.applyFilters();
      this.renderContent(container);
    });

    resetBtn?.addEventListener('click', () => {
      this.resetSearch();
      this.renderContent(container);
    });

    // ADVANCED SEARCH
    const applyFiltersBtn = container.querySelector('#apply-advanced-search');
    const clearFiltersBtn = container.querySelector('#clear-advanced-search');
    const advancedSearchInput = container.querySelector('#advanced-search-input') as HTMLInputElement;

    applyFiltersBtn?.addEventListener('click', () => {
      this.currentSearchQuery = advancedSearchInput.value;
      this.applyFilters();
      this.renderContent(container);
    });

    clearFiltersBtn?.addEventListener('click', () => {
      this.resetSearch();
      this.renderContent(container);
    });

    // CHECKBOXES
    const checkboxes = container.querySelectorAll('cka-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLInputElement;
        const filterType = target.dataset.filterType as keyof SelectedFilters;
        const value = target.dataset.value as string;
        if (!filterType || !value) return;

        if (target.checked) {
          this.selectedFilters[filterType].push(value);
        } else {
          this.selectedFilters[filterType] = this.selectedFilters[filterType].filter(v => v !== value);
        }
      });
    });

    // PAGINATION
    const paginationBtns = container.querySelectorAll('.pagination-btn');
    paginationBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLButtonElement;
        if (!target.disabled) {
          const page = parseInt(target.dataset.page || '1', 10);
          this.currentPage = page;
          this.renderContent(container);
        }
      });
    });
  }

  /**
   * Initializes a custom select menu for pagination.
   */
  private initializePageSelect(container: HTMLElement, pageNum: number, totalPages: number): void {
    const selectContainer = container.querySelector('#page-select-container');
    if (!selectContainer) return;

    type SelectOption = {
      value: string;
      label: string;
      selected: boolean;
    };

    const options: SelectOption[] = Array.from({ length: totalPages }, (_, i) => ({
      value: (i + 1).toString(),
      label: `Page ${i + 1} of ${totalPages}`,
      selected: i + 1 === pageNum
    }));

    const select = new CKALightSelectMenu<SelectOption>({
      options,
      onChange: (selectedOption: SelectOption | SelectOption[] | null) => {
        if (selectedOption && !Array.isArray(selectedOption)) {
          const newPage = parseInt(selectedOption.value, 10);
          if (newPage !== this.currentPage) {
            this.currentPage = newPage;
            this.renderContent(container);
          }
        }
      }
    });

    // Render the select menu inside the container
    select.render(selectContainer);
  }

  /**
   * Returns sorted unique values for the requested document key.
   */
  private getUniqueValues(data: DocumentItem[], key: keyof DocumentItem): string[] {
    return Array.from(new Set(data.map(item => item[key]))).sort();
  }

  /**
   * Creates the HTML for a set of checkbox filters (Population, Language, File Type).
   */
  private createCheckboxList(options: string[], filterType: keyof SelectedFilters, title: string): string {
    return `
      <div class="filter-section">
        <h4>${title}</h4>
        <ul class="checkbox-list">
          ${options
        .map(
          option => `
            <li>
              <cka-checkbox 
                data-filter-type="${filterType}"
                data-value="${option}"
                ${this.selectedFilters[filterType].includes(option) ? 'initialvalue="true"' : ''}
              >${option}</cka-checkbox>
            </li>
          `
        )
        .join('')}
        </ul>
      </div>
    `;
  }
}
