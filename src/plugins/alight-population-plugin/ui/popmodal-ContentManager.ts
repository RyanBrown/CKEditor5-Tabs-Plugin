// src/plugins/alight-population-plugin/ui/popmodal-ContentManager.ts
import { ILinkManager } from './popmodal-ILinkManager';
import { PopulationTagData } from './popmodal-modal-types';
import { SearchManager } from './popmodal-SearchManager';
import { PaginationManager } from './popmodal-PaginationManager';
import '../../ui-components/alight-radio-component/alight-radio-component';

export class ContentManager implements ILinkManager {
  private selectedPopulation: PopulationTagData | null = null;
  private populationTagData: PopulationTagData[] = [];
  private filteredPopulationData: PopulationTagData[] = [];
  private searchManager: SearchManager;
  private paginationManager: PaginationManager;
  private container: HTMLElement | null = null;
  private initialPopulationName: string = '';

  // Add callback for population selection events
  public onLinkSelected: ((population: PopulationTagData | null) => void) | null = null;

  constructor(initialPopulationName: string = '', populationTagData: PopulationTagData[] = []) {
    this.initialPopulationName = initialPopulationName;
    this.populationTagData = populationTagData;
    this.filteredPopulationData = [...this.populationTagData];

    // If we have an initial population name, try to find and preselect the matching population
    if (initialPopulationName) {
      this.selectedPopulation = this.populationTagData.find(
        population => population.populationTagName === initialPopulationName
      ) || null;
    }

    this.paginationManager = new PaginationManager(this.handlePageChange.bind(this));
    this.searchManager = new SearchManager(
      this.populationTagData,
      this.handleSearchResults.bind(this),
      this.paginationManager
    );
  }

  public getSelectedLink(): { destination: string; title: string } | null {
    if (!this.selectedPopulation) return null;
    return {
      destination: this.selectedPopulation.destination,
      title: this.selectedPopulation.populationTagName
    };
  }

  private handleSearchResults = (filteredData: PopulationTagData[]): void => {
    console.log('Search results updated:', filteredData.length, 'items');

    this.filteredPopulationData = filteredData;

    // Maintain selected population if still in filtered results, otherwise clear selection
    if (this.selectedPopulation && !filteredData.some(tag => tag.populationTagName === this.selectedPopulation?.populationTagName)) {
      this.selectedPopulation = null;
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
    this.selectedPopulation = null;
    this.filteredPopulationData = [...this.populationTagData];

    // Notify of population deselection
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
    this.paginationManager.initialize(container, this.filteredPopulationData.length);

    // Finally attach population selection listeners
    this.attachPopulationSelectionListeners(container);

    // Ensure radio buttons reflect current selection
    if (this.selectedPopulation) {
      const selectedRadio = container.querySelector(`cka-radio-button[value="${this.selectedPopulation.populationTagName}"]`) as any;
      if (selectedRadio) {
        selectedRadio.checked = true;
      }
    }
  }

  private buildContentForPage(): string {
    // Check if we have data yet
    if (this.populationTagData.length === 0) {
      return `
      <div class="cka-loading-container">
        <div class="cka-loading-spinner"></div>
      </div>
    `;
    }

    const currentPage = this.paginationManager.getCurrentPage();
    const pageSize = this.paginationManager.getPageSize();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, this.filteredPopulationData.length);
    const currentPageData = this.filteredPopulationData.slice(startIndex, endIndex);

    // Search container
    const searchContainerMarkup = `<div id="search-container-root" class="cka-search-container"></div>`;

    // Current population info if we have an initial population name
    const currentPopulationInfo = this.initialPopulationName ? this.buildCurrentPopulationInfoMarkup() : '';

    // Population tags list
    const populationTagsMarkup = currentPageData.length > 0
      ? currentPageData
        .map(tag => this.buildPopulationItemMarkup(tag))
        .join('')
      : '<div class="cka-center-modal-message">No results found.</div>';

    // Pagination container
    const paginationMarkup = `<div id="pagination-container" class="cka-pagination"></div>`;

    return `
    ${searchContainerMarkup}
    ${currentPopulationInfo}
    <div id="links-container">
      ${populationTagsMarkup}
    </div>
    ${paginationMarkup}
  `;
  }

