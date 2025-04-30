// src/plugins/alight-existing-document-link/ui/linkmodal-ContentManager.ts
import { ILinkManager } from './linkmodal-ILinkManager';
import { DocumentLink } from './linkmodal-modal-types';
import { SearchManager } from './linkmodal-SearchManager';
import { PaginationManager } from './linkmodal-PaginationManager';
import '../../ui-components/alight-radio-component/alight-radio-component';

export class ContentManager implements ILinkManager {
  private selectedLink: DocumentLink | null = null;
  private existingDocumentLinksData: DocumentLink[] = [];
  private filteredLinksData: DocumentLink[] = [];
  private searchManager: SearchManager;
  private paginationManager: PaginationManager;
  private container: HTMLElement | null = null;
  private initialUrl: string = '';
  private loadingIndicator: HTMLElement | null = null;
  private alerts: Array<{ message: string, type: 'error' | 'info' | 'success' | 'warning', id: string }> = [];

  // Add callback for link selection events
  public onLinkSelected: ((link: DocumentLink | null) => void) | null = null;

  constructor(initialUrl: string = '', existingDocumentLinksData: DocumentLink[] = []) {
    this.initialUrl = initialUrl;
    this.existingDocumentLinksData = existingDocumentLinksData;
    this.filteredLinksData = [...this.existingDocumentLinksData];

    // If we have an initial URL, try to find and preselect the matching link
    if (initialUrl) {
      this.selectedLink = this.existingDocumentLinksData.find(
        link => link.serverFilePath === initialUrl
      ) || null;
    }

    this.paginationManager = new PaginationManager(this.handlePageChange.bind(this));
    this.searchManager = new SearchManager(
      this.existingDocumentLinksData,
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

  // Helper for URL normalization - this is used by external callers
  public normalizeUrl(url: string): string {
    if (!url) return '';

    // Remove trailing slash
    let normalized = url.endsWith('/') ? url.slice(0, -1) : url;

    // Simplify protocol for comparison
    normalized = normalized.replace(/^https?:\/\//, '');

    return normalized.toLowerCase();
  }

  // Add method to show alerts
  public showAlert(message: string, type: 'error' | 'info' | 'success' | 'warning', timeout: number = 10000): void {
    const alertId = `alert-${Date.now()}`;
    this.alerts.push({ message, type, id: alertId });

    // Re-render to show the alert
    if (this.container) {
      this.renderContent(this.container);
    }

    // Auto-remove the alert after the timeout
    if (timeout > 0) {
      setTimeout(() => {
        this.removeAlert(alertId);
      }, timeout);
    }
  }

  // Method to remove a specific alert
  public removeAlert(alertId: string): void {
    // Find the alert element in the DOM
    const alertElement = document.querySelector(`.cka-alert[data-alert-id="${alertId}"]`);

    if (alertElement) {
      // Add the removing class to trigger the CSS transition
      alertElement.classList.add('cka-alert-removing');

      // Wait for the animation to complete before actually removing from the data structure
      setTimeout(() => {
        // Remove the alert from the data array
        this.alerts = this.alerts.filter(alert => alert.id !== alertId);

        // Re-render if necessary (you might not need this if the DOM element is already gone)
        if (this.container) {
          this.renderContent(this.container);
        }
      }, 500); // This timing should match your CSS transition duration
    } else {
      // If element isn't found in DOM, just remove it from the data structure
      this.alerts = this.alerts.filter(alert => alert.id !== alertId);

      // Re-render if necessary
      if (this.container) {
        this.renderContent(this.container);
      }
    }
  }

  // Method to clear all alerts
  public clearAlerts(): void {
    this.alerts = [];

    // Re-render to update the alerts
    if (this.container) {
      this.renderContent(this.container);
    }
  }

  private handleSearchResults = (filteredData: DocumentLink[]): void => {
    console.log('Search results updated:', filteredData.length, 'items');

    this.filteredLinksData = filteredData;

    // Maintain selected link if still in filtered results, otherwise clear selection
    if (this.selectedLink && !filteredData.some(link => link.serverFilePath === this.selectedLink?.serverFilePath)) {
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
    this.filteredLinksData = [...this.existingDocumentLinksData];

    // Notify of link deselection
    if (this.onLinkSelected) {
      this.onLinkSelected(null);
    }

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
    this.paginationManager.initialize(container, this.filteredLinksData.length);

    // Finally attach link selection listeners
    this.attachLinkSelectionListeners(container);

    // Add alert dismissal listeners
    this.attachAlertListeners(container);

    // Ensure radio buttons reflect current selection
    if (this.selectedLink) {
      const selectedRadio = container.querySelector(`cka-radio-button[value="${this.selectedLink.serverFilePath}"]`) as any;
      if (selectedRadio) {
        selectedRadio.checked = true;
      }
    }
  }

  // Add method to attach alert dismissal listeners
  private attachAlertListeners(container: HTMLElement): void {
    container.querySelectorAll('.cka-alert-dismiss').forEach(button => {
      button.addEventListener('click', (event) => {
        const alertElement = (event.target as HTMLElement).closest('.cka-alert');
        if (alertElement) {
          const alertId = alertElement.getAttribute('data-alert-id');
          if (alertId) {
            this.removeAlert(alertId);
          }
        }
      });
    });
  }

  // Build alerts HTML
  private buildAlertsMarkup(): string {
    if (this.alerts.length === 0) {
      return '';
    }

    return `
      <div class="cka-alerts-container">
        ${this.alerts.map(alert => `
          <div class="cka-alert cka-alert-${alert.type}" data-alert-id="${alert.id}">
            ${alert.message}
            <button class="cka-button cka-button-rounded cka-button-${alert.type} cka-button-icon-only cka-button-text cka-alert-dismiss" aria-label="Dismiss alert">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        `).join('')}
      </div>
    `;
  }

  private buildContentForPage(): string {
    // Check if we have data yet
    if (this.existingDocumentLinksData.length === 0) {
      return `
      <div class="cka-loading-container">
        <div class="cka-loading-spinner"></div>
      </div>
    `;
    }

    const currentPage = this.paginationManager.getCurrentPage();
    const pageSize = this.paginationManager.getPageSize();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, this.filteredLinksData.length);
    const currentPageData = this.filteredLinksData.slice(startIndex, endIndex);

    // Search container
    const searchContainerMarkup = `<div id="search-container-root" class="cka-search-container"></div>`;

    // Current URL info if we have an initial URL
    const selectedUrlInfo = this.initialUrl ? this.buildSelectedUrlInfoMarkup() : '';

    // Alerts markup
    const alertsMarkup = this.buildAlertsMarkup();

    // Links list
    const linksMarkup = currentPageData.length > 0
      ? currentPageData
        .map(link => this.buildLinkItemMarkup(link))
        .join('')
      : '<div class="cka-center-modal-message">No results found.</div>';

    // Pagination container
    const paginationMarkup = `<div id="pagination-container" class="cka-pagination"></div>`;

    return `
      ${searchContainerMarkup}
      ${alertsMarkup}
      <div id="links-container" class="cka-links-container">
        ${selectedUrlInfo}
        ${linksMarkup}
      </div>
      ${paginationMarkup}
    `;
  }

  private buildSelectedUrlInfoMarkup(): string {
    // Find the matching link for this URL
    const matchingLink = this.existingDocumentLinksData.find(link =>
      link.serverFilePath === this.initialUrl
    );

    if (!matchingLink) {
      return `
      <div class="current-url-info">
        <h3><strong>Current Link URL:</strong> ${this.initialUrl}</h3>
        <div class="cka-note-message">This URL is not in the existing document links list.</div>
      </div>
    `;
    }

    // Use the shared link markup function but customize for current link context
    return `
    <div class="current-url-info">
      <h3>Current Selected Link</h3>
      ${this.buildLinkItemMarkup(matchingLink, true, 'current-link')}
    </div>
  `;
  }

  private buildLinkItemMarkup(
    link: DocumentLink,
    forceSelected: boolean = false,
    radioGroupName: string = 'link-selection'
  ): string {
    const isSelected = forceSelected || this.selectedLink?.serverFilePath === link.serverFilePath;

    return `
      <div class="cka-link-item ${isSelected ? 'selected' : ''}" data-link-name="${link.serverFilePath}">
        <div class="radio-container">
          <cka-radio-button 
            name="${radioGroupName}" 
            value="${link.serverFilePath}" 
            ${isSelected ? 'checked' : ''}
          >
          </cka-radio-button>
        </div>
        <ul>
          ${link.title ? `<li><strong>${link.title}</strong></li>` : ''}
          ${link.population ? `<li><strong>Population:</strong> ${link.population}</li>` : ''}
          ${link.locale ? `<li><strong>Language:</strong> ${link.locale}</li>` : ''}
          ${link.fileType ? `<li><strong>File Type:</strong> ${link.fileType}</li>` : ''}
        </ul>
      </div>
    `;
  }

  private attachLinkSelectionListeners(container: HTMLElement): void {
    // Link item click handlers
    container.querySelectorAll('.cka-link-item').forEach(item => {
      item.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;
        // Ignore clicks on the radio button itself and on any links
        if (target.closest('cka-radio-button') || target.tagName === 'A') return;

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
    this.selectedLink = this.existingDocumentLinksData.find(
      link => link.serverFilePath === linkName
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

    // Call the selection callback if it exists
    if (this.onLinkSelected) {
      this.onLinkSelected(this.selectedLink);
    }
  }
}
