// src/plugins/alight-population-plugin/ui/popmodal-ContentManager.ts
import { ILinkManager } from './popmodal-ILinkManager';
import { PopulationTagData } from './popmodal-modal-types';
import { SearchManager } from './popmodal-SearchManager';
import { PaginationManager } from './popmodal-PaginationManager';
import { TabsView, TabViewConfig } from '../../ui-components/alight-tabs-component/alight-tabs-component';
import '../../ui-components/alight-radio-component/alight-radio-component';

export class ContentManager implements ILinkManager {
  private selectedPopulation: PopulationTagData | null = null;
  private populationTagData: PopulationTagData[] = [];
  private systemPopulations: PopulationTagData[] = [];
  private createdPopulations: PopulationTagData[] = [];
  private filteredSystemPopulations: PopulationTagData[] = [];
  private filteredCreatedPopulations: PopulationTagData[] = [];
  private searchManager: SearchManager;
  private paginationManager: PaginationManager;
  private container: HTMLElement | null = null;
  private initialPopulationName: string = '';
  private tabsView: TabsView | null = null;
  private activeTabId: string = 'system-populations';

  // Add callback for population selection events
  public onLinkSelected: ((population: PopulationTagData | null) => void) | null = null;

  constructor(initialPopulationName: string = '', populationTagData: PopulationTagData[] = []) {
    this.initialPopulationName = initialPopulationName;
    this.populationTagData = populationTagData;

    // Split populations into system and created categories
    // For demonstration, we'll consider populations with baseOrClientSpecific "Base" as system
    // and others as created populations
    this.systemPopulations = populationTagData.filter(p => p.baseOrClientSpecific === 'Base');
    this.createdPopulations = populationTagData.filter(p => p.baseOrClientSpecific !== 'Base');

    this.filteredSystemPopulations = [...this.systemPopulations];
    this.filteredCreatedPopulations = [...this.createdPopulations];

    // If we have an initial population name, try to find and preselect the matching population
    if (initialPopulationName) {
      this.selectedPopulation = this.populationTagData.find(
        population => population.populationTagName === initialPopulationName
      ) || null;

      // Set active tab based on where the selection is
      if (this.selectedPopulation) {
        if (this.systemPopulations.some(p => p.populationTagName === initialPopulationName)) {
          this.activeTabId = 'system-populations';
        } else if (this.createdPopulations.some(p => p.populationTagName === initialPopulationName)) {
          this.activeTabId = 'created-populations';
        }
      }
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

    // Filter for both tabs
    this.filteredSystemPopulations = filteredData.filter(p => p.baseOrClientSpecific === 'Base');
    this.filteredCreatedPopulations = filteredData.filter(p => p.baseOrClientSpecific !== 'Base');

    // Maintain selected population if still in filtered results, otherwise clear selection
    if (this.selectedPopulation && !filteredData.some(tag => tag.populationTagName === this.selectedPopulation?.populationTagName)) {
      this.selectedPopulation = null;

      // Notify of population deselection
      if (this.onLinkSelected) {
        this.onLinkSelected(null);
      }
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
    this.filteredSystemPopulations = [...this.systemPopulations];
    this.filteredCreatedPopulations = [...this.createdPopulations];

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

    // Create tab configuration
    const tabsConfig = [
      {
        id: 'system-populations',
        label: 'System Populations',
        content: this.buildTabContentString(this.filteredSystemPopulations, 'System Populations'),
        isActive: this.activeTabId === 'system-populations'
      },
      {
        id: 'created-populations',
        label: 'Created Populations',
        content: this.buildTabContentString(this.filteredCreatedPopulations, 'Created Populations'),
        isActive: this.activeTabId === 'created-populations'
      }
    ];

    // Clear container first
    container.innerHTML = '';

    // Add search container
    const searchContainerRoot = document.createElement('div');
    searchContainerRoot.id = 'search-container-root';
    searchContainerRoot.className = 'cka-search-container';
    container.appendChild(searchContainerRoot);

    // Add current population info if applicable
    if (this.initialPopulationName) {
      const currentPopulationInfo = document.createElement('div');
      currentPopulationInfo.innerHTML = this.buildCurrentPopulationInfoMarkup();
      container.appendChild(currentPopulationInfo);
    }

    // Create and initialize tabs
    this.initializeTabs(container, tabsConfig);

    // Add pagination container at the bottom
    const paginationContainer = document.createElement('div');
    paginationContainer.id = 'pagination-container';
    paginationContainer.className = 'cka-pagination';
    container.appendChild(paginationContainer);

    // Initialize components
    this.initializeComponents(container);
  }

  private initializeTabs(container: HTMLElement, tabsConfig: TabViewConfig[]): void {
    // Create a div for tabs
    const tabsContainer = document.createElement('div');
    tabsContainer.id = 'tabs-container';
    container.appendChild(tabsContainer);

    // Create links container for tab content
    const linksContainer = document.createElement('div');
    linksContainer.id = 'links-container';
    container.appendChild(linksContainer);

    // Set up tabs using the TabsView component
    const locale = { t: (str: string) => str }; // Simple locale mock
    this.tabsView = new TabsView(locale as any, { tabs: tabsConfig });

    // Handle tab selection
    this.tabsView.on('select', (event, tabView) => {
      this.activeTabId = tabView.id;

      // Update content in links container based on active tab
      if (tabView.id === 'system-populations') {
        linksContainer.innerHTML = this.buildPopulationList(this.filteredSystemPopulations, 'System Populations');
      } else {
        linksContainer.innerHTML = this.buildPopulationList(this.filteredCreatedPopulations, 'Created Populations');
      }

      // Re-attach event listeners for population selection
      this.attachPopulationSelectionListeners(container);

      // Update pagination for the current tab
      const currentItems = tabView.id === 'system-populations'
        ? this.filteredSystemPopulations
        : this.filteredCreatedPopulations;
      this.paginationManager.setPage(1, currentItems.length);
    });

    // Render the tabs
    this.tabsView.render();
    tabsContainer.appendChild(this.tabsView.element as Node);

    // Set the initial tab content
    const activeTabData = this.activeTabId === 'system-populations'
      ? this.filteredSystemPopulations
      : this.filteredCreatedPopulations;
    const activeTabTitle = this.activeTabId === 'system-populations'
      ? 'System Populations'
      : 'Created Populations';
    linksContainer.innerHTML = this.buildPopulationList(activeTabData, activeTabTitle);
  }

  private buildTabContentString(populations: PopulationTagData[], title: string): string {
    return this.buildPopulationList(populations, title);
  }

  private buildPopulationList(populations: PopulationTagData[], title: string): string {
    const currentPage = this.paginationManager.getCurrentPage();
    const pageSize = this.paginationManager.getPageSize();
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, populations.length);
    const currentPageData = populations.slice(startIndex, endIndex);

    // Start with the title
    let content = `<h2 class="tab-content-title">${title}</h2>`;

    if (currentPageData.length === 0) {
      return content + '<div class="cka-center-modal-message">No results found.</div>';
    }

    // Add description based on tab type
    if (title === 'System Populations') {
      content += `<p class="tab-content-description">These are standard system population tags that can be used across all documents.</p>`;
    } else if (title === 'Created Populations') {
      content += `<p class="tab-content-description">These are custom population tags that have been created specifically for your content.</p>`;
    }

    // Add the population items
    content += currentPageData
      .map(tag => this.buildPopulationItemMarkup(tag))
      .join('');

    return content;
  }

  private initializeComponents(container: HTMLElement): void {
    // Initialize search first as it sets up the search container
    this.searchManager.initialize(container);

    // Then initialize pagination for the active tab
    const activeTabData = this.activeTabId === 'system-populations'
      ? this.filteredSystemPopulations
      : this.filteredCreatedPopulations;
    this.paginationManager.initialize(container, activeTabData.length);

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
    const container = populationItem.closest('.cka-dialog');
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