  private buildCurrentPopulationInfoMarkup(): string {
    // Find the matching population for this name
    const matchingPopulation = this.populationTagData.find(tag =>
      tag.populationTagName === this.initialPopulationName
    );

    if (!matchingPopulation) {
      return `
      <div class="current-population-info">
        <h3><strong>Current Population:</strong> ${this.initialPopulationName}</h3>
        <div class="cka-note-message">This population is not in the available population tags list.</div>
      </div>
    `;
    }

    // Use the shared population item markup function but customize for current population context
    return `
    <div class="current-population-info">
      <h3>Current Selected Population</h3>
      ${this.buildPopulationItemMarkup(matchingPopulation, true, 'current-population')}
    </div>
  `;
  }

  private buildPopulationItemMarkup(
    population: PopulationTagData,
    forceSelected: boolean = false,
    radioGroupName: string = 'population-selection'
  ): string {
    const isSelected = forceSelected || this.selectedPopulation?.populationTagName === population.populationTagName;

    return `
      <div class="cka-population-item ${isSelected ? 'selected' : ''}" data-population-name="${population.populationTagName}">
        <div class="radio-container">
          <cka-radio-button 
            name="${radioGroupName}" 
            value="${population.populationTagName}" 
            ${isSelected ? 'checked' : ''}
          >
          </cka-radio-button>
        </div>
        <ul>
          <li><strong>${population.populationTagName}</strong></li>
          <li><strong>Description:</strong> ${population.populationTagDescription}</li>
          <li><strong>Base/Client Specific:</strong> ${population.baseOrClientSpecific}</li>
          <li><strong>Page Type:</strong> ${population.pageType}</li>
          ${population.domain ? `<li><strong>Domain:</strong> ${population.domain}</li>` : ''}
          ${population.pageCode ? `<li><strong>Page Code:</strong> ${population.pageCode}</li>` : ''}
          <li><strong>Attribute:</strong> ${population.attributeName}="${population.attributeValue}"</li>
        </ul>
      </div>
    `;
  }

  private attachPopulationSelectionListeners(container: HTMLElement): void {
    // Population item click handlers
    container.querySelectorAll('.cka-population-item').forEach(item => {
      item.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;
        // Ignore clicks on the radio button itself and on any links
        if (target.closest('cka-radio-button') || target.tagName === 'A') return;

        const populationName = (item as HTMLElement).dataset.populationName;
        if (!populationName) return;

        this.handlePopulationSelection(populationName, item as HTMLElement);
      });
    });

    // Radio button change handlers
    container.querySelectorAll('cka-radio-button').forEach(radio => {
      radio.addEventListener('change', (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (!target.checked) return;

        const populationItem = target.closest('.cka-population-item');
        if (!populationItem) return;

        const populationName = (populationItem as HTMLElement).dataset.populationName;
        if (populationName) {
          this.handlePopulationSelection(populationName, populationItem as HTMLElement);
        }
      });
    });
  }

  private handlePopulationSelection(populationName: string, populationItem: HTMLElement): void {
    this.selectedPopulation = this.populationTagData.find(
      tag => tag.populationTagName === populationName
    ) || null;

    // Update selected state visually
    const container = populationItem.closest('.cka-population-content');
    if (container) {
      container.querySelectorAll('.cka-population-item').forEach(item => {
        item.classList.remove('selected');
      });
      populationItem.classList.add('selected');

      // Update radio buttons
      container.querySelectorAll('cka-radio-button').forEach(radio => {
        (radio as any).checked = false;
      });
      const radio = populationItem.querySelector('cka-radio-button') as any;
      if (radio) {
        radio.checked = true;
      }
    }

    // Call the selection callback if it exists
    if (this.onLinkSelected) {
      this.onLinkSelected(this.selectedPopulation);
    }
  }
}
