// src/plugins/ui-components/alight-pagination-component/alight-pagination-component.ts
import { AlightUIBaseComponent } from '../alight-ui-base-component/alight-ui-base-component';
import type { Locale } from '@ckeditor/ckeditor5-utils';
import './styles/alight-pagination-component.scss';

export interface PaginationConfiguration {
  pageSize?: number;
  showPageSelect?: boolean;
  showFirstLastButtons?: boolean;
  compactMode?: boolean;
  controlLabels?: {
    first?: string;
    previous?: string;
    next?: string;
    last?: string;
    page?: string;
  };
}

export interface PaginationState {
  currentPage: number;
  totalItems: number;
  pageSize: number;
}

export interface PageChangeEvent {
  currentPage: number;
  pageSize: number;
  offset: number;
  totalPages: number;
}

export class AlightPaginationComponent extends AlightUIBaseComponent {
  private paginationState: PaginationState = {
    currentPage: 1,
    totalItems: 0,
    pageSize: 10
  };

  private config: PaginationConfiguration = {
    pageSize: 10,
    showPageSelect: true,
    showFirstLastButtons: true,
    compactMode: false,
    controlLabels: {
      first: 'First page',
      previous: 'Previous page',
      next: 'Next page',
      last: 'Last page',
      page: 'Page'
    }
  };

  private readonly uniqueId: string;
  private paginationContainer: HTMLElement | null = null;

  constructor(
    locale: Locale,
    config: Partial<PaginationConfiguration> = {},
    private onPageChange?: (event: PageChangeEvent) => void
  ) {
    super(locale);

    this.uniqueId = `alight-pagination-${Math.random().toString(36).substr(2, 9)}`;
    this.config = { ...this.config, ...config };
    this.paginationState.pageSize = this.config.pageSize || 10;

    this._createTemplate();
  }

  /**
   * Creates the template for the pagination component
   */
  private _createTemplate(): void {
    const container = document.createElement('div');
    container.className = 'alight-pagination-container';
    container.setAttribute('role', 'navigation');
    container.setAttribute('aria-label', 'Pagination');

    this.setTemplate({
      tag: 'div',
      children: [
        container
      ]
    });
  }

  private getTotalPages(): number {
    return Math.max(1, Math.ceil(this.paginationState.totalItems / this.paginationState.pageSize));
  }

  private renderPagination(): void {
    // Find the container element
    if (!this.paginationContainer) {
      this.paginationContainer = this.element.querySelector('.alight-pagination-container');

      if (!this.paginationContainer) {
        console.error('Pagination container not found in the component');
        return;
      }
    }

    const totalPages = this.getTotalPages();

    // Don't show pagination for single page
    if (totalPages <= 1 && !this.config.compactMode) {
      this.paginationContainer.innerHTML = '';
      return;
    }

    this.paginationContainer.innerHTML = this.getPaginationMarkup(totalPages);
    this.attachPaginationListeners();
    this.updateButtonStates(totalPages);
  }

  private getPaginationMarkup(totalPages: number): string {
    const { currentPage } = this.paginationState;
    const showPageSelect = this.config.showPageSelect;
    const showFirstLastButtons = this.config.showFirstLastButtons;
    const labels = this.config.controlLabels || {};

    return `
      <div id="${this.uniqueId}-pagination" class="alight-pagination-controls">
        ${showFirstLastButtons ? `
          <button 
            id="${this.uniqueId}-first-page" 
            class="ck ck-button ck-button-icon-only ck-button-text first"
            data-page="1" 
            ${currentPage === 1 ? 'disabled' : ''}
            aria-label="${labels.first || 'First page'}"
          >
            <i class="fa-solid fa-chevrons-left"></i>
          </button>
        ` : ''}
        <button 
          id="${this.uniqueId}-prev-page" 
          class="ck ck-button ck-button-icon-only ck-button-text previous"
          data-page="${currentPage - 1}" 
          ${currentPage === 1 ? 'disabled' : ''}
          aria-label="${labels.previous || 'Previous page'}"
        >
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        ${showPageSelect ? `
          <div id="${this.uniqueId}-page-select-container" class="alight-page-select">
            <span class="alight-page-text">${labels.page || 'Page'}</span>
            <select id="${this.uniqueId}-page-select" class="alight-page-select-input" aria-label="Select page">
              ${Array.from({ length: totalPages }, (_, i) => i + 1).map(page => `
                <option value="${page}" ${page === currentPage ? 'selected' : ''}>
                  ${page} of ${totalPages}
                </option>
              `).join('')}
            </select>
          </div>
        ` : `
          <span class="alight-page-info">${labels.page || 'Page'} ${currentPage} of ${totalPages}</span>
        `}
        <button 
          id="${this.uniqueId}-next-page" 
          class="ck ck-button ck-button-icon-only ck-button-text next"
          data-page="${currentPage + 1}" 
          ${currentPage === totalPages ? 'disabled' : ''}
          aria-label="${labels.next || 'Next page'}"
        >
          <i class="fa-solid fa-chevron-right"></i>
        </button>
        ${showFirstLastButtons ? `
          <button 
            id="${this.uniqueId}-last-page" 
            class="ck ck-button ck-button-icon-only ck-button-text last"
            data-page="${totalPages}" 
            ${currentPage === totalPages ? 'disabled' : ''}
            aria-label="${labels.last || 'Last page'}"
          >
            <i class="fa-solid fa-chevrons-right"></i>
          </button>
        ` : ''}
      </div>
    `;
  }

