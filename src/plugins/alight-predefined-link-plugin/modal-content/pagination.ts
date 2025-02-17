// src/plugins/alight-predefined-link-plugin/modal-content/pagination.ts
import { CKALightSelectMenu } from '../../ui-components/alight-select-menu-component/alight-select-menu-component';

export class PaginationManager {
  private currentPage = 1;
  private readonly pageSize: number;

  constructor(
    private onPageChange: (page: number) => void,
    pageSize = 5
  ) {
    this.pageSize = pageSize;
  }

  public initialize(container: HTMLElement, totalItems: number): void {
    const paginationContainer = container.querySelector('#pagination-container');
    if (paginationContainer) {
      const totalPages = this.calculateTotalPages(totalItems);
      paginationContainer.innerHTML = this.getPaginationMarkup(totalPages);
      this.attachPaginationListeners(container);
      this.initializePageSelect(container, this.currentPage, totalPages);
    }
  }

  public getCurrentPage(): number {
    return this.currentPage;
  }

  public getPageSize(): number {
    return this.pageSize;
  }

  public setPage(page: number, totalItems: number): void {
    const totalPages = this.calculateTotalPages(totalItems);
    this.currentPage = Math.max(1, Math.min(page, totalPages));
    this.onPageChange(this.currentPage);
  }

  private calculateTotalPages(totalItems: number): number {
    return Math.ceil(totalItems / this.pageSize) || 1;
  }

  private getPaginationMarkup(totalPages: number): string {
    if (totalPages <= 1) return '';

    return `
      <article id="pagination" class="cka-pagination">
        <button 
          id="first-page" 
          class="first pagination-btn cka-button cka-button-text" 
          data-page="1" 
          ${this.currentPage === 1 ? 'disabled' : ''}
        >
          First
        </button>
        <button 
          id="prev-page" 
          class="previous pagination-btn cka-button cka-button-text" 
          data-page="${this.currentPage - 1}" 
          ${this.currentPage === 1 ? 'disabled' : ''}
        >
          Previous
        </button>
        <div id="page-select-container" class="cka-select-menu-wrap"></div>
        <button 
          id="next-page" 
          class="next pagination-btn cka-button cka-button-text" 
          data-page="${this.currentPage + 1}" 
          ${this.currentPage === totalPages ? 'disabled' : ''}
        >
          Next
        </button>
        <button 
          id="last-page" 
          class="last pagination-btn cka-button cka-button-text" 
          data-page="${totalPages}" 
          ${this.currentPage === totalPages ? 'disabled' : ''}
        >
          Last
        </button>
      </article>
    `;
  }

  private attachPaginationListeners(container: HTMLElement): void {
    const paginationDiv = container.querySelector('#pagination');
    paginationDiv?.addEventListener('click', e => {
      const target = e.target as HTMLElement;
      if (!target.matches('.pagination-btn')) return;
      const pageAttr = target.getAttribute('data-page');
      if (!pageAttr) return;
      const newPage = parseInt(pageAttr, 10);
      if (!isNaN(newPage) && newPage !== this.currentPage) {
        this.setPage(newPage, this.calculateTotalPages(this.pageSize));
      }
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
          this.setPage(selectedValue, totalPages);
        }
      }
    });

    pageSelectContainer.innerHTML = '';
    pageSelect.mount(pageSelectContainer as HTMLElement);
  }
}

