// src/plugins/alight-image-plugin/modal-content/predefined-link.ts
import predefinedLinksData from './json/predefined-test-data.json';
import { CKALightSelectMenu } from '../../ui-components/alight-select-menu-component/alight-select-menu-component';
import './../../alight-link-plugin/styles/predefined-link.scss';
import './../../alight-link-plugin/styles/search.scss';

// State variables to manage data, search query, and current page
let filteredLinksData = [...predefinedLinksData.predefinedLinksDetails];
let currentSearchQuery = '';
let currentPage = 1;
let advancedSearchSelect: CKALightSelectMenu<{ label: string; value: string }> | null = null;

// Constants
const pageSize = 5;  // Number of items per page

const advancedSearchOptions = [
  { label: 'Link Name', value: 'name' },
  { label: 'Page Type', value: 'pageType' },
  { label: 'Domain', value: 'domain' },
  { label: 'Base/Client Specific', value: 'clientSpecific' }
];

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

  // Create the advanced search form markup
  const advancedSearchFormMarkup = `
    <div id="advanced-search-form" class="hidden">
      <div class="advanced-search-content">
        <div class="form-group">
          <input type="text" id="advanced-search-input" placeholder="Enter search term..." />
        </div>
        <button id="apply-advanced-search">Apply Filter</button>
        <button id="clear-advanced-search">Clear Filter</button>
      </div>
    </div>
  `;

  // Return complete HTML structure
  return `
    <div id="search-container">
      <input type="text" id="search-input" placeholder="Search by link name..." value="${currentSearchQuery}" />
      <button id="reset-search-btn">Reset</button>
      <div id="advanced-search-select"></div>
      <button id="search-btn">Search</button>
    </div>
    ${advancedSearchFormMarkup}
    ${linksMarkup || '<p>No results found.</p>'}
    ${paginationMarkup}
  `;
}

/**
 * Initializes the advanced search select menu
 * @param container - The container element
 */
function initializeAdvancedSearch(container: HTMLElement): void {
  const selectContainer = container.querySelector('#advanced-search-select') as HTMLElement;
  if (!selectContainer) return;

  advancedSearchSelect = new CKALightSelectMenu<{ label: string; value: string }>({
    options: advancedSearchOptions,
    placeholder: 'Advanced Search',
    onChange: (value) => {
      const searchForm = container.querySelector('#advanced-search-form');
      const searchInput = container.querySelector('#advanced-search-input') as HTMLInputElement | null;

      if (!searchForm || !searchInput) return;

      if (value && typeof value === 'string') {
        searchForm.classList.remove('hidden');
        const selectedOption = advancedSearchOptions.find(opt => opt.value === value);
        searchInput.placeholder = selectedOption ? `Search by ${selectedOption.label}...` : 'Enter search term...';
      } else {
        searchForm.classList.add('hidden');
      }
    }
  });

  advancedSearchSelect.mount(selectContainer);
}

/**
 * Handles the advanced search functionality
 * @param container - The container element
 * @param searchTerm - The search term
 */
function handleAdvancedSearch(container: HTMLElement, searchTerm: string): void {
  const selectedFilter = advancedSearchSelect?.getValue();

  if (!selectedFilter || typeof selectedFilter !== 'string' || !searchTerm) {
    return;
  }

  const searchTermLower = searchTerm.toLowerCase();

  filteredLinksData = predefinedLinksData.predefinedLinksDetails.filter((link: any) => {
    switch (selectedFilter) {
      case 'name':
        return link.predefinedLinkName.toLowerCase().includes(searchTermLower);
      case 'pageType':
        return link.pageType.toLowerCase().includes(searchTermLower);
      case 'domain':
        return link.domain.toLowerCase().includes(searchTermLower);
      case 'clientSpecific':
        return link.baseOrClientSpecific.toLowerCase().includes(searchTermLower);
      default:
        return true;
    }
  });

  currentPage = 1;
  renderContent(container);
}

/**
 * Filters the data based on the search query.
 * @param query - The search query string
 */
export function handleSearch(query: string): void {
  currentSearchQuery = query.toLowerCase().trim();

  filteredLinksData = currentSearchQuery
    ? predefinedLinksData.predefinedLinksDetails.filter((link: any) =>
      link.predefinedLinkName.toLowerCase().includes(currentSearchQuery)
    )
    : [...predefinedLinksData.predefinedLinksDetails];

  currentPage = 1;
}

/**
 * Resets the search and displays all data.
 */
export function resetSearch(): void {
  currentSearchQuery = '';
  filteredLinksData = [...predefinedLinksData.predefinedLinksDetails];
  currentPage = 1;
  if (advancedSearchSelect) {
    advancedSearchSelect.setValue(null);
  }
}

/**
 * Renders the filtered and paginated content into the container.
 * @param container - The HTMLElement to render content into
 */
export function renderContent(container: HTMLElement): void {
  const content = getPredefinedLinkContent(currentPage);
  container.innerHTML = content;

  // Initialize advanced search select after content is rendered
  initializeAdvancedSearch(container);

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
  const advancedSearchInput = container.querySelector('#advanced-search-input') as HTMLInputElement | null;
  const applyAdvancedSearch = container.querySelector('#apply-advanced-search') as HTMLButtonElement | null;
  const clearAdvancedSearch = container.querySelector('#clear-advanced-search') as HTMLButtonElement | null;

  // Search button click handler
  searchBtn?.addEventListener('click', () => {
    if (searchInput) {
      handleSearch(searchInput.value);
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
    if (advancedSearchInput) advancedSearchInput.value = '';
    renderContent(container);
  });

  // Advanced search handlers
  applyAdvancedSearch?.addEventListener('click', () => {
    if (advancedSearchInput) {
      handleAdvancedSearch(container, advancedSearchInput.value);
    }
  });

  clearAdvancedSearch?.addEventListener('click', () => {
    if (advancedSearchInput) {
      advancedSearchInput.value = '';
      resetSearch();
      renderContent(container);
    }
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