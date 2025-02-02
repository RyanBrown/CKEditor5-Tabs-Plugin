// src/plugins/alight-image-plugin/modal-content/predefined-link.ts
import predefinedLinksData from './json/predefined-test-data.json';
import { AlightOverlayPanel } from '../../ui-components/alight-overlay-panel-component/alight-overlay-panel';
import './../../alight-link-plugin/styles/predefined-link.scss';
import './../../alight-link-plugin/styles/search.scss';
import '../../ui-components/alight-checkbox-component/alight-checkbox-component';
import '../../ui-components/alight-radio-component/alight-radio-component';

// Define interfaces for type safety
interface SelectedFilters {
  [key: string]: string[];
  baseOrClientSpecific: string[];
  pageType: string[];
  domain: string[];
}

// State variables to manage data, search query, and current page
let filteredLinksData = [...predefinedLinksData.predefinedLinksDetails];
let currentSearchQuery = '';
let currentPage = 1;

// Initialize selected filters with empty arrays
let selectedFilters: SelectedFilters = {
  baseOrClientSpecific: [],
  pageType: [],
  domain: []
};

// Constants
const pageSize = 5;  // Number of items per page

// Gets unique values from an array of objects for a specific key
function getUniqueValues(data: any[], key: string): string[] {
  return Array.from(new Set(data.map(item => item[key]))).sort();
}

