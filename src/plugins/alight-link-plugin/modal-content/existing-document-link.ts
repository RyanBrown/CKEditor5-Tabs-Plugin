// src/plugins/alight-link-plugin/modal-content/existing-document-link.ts

import existingDocumentLinkData from './json/existing-document-test-data.json';
import { ILinkManager } from './ILinkManager';
import { AlightOverlayPanel } from '../../ui-components/alight-overlay-panel-component/alight-overlay-panel';
import { CKALightSelectMenu } from '../../ui-components/alight-select-menu-component/alight-select-menu-component';
import '../../ui-components/alight-checkbox-component/alight-checkbox-component';
import '../../ui-components/alight-radio-component/alight-radio-component';

// Type for document from JSON
interface DocumentItem {
  serverFilePath: string;
  title: string;
  fileId: string;
  fileType: string;
  population: string;
  locale: string;
  lastUpdated: number;
  updatedBy: string;
  upointLink: string;
  documentDescription: string;
  expiryDate: string;
}

// JSON response type
interface DocumentData {
  responseStatus: string;
  branchName: string;
  documentList: DocumentItem[];
}

// Selected filters interface
interface SelectedFilters {
  [key: string]: string[];
  population: string[];
  fileType: string[];
  locale: string[];
}

export class ExistingDocumentLinkManager implements ILinkManager {
  private overlayPanelConfig = {
    width: '600px',
    height: 'auto'
  };

  private documentData: DocumentData = existingDocumentLinkData as DocumentData;
  private filteredDocsData: DocumentItem[] = [...this.documentData.documentList];

  private currentSearchQuery = '';
  private currentPage = 1;
  private readonly pageSize = 5;
  private readonly advancedSearchTriggerId = 'advanced-search-trigger-document';

  private selectedFilters: SelectedFilters = {
    population: [],
    fileType: [],
    locale: []
  };

  public getLinkContent(page: number): string {
    return this.buildContentForPage(page);
  }

  public renderContent(container: HTMLElement): void {
    container.innerHTML = this.buildContentForPage(this.currentPage);

    const triggerEl = container.querySelector(`#${this.advancedSearchTriggerId}`) as HTMLButtonElement | null;
    if (triggerEl) {
      new AlightOverlayPanel(triggerEl, this.overlayPanelConfig);
    }

    const totalPages = Math.ceil(this.filteredDocsData.length / this.pageSize);
    this.initializePageSelect(container, this.currentPage, totalPages);
    this.attachEventListeners(container);
  }

  public resetSearch(): void {
    this.currentSearchQuery = '';
    this.selectedFilters = {
      population: [],
      fileType: [],
      locale: []
    };
    this.filteredDocsData = [...this.documentData.documentList];
    this.currentPage = 1;
  }

