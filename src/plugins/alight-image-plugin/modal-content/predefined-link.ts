// src/plugins/alight-image-plugin/modal-content/predefined-link.ts
import predefinedLinksData from './json/predefined-test-data.json';
import './../../alight-link-plugin/styles/predefined-link.scss';
import './../../alight-link-plugin/styles/search.scss';

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

  // Return complete HTML structure
  return `
    <div id="search-container">
      <input type="text" id="search-input" placeholder="Search by link name..." value="${currentSearchQuery}" />
      <button id="search-btn">Search</button>
      <button id="reset-search-btn">Reset</button>
    </div>
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

  // Reset to the first page and render
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
  // Search button listener
  const searchBtn = container.querySelector('#search-btn');
  const searchInput = container.querySelector('#search-input') as HTMLInputElement | null;
  const resetSearchBtn = container.querySelector('#reset-search-btn');

  searchBtn?.addEventListener('click', () => {
    if (searchInput) handleSearch(searchInput.value);
    renderContent(container); // Re-render content after search
  });

  resetSearchBtn?.addEventListener('click', () => {
    resetSearch();
    if (searchInput) searchInput.value = '';
    renderContent(container); // Re-render content after reset
  });

  // Input listener for live search (optional)
  searchInput?.addEventListener('input', (event) => {
    const target = event.target as HTMLInputElement;
    handleSearch(target.value);
    renderContent(container); // Re-render content after input
  });

  // Unified pagination button handler using event delegation
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
      renderContent(container); // Re-render content for the new page
    } else {
      console.log('Already on page:', page);
    }
  });
}
