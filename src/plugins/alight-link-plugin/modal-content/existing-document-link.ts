// src/plugins/alight-link-plugin/modal-content/existing-document-link.ts
import { type DocumentData, type DocumentItem } from './types/document-types';
import existingDocumentLinkData from './json/existing-document-test-data.json';
import { AlightOverlayPanel } from '../../ui-components/alight-overlay-panel-component/alight-overlay-panel';
import { CKALightSelectMenu } from '../../ui-components/alight-select-menu-component/alight-select-menu-component';
import '../../ui-components/alight-checkbox-component/alight-checkbox-component';
import '../../ui-components/alight-radio-component/alight-radio-component';

// Cast the imported JSON to our type
const documentData = existingDocumentLinkData as unknown as DocumentData;

interface SelectedFilters {
  [key: string]: string[];
  population: string[];
  language: string[];
  fileType: string[];
}

const overlayPanelConfig = {
  width: '600px',
  height: 'auto'
};

// State management
let filteredDocsData: DocumentItem[] = [...documentData.documentList];
let currentSearchQuery = '';
let currentPage = 1;
const pageSize = 5;
const advancedSearchTriggerId = 'advanced-search-trigger-document';

// Initialize selected filters
let selectedFilters: SelectedFilters = {
  population: [],
  language: [],
  fileType: []
};

// Helper Functions
function getUniqueValues(data: DocumentItem[], key: keyof DocumentItem): string[] {
  return Array.from(new Set(data.map(item => item[key]))).sort();
}

function createCheckboxList(options: string[], filterType: keyof SelectedFilters, title: string): string {
  return `
    <div class="filter-section">
      <h4>${title}</h4>
      <ul class="checkbox-list">
        ${options.map(option => `
          <li>
            <cka-checkbox 
              data-filter-type="${filterType}"
              data-value="${option}"
              ${selectedFilters[filterType].includes(option) ? 'initialvalue="true"' : ''}
            >${option}</cka-checkbox>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

function initializePageSelect(container: HTMLElement, currentPage: number, totalPages: number): void {
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
    selected: i + 1 === currentPage
  }));

  const select = new CKALightSelectMenu<SelectOption>({
    options,
    onChange: (selectedOption: SelectOption | SelectOption[] | null) => {
      if (selectedOption && !Array.isArray(selectedOption)) {
        const newPage = parseInt(selectedOption.value, 10);
        if (newPage !== currentPage) {
          currentPage = newPage;
          renderContent(container);
        }
      }
    }
  });

  // Assuming CKALightSelectMenu has a getElement() method or similar
  select.render(selectContainer);
}

function attachEventListeners(container: HTMLElement): void {
  // Search functionality
  const searchInput = container.querySelector('#search-input') as HTMLInputElement;
  const searchBtn = container.querySelector('#search-btn');
  const resetBtn = container.querySelector('#reset-search-btn');

  searchBtn?.addEventListener('click', () => {
    currentSearchQuery = searchInput.value;
    applyFilters();
    renderContent(container);
  });

  resetBtn?.addEventListener('click', () => {
    resetSearch();
    renderContent(container);
  });

  // Pagination
  const paginationBtns = container.querySelectorAll('.pagination-btn');
  paginationBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLButtonElement;
      if (!target.disabled) {
        const page = parseInt(target.dataset.page || '1', 10);
        currentPage = page;
        renderContent(container);
      }
    });
  });

  // Advanced search panel
  const applyFiltersBtn = container.querySelector('#apply-advanced-search');
  const clearFiltersBtn = container.querySelector('#clear-advanced-search');
  const advancedSearchInput = container.querySelector('#advanced-search-input') as HTMLInputElement;

  applyFiltersBtn?.addEventListener('click', () => {
    currentSearchQuery = advancedSearchInput.value;
    applyFilters();
    renderContent(container);
  });

  clearFiltersBtn?.addEventListener('click', () => {
    resetSearch();
    renderContent(container);
  });

  // Checkbox event listeners
  const checkboxes = container.querySelectorAll('cka-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', (e: Event) => {
      const target = e.target as HTMLInputElement;
      const filterType = target.dataset.filterType as keyof SelectedFilters;
      const value = target.dataset.value as string;

      if (target.checked) {
        selectedFilters[filterType].push(value);
      } else {
        selectedFilters[filterType] = selectedFilters[filterType].filter(v => v !== value);
      }
    });
  });
}

