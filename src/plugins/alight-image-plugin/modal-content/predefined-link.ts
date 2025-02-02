// src/plugins/alight-image-plugin/modal-content/predefined-link.ts
import predefinedLinksData from './json/predefined-test-data.json';
import { AlightOverlayPanel } from '../../ui-components/alight-overlay-panel-component/alight-overlay-panel';
import './../../alight-link-plugin/styles/predefined-link.scss';
import './../../alight-link-plugin/styles/search.scss';
import './../../ui-components/alight-overlay-panel-component/styles/alight-overlay-panel.scss';

// State variables to manage data, search query, and current page
let filteredLinksData = [...predefinedLinksData.predefinedLinksDetails];
let currentSearchQuery = '';
let currentPage = 1;
let currentAdvancedSearchFilter = '';
// Define interface for filter types
interface SelectedFilters {
  [key: string]: string;
  baseOrClientSpecific: string;
  pageType: string;
  domain: string;
}

// Initialize selected filters with type
let selectedFilters: SelectedFilters = {
  baseOrClientSpecific: '',
  pageType: '',
  domain: ''
};

// Constants
const pageSize = 5;  // Number of items per page

const advancedSearchOptions = [
  { label: 'Link Name', value: 'name' },
  { label: 'Page Type', value: 'pageType' },
  { label: 'Domain', value: 'domain' },
  { label: 'Base/Client Specific', value: 'clientSpecific' }
];

/**
 * Gets unique values from an array of objects for a specific key
 * @param data - Array of objects
 * @param key - Key to extract unique values from
 * @returns Array of unique values
 */
function getUniqueValues(data: any[], key: string): string[] {
  return Array.from(new Set(data.map(item => item[key]))).sort();
}

/**
 * Creates a select dropdown for filter options
 * @param options - Array of options
 * @param name - Name of the select element
 * @param label - Label text
 * @returns HTML string for select element
 */
function createSelectDropdown(options: string[], name: keyof SelectedFilters, label: string): string {
  return `
    <div class="form-group">
      <label>${label}</label>
      <select name="${name}" class="filter-select">
        <option value="">All</option>
        ${options.map(option => `
          <option value="${option}" ${selectedFilters[name] === option ? 'selected' : ''}>
            ${option}
          </option>
        `).join('')}
      </select>
    </div>
  `;
}

/**
 * Generates the HTML content for the current filtered and paginated data.
 * @param page - The current page number
 * @returns string - HTML content for the current page
 */
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
      <button class="cka-close-btn">×</button>
      <div class="advanced-search-content">
        <h3>Advanced Search</h3>
        ${createSelectDropdown(baseOrClientSpecificOptions, 'baseOrClientSpecific', 'Base/Client Specific')}
        ${createSelectDropdown(pageTypeOptions, 'pageType', 'Page Type')}
        ${createSelectDropdown(domainOptions, 'domain', 'Domain')}
        <div class="form-group">
          <input type="text" id="advanced-search-input" placeholder="Search by link name..." />
        </div>
        <button id="apply-advanced-search">Apply Filters</button>
        <button id="clear-advanced-search">Clear Filters</button>
      </div>
    </div>
  `;

  // Generate HTML for link items
  const linksMarkup = currentPageData
    .map((link: any) => `
      <div class="link-item">
        <div>
          <input type="radio" name="link-selection" value="${link.predefinedLinkName}" />
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

  // Return complete HTML structure
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

/**
 * Applies all active filters to the data
 */
function applyFilters(): void {
  filteredLinksData = predefinedLinksData.predefinedLinksDetails.filter((link: any) => {
    const nameMatch = currentSearchQuery ?
      link.predefinedLinkName.toLowerCase().includes(currentSearchQuery.toLowerCase()) :
      true;

    const baseOrClientSpecificMatch = selectedFilters.baseOrClientSpecific ?
      link.baseOrClientSpecific === selectedFilters.baseOrClientSpecific :
      true;

    const pageTypeMatch = selectedFilters.pageType ?
      link.pageType === selectedFilters.pageType :
      true;

    const domainMatch = selectedFilters.domain ?
      link.domain === selectedFilters.domain :
      true;

    return nameMatch && baseOrClientSpecificMatch && pageTypeMatch && domainMatch;
  });
}

/**
 * Handles the advanced search functionality
 * @param container - The container element
 */
function handleAdvancedSearch(container: HTMLElement): void {
  const searchInput = container.querySelector('#advanced-search-input') as HTMLInputElement;
  currentSearchQuery = searchInput?.value || '';

  // Update selected filters from dropdowns
  const filterSelects = container.querySelectorAll('.filter-select') as NodeListOf<HTMLSelectElement>;
  filterSelects.forEach(select => {
    const filterName = select.name as keyof SelectedFilters;
    selectedFilters[filterName] = select.value;
  });

  applyFilters();
  currentPage = 1;
  renderContent(container);
}

/**
 * Resets all filters and search criteria
 */
export function resetSearch(): void {
  currentSearchQuery = '';
  selectedFilters = {
    baseOrClientSpecific: '',
    pageType: '',
    domain: ''
  };
  filteredLinksData = [...predefinedLinksData.predefinedLinksDetails];
  currentPage = 1;
}

/**
 * Renders the filtered and paginated content into the container.
 * @param container - The HTMLElement to render content into
 */
export function renderContent(container: HTMLElement): void {
  const content = getPredefinedLinkContent(currentPage);
  container.innerHTML = content;

  // Initialize overlay panel
  new AlightOverlayPanel();

  // Attach event listeners after content is injected
  attachEventListeners(container);
}

/**
 * Attaches event listeners to search and pagination controls.
 * @param container - The HTMLElement containing the modal's content
 */
function attachEventListeners(container: HTMLElement): void {
  // Search functionality
  const searchBtn = container.querySelector('#search-btn') as HTMLButtonElement | null;
  const searchInput = container.querySelector('#search-input') as HTMLInputElement | null;
  const resetSearchBtn = container.querySelector('#reset-search-btn') as HTMLButtonElement | null;
  const applyAdvancedSearch = container.querySelector('#apply-advanced-search') as HTMLButtonElement | null;
  const clearAdvancedSearch = container.querySelector('#clear-advanced-search') as HTMLButtonElement | null;

  // Search button click handler
  searchBtn?.addEventListener('click', () => {
    if (searchInput) {
      currentSearchQuery = searchInput.value;
      applyFilters();
      renderContent(container);
    }
  });

  // Search input enter key handler
  searchInput?.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Enter' && searchBtn) {
      event.preventDefault();
      searchBtn.click();
    }
  });

  // Reset button handler
  resetSearchBtn?.addEventListener('click', () => {
    resetSearch();
    if (searchInput) searchInput.value = '';
    renderContent(container);
  });

  // Advanced search handlers
  applyAdvancedSearch?.addEventListener('click', () => {
    handleAdvancedSearch(container);
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