  private attachPaginationListeners(): void {
    if (!this.paginationContainer) return;

    const paginationDiv = this.paginationContainer.querySelector(`#${this.uniqueId}-pagination`);
    if (!paginationDiv) return;

    // Button click handlers
    paginationDiv.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button');

      if (!button || button.hasAttribute('disabled')) return;

      const pageAttr = button.getAttribute('data-page');
      if (!pageAttr) return;

      const newPage = parseInt(pageAttr, 10);
      if (!isNaN(newPage) && newPage !== this.paginationState.currentPage) {
        this.setPage(newPage);
      }
    });

    // Page select handler
    const pageSelect = paginationDiv.querySelector(`#${this.uniqueId}-page-select`) as HTMLSelectElement;
    if (pageSelect) {
      pageSelect.addEventListener('change', () => {
        const newPage = parseInt(pageSelect.value, 10);
        if (!isNaN(newPage) && newPage !== this.paginationState.currentPage) {
          this.setPage(newPage);
        }
      });
    }
  }

  private updateButtonStates(totalPages: number): void {
    if (!this.paginationContainer) return;

    const currentPage = this.paginationState.currentPage;

    const firstButton = this.paginationContainer.querySelector(`#${this.uniqueId}-first-page`) as HTMLButtonElement;
    const prevButton = this.paginationContainer.querySelector(`#${this.uniqueId}-prev-page`) as HTMLButtonElement;
    const nextButton = this.paginationContainer.querySelector(`#${this.uniqueId}-next-page`) as HTMLButtonElement;
    const lastButton = this.paginationContainer.querySelector(`#${this.uniqueId}-last-page`) as HTMLButtonElement;

    if (firstButton) {
      firstButton.disabled = currentPage === 1;
      firstButton.setAttribute('data-page', '1');
    }

    if (prevButton) {
      prevButton.disabled = currentPage === 1;
      prevButton.setAttribute('data-page', (currentPage - 1).toString());
    }

    if (nextButton) {
      nextButton.disabled = currentPage === totalPages;
      nextButton.setAttribute('data-page', (currentPage + 1).toString());
    }

    if (lastButton) {
      lastButton.disabled = currentPage === totalPages;
      lastButton.setAttribute('data-page', totalPages.toString());
    }
  }

  public setPage(page: number): void {
    const totalPages = this.getTotalPages();
    const newPage = Math.max(1, Math.min(page, totalPages));

    if (newPage !== this.paginationState.currentPage) {
      this.paginationState.currentPage = newPage;
      this.renderPagination();

      if (this.onPageChange) {
        this.onPageChange({
          currentPage: newPage,
          pageSize: this.paginationState.pageSize,
          offset: (newPage - 1) * this.paginationState.pageSize,
          totalPages
        });
      }
    }
  }

  public setPaginationState(state: Partial<PaginationState>): void {
    let shouldUpdate = false;

    if (state.totalItems !== undefined && state.totalItems !== this.paginationState.totalItems) {
      this.paginationState.totalItems = state.totalItems;
      shouldUpdate = true;
    }

    if (state.pageSize !== undefined && state.pageSize !== this.paginationState.pageSize) {
      this.paginationState.pageSize = state.pageSize;
      shouldUpdate = true;
    }

    if (state.currentPage !== undefined) {
      const totalPages = this.getTotalPages();
      const validPage = Math.max(1, Math.min(state.currentPage, totalPages));

      if (validPage !== this.paginationState.currentPage) {
        this.paginationState.currentPage = validPage;
        shouldUpdate = true;
      }
    }

    if (shouldUpdate) {
      this.renderPagination();
    }
  }

  public getPaginationState(): PaginationState {
    return { ...this.paginationState };
  }

  public getCurrentPage(): number {
    return this.paginationState.currentPage;
  }

  public getPageSize(): number {
    return this.paginationState.pageSize;
  }

  public getTotalItems(): number {
    return this.paginationState.totalItems;
  }

  override render(): void {
    super.render();
    this.renderPagination();
  }
}
