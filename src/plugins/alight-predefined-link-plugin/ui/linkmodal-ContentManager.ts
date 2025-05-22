// src/plugins/alight-predefined-link-plugin/ui/linkmodal-ContentManager.ts
import { ILinkManager } from './linkmodal-ILinkManager';
import { PredefinedLink } from './linkmodal-modal-types';
import { SearchManager } from './linkmodal-SearchManager';
import { PaginationManager } from './linkmodal-PaginationManager';
import '../../ui-components/alight-radio-component/alight-radio-component';

export class ContentManager implements ILinkManager {
  private selectedLink: PredefinedLink | null = null;
  private predefinedLinksData: PredefinedLink[] = [];
  private filteredLinksData: PredefinedLink[] = [];
  private searchManager: SearchManager;
  private paginationManager: PaginationManager;
  private container: HTMLElement | null = null;
  private initialUrl: string = '';
  private loadingIndicator: HTMLElement | null = null;
  private alerts: Array<{ message: string, type: 'error' | 'info' | 'success' | 'warning', id: string }> = [];
  private isRendering = false;  // Flag to prevent recursive rendering

  // Add callback for link selection events
  public onLinkSelected: ((link: PredefinedLink | null) => void) | null = null;

  constructor(initialUrl: string = '', predefinedLinksData: PredefinedLink[] = []) {
    this.initialUrl = initialUrl;
    this.predefinedLinksData = predefinedLinksData;
    this.filteredLinksData = [...this.predefinedLinksData];

    // If we have an initial URL, try to find and preselect the matching link
    if (initialUrl) {
      // First try direct match by predefinedLinkName (for predefined links)
      this.selectedLink = this.predefinedLinksData.find(
        link => link.predefinedLinkName === initialUrl
      ) || null;

      // If not found, try by uniqueId
      if (!this.selectedLink) {
        this.selectedLink = this.predefinedLinksData.find(
          link => link.uniqueId && link.uniqueId.toString() === initialUrl
        ) || null;
      }

      // If still not found, try by destination
      if (!this.selectedLink) {
        this.selectedLink = this.predefinedLinksData.find(
          link => link.destination === initialUrl
        ) || null;
      }
    }

    this.paginationManager = new PaginationManager(this.handlePageChange.bind(this));
    this.searchManager = new SearchManager(
      this.predefinedLinksData,
      this.handleSearchResults.bind(this),
      this.paginationManager
    );
  }

