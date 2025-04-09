// src/plugins/alight-predefined-link-plugin/ui/linkmodal-PaginationManager.ts
import { CkAlightSelectMenu } from '../../ui-components/alight-select-menu-component/alight-select-menu-component';

export class PaginationManager {
  private currentPage = 1;
  private readonly pageSize: number;
  private totalItems = 0;
  private selectMenu: CkAlightSelectMenu<any> | null = null;

  constructor(
    private onPageChange: (page: number) => void,
    pageSize = 10
  ) {
    this.pageSize = pageSize;
  }

  public initialize(container: HTMLElement, totalItems: number): void {
    this.totalItems = totalItems;
    const paginationContainer = container.querySelector('#pagination-container');
    if (!paginationContainer) {
      console.error('Pagination container not found');
      return;
    }

    const totalPages = this.calculateTotalPages(totalItems);

    // Update current page if it's out of bounds with new total
    if (this.currentPage > totalPages) {
      this.currentPage = totalPages;
    }

    // Render pagination UI
    paginationContainer.innerHTML = this.getPaginationMarkup(totalPages);

    // Initialize components
    this.initializeComponents(container, totalPages);
  }

  private initializeComponents(container: HTMLElement, totalPages: number): void {
    // Attach button listeners first
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

  public setPage(page: number, totalItems: number): void {
    const totalPages = this.calculateTotalPages(totalItems);
    const newPage = Math.max(1, Math.min(page, totalPages));

    if (newPage !== this.currentPage) {
      this.currentPage = newPage;
      this.totalItems = totalItems;

      // Notify of page change
      this.onPageChange(this.currentPage);

      // Update UI elements if container exists
      const container = document.querySelector('.cka-predefined-link-content');
      if (container) {
        this.updateButtonStates(container as HTMLElement, this.currentPage, totalPages);
        this.updatePageSelect(container as HTMLElement, this.currentPage, totalPages);
      }
    }
  }

  private calculateTotalPages(totalItems: number): number {
    return Math.max(1, Math.ceil(totalItems / this.pageSize));
  }

  private getPaginationMarkup(totalPages: number): string {
    if (totalPages <= 1) return '';

    return `
      <article id="pagination" class="pagination-controls">
        <button 
          id="first-page" 
          class="cka-button cka-button-icon-only cka-button-text first"
          data-page="1" 
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
          data-page="${totalPages}" 
          ${this.currentPage === totalPages ? 'disabled' : ''}
          aria-label="Last page"
        >
          <i class="fa-solid fa-chevrons-right"></i>
        </button>
      </article>
    `;
  }

  private attachPaginationListeners(container: HTMLElement): void {
    const paginationDiv = container.querySelector('#pagination');
    if (!paginationDiv) return;

    // Remove any existing listeners
    const newPaginationDiv = paginationDiv.cloneNode(true);
    paginationDiv.parentNode?.replaceChild(newPaginationDiv, paginationDiv);

    newPaginationDiv.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target.matches('.cka-button') || target.hasAttribute('disabled')) return;

      const pageAttr = target.getAttribute('data-page');
      if (!pageAttr) return;

      const newPage = parseInt(pageAttr, 10);
      if (!isNaN(newPage) && newPage !== this.currentPage) {
        this.setPage(newPage, this.totalItems);
      }
    });
  }

  private updateButtonStates(container: HTMLElement, currentPage: number, totalPages: number): void {
    const buttons = {
      first: container.querySelector('#first-page') as HTMLButtonElement,
      prev: container.querySelector('#prev-page') as HTMLButtonElement,
      next: container.querySelector('#next-page') as HTMLButtonElement,
      last: container.querySelector('#last-page') as HTMLButtonElement
    };

    if (buttons.first) {
      buttons.first.disabled = currentPage === 1;
      buttons.first.setAttribute('data-page', '1');
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
      buttons.last.setAttribute('data-page', totalPages.toString());
    }
  }

  private initializePageSelect(container: HTMLElement, pageNum: number, totalPages: number): void {
    const pageSelectContainer = container.querySelector('#page-select-container');
    if (!pageSelectContainer) return;

    // Clean up existing select menu if it exists
    if (this.selectMenu) {
      this.selectMenu = null;
    }

    const pageOptions = Array.from({ length: totalPages }, (_, i) => ({
      label: `${i + 1} of ${totalPages}`,
      value: i + 1
    }));

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

    pageSelectContainer.innerHTML = '';
    this.selectMenu.mount(pageSelectContainer as HTMLElement);
  }

  private updatePageSelect(container: HTMLElement, currentPage: number, totalPages: number): void {
    this.initializePageSelect(container, currentPage, totalPages);
  }
}
