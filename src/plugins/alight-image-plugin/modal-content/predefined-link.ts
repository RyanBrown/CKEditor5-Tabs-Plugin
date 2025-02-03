// src/plugins/alight-image-plugin/modal-content/predefined-link.ts
import predefinedLinksData from './json/predefined-test-data.json';
import { AlightOverlayPanel } from '../../ui-components/alight-overlay-panel-component/alight-overlay-panel';
import { CKALightSelectMenu } from '../../ui-components/alight-select-menu-component/alight-select-menu-component';
import '../../ui-components/alight-checkbox-component/alight-checkbox-component';
import '../../ui-components/alight-radio-component/alight-radio-component';
import './../../alight-link-plugin/styles/predefined-link.scss';

// Define interfaces for type safety
interface SelectedFilters {
  [key: string]: string[];
  baseOrClientSpecific: string[];
  pageType: string[];
  domain: string[];
}

interface PredefinedLink {
  predefinedLinkName: string;
  predefinedLinkDescription: string;
  baseOrClientSpecific: string;
  pageType: string;
  destination: string;
  domain: string;
  uniqueId: string;
  attributeName: string;
  attributeValue: string;
}

const overlayPanelConfig = {
  width: '600px',  // Optional: Add your desired width
  height: 'auto'   // Optional: Add your desired height
};

// State management
let filteredLinksData: PredefinedLink[] = [...predefinedLinksData.predefinedLinksDetails];
let currentSearchQuery = '';
let currentPage = 1;
const pageSize = 5;
const advancedSearchTriggerId = 'advanced-search-trigger-image';

// Initialize selected filters with empty arrays
let selectedFilters: SelectedFilters = {
  baseOrClientSpecific: [],
  pageType: [],
  domain: []
};

// Helper Functions
function getUniqueValues(data: PredefinedLink[], key: keyof PredefinedLink): string[] {
  return Array.from(new Set(data.map(item => item[key]))).sort();
}

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