  private buildContentForPage(page: number): string {
    const totalItems = this.filteredDocsData.length;
    const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
    page = Math.max(1, Math.min(page, totalPages));
    this.currentPage = page;

    const startIndex = (page - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, totalItems);
    const currentPageData = this.filteredDocsData.slice(startIndex, endIndex);

    const populationOptions = this.getUniqueValues(this.documentData.documentList, 'population');
    const fileTypeOptions = this.getUniqueValues(this.documentData.documentList, 'fileType');
    const localeOptions = this.getUniqueValues(this.documentData.documentList, 'locale');

    const searchContainerMarkup = `
      <div id="search-container" class="cka-search-container">
        <input type="text" id="search-input" placeholder="Search by document title..." value="${this.currentSearchQuery}" />
        <button id="reset-search-btn" class="cka-button cka-button-rounded cka-button-outlined cka-button-text">Reset</button>
        <button id="${this.advancedSearchTriggerId}" data-panel-id="advanced-search-panel" class="cka-button cka-button-rounded cka-button-text">
          Advanced Search
        </button>
        <button id="search-btn" class="cka-button cka-button-rounded cka-button-outlined">Search</button>
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
            ${this.createCheckboxList(fileTypeOptions, 'fileType', 'File Type')}
            ${this.createCheckboxList(populationOptions, 'population', 'Population')}
            ${this.createCheckboxList(localeOptions, 'locale', 'Language')}
          </div>
          <div class="form-group">
            <input type="text" id="advanced-search-input" placeholder="Search by document title..." />
          </div>
        </main>
        <footer>
          <button id="clear-advanced-search" class="cka-button cka-button-rounded cka-button-outlined cka-button-sm">Clear Filters</button>
          <button id="apply-advanced-search" class="cka-button cka-button-rounded cka-button-sm">Apply Filters</button>
        </footer>
      </div>
    `;

    const documentsMarkup = currentPageData.length > 0
      ? currentPageData
        .map(doc => `
          <div class="cka-link-item" data-doc-title="${doc.title}">
            <div class="radio-container">
              <cka-radio-button name="document-selection" value="${doc.title}" label=""></cka-radio-button>
            </div>
            <ul>
              <li><strong>${doc.title}</strong></li>
              <!--<li><strong>Description:</strong> ${doc.documentDescription}</li>-->
              <li><strong>Population:</strong> ${doc.population}</li>
              <li><strong>Language:</strong> ${doc.locale}</li>
              <li><strong>File Type:</strong> ${doc.fileType}</li>
              <!--<li><strong>File ID:</strong> ${doc.fileId}</li>
              <li><strong>Last Updated:</strong> ${new Date(doc.lastUpdated).toLocaleDateString()}</li>
              <li><strong>Updated By:</strong> ${doc.updatedBy}</li>-->
            </ul>
          </div>
        `)
        .join('')
      : '<p>No results found.</p>';

    const paginationMarkup = totalPages > 1
      ? `
        <article id="pagination" class="cka-pagination">
          <button id="first-page" class="pagination-btn cka-button cka-button-text" data-page="1" ${page === 1 ? 'disabled' : ''}>First</button>
          <button id="prev-page" class="pagination-btn cka-button cka-button-text" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>Previous</button>
          <div id="page-select-container" class="cka-select-menu-wrap"></div>
          <button id="next-page" class="pagination-btn cka-button cka-button-text" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>Next</button>
          <button id="last-page" class="pagination-btn cka-button cka-button-text" data-page="${totalPages}" ${page === totalPages ? 'disabled' : ''}>Last</button>
        </article>
      `
      : '';

    return `
      ${searchContainerMarkup}
      ${advancedSearchPanelMarkup}
      <div id="documents-container">
        ${documentsMarkup}
      </div>
      ${paginationMarkup}
    `;
  }

  private applyFilters(): void {
    this.filteredDocsData = this.documentData.documentList.filter(doc => {
      const titleMatch = !this.currentSearchQuery ||
        doc.title.toLowerCase().includes(this.currentSearchQuery.toLowerCase());

      const populationMatch = this.selectedFilters.population.length === 0 ||
        this.selectedFilters.population.includes(doc.population);

      const fileTypeMatch = this.selectedFilters.fileType.length === 0 ||
        this.selectedFilters.fileType.includes(doc.fileType);

      const localeMatch = this.selectedFilters.locale.length === 0 ||
        this.selectedFilters.locale.includes(doc.locale);

      return titleMatch && populationMatch && fileTypeMatch && localeMatch;
    });
    this.currentPage = 1;
  }

