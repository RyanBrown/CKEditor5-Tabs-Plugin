// src/plugins/ui-components/alight-data-grid-component/alight-data-grid-component.ts
import { AlightUIBaseComponent } from '../alight-ui-base-component/alight-ui-base-component';
import { AlightSearchComponent, SearchEvent, FilterSection } from '../alight-search-component/alight-search-component';
import { AlightPaginationComponent, PageChangeEvent } from '../alight-pagination-component/alight-pagination-component';
import type { Locale } from '@ckeditor/ckeditor5-utils';
import './styles/alight-data-grid-component.scss';

export interface DataGridColumn<T = any> {
  field: keyof T;
  header: string;
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  renderer?: (item: T) => string;
}

export interface DataGridConfiguration<T = any> {
  columns: DataGridColumn<T>[];
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  advancedSearch?: boolean;
  filterSections?: FilterSection[];
  noDataMessage?: string;
  selectable?: boolean;
  onRowSelect?: (item: T) => void;
}

export class AlightDataGridComponent<T extends Record<string, any> = Record<string, any>> extends AlightUIBaseComponent {
  private readonly config: DataGridConfiguration<T>;
  private data: T[] = [];
  private filteredData: T[] = [];
  private displayData: T[] = [];
  private searchComponent: AlightSearchComponent | null = null;
  private paginationComponent: AlightPaginationComponent | null = null;
  private tableElement: HTMLElement | null = null;
  private gridContainer: HTMLElement | null = null;
  private readonly uniqueId: string;
  private selectedRow: T | null = null;

  constructor(
    locale: Locale,
    config: DataGridConfiguration<T>
  ) {
    super(locale);

    this.uniqueId = `alight-grid-${Math.random().toString(36).substr(2, 9)}`;
    this.config = {
      ...{
        pageSize: 10,
        searchable: true,
        searchPlaceholder: 'Search...',
        advancedSearch: false,
        noDataMessage: 'No data available',
        selectable: false
      },
      ...config
    };

    this._createTemplate();
  }

  /**
   * Creates the template for the data grid component
   */
  private _createTemplate(): void {
    const container = document.createElement('div');
    container.className = 'alight-data-grid';
    container.id = this.uniqueId;

    container.innerHTML = `
      <div class="alight-data-grid-header">
        ${this.config.searchable ? `<div id="${this.uniqueId}-search-container" class="alight-search-wrapper"></div>` : ''}
      </div>
      <div id="${this.uniqueId}-grid-container" class="alight-data-grid-body"></div>
      <div id="${this.uniqueId}-pagination-container" class="alight-data-grid-footer"></div>
    `;

    this.setTemplate({
      tag: 'div',
      children: [
        container
      ]
    });
  }

  public setData(data: T[]): void {
    this.data = [...data];
    this.applySearch();
    this.renderGrid();
  }

  private applySearch(searchEvent?: SearchEvent): void {
    if (!this.data.length) {
      this.filteredData = [];
      return;
    }

    if (!searchEvent || (!searchEvent.searchQuery && Object.values(searchEvent.selectedFilters).every(filters => !filters.length))) {
      // No search criteria, use all data
      this.filteredData = [...this.data];
    } else {
      // Apply search query
      const searchFields = this.config.searchFields || Object.keys(this.data[0]) as (keyof T)[];
      const searchQuery = searchEvent?.searchQuery.toLowerCase() || '';

      this.filteredData = this.data.filter(item => {
        // Search text match
        const matchesSearch = !searchQuery || searchFields.some(field => {
          const value = item[field];
          return value !== null &&
            value !== undefined &&
            String(value).toLowerCase().includes(searchQuery);
        });

        // Filter matches
        const matchesFilters = !searchEvent?.selectedFilters ||
          Object.entries(searchEvent.selectedFilters).every(([filterType, selectedValues]) => {
            if (!selectedValues.length) return true; // No filter applied

            // Check if item has matching property value
            const fieldValue = String(item[filterType as keyof T] || '');
            return selectedValues.includes(fieldValue);
          });

        return matchesSearch && matchesFilters;
      });
    }

    // If pagination exists, reset to first page
    if (this.paginationComponent) {
      this.paginationComponent.setPaginationState({
        currentPage: 1,
        totalItems: this.filteredData.length
      });
    }

    this.updateDisplayData();
  }

  private handlePageChange(event: PageChangeEvent): void {
    this.updateDisplayData(event.currentPage);
  }

  private updateDisplayData(page: number = 1): void {
    const pageSize = this.config.pageSize || 10;
    const startIndex = (page - 1) * pageSize;
    this.displayData = this.filteredData.slice(startIndex, startIndex + pageSize);

    if (this.tableElement) {
      this._renderTable();
    }
  }