// Main Content Generation
export function getPredefinedLinkContent(page: number): string {
  const totalItems = filteredLinksData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  // Validate and adjust page number
  page = Math.max(1, Math.min(page, totalPages));
  currentPage = page; // Update global state

  // Calculate page slice
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentPageData = filteredLinksData.slice(startIndex, endIndex);

  // Get filter options
  const baseOrClientSpecificOptions = getUniqueValues(predefinedLinksData.predefinedLinksDetails, 'baseOrClientSpecific');
  const pageTypeOptions = getUniqueValues(predefinedLinksData.predefinedLinksDetails, 'pageType');
  const domainOptions = getUniqueValues(predefinedLinksData.predefinedLinksDetails, 'domain');

  // Create UI components
  const searchContainerMarkup = `
    <div id="search-container" class="cka-search-container">
      <input type="text" id="search-input" placeholder="Search by link name..." value="${currentSearchQuery}" />
      <button id="reset-search-btn">Reset</button>
      <button id="${advancedSearchTriggerId}" data-panel-id="advanced-search-panel">Advanced Search</button>
      <button id="search-btn">Search</button>
    </div>
  `;

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
  const linksMarkup = currentPageData.length > 0
    ? currentPageData
      .map(link => `
          <div class="cka-link-item" data-link-name="${link.predefinedLinkName}">
            <div class="radio-container">
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
    <div id="links-container">
      ${linksMarkup}
    </div>
    ${paginationMarkup}
  `;
}

// Pagination Select Menu
function initializePageSelect(container: HTMLElement, pageNum: number, totalPages: number): void {
  const pageSelectContainer = container.querySelector('#page-select-container');
  if (!pageSelectContainer || !(pageSelectContainer instanceof HTMLElement)) return;

  const pageOptions = Array.from({ length: totalPages }, (_, i) => ({
    label: `Page ${i + 1} of ${totalPages}`,
    value: i + 1
  }));

  const pageSelect = new CKALightSelectMenu({
    options: pageOptions,
    value: pageNum,
    placeholder: `Page ${pageNum} of ${totalPages}`,
    onChange: (selectedValue) => {
      if (selectedValue && typeof selectedValue === 'number' && selectedValue !== currentPage) {
        // Update the module-level currentPage variable
        currentPage = selectedValue;
        console.log('Select menu changing page to:', currentPage); // Debug log
        renderContent(container);
      }
    }
  });

  pageSelectContainer.innerHTML = '';
  pageSelect.mount(pageSelectContainer);
}

// Filter Application
function applyFilters(): void {
  filteredLinksData = predefinedLinksData.predefinedLinksDetails.filter((link: PredefinedLink) => {
    const nameMatch = !currentSearchQuery ||
      link.predefinedLinkName.toLowerCase().includes(currentSearchQuery.toLowerCase());

    const baseOrClientSpecificMatch = selectedFilters.baseOrClientSpecific.length === 0 ||
      selectedFilters.baseOrClientSpecific.includes(link.baseOrClientSpecific);

    const pageTypeMatch = selectedFilters.pageType.length === 0 ||
      selectedFilters.pageType.includes(link.pageType);

    const domainMatch = selectedFilters.domain.length === 0 ||
      selectedFilters.domain.includes(link.domain);

    return nameMatch && baseOrClientSpecificMatch && pageTypeMatch && domainMatch;
  });

  // Reset to first page when filters change
  currentPage = 1;
}

// Event Handlers
function handleCheckboxChange(event: Event): void {
  const checkbox = event.target as HTMLInputElement;
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

function handlePaginationClick(event: Event, container: HTMLElement): void {
  const target = event.target as HTMLElement;
  if (!target.matches('.pagination-btn')) return;

  const pageAttr = target.getAttribute('data-page');
  if (!pageAttr) return;

  const newPage = parseInt(pageAttr, 10);
  const totalPages = Math.ceil(filteredLinksData.length / pageSize);

  if (isNaN(newPage) || newPage < 1 || newPage > totalPages || newPage === currentPage) return;

  console.log(`Changing page from ${currentPage} to ${newPage}`); // Debug log
  currentPage = newPage;
  renderContent(container);
}

// Attaches event listeners to the container
function attachEventListeners(container: HTMLElement): void {
  // Link selection
  const linkItems = container.querySelectorAll('.cka-link-item');
  linkItems.forEach(item => {
    item.addEventListener('click', (event) => {
      // Prevent triggering if clicking directly on the radio button
      if ((event.target as HTMLElement).closest('ck-alight-radio-button')) return;

      const linkName = (event.currentTarget as HTMLElement).getAttribute('data-link-name');
      if (!linkName) return;
      // Find the radio button within this link item
      const radio = (event.currentTarget as HTMLElement).querySelector('ck-alight-radio-button') as any;
      if (radio) {
        // Set the radio button's checked state
        radio.checked = true;
        radio.value = linkName;
        // Dispatch both change and input events to ensure proper state updates
        radio.dispatchEvent(new Event('change', { bubbles: true }));
        radio.dispatchEvent(new Event('input', { bubbles: true }));

        container.querySelectorAll('ck-alight-radio-button').forEach(otherRadio => {
          if (otherRadio !== radio) {
            (otherRadio as any).checked = false;
          }
        });
      }
    });
  });

  // Search functionality
  const searchBtn = container.querySelector('#search-btn') as HTMLButtonElement;  // Type cast added
  const searchInput = container.querySelector('#search-input') as HTMLInputElement;
  const resetSearchBtn = container.querySelector('#reset-search-btn');
  const applyAdvancedSearch = container.querySelector('#apply-advanced-search');
  const clearAdvancedSearch = container.querySelector('#clear-advanced-search');
  const paginationDiv = container.querySelector('#pagination');

  // Checkbox listeners
  container.querySelectorAll('ck-alight-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', handleCheckboxChange);
  });

  // Search button
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      currentSearchQuery = searchInput?.value || '';
      applyFilters();
      renderContent(container);
    });
  }

  // Search input enter key
  if (searchInput) {
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && searchBtn) {
        event.preventDefault();
        searchBtn.click();  // Now safe because searchBtn is HTMLButtonElement
      }
    });
  }

  // Reset button
  if (resetSearchBtn instanceof HTMLElement) {  // Type guard added
    resetSearchBtn.addEventListener('click', () => {
      resetSearch();
      if (searchInput) searchInput.value = '';
      renderContent(container);
    });
  }

  // Advanced search buttons
  if (applyAdvancedSearch instanceof HTMLElement) {  // Type guard added
    applyAdvancedSearch.addEventListener('click', () => {
      applyFilters();
      renderContent(container);
    });
  }

  if (clearAdvancedSearch instanceof HTMLElement) {  // Type guard added
    clearAdvancedSearch.addEventListener('click', () => {
      resetSearch();
      renderContent(container);
    });
  }

  // Pagination
  if (paginationDiv) {
    paginationDiv.addEventListener('click', (event) => handlePaginationClick(event, container));
  }
}

export function renderContent(container: HTMLElement): void {
  const content = getPredefinedLinkContent(currentPage);
  container.innerHTML = content;

  // Initialize overlay panel
  const trigger = document.getElementById(advancedSearchTriggerId);
  if (trigger) {
    new AlightOverlayPanel(advancedSearchTriggerId, overlayPanelConfig);
  }

  // Initialize page select
  const totalPages = Math.ceil(filteredLinksData.length / pageSize);
  initializePageSelect(container, currentPage, totalPages);

  // Attach event listeners
  attachEventListeners(container);
}