// src/plugins/alight-existing-document-link-plugin/modal-content/alight-existing-document-link-plugin-modal-ContentManager.ts
import { LinkManager } from './alight-existing-document-link-plugin-modal-LinkManager';
import { DocumentLink } from './alight-existing-document-link-plugin-modal-types';
import { SearchManager } from './alight-existing-document-link-plugin-modal-SearchManager';
import { PaginationManager } from './alight-existing-document-link-plugin-modal-PaginationManager';
import existingDocumentLinksData from './json/existing-document-test-data.json';
import './../styles/alight-existing-document-link-plugin.scss';

export class ContentManager implements LinkManager {
  private selectedLink: DocumentLink | null = null;
  private existingDocumentLinks: DocumentLink[] = existingDocumentLinksData.documentList;
  private filteredLinks: DocumentLink[] = [...this.existingDocumentLinks];
  private searchManager: SearchManager;
  private paginationManager: PaginationManager;
  private container: HTMLElement | null = null;

  constructor() {
    this.paginationManager = new PaginationManager(this.handlePageChange.bind(this));
    this.searchManager = new SearchManager(
      this.existingDocumentLinks,
      this.handleSearchResults.bind(this),
      this.paginationManager
    );
  }

  public getSelectedLink(): { destination: string; title: string } | null {
    if (!this.selectedLink) return null;
    return {
      destination: this.selectedLink.serverFilePath,
      title: this.selectedLink.title
    };
  }

  private handleSearchResults = (filteredData: DocumentLink[]): void => {
    console.log('Search results updated:', filteredData.length, 'items');

    this.filteredLinks = filteredData;

    // Maintain selected link if still in filtered results, otherwise clear selection
    if (this.selectedLink && !filteredData.some(link => link.title === this.selectedLink?.title)) {
      this.selectedLink = null;
    }

    // Re-render the UI
    if (this.container) {
      console.log('Re-rendering content');
      this.renderContent(this.container);
    }
  };

  private handlePageChange = (page: number): void => {
    if (this.container) {
      this.renderContent(this.container);
    }
  };

  public resetSearch(): void {
    this.searchManager.reset();
    this.selectedLink = null;
    this.filteredLinks = [...this.existingDocumentLinks];

    if (this.container) {
      this.renderContent(this.container);
    }
  }

  public renderContent(container: HTMLElement): void {
    this.container = container;
    container.innerHTML = this.buildContentForPage();

    // Initialize components in correct order
    this.initializeComponents(container);
  }

  private initializeComponents(container: HTMLElement): void {
    // Initialize search first as it sets up the search container
    this.searchManager.initialize(container);

    // Then initialize pagination
    this.paginationManager.initialize(container, this.filteredLinks.length);

    // Finally attach link selection listeners
    this.attachLinkSelectionListeners(container);

    // Ensure radio buttons reflect current selection
    if (this.selectedLink) {
      const selectedRadio = container.querySelector(`cka-radio-button[value="${this.selectedLink.title}"]`) as any;
      if (selectedRadio) {
        selectedRadio.checked = true;
      }
    }
  }

  private buildContentForPage(): string {
    const currentPage = this.paginationManager.getCurrentPage();
    const pageSize = this.paginationManager.getPageSize();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, this.filteredLinks.length);
    const currentPageData = this.filteredLinks.slice(startIndex, endIndex);

    // Search container
    const searchContainerMarkup = `<div id="search-container-root" class="cka-search-container"></div>`;

    // Links list
    const linksMarkup = currentPageData.length > 0
      ? currentPageData
        .map((link: DocumentLink) => this.buildLinkItemMarkup(link))
        .join('')
      : '<p>No results found.</p>';

    // Pagination container
    const paginationMarkup = `<div id="pagination-container" class="cka-pagination"></div>`;

    return `
      ${searchContainerMarkup}
      <div id="links-container" class="cka-links-container">
        ${linksMarkup}
      </div>
      ${paginationMarkup}
    `;
  }

  private buildLinkItemMarkup(link: DocumentLink): string {
    const isSelected = this.selectedLink?.title === link.title;

    return `
      <div class="cka-link-item ${isSelected ? 'selected' : ''}" data-link-name="${link.title}">
        <div class="radio-container">
          <cka-radio-button name="linkument-selection" value="${link.title}" label=""></cka-radio-button>
        </div>
        <ul>
          <li><strong>${link.title}</strong></li>
          <!--<li><strong>Description:</strong> ${link.documentDescription}</li>-->
          <li><strong>Population:</strong> ${link.population}</li>
          <li><strong>Language:</strong> ${link.locale}</li>
          <li><strong>File Type:</strong> ${link.fileType}</li>
          <!--<li><strong>File ID:</strong> ${link.fileId}</li>
          <li><strong>Last Updated:</strong> ${new Date(link.lastUpdated).toLocaleDateString()}</li>
          <li><strong>Updated By:</strong> ${link.updatedBy}</li>-->
        </ul>
      </div>
    `;
  }

  private attachLinkSelectionListeners(container: HTMLElement): void {
    // Link item click handlers
    container.querySelectorAll('.cka-link-item').forEach(item => {
      item.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;
        // Ignore clicks on the radio button itself
        if (target.closest('cka-radio-button')) return;

        const linkName = (item as HTMLElement).dataset.linkName;
        if (!linkName) return;

        this.handleLinkSelection(linkName, item as HTMLElement);
      });
    });

    // Radio button change handlers
    container.querySelectorAll('cka-radio-button').forEach(radio => {
      radio.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (!target.checked) return;

        const linkItem = target.closest('.cka-link-item');
        if (!linkItem) return;

        const linkName = (linkItem as HTMLElement).dataset.linkName;
        if (linkName) {
          this.handleLinkSelection(linkName, linkItem as HTMLElement);
        }
      });
    });
  }

  private handleLinkSelection(linkName: string, linkItem: HTMLElement): void {
    this.selectedLink = this.existingDocumentLinks.find(
      link => link.title === linkName
    ) || null;

    // Update selected state visually
    const container = linkItem.closest('.cka-existing-document-link-content');
    if (container) {
      container.querySelectorAll('.cka-link-item').forEach(item => {
        item.classList.remove('selected');
      });
      linkItem.classList.add('selected');

      // Update radio buttons
      container.querySelectorAll('cka-radio-button').forEach(radio => {
        (radio as any).checked = false;
      });
      const radio = linkItem.querySelector('cka-radio-button') as any;
      if (radio) {
        radio.checked = true;
      }
    }
  }
}