  private renderGrid(): void {
    const rootElement = this.element;
    if (!rootElement) return;

    this.gridContainer = rootElement.querySelector(`#${this.uniqueId}-grid-container`);
    if (!this.gridContainer) return;

    // Initialize search component if enabled
    if (this.config.searchable) {
      const searchContainer = rootElement.querySelector(`#${this.uniqueId}-search-container`) as HTMLElement;

      if (searchContainer && !this.searchComponent) {
        // Extract filter sections from data if not provided
        let filterSections = this.config.filterSections;
        if (this.config.advancedSearch && !filterSections && this.data.length > 0) {
          // Generate filter sections automatically from data and columns
          filterSections = this.generateFilterSections();
        }

        this.searchComponent = new AlightSearchComponent(this.locale, {
          placeholder: this.config.searchPlaceholder,
          advancedSearch: this.config.advancedSearch,
          filterSections: filterSections,
          searchOnInputChange: true
        }, (searchEvent) => {
          this.applySearch(searchEvent);
        });

        // Add the search component to the DOM
        searchContainer.appendChild(this.searchComponent.element);
        this.searchComponent.render();
      }
    }

    // Initialize pagination component
    const paginationContainer = rootElement.querySelector(`#${this.uniqueId}-pagination-container`) as HTMLElement;
    if (paginationContainer && !this.paginationComponent) {
      this.paginationComponent = new AlightPaginationComponent(this.locale, {
        pageSize: this.config.pageSize
      }, (pageEvent) => {
        this.handlePageChange(pageEvent);
      });

      // Add the pagination component to the DOM
      paginationContainer.appendChild(this.paginationComponent.element);
      this.paginationComponent.render();
      this.paginationComponent.setPaginationState({
        totalItems: this.filteredData.length
      });
    }

    this._renderTable();
  }

  private _renderTable(): void {
    if (!this.gridContainer) return;

    // Create a table element if it doesn't exist
    if (!this.tableElement) {
      this.tableElement = document.createElement('table');
      this.tableElement.className = 'alight-data-table';
      this.gridContainer.appendChild(this.tableElement);
    }

    // Generate table content
    this.tableElement.innerHTML = this._getTableMarkup();

    // Attach event listeners to table rows if selectable
    if (this.config.selectable) {
      const rows = this.tableElement.querySelectorAll('tbody tr');
      rows.forEach((row, index) => {
        row.addEventListener('click', () => {
          this._handleRowSelect(index);
        });
      });
    }
  }

  private generateFilterSections(): FilterSection[] {
    if (!this.data.length) return [];

    const filterSections: FilterSection[] = [];

    // Only include filterable columns
    const filterableColumns = this.config.columns.filter(col => col.filterable);

    filterableColumns.forEach(column => {
      const field = column.field as string;

      // Get unique values for this field
      const uniqueValues = Array.from(new Set(
        this.data
          .map(item => item[field])
          .filter(value => value !== null && value !== undefined)
          .map(value => String(value))
      )).sort();

      if (uniqueValues.length > 0) {
        filterSections.push({
          id: field,
          title: column.header,
          options: uniqueValues.map(value => ({
            label: value,
            value: value
          }))
        });
      }
    });

    return filterSections;
  }

  private _getTableMarkup(): string {
    if (!this.displayData.length) {
      return `
        <tr>
          <td colspan="${this.config.columns.length}" class="no-data">
            ${this.config.noDataMessage}
          </td>
        </tr>
      `;
    }

    return `
      <thead>
        <tr>
          ${this.config.columns.map(column => `
            <th class="${column.sortable ? 'sortable' : ''}" style="${column.width ? `width: ${column.width};` : ''}">
              ${column.header}
              ${column.sortable ? '<span class="sort-icon"></span>' : ''}
            </th>
          `).join('')}
        </tr>
      </thead>
      <tbody>
        ${this.displayData.map((item, rowIndex) => `
          <tr class="${this.config.selectable ? 'selectable' : ''}" data-row-index="${rowIndex}">
            ${this.config.columns.map(column => {
      const value = item[column.field];
      let displayValue = '';

      if (column.renderer) {
        displayValue = column.renderer(item);
      } else {
        displayValue = value !== null && value !== undefined ? String(value) : '';
      }

      return `<td>${displayValue}</td>`;
    }).join('')}
          </tr>
        `).join('')}
      </tbody>
    `;
  }

  private _handleRowSelect(index: number): void {
    if (!this.config.selectable || index >= this.displayData.length) return;

    const selectedItem = this.displayData[index];
    this.selectedRow = selectedItem;

    // Update UI to reflect selection
    if (this.tableElement) {
      // Clear previous selection
      this.tableElement.querySelectorAll('tbody tr.selected').forEach(row => {
        row.classList.remove('selected');
      });

      // Add selected class to current row
      const rowElement = this.tableElement.querySelector(`tbody tr[data-row-index="${index}"]`);
      if (rowElement) {
        rowElement.classList.add('selected');
      }
    }

    // Call the onRowSelect callback if provided
    if (this.config.onRowSelect) {
      this.config.onRowSelect(selectedItem);
    }
  }

  public getSelectedRow(): T | null {
    return this.selectedRow;
  }

  public refresh(): void {
    this.applySearch();
  }

  public clearSelection(): void {
    this.selectedRow = null;

    if (this.tableElement) {
      this.tableElement.querySelectorAll('tbody tr.selected').forEach(row => {
        row.classList.remove('selected');
      });
    }
  }

  override render(): void {
    super.render();
    this.renderGrid();
  }
}
