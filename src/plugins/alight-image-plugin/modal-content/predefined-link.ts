// src/plugins/alight-image-plugin/modal-content/predefined-link.ts
import predefinedLinksData from './json/predefined-test-data.json';
import './../../alight-link-plugin/styles/predefined-link.scss';
import './../../alight-link-plugin/styles/search.scss';
import './../../components/alight-overlay-panel-component/styles/alight-overlay-panel.scss';

// State variables to manage data, search query, and current page
let filteredLinksData = [...predefinedLinksData.predefinedLinksDetails];
let currentSearchQuery = '';
let currentPage = 1;

// Constants
const pageSize = 5;  // Number of items per page

/**
 * Generates the HTML content for the current filtered and paginated data.
 * @param page - The current page number
 * @returns string - HTML content for the current page
 */
export function getPredefinedLinkContent(page: number): string {
  console.log('Generating content for page:', page);
  const totalItems = filteredLinksData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  // Ensure the current page is valid
  page = Math.max(1, Math.min(page, totalPages));
  console.log('Total items:', totalItems, 'Total pages:', totalPages, 'Adjusted page:', page);

  // Calculate the slice of data for the current page
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  console.log('Slice indices:', startIndex, 'to', endIndex);

  const currentPageData = filteredLinksData.slice(startIndex, endIndex);
  console.log('Items for current page:', currentPageData.length);

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

  // Create the advanced search panel markup
  const advancedSearchPanelMarkup = `
    <div class="ck-alight-overlay-panel" data-id="advanced-search-panel">
      <button class="ck-alight-closeBtn">×</button>
      <div class="advanced-search-content">
        <h3>Advanced Search</h3>
        <div class="form-group">
          <label for="advanced-name-search">Link Name:</label>
          <input type="text" id="advanced-name-search" />
        </div>
        <div class="form-group">
          <label for="advanced-page-type">Page Type:</label>
          <input type="text" id="advanced-page-type" />
        </div>
        <div class="form-group">
          <label for="advanced-domain">Domain:</label>
          <input type="text" id="advanced-domain" />
        </div>
        <div class="form-group">
          <label for="advanced-client-specific">Base/Client Specific:</label>
          <select id="advanced-client-specific">
            <option value="">All</option>
            <option value="Base">Base</option>
            <option value="Client Specific">Client Specific</option>
          </select>
        </div>
        <button id="apply-advanced-search">Apply Filters</button>
      </div>
    </div>
  `;

  // Return complete HTML structure
  return `
    <div id="search-container">
      <input type="text" id="search-input" placeholder="Search by link name..." value="${currentSearchQuery}" />
      <button id="reset-search-btn">Reset</button>
      <button class="ck-alight-triggerBtn" data-id="advanced-search-panel">Advanced Search</button>
      <button id="search-btn">Search</button>
    </div>
    ${advancedSearchPanelMarkup}
    ${linksMarkup || '<p>No results found.</p>'}
    ${paginationMarkup}
  `;
}

/**
 * Filters the data based on the search query.
 * @param query - The search query string
 */
export function handleSearch(query: string): void {
  console.log('Handling search for query:', query);
  currentSearchQuery = query.toLowerCase().trim();

  // Filter the data based on search query
  filteredLinksData = currentSearchQuery
    ? predefinedLinksData.predefinedLinksDetails.filter((link: any) =>
      link.predefinedLinkName.toLowerCase().includes(currentSearchQuery)
    )
    : [...predefinedLinksData.predefinedLinksDetails];

  console.log('Filtered results:', filteredLinksData.length);

  // Reset to the first page after search
  currentPage = 1;
}

/**
 * Resets the search and displays all data.
 */
export function resetSearch(): void {
  console.log('Resetting search');
  currentSearchQuery = '';
  filteredLinksData = [...predefinedLinksData.predefinedLinksDetails];
  currentPage = 1;
}

/**
 * Handles the advanced search functionality
 * @param container - The container element
 */
function handleAdvancedSearch(container: HTMLElement): void {
  const applyButton = container.querySelector('#apply-advanced-search');
  applyButton?.addEventListener('click', () => {
    const nameSearch = (container.querySelector('#advanced-name-search') as HTMLInputElement)?.value.toLowerCase();
    const pageType = (container.querySelector('#advanced-page-type') as HTMLInputElement)?.value.toLowerCase();
    const domain = (container.querySelector('#advanced-domain') as HTMLInputElement)?.value.toLowerCase();
    const clientSpecific = (container.querySelector('#advanced-client-specific') as HTMLSelectElement)?.value;

    filteredLinksData = predefinedLinksData.predefinedLinksDetails.filter((link: any) => {
      const matchesName = !nameSearch || link.predefinedLinkName.toLowerCase().includes(nameSearch);
      const matchesPageType = !pageType || link.pageType.toLowerCase().includes(pageType);
      const matchesDomain = !domain || link.domain.toLowerCase().includes(domain);
      const matchesClientSpecific = !clientSpecific || link.baseOrClientSpecific === clientSpecific;

      return matchesName && matchesPageType && matchesDomain && matchesClientSpecific;
    });

    currentPage = 1;
    renderContent(container);

    // Close the panel after applying filters
    const panel = container.querySelector('.ck-alight-overlay-panel') as HTMLElement;
    if (panel) {
      panel.style.opacity = "0";
      panel.style.visibility = "hidden";
      panel.classList.remove("ck-alight-active");
    }
  });
}

/**
 * Renders the filtered and paginated content into the container.
 * @param container - The HTMLElement to render content into
 */
export function renderContent(container: HTMLElement): void {
  console.log('Rendering content for page:', currentPage);
  const content = getPredefinedLinkContent(currentPage);
  console.log('Content generated, updating DOM');
  container.innerHTML = content;
  console.log('DOM updated, attaching event listeners');

  // Attach event listeners after content is injected
  attachEventListeners(container);
}

/**
 * Attaches event listeners to search and pagination controls.
 * Uses event delegation for better performance and to handle dynamically added elements.
 * @param container - The HTMLElement containing the modal's content
 */
function attachEventListeners(container: HTMLElement): void {
  // Search functionality
  const searchBtn = container.querySelector('#search-btn') as HTMLButtonElement | null;
  const searchInput = container.querySelector('#search-input') as HTMLInputElement | null;
  const resetSearchBtn = container.querySelector('#reset-search-btn') as HTMLButtonElement | null;

  // Search button click handler
  searchBtn?.addEventListener('click', () => {
    if (searchInput) {
      handleSearch(searchInput.value);
      renderContent(container);
    }
  });

  // Search input enter key handler
  searchInput?.addEventListener('keydown', (event) => {
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
  handleAdvancedSearch(container);

  // Pagination handlers
  const paginationDiv = container.querySelector('#pagination');
  paginationDiv?.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target.tagName !== 'BUTTON') return;

    const pageAttr = target.getAttribute('data-page');
    if (!pageAttr) return;

    const page = Number(pageAttr);
    console.log('Button clicked:', target.id || 'page button', 'Page:', page);

    if (!page) {
      console.log('Invalid page number');
      return;
    }

    const totalPages = Math.ceil(filteredLinksData.length / pageSize);
    console.log('Current page:', currentPage, 'Total pages:', totalPages);

    // Validate the page number
    if (page < 1 || page > totalPages) {
      console.log('Page out of range');
      return;
    }

    // Only update if it's a different page
    if (page !== currentPage) {
      console.log('Updating to page:', page);
      currentPage = page;
      renderContent(container);
    } else {
      console.log('Already on page:', page);
    }
  });
}