  public getSelectedLink(): { destination: string; title: string; predefinedLinkName: string } | null {
    if (!this.selectedLink) return null;
    return {
      destination: this.selectedLink.destination,
      title: this.selectedLink.predefinedLinkName,
      predefinedLinkName: this.selectedLink.predefinedLinkName
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
        if (this.container && !this.isRendering) {
          this.renderContent(this.container);
        }
      }, 500); // This timing should match your CSS transition duration
    } else {
      // If element isn't found in DOM, just remove it from the data structure
      this.alerts = this.alerts.filter(alert => alert.id !== alertId);

      // Re-render if necessary
      if (this.container && !this.isRendering) {
        this.renderContent(this.container);
      }
    }
  }

  // Method to clear all alerts
  public clearAlerts(): void {
    this.alerts = [];

    // Re-render to update the alerts
    if (this.container && !this.isRendering) {
      this.renderContent(this.container);
    }
  }

  private handleSearchResults = (filteredData: PredefinedLink[]): void => {
    console.log('Search results updated:', filteredData.length, 'items');

    this.filteredLinksData = filteredData;

    // Maintain selected link if still in filtered results, otherwise clear selection
    if (this.selectedLink && !filteredData.some(link => link.predefinedLinkName === this.selectedLink?.predefinedLinkName)) {
      // If we have an initialUrl and the selected link matches it, keep the selection
      // This ensures the current link stays selected even if filtered out
      if (!(this.initialUrl && this.selectedLink.predefinedLinkName === this.initialUrl)) {
        this.selectedLink = null;

        // Notify of deselection if callback exists
        if (this.onLinkSelected) {
          this.onLinkSelected(null);
        }
      }
    }

    // Re-render the UI
    if (this.container && !this.isRendering) {
      console.log('Re-rendering content due to search results update');
      this.renderContent(this.container);
    }
  };

  private handlePageChange = (page: number): void => {
    console.log('Page changed to:', page);

    // Only re-render if we have a container and aren't already rendering
    if (this.container && !this.isRendering) {
      this.renderContent(this.container);
    }
  };

  public resetSearch(): void {
    this.searchManager.reset();
    this.selectedLink = null;
    this.filteredLinksData = [...this.predefinedLinksData];

    // Notify of link deselection
    if (this.onLinkSelected) {
      this.onLinkSelected(null);
    }

    if (this.container && !this.isRendering) {
      this.renderContent(this.container);
    }
  }

  /**
   * Checks if a link matches the current search query and filters
   * This is used to determine if the selected link matches the search criteria
   */
  private _doesLinkMatchCurrentSearch(link: PredefinedLink): boolean {
    // Get the current search query from the search manager
    const searchQuery = this.searchManager.getCurrentSearchQuery().toLowerCase();

    // Check if link matches search query
    const matchesSearch = !searchQuery ||
      (link.predefinedLinkName && link.predefinedLinkName.toLowerCase().includes(searchQuery)) ||
      (link.predefinedLinkDescription && link.predefinedLinkDescription.toLowerCase().includes(searchQuery)) ||
      (link.destination && link.destination.toLowerCase().includes(searchQuery));

    // For now, we're only checking search query, not advanced filters
    // If you want to include advanced filters, you'd need to expose them from SearchManager

    return matchesSearch;
  }

  public renderContent(container: HTMLElement): void {
    // Prevent recursive renders
    if (this.isRendering) {
      console.warn('Preventing recursive render');
      return;
    }

    this.isRendering = true;
    try {
      this.container = container;

      // Build all content at once
      container.innerHTML = this.buildContentForPage();

      // Initialize components in correct order
      this.initializeComponents(container);
    } catch (error) {
      console.error('Error rendering content:', error);
    } finally {
      // Always ensure we reset the rendering flag
      this.isRendering = false;
    }
  }

  private initializeComponents(container: HTMLElement): void {
    // Initialize search first as it sets up the search container
    this.searchManager.initialize(container);

    // Calculate total items for pagination, excluding the selected item if displayed separately
    let paginationTotalItems = this.filteredLinksData.length;
    if (this.initialUrl && this.selectedLink) {
      // If we're showing the selected link separately, subtract 1 from total
      const isSelectedInFiltered = this.filteredLinksData.some(link =>
        link.predefinedLinkName === this.selectedLink?.predefinedLinkName
      );
      if (isSelectedInFiltered) {
        paginationTotalItems--;
      }
    }

    // Then initialize pagination with the correct count of filtered items
    this.paginationManager.initialize(container, paginationTotalItems);

    // Make sure the search input has the current search query
    const searchInput = container.querySelector('#search-input') as HTMLInputElement;
    if (searchInput && this.searchManager) {
      // Set the search input value to maintain search state
      searchInput.value = this.searchManager.getCurrentSearchQuery();

      // Show/hide reset button based on search query
      const resetButton = container.querySelector('#reset-search-btn') as HTMLButtonElement;
      if (resetButton) {
        resetButton.style.display = searchInput.value.length > 0 ? 'inline-flex' : 'none';
      }
    }

    // Finally attach link selection listeners
    this.attachLinkSelectionListeners(container);

    // Add alert dismissal listeners
    this.attachAlertListeners(container);

    // Ensure radio buttons reflect current selection
    if (this.selectedLink) {
      const selectedRadio = container.querySelector(`cka-radio-button[value="${this.selectedLink.predefinedLinkName}"]`) as any;
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
    if (this.predefinedLinksData.length === 0) {
      return `
      <div class="cka-loading-container">
        <div class="cka-loading-spinner"></div>
        <div class="cka-loading-message">Loading predefined links...</div>
      </div>
    `;
    }

    // Filter out the currently selected link if we have an initial URL
    let displayFilteredData = this.filteredLinksData;
    if (this.initialUrl && this.selectedLink) {
      // Remove the selected link from the display list to avoid duplication
      displayFilteredData = this.filteredLinksData.filter(link =>
        link.predefinedLinkName !== this.selectedLink?.predefinedLinkName
      );
    }

    const currentPage = this.paginationManager.getCurrentPage();
    const pageSize = this.paginationManager.getPageSize();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, displayFilteredData.length);
    const currentPageData = displayFilteredData.slice(startIndex, endIndex);

    // Search container
    const searchContainerMarkup = `<div id="search-container-root" class="cka-search-container"></div>`;

    // Current URL info if we have an initial URL
    const selectedUrlInfo = this.initialUrl ? this.buildSelectedUrlInfoMarkup() : '';

    // Alerts markup
    const alertsMarkup = this.buildAlertsMarkup();

    // Links list
    let linksMarkup = '';
    if (currentPageData.length > 0) {
      linksMarkup = currentPageData
        .map(link => this.buildLinkItemMarkup(link))
        .join('');
    } else {
      // Check if we're showing the selected link separately and it matches the search
      const isShowingSelectedLink = this.initialUrl && this.selectedLink;
      const selectedMatchesSearch = isShowingSelectedLink && this._doesLinkMatchCurrentSearch(this.selectedLink!);

      if (!isShowingSelectedLink || !selectedMatchesSearch) {
        // Only show "no results" if we're not showing a matching selected link
        linksMarkup = '<div class="cka-center-modal-message">No results found. Try adjusting your search criteria.</div>';
      }
      // Otherwise, show nothing (empty list) since the result is shown above
    }

    // Pagination container
    const paginationMarkup = `<div id="pagination-container" class="cka-pagination"></div>`;

    // Debugging metadata (can be removed in production)
    const debugInfo = `
      <!-- 
      Data summary:
      - Total links: ${this.predefinedLinksData.length}
      - Filtered links: ${this.filteredLinksData.length}
      - Display filtered links: ${displayFilteredData.length}
      - Current page: ${currentPage}
      - Items on page: ${currentPageData.length}
      - Page size: ${pageSize}
      -->
    `;

    return `
      ${searchContainerMarkup}
      ${alertsMarkup}
      <div id="links-container" class="cka-links-container">
        ${selectedUrlInfo}
        ${linksMarkup}
      </div>
      ${paginationMarkup}
      ${debugInfo}
    `;
  }

  private buildSelectedUrlInfoMarkup(): string {
    // Find the matching link for this URL
    // For predefined links, the initialUrl is the predefinedLinkName, not the destination
    const matchingLink = this.predefinedLinksData.find(link => {
      // Check if initialUrl matches the predefinedLinkName
      if (link.predefinedLinkName === this.initialUrl) {
        return true;
      }

      // Check if initialUrl matches the uniqueId
      if (link.uniqueId && link.uniqueId.toString() === this.initialUrl) {
        return true;
      }

      // Check if initialUrl matches the destination
      if (link.destination === this.initialUrl) {
        return true;
      }

      // For backward compatibility, check normalized URLs
      const normalizedInitial = this.normalizeUrl(this.initialUrl);
      const normalizedDestination = this.normalizeUrl(link.destination as string);
      return normalizedInitial === normalizedDestination;
    });

    if (!matchingLink) {
      return `
      <div class="cka-current-url-info">
        <h3><strong>Current Link:</strong> ${this.initialUrl}</h3>
        <div class="cka-note-message">This link is not in the predefined links list.</div>
      </div>
    `;
    }

    // Use the shared link markup function but customize for current link context
    return `
    <div class="cka-current-url-info">
      <h3>Current Selected Link</h3>
      ${this.buildLinkItemMarkup(matchingLink, true, 'current-link')}
    </div>
  `;
  }

  private buildLinkItemMarkup(
    link: PredefinedLink,
    forceSelected: boolean = false,
    radioGroupName: string = 'link-selection'
  ): string {
    const isSelected = forceSelected || this.selectedLink?.predefinedLinkName === link.predefinedLinkName;

    return `
      <div class="cka-link-item ${isSelected ? 'selected' : ''}" data-link-name="${link.predefinedLinkName}">
        <div class="cka-radio-container">
          <cka-radio-button 
            name="${radioGroupName}" 
            value="${link.predefinedLinkName}" 
            ${isSelected ? 'checked' : ''}
          ></cka-radio-button>
        </div>
        <ul>
          ${link.predefinedLinkDescription ? `<li><strong>${link.predefinedLinkDescription}</strong></li>` : ''}
          ${link.predefinedLinkName ? `<li><strong>Link Item Name:</strong> ${link.predefinedLinkName}</li>` : ''}
          ${link.baseOrClientSpecific ? `<li><strong>Base / Client Specific:</strong> ${link.baseOrClientSpecific}</li>` : ''}
          ${link.pageType ? `<li><strong>Page Type:</strong> ${link.pageType}</li>` : ''}
          ${link.destination ? `<li><strong>Destination:</strong> ${link.destination}</ >` : ''}
          ${link.domain ? `<li><strong>Domain:</strong> ${link.domain}</ >` : ''}
        </ul>
      </div>
    `;
  }

  private attachLinkSelectionListeners(container: HTMLElement): void {
    // Use event delegation for improved performance and to avoid duplicate listeners
    const linksContainer = container.querySelector('#links-container');
    if (!linksContainer) return;

    // Remove any existing listener first to prevent duplicates
    linksContainer.removeEventListener('click', this.handleLinkItemClick);

    // Add a single click handler for the entire links container
    linksContainer.addEventListener('click', this.handleLinkItemClick);

    // Handle radio button change events separately
    container.querySelectorAll('cka-radio-button').forEach(radio => {
      radio.addEventListener('change', this.handleRadioChange);
    });
  }

  private handleLinkItemClick = (e: Event): void => {
    const target = e.target as HTMLElement;

    // Ignore clicks on the radio button itself or on links
    if (target.closest('cka-radio-button') || target.tagName === 'A') return;

    // Find the closest link item
    const linkItem = target.closest('.cka-link-item') as HTMLElement;
    if (!linkItem) return;

    const linkName = linkItem.dataset.linkName;
    if (linkName) {
      this.handleLinkSelection(linkName, linkItem);
    }
  };

  private handleRadioChange = (e: Event): void => {
    const radio = e.target as HTMLInputElement;
    if (!radio.checked) return;

    const linkItem = radio.closest('.cka-link-item') as HTMLElement;
    if (!linkItem) return;

    const linkName = linkItem.dataset.linkName;
    if (linkName) {
      this.handleLinkSelection(linkName, linkItem);
    }
  };

  private handleLinkSelection(linkName: string, linkItem: HTMLElement): void {
    this.selectedLink = this.predefinedLinksData.find(
      link => link.predefinedLinkName === linkName
    ) || null;

    // Update selected state visually
    const container = linkItem.closest('.cka-predefined-link-content');
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

  // Clean up method to prevent memory leaks
  public destroy(): void {
    // Clean up event listeners
    if (this.container) {
      const linksContainer = this.container.querySelector('#links-container');
      if (linksContainer) {
        linksContainer.removeEventListener('click', this.handleLinkItemClick);
      }

      // Clean up radio button listeners
      this.container.querySelectorAll('cka-radio-button').forEach(radio => {
        radio.removeEventListener('change', this.handleRadioChange);
      });
    }

    // Clean up pagination and search managers
    if (this.paginationManager) {
      this.paginationManager.destroy();
    }

    if (this.searchManager) {
      this.searchManager.destroy();
    }

    // Clear references
    this.container = null;
    this.selectedLink = null;
  }
}