// Creates a checkbox list for filter options
function createCheckboxList(options: string[], filterType: keyof SelectedFilters, title: string): string {
  return `
    <div class="filter-section">
      <h4>${title}</h4>
      <ul class="checkbox-list">
        ${options.map(option => `
          <li>
            <ck-alight-checkbox 
              data-filter-type="${filterType}"
              data-value="${option}"
              ${selectedFilters[filterType].includes(option) ? 'initialvalue="true"' : ''}
            >${option}</ck-alight-checkbox>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

// Generates the HTML content for the current filtered and paginated data
export function getPredefinedLinkContent(page: number): string {
  const totalItems = filteredLinksData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  // Ensure the current page is valid
  page = Math.max(1, Math.min(page, totalPages));

  // Calculate the slice of data for the current page
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const currentPageData = filteredLinksData.slice(startIndex, endIndex);

  // Get unique values for filters
  const baseOrClientSpecificOptions = getUniqueValues(predefinedLinksData.predefinedLinksDetails, 'baseOrClientSpecific');
  const pageTypeOptions = getUniqueValues(predefinedLinksData.predefinedLinksDetails, 'pageType');
  const domainOptions = getUniqueValues(predefinedLinksData.predefinedLinksDetails, 'domain');

  // Create the advanced search panel markup
  const advancedSearchPanelMarkup = `
    <div class="cka-overlay-panel" data-id="advanced-search-panel">
    <header>
      <h3>Advanced Search</h3>
      <button class="cka-close-btn">×</button>
    </header>
      <main class="advanced-search-content">
        <div class="search-filters">
          ${createCheckboxList(baseOrClientSpecificOptions, 'baseOrClientSpecific', 'Base/Client Specific')}
          ${createCheckboxList(pageTypeOptions, 'pageType', 'Page Type')}
          ${createCheckboxList(domainOptions, 'domain', 'Domain')}
        </div>
        <div class="form-group">
          <input type="text" id="advanced-search-input" placeholder="Search by link name..." />
        </div>
      </main>
      <footer>
        <button id="apply-advanced-search">Apply Filters</button>
        <button id="clear-advanced-search">Clear Filters</button>
      </footer>
    </div>
  `;

  // Generate HTML for link items
  const linksMarkup = currentPageData
    .map((link: any) => `
      <div class="link-item">
        <div>
          <ck-alight-radio-button
            name="link-selection"
            value="${link.predefinedLinkName}"
            label=""
          ></ck-alight-radio-button>
        </div>
        <ul>
          <li><strong>${link.predefinedLinkName}</strong></li>
          <li><strong>Description:</strong> ${link.predefinedLinkDescription}</li>
          <li><strong>Base/Client Specific:</strong> ${link.baseOrClientSpecific}</li>
          <li><strong>Page Type:</strong> ${link.pageType}</li>
          <li><strong>Destination:</strong> ${link.destination}</li>
          <li><strong>Domain:</strong> ${link.domain}</li>
          <li><strong>Unique ID:</strong> ${link.uniqueId}</li>
          <li><strong>Attribute Name:</strong> ${link.attributeName}</li>
          <li><strong>Attribute Value:</strong> ${link.attributeValue}</li>
        </ul>
      </div>
    `)
    .join('');

  // Generate pagination controls
  const paginationMarkup = `
    <div id="pagination">
      <button id="first-page" data-page="1" ${page === 1 ? 'disabled' : ''}>First</button>
      <button id="prev-page" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>Previous</button>
      ${Array.from({ length: totalPages }, (_, i) =>
    `<button class="page-btn ${i + 1 === page ? 'active' : ''}" data-page="${i + 1}">
          ${i + 1}
        </button>`
  ).join('')}
      <button id="next-page" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>Next</button>
      <button id="last-page" data-page="${totalPages}" ${page === totalPages ? 'disabled' : ''}>Last</button>
    </div>
  `;

  return `
    <div id="search-container">
      <input type="text" id="search-input" placeholder="Search by link name..." value="${currentSearchQuery}" />
      <button id="reset-search-btn">Reset</button>
      <button class="cka-trigger-btn" data-id="advanced-search-panel">Advanced Search</button>
      <button id="search-btn">Search</button>
    </div>
    ${advancedSearchPanelMarkup}
    ${linksMarkup || '<p>No results found.</p>'}
    ${paginationMarkup}
  `;
}

// Applies all active filters to the data
function applyFilters(): void {
  filteredLinksData = predefinedLinksData.predefinedLinksDetails.filter((link: any) => {
    const nameMatch = currentSearchQuery ?
      link.predefinedLinkName.toLowerCase().includes(currentSearchQuery.toLowerCase()) :
      true;

    const baseOrClientSpecificMatch = selectedFilters.baseOrClientSpecific.length === 0 ||
      selectedFilters.baseOrClientSpecific.includes(link.baseOrClientSpecific);

    const pageTypeMatch = selectedFilters.pageType.length === 0 ||
      selectedFilters.pageType.includes(link.pageType);

    const domainMatch = selectedFilters.domain.length === 0 ||
      selectedFilters.domain.includes(link.domain);

    return nameMatch && baseOrClientSpecificMatch && pageTypeMatch && domainMatch;
  });
}

// Handles checkbox change events
function handleCheckboxChange(event: Event): void {
  const checkbox = event.target as any;
  if (!checkbox || !('checked' in checkbox)) return;

  const filterType = checkbox.dataset.filterType as keyof SelectedFilters;
  const value = checkbox.dataset.value;

  if (!filterType || !value) return;

  if (checkbox.checked) {
    if (!selectedFilters[filterType].includes(value)) {
      selectedFilters[filterType].push(value);
    }
  } else {
    selectedFilters[filterType] = selectedFilters[filterType].filter(v => v !== value);
  }
}

// Resets all filters and search criteria
export function resetSearch(): void {
  currentSearchQuery = '';
  selectedFilters = {
    baseOrClientSpecific: [],
    pageType: [],
    domain: []
  };
  filteredLinksData = [...predefinedLinksData.predefinedLinksDetails];
  currentPage = 1;
}

// Renders the filtered and paginated content into the container
export function renderContent(container: HTMLElement): void {
  const content = getPredefinedLinkContent(currentPage);
  container.innerHTML = content;

  // Initialize overlay panel
  new AlightOverlayPanel();

  // Attach event listeners after content is injected
  attachEventListeners(container);
}

// Attaches event listeners to the container
function attachEventListeners(container: HTMLElement): void {
  // Search functionality
  const searchBtn = container.querySelector('#search-btn');
  const searchInput = container.querySelector('#search-input') as HTMLInputElement;
  const resetSearchBtn = container.querySelector('#reset-search-btn');
  const applyAdvancedSearch = container.querySelector('#apply-advanced-search');
  const clearAdvancedSearch = container.querySelector('#clear-advanced-search');

  // Add checkbox change listeners
  const checkboxes = container.querySelectorAll('ck-alight-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', handleCheckboxChange);
  });

  // Search button click handler
  if (searchBtn instanceof HTMLElement) {
    searchBtn.addEventListener('click', () => {
      currentSearchQuery = searchInput?.value || '';
      applyFilters();
      renderContent(container);
    });
  }

  // Search input enter key handler
  if (searchInput instanceof HTMLInputElement) {
    searchInput.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' && searchBtn instanceof HTMLElement) {
        event.preventDefault();
        searchBtn.click();
      }
    });
  }

  // Reset button handler
  resetSearchBtn?.addEventListener('click', () => {
    resetSearch();
    if (searchInput) searchInput.value = '';
    renderContent(container);
  });

  // Advanced search handlers
  applyAdvancedSearch?.addEventListener('click', () => {
    applyFilters();
    renderContent(container);
  });

  clearAdvancedSearch?.addEventListener('click', () => {
    resetSearch();
    renderContent(container);
  });

  // Pagination handlers
  const paginationDiv = container.querySelector('#pagination');
  paginationDiv?.addEventListener('click', (event: Event) => {
    const target = event.target as HTMLElement;
    if (target.tagName !== 'BUTTON') return;

    const pageAttr = target.getAttribute('data-page');
    if (!pageAttr) return;

    const page = Number(pageAttr);
    if (!page) return;

    const totalPages = Math.ceil(filteredLinksData.length / pageSize);
    if (page < 1 || page > totalPages) return;

    if (page !== currentPage) {
      currentPage = page;
      renderContent(container);
    }
  });
}