  private attachEventListeners(container: HTMLElement): void {
    const searchInput = container.querySelector('#search-input') as HTMLInputElement;
    const searchBtn = container.querySelector('#search-btn');
    const resetBtn = container.querySelector('#reset-search-btn');

    searchBtn?.addEventListener('click', () => {
      this.currentSearchQuery = searchInput.value;
      this.applyFilters();
      this.renderContent(container);
    });

    searchInput?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        (searchBtn as HTMLButtonElement)?.click();
      }
    });

    resetBtn?.addEventListener('click', () => {
      this.resetSearch();
      if (searchInput) {
        searchInput.value = '';
      }
      this.renderContent(container);
    });

    const applyAdvancedSearchBtn = container.querySelector('#apply-advanced-search');
    const clearAdvancedSearchBtn = container.querySelector('#clear-advanced-search');
    const advancedSearchInput = container.querySelector('#advanced-search-input') as HTMLInputElement;

    applyAdvancedSearchBtn?.addEventListener('click', () => {
      if (advancedSearchInput) {
        this.currentSearchQuery = advancedSearchInput.value;
      }
      this.applyFilters();
      this.renderContent(container);
    });

    clearAdvancedSearchBtn?.addEventListener('click', () => {
      this.resetSearch();
      this.renderContent(container);
    });

    const checkboxes = container.querySelectorAll('cka-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', event => {
        const target = event.target as HTMLInputElement;
        if (!target) return;
        const filterType = target.dataset.filterType as keyof SelectedFilters;
        const value = target.dataset.value;
        if (!filterType || !value) return;
        if (target.checked) {
          this.selectedFilters[filterType].push(value);
        } else {
          this.selectedFilters[filterType] = this.selectedFilters[filterType].filter(v => v !== value);
        }
      });
    });

    const paginationDiv = container.querySelector('#pagination');
    paginationDiv?.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      if (!target.matches('.pagination-btn')) return;
      const pageAttr = target.getAttribute('data-page');
      if (!pageAttr) return;
      const newPage = parseInt(pageAttr, 10);
      const totalPages = Math.ceil(this.filteredDocsData.length / this.pageSize);
      if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages && newPage !== this.currentPage) {
        this.currentPage = newPage;
        this.renderContent(container);
      }
    });

    const documentItems = container.querySelectorAll('.cka-link-item');
    documentItems.forEach(item => {
      item.addEventListener('click', event => {
        if ((event.target as HTMLElement).closest('cka-radio-button')) return;
        const docTitle = (event.currentTarget as HTMLElement).getAttribute('data-doc-title');
        if (!docTitle) return;
        const radio = (event.currentTarget as HTMLElement).querySelector('cka-radio-button') as any;
        if (radio) {
          radio.checked = true;
          radio.value = docTitle;
          radio.dispatchEvent(new Event('change', { bubbles: true }));
          radio.dispatchEvent(new Event('input', { bubbles: true }));
          container.querySelectorAll('cka-radio-button').forEach(otherRadio => {
            if (otherRadio !== radio) {
              (otherRadio as any).checked = false;
            }
          });
        }
      });
    });
  }

  private initializePageSelect(container: HTMLElement, pageNum: number, totalPages: number): void {
    const pageSelectContainer = container.querySelector('#page-select-container');
    if (!pageSelectContainer) return;

    const pageOptions = Array.from({ length: totalPages }, (_, i) => ({
      label: `${i + 1} of ${totalPages}`,
      value: i + 1
    }));

    const pageSelect = new CKALightSelectMenu({
      options: pageOptions,
      value: pageNum,
      placeholder: `Page ${pageNum} of ${totalPages}`,
      onChange: (selectedValue) => {
        if (selectedValue && typeof selectedValue === 'number' && selectedValue !== this.currentPage) {
          this.currentPage = selectedValue;
          this.renderContent(container);
        }
      }
    });

    pageSelectContainer.innerHTML = '';
    pageSelect.mount(pageSelectContainer as HTMLElement);
  }

  private getUniqueValues(data: DocumentItem[], key: keyof DocumentItem): string[] {
    return Array.from(new Set(data.map(item => String(item[key])))).sort();
  }

  private createCheckboxList(options: string[], filterType: keyof SelectedFilters, title: string): string {
    return `
      <div class="filter-section">
        <h4>${title}</h4>
        <ul class="checkbox-list">
          ${options
        .map(option => {
          const checked = this.selectedFilters[filterType].includes(option) ? 'initialvalue="true"' : '';
          return `
                <li>
                  <cka-checkbox data-filter-type="${filterType}" data-value="${option}" ${checked}>
                    ${option}
                  </cka-checkbox>
                </li>
              `;
        })
        .join('')}
        </ul>
      </div>
    `;
  }
}