// Main Content Generation
export function getExistingDocumentLinkContent(page: number): string {
  const totalItems = filteredDocsData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  page = Math.max(1, Math.min(page, totalPages));
  currentPage = page;

  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentPageData = filteredDocsData.slice(startIndex, endIndex);

  // Get filter options
  const populationOptions = getUniqueValues(documentData.documentList, 'Population');
  const languageOptions = getUniqueValues(documentData.documentList, 'Language');
  const fileTypeOptions = getUniqueValues(documentData.documentList, 'FileType');

  const searchContainerMarkup = `
    <div id="search-container" class="cka-search-container">
      <input type="text" id="search-input" placeholder="Search by document name..." value="${currentSearchQuery}" />
      <button id="reset-search-btn">Reset</button>
      <button id="${advancedSearchTriggerId}" data-panel-id="advanced-search-panel">Advanced Search</button>
      <button id="search-btn">Search</button>
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
          ${createCheckboxList(populationOptions, 'population', 'Population')}
          ${createCheckboxList(languageOptions, 'language', 'Language')}
          ${createCheckboxList(fileTypeOptions, 'fileType', 'File Type')}
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

  const paginationMarkup = totalPages > 1 ? `
    <article id="pagination" class="cka-pagination">
      <button id="first-page" class="pagination-btn" data-page="1" ${page === 1 ? 'disabled' : ''}>First</button>
      <button id="prev-page" class="pagination-btn" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>Previous</button>
      <div id="page-select-container" class="cka-select-menu-wrap"></div>
      <button id="next-page" class="pagination-btn" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>Next</button>
      <button id="last-page" class="pagination-btn" data-page="${totalPages}" ${page === totalPages ? 'disabled' : ''}>Last</button>
    </article>
  ` : '';

  return `
    ${searchContainerMarkup}
    ${advancedSearchPanelMarkup}
    <div id="documents-container">
      ${documentsMarkup}
    </div>
    ${paginationMarkup}
  `;
}

// Filter Application
function applyFilters(): void {
  filteredDocsData = documentData.documentList.filter((doc: DocumentItem) => {
    const nameMatch = !currentSearchQuery ||
      doc.DocumentName.toLowerCase().includes(currentSearchQuery.toLowerCase());

    const populationMatch = selectedFilters.population.length === 0 ||
      selectedFilters.population.includes(doc.Population);

    const languageMatch = selectedFilters.language.length === 0 ||
      selectedFilters.language.includes(doc.Language);

    const fileTypeMatch = selectedFilters.fileType.length === 0 ||
      selectedFilters.fileType.includes(doc.FileType);

    return nameMatch && populationMatch && languageMatch && fileTypeMatch;
  });

  currentPage = 1;
}

export function resetSearch(): void {
  currentSearchQuery = '';
  selectedFilters = {
    population: [],
    language: [],
    fileType: []
  };
  filteredDocsData = [...documentData.documentList];
  currentPage = 1;
}

export function renderContent(container: HTMLElement): void {
  const content = getExistingDocumentLinkContent(currentPage);
  container.innerHTML = content;

  const trigger = document.getElementById(advancedSearchTriggerId);
  if (trigger) {
    new AlightOverlayPanel(advancedSearchTriggerId, overlayPanelConfig);
  }

  const totalPages = Math.ceil(filteredDocsData.length / pageSize);
  initializePageSelect(container, currentPage, totalPages);
  attachEventListeners(container);
}