// src/plugins/alight-predefined-link-plugin/ui/linkmodal-PaginationManager.ts
import { CkAlightSelectMenu } from '../../ui-components/alight-select-menu-component/alight-select-menu-component';

export class PaginationManager {
  private currentPage = 1;
  private readonly pageSize: number;
  private totalItems = 0;
  private selectMenu: CkAlightSelectMenu<any> | null = null;
  private containerRef: HTMLElement | null = null;
  private isUpdating = false; // Add flag to prevent concurrent updates

  constructor(
    private onPageChange: (page: number) => void,
    pageSize = 10
  ) {
    this.pageSize = pageSize;
  }

  public initialize(container: HTMLElement, totalItems: number): void {
    // Store container reference for future use
    this.containerRef = container;
    this.totalItems = totalItems;

    const paginationContainer = container.querySelector('#pagination-container');
    if (!paginationContainer) {
      console.error('Pagination container not found');
      return;
    }

    const totalPages = this.calculateTotalPages(totalItems);

    // Update current page if it's out of bounds with new total
    if (this.currentPage > totalPages) {
      this.currentPage = Math.max(1, totalPages);
    }

    // Render pagination UI
    paginationContainer.innerHTML = this.getPaginationMarkup(totalPages);

    // Initialize components
    this.initializeComponents(container, totalPages);
  }

  private initializeComponents(container: HTMLElement, totalPages: number): void {
    // Attach pagination event delegation (once)
    this.attachPaginationListeners(container);

    // Then initialize the page select
    this.initializePageSelect(container, this.currentPage, totalPages);

    // Finally update button states
    this.updateButtonStates(container, this.currentPage, totalPages);
  }

  public getCurrentPage(): number {
    return this.currentPage;
  }

  public getPageSize(): number {
    return this.pageSize;
  }

  /**
   * Get total pages based on item count
   */
  public getTotalPages(): number {
    return this.calculateTotalPages(this.totalItems);
  }

  /**
   * Set page with optimized handling for first/last navigation
   */
  public setPage(page: number, totalItems: number): void {
    // Prevent concurrent updates
    if (this.isUpdating) {
      console.log('Update already in progress, skipping');
      return;
    }

    this.isUpdating = true;

    try {
      // Save old values to check if anything changed
      const oldPage = this.currentPage;
      const oldTotalItems = this.totalItems;
      const oldTotalPages = this.calculateTotalPages(oldTotalItems);

      // Calculate new values
      const totalPages = this.calculateTotalPages(totalItems);
      const newPage = Math.max(1, Math.min(page, totalPages));

      // Only make changes if something is different
      if (newPage !== oldPage || totalItems !== oldTotalItems) {
        // Update internal state first
        this.currentPage = newPage;
        this.totalItems = totalItems;

        // Use the stored container reference instead of querying the document
        if (this.containerRef) {
          // Check if pagination elements exist before updating them
          const paginationContainer = this.containerRef.querySelector('#pagination-container');
          if (paginationContainer) {
            // If the total number of pages changed, redraw the entire pagination
            if (totalPages !== oldTotalPages) {
              paginationContainer.innerHTML = this.getPaginationMarkup(totalPages);
              this.initializeComponents(this.containerRef, totalPages);
            } else {
              // Otherwise just update the existing UI elements
              this.updateButtonStates(this.containerRef, newPage, totalPages);
              this.updatePageSelect(this.containerRef, newPage, totalPages);
            }

            // Notify of page change only after UI is updated
            this.onPageChange(this.currentPage);
          } else {
            // If container is gone, just notify of page change
            this.onPageChange(this.currentPage);
          }
        } else {
          // If container reference is gone, just notify of page change
          this.onPageChange(this.currentPage);
        }
      }
    } catch (error) {
      console.error('Error in setPage:', error);
    }

    // Always release the update lock
    this.isUpdating = false;
  }

  /**
   * Optimized method for jumping directly to first/last page
   */
  public jumpToPage(pageType: 'first' | 'last'): void {
    if (this.isUpdating) {
      return; // Prevent concurrent updates
    }

    this.isUpdating = true;

    try {
      const totalPages = this.calculateTotalPages(this.totalItems);
      const targetPage = pageType === 'first' ? 1 : totalPages;

      // If already on target page, do nothing
      if (this.currentPage === targetPage) {
        this.isUpdating = false;
        return;
      }

      // Update internal state first
      this.currentPage = targetPage;

      // Update UI
      if (this.containerRef) {
        this.updateButtonStates(this.containerRef, targetPage, totalPages);
        this.updatePageSelect(this.containerRef, targetPage, totalPages);
      }

      // Notify of page change
      this.onPageChange(this.currentPage);
    } catch (error) {
      console.error('Error jumping to page:', error);
    }

    // Always release the update lock
    this.isUpdating = false;
  }

  private calculateTotalPages(totalItems: number): number {
    return Math.max(1, Math.ceil(totalItems / this.pageSize));
  }

  private getPaginationMarkup(totalPages: number): string {
    // If only one page, don't show pagination
    if (totalPages <= 1) return '';

    return `
      <article id="pagination" class="pagination-controls">
        <button 
          id="first-page" 
          class="cka-button cka-button-icon-only cka-button-text first"
          data-page-type="first"
          ${this.currentPage === 1 ? 'disabled' : ''}
          aria-label="First page"
        >
          <i class="fa-solid fa-chevrons-left"></i>
        </button>
        <button 
          id="prev-page" 
          class="cka-button cka-button-icon-only cka-button-text previous"
          data-page="${this.currentPage - 1}" 
          ${this.currentPage === 1 ? 'disabled' : ''}
          aria-label="Previous page"
        >
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <div id="page-select-container" class="cka-select-menu-wrap" role="navigation"></div>
        <button 
          id="next-page" 
          class="cka-button cka-button-icon-only cka-button-text next"
          data-page="${this.currentPage + 1}" 
          ${this.currentPage === totalPages ? 'disabled' : ''}
          aria-label="Next page"
        >
          <i class="fa-solid fa-chevron-right"></i>
        </button>
        <button 
          id="last-page" 
          class="cka-button cka-button-icon-only cka-button-text last"
          data-page-type="last"
          ${this.currentPage === totalPages ? 'disabled' : ''}
          aria-label="Last page"
        >
          <i class="fa-solid fa-chevrons-right"></i>
        </button>
      </article>
    `;
  }

  private attachPaginationListeners(container: HTMLElement): void {
    // Use event delegation to handle all pagination button clicks
    const paginationContainer = container.querySelector('#pagination-container');
    if (!paginationContainer) return;

    // Remove existing handler if there is one (clean up event listeners)
    paginationContainer.removeEventListener('click', this.handlePaginationClick);

    // Add the click handler to the container
    paginationContainer.addEventListener('click', this.handlePaginationClick);
  }

  // Using a named method allows us to remove it later if needed
  private handlePaginationClick = (e: Event) => {
    const target = e.target as HTMLElement;
    const button = target.closest('.cka-button') as HTMLButtonElement;

    if (!button || button.hasAttribute('disabled')) return;

    // Handle first/last page special case
    const pageType = button.getAttribute('data-page-type');
    if (pageType === 'first' || pageType === 'last') {
      e.preventDefault();
      this.jumpToPage(pageType as 'first' | 'last');
      return;
    }

    // Regular page navigation
    const pageAttr = button.getAttribute('data-page');
    if (!pageAttr) return;

    const newPage = parseInt(pageAttr, 10);
    if (!isNaN(newPage) && newPage !== this.currentPage) {
      this.setPage(newPage, this.totalItems);
    }
  };

  private updateButtonStates(container: HTMLElement, currentPage: number, totalPages: number): void {
    const buttons = {
      first: container.querySelector('#first-page') as HTMLButtonElement,
      prev: container.querySelector('#prev-page') as HTMLButtonElement,
      next: container.querySelector('#next-page') as HTMLButtonElement,
      last: container.querySelector('#last-page') as HTMLButtonElement
    };

    if (buttons.first) {
      buttons.first.disabled = currentPage === 1;
    }

    if (buttons.prev) {
      buttons.prev.disabled = currentPage === 1;
      buttons.prev.setAttribute('data-page', (currentPage - 1).toString());
    }

    if (buttons.next) {
      buttons.next.disabled = currentPage === totalPages;
      buttons.next.setAttribute('data-page', (currentPage + 1).toString());
    }

    if (buttons.last) {
      buttons.last.disabled = currentPage === totalPages;
    }
  }

  private initializePageSelect(container: HTMLElement, pageNum: number, totalPages: number): void {
    const pageSelectContainer = container.querySelector('#page-select-container');
    if (!pageSelectContainer) return;

    // Create page options array
    const pageOptions = Array.from({ length: totalPages }, (_, i) => ({
      label: `${i + 1} of ${totalPages}`,
      value: i + 1
    }));

    // Always recreate the select menu - this is the simplest solution
    // First, clean up any existing menu
    this.selectMenu = null;

    // Clean up the container
    pageSelectContainer.innerHTML = '';

    try {
      // Create a new select menu
      this.selectMenu = new CkAlightSelectMenu({
        options: pageOptions,
        value: pageNum,
        placeholder: `Page ${pageNum} of ${totalPages}`,
        onChange: (selectedValue) => {
          if (selectedValue && typeof selectedValue === 'number' && selectedValue !== this.currentPage) {
            this.setPage(selectedValue, this.totalItems);
          }
        }
      });

      // Mount it to the container
      this.selectMenu.mount(pageSelectContainer as HTMLElement);
    } catch (error) {
      console.error('Error creating select menu:', error);

      // Fallback to simple text display
      pageSelectContainer.innerHTML = `<span>Page ${pageNum} of ${totalPages}</span>`;
    }
  }

  private updatePageSelect(container: HTMLElement, currentPage: number, totalPages: number): void {
    // Always reinitialize the page select for simplicity
    this.initializePageSelect(container, currentPage, totalPages);
  }

  // Add cleanup method to prevent memory leaks
  public destroy(): void {
    this.selectMenu = null;

    if (this.containerRef) {
      const paginationContainer = this.containerRef.querySelector('#pagination-container');
      if (paginationContainer) {
        paginationContainer.removeEventListener('click', this.handlePaginationClick);
      }
      this.containerRef = null;
    }

    this.isUpdating = false;
  }
}
