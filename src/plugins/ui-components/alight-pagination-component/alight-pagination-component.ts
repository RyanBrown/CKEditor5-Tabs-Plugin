// src/plugins/ui-components/alight-pagination-component/alight-pagination-component.ts
import { AlightUIBaseComponent } from '../alight-ui-base-component/alight-ui-base-component';
import { CkAlightSelectMenu } from '../alight-select-menu-component/alight-select-menu-component'; // Adjusted import path
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
  private pageSelectMenu: CkAlightSelectMenu<{ label: string; value: number }> | null = null; // Instance of select menu

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
      children: [container]
    });
  }

  private getTotalPages(): number {
    return Math.max(1, Math.ceil(this.paginationState.totalItems / this.paginationState.pageSize));
  }

  private renderPagination(): void {
    // Find the container element
    if (!this.paginationContainer) {
      // Only attempt to find the container if the element exists
      if (!this.element) {
        return;
      }

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
    this.initializePageSelect(totalPages); // Initialize the select menu
    this.updateButtonStates(totalPages);
  }

  private getPaginationMarkup(totalPages: number): string {
    const { currentPage } = this.paginationState;
    const showPageSelect = this.config.showPageSelect;
    const showFirstLastButtons = this.config.showFirstLastButtons;
    const labels = this.config.controlLabels || {};

    return `
      <article id="${this.uniqueId}-pagination" class="cka-pagination">
        ${showFirstLastButtons ? `
          <button
            id="${this.uniqueId}-first-page"
            class="cka-button cka-button-icon-only cka-button-text first"
            data-page="1"
            ${currentPage === 1 ? 'disabled' : ''}
            aria-label="${labels.first || 'First page'}"
          >
            <i class="fa-solid fa-chevrons-left"></i>
          </button>
          ` : ''}
          <button 
            id="${this.uniqueId}-prev-page" 
            class="cka-button cka-button-icon-only cka-button-text previous"
            data-page="${currentPage - 1}" 
            ${currentPage === 1 ? 'disabled' : ''}
            aria-label="${labels.previous || 'Previous page'}"
          >
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          ${showPageSelect ? `
            <div id="${this.uniqueId}-page-select-container" class="cka-select-menu-wrap" role="navigation">
              <span class="alight-page-text">${labels.page || 'Page'}</span>
              <div id="${this.uniqueId}-page-select-mount" class="alight-page-select-mount"></div>
            </div>
          ` : `
            <span class="alight-page-info">${labels.page || 'Page'} ${currentPage} of ${totalPages}</span>
          `}
          <button 
            id="${this.uniqueId}-next-page"
            class="cka-button cka-button-icon-only cka-button-text next"
            data-page="${currentPage + 1}" 
            ${currentPage === totalPages ? 'disabled' : ''}
            aria-label="${labels.next || 'Next page'}"
          >
            <i class="fa-solid fa-chevron-right"></i>
          </button>
          ${showFirstLastButtons ? `
          <button 
            id="${this.uniqueId}-last-page"
            class="cka-button cka-button-icon-only cka-button-text last"
            data-page="${totalPages}" 
            ${currentPage === totalPages ? 'disabled' : ''}
            aria-label="${labels.last || 'Last page'}"
          >
            <i class="fa-solid fa-chevrons-right"></i>
          </button>
        ` : ''}
      </article> 
    `;
  }

  private initializePageSelect(totalPages: number): void {
    if (!this.config.showPageSelect || !this.paginationContainer) return;

    const mountPoint = this.paginationContainer.querySelector(`#${this.uniqueId}-page-select-mount`) as HTMLElement;
    if (!mountPoint) {
      console.error('Page select mount point not found');
      return;
    }

    // Generate options for the select menu
    const options = Array.from({ length: totalPages }, (_, i) => ({
      label: `${i + 1} of ${totalPages}`,
      value: i + 1
    }));

    // Initialize or update the select menu
    if (!this.pageSelectMenu) {
      this.pageSelectMenu = new CkAlightSelectMenu({
        options,
        value: this.paginationState.currentPage,
        placeholder: 'Select page',
        onChange: (value) => {
          if (typeof value === 'number' && value !== this.paginationState.currentPage) {
            this.setPage(value);
          }
        }
      });
      this.pageSelectMenu.mount(mountPoint);
    } else {
      this.pageSelectMenu.setOptions(options);
      this.pageSelectMenu.setValue(this.paginationState.currentPage);
    }
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
      this.renderPagination(); // Re-renders everything, including select menu

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

    // Only call renderPagination if the component is already rendered
    if (shouldUpdate && this.element) {
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
    console.log('Rendering AlightPaginationComponent');
    super.render();
    if (!this.element) {
      console.error('Element not created in render');
      return;
    }
    this.paginationContainer = this.element.querySelector('.alight-pagination-container');
    if (!this.paginationContainer) {
      console.error('Pagination container not found');
      return;
    }
    this.renderPagination();
  }

  // Clean up the select menu when destroying the component
  override destroy(): void {
    if (this.pageSelectMenu) {
      this.pageSelectMenu.destroy();
    }
    super.destroy();
  }
}
