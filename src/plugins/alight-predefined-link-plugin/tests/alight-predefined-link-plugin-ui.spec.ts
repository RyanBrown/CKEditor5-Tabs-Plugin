// // src/plugins/alight-predefined-link-plugin/tests/alight-predefined-link-plugin-ui.spec.ts
// import LinkActionsView from '../ui/linkactionsview';
// import { ContentManager } from '../ui/linkmodal-ContentManager';
// import { PaginationManager } from '../ui/linkmodal-PaginationManager';
// import { SearchManager } from '../ui/linkmodal-SearchManager';
// import { PredefinedLink } from '../ui/linkmodal-modal-types';

// describe('AlightPredefinedLinkPlugin UI', () => {
//   // Mock data for testing
//   const mockPredefinedLinks: PredefinedLink[] = [
//     {
//       predefinedLinksDetails: false,
//       predefinedLinkName: 'homepage',
//       predefinedLinkDescription: 'Home Page Link',
//       baseOrClientSpecific: 'base',
//       pageType: 'home',
//       destination: 'https://example.com',
//       pageCode: 'home-001',
//       domain: 'example.com',
//       uniqueId: '1',
//       attributeName: '',
//       attributeValue: ''
//     },
//     {
//       predefinedLinksDetails: false,
//       predefinedLinkName: 'about',
//       predefinedLinkDescription: 'About Us Page',
//       baseOrClientSpecific: 'base',
//       pageType: 'about',
//       destination: 'https://example.com/about',
//       pageCode: 'about-001',
//       domain: 'example.com',
//       uniqueId: '2',
//       attributeName: '',
//       attributeValue: ''
//     },
//     {
//       predefinedLinksDetails: false,
//       predefinedLinkName: 'contact',
//       predefinedLinkDescription: 'Contact Page',
//       baseOrClientSpecific: 'client',
//       pageType: 'contact',
//       destination: 'https://example.com/contact',
//       pageCode: 'contact-001',
//       domain: 'example.com',
//       uniqueId: '3',
//       attributeName: '',
//       attributeValue: ''
//     }
//   ];

//   // LinkActionsView tests
//   describe('LinkActionsView', () => {
//     let view: LinkActionsView;
//     let locale: any;
//     let element: HTMLElement;

//     beforeEach(() => {
//       // Mock the locale
//       locale = {
//         t: (str: string) => str,
//         contentLanguage: 'en',
//         ui: 'en',
//         uiLanguage: 'en'
//       };

//       // Create the view
//       view = new LinkActionsView(locale);
//       view.render();
//       element = view.element as HTMLElement;
//       document.body.appendChild(element);
//     });

//     afterEach(() => {
//       // Clean up
//       if (element && element.parentNode) {
//         element.parentNode.removeChild(element);
//       }
//       view.destroy();
//     });

//     it('should create instance properly', () => {
//       expect(view).toBeTruthy();
//       expect(view.focusTracker).toBeTruthy();
//       expect(view.keystrokes).toBeTruthy();
//       expect(view.editButtonView).toBeTruthy();
//       expect(view.unlinkButtonView).toBeTruthy();
//       expect(view.previewButtonView).toBeTruthy();
//     });

//     it('should set predefined links', () => {
//       // Set predefined links
//       view.setPredefinedLinks(mockPredefinedLinks);

//       // Check if links were set (via private property, we'll need to access it using any)
//       expect((view as any)._predefinedLinks).toEqual(mockPredefinedLinks);
//     });

//     it('should display link information when href is set', () => {
//       // Set predefined links
//       view.setPredefinedLinks(mockPredefinedLinks);

//       // Set href to one of the predefined links
//       view.set({ href: 'homepage' });

//       // Get the preview text element
//       const previewText = element.querySelector('.cka-button-title-text');

//       // Expect the preview text to match the link name
//       expect(previewText?.textContent).toBe('homepage');
//     });

//     it('should focus first focusable element', () => {
//       // Spy on the focusCycler
//       spyOn((view as any)._focusCycler, 'focusFirst');

//       // Call focus method
//       view.focus();

//       // Expect focusFirst to be called
//       expect((view as any)._focusCycler.focusFirst).toHaveBeenCalled();
//     });

//     it('should delegate button events', () => {
//       // Create spies for the events
//       const editSpy = jasmine.createSpy('edit');
//       const unlinkSpy = jasmine.createSpy('unlink');

//       // Listen for the events
//       view.on('edit', editSpy);
//       view.on('unlink', unlinkSpy);

//       // Trigger button clicks
//       view.editButtonView.fire('execute');
//       view.unlinkButtonView.fire('execute');

//       // Expect the events to be fired
//       expect(editSpy).toHaveBeenCalled();
//       expect(unlinkSpy).toHaveBeenCalled();
//     });
//   });

//   // ContentManager tests
//   describe('ContentManager', () => {
//     let contentManager: ContentManager;
//     let container: HTMLElement;
//     let linkSelectedSpy: jasmine.Spy;

//     beforeEach(() => {
//       // Create a container element
//       container = document.createElement('div');
//       document.body.appendChild(container);

//       // Set up a spy for the link selected callback
//       linkSelectedSpy = jasmine.createSpy('onLinkSelected');

//       // Create ContentManager with mock data
//       contentManager = new ContentManager('', mockPredefinedLinks);
//       contentManager.onLinkSelected = linkSelectedSpy;
//     });

//     afterEach(() => {
//       // Clean up
//       if (container && container.parentNode) {
//         container.parentNode.removeChild(container);
//       }
//       contentManager.destroy();
//     });

//     it('should initialize with predefined links', () => {
//       // Initial state should have the predefined links
//       const selectedLink = contentManager.getSelectedLink();
//       expect(selectedLink).toBeNull(); // No selection initially

//       // Check if the predefined links are stored (accessing private property)
//       expect((contentManager as any).predefinedLinksData).toEqual(mockPredefinedLinks);
//     });

//     it('should render content and initialize components', () => {
//       // Spy on component initialization methods
//       spyOn((contentManager as any), 'initializeComponents');

//       // Render content
//       contentManager.renderContent(container);

//       // Expect initialization to be called
//       expect((contentManager as any).initializeComponents).toHaveBeenCalledWith(container);

//       // Container should now have content
//       expect(container.innerHTML).not.toBe('');
//     });

//     it('should handle link selection', () => {
//       // Render content
//       contentManager.renderContent(container);

//       // Create a link item
//       const linkItem = document.createElement('div');
//       linkItem.className = 'cka-link-item';
//       linkItem.dataset.linkName = 'homepage';
//       container.appendChild(linkItem);

//       // Call the link selection handler
//       (contentManager as any).handleLinkSelection('homepage', linkItem);

//       // Check if the selected link is set
//       const selectedLink = contentManager.getSelectedLink();
//       expect(selectedLink).not.toBeNull();
//       expect(selectedLink?.predefinedLinkName).toBe('homepage');

//       // Check if the callback was called
//       expect(linkSelectedSpy).toHaveBeenCalled();
//     });

//     it('should show and remove alerts', () => {
//       // Render content
//       contentManager.renderContent(container);

//       // Show an alert
//       contentManager.showAlert('Test alert', 'info', 0);

//       // Check if alerts are stored
//       expect((contentManager as any).alerts.length).toBe(1);

//       // Remove the alert
//       const alertId = (contentManager as any).alerts[0].id;
//       contentManager.removeAlert(alertId);

//       // Wait for the timeout
//       jasmine.clock().install();
//       jasmine.clock().tick(600); // More than the 500ms timeout

//       // Check if alert is removed
//       expect((contentManager as any).alerts.length).toBe(0);

//       jasmine.clock().uninstall();
//     });

//     it('should reset search', () => {
//       // Create spies
//       spyOn((contentManager as any).searchManager, 'reset');

//       // Reset search
//       contentManager.resetSearch();

//       // Check if methods were called
//       expect((contentManager as any).searchManager.reset).toHaveBeenCalled();
//       expect((contentManager as any).selectedLink).toBeNull();

//       // Check if callback was called
//       expect(linkSelectedSpy).toHaveBeenCalledWith(null);
//     });
//   });

//   // PaginationManager tests
//   describe('PaginationManager', () => {
//     let paginationManager: PaginationManager;
//     let container: HTMLElement;
//     let pageChangeSpy: jasmine.Spy;

//     beforeEach(() => {
//       // Create a container element
//       container = document.createElement('div');
//       const paginationContainer = document.createElement('div');
//       paginationContainer.id = 'pagination-container';
//       container.appendChild(paginationContainer);
//       document.body.appendChild(container);

//       // Set up a spy for the page change callback
//       pageChangeSpy = jasmine.createSpy('onPageChange');

//       // Create PaginationManager
//       paginationManager = new PaginationManager(pageChangeSpy, 10);
//     });

//     afterEach(() => {
//       // Clean up
//       if (container && container.parentNode) {
//         container.parentNode.removeChild(container);
//       }
//       paginationManager.destroy();
//     });

//     it('should initialize with correct page size', () => {
//       expect(paginationManager.getPageSize()).toBe(10);
//       expect(paginationManager.getCurrentPage()).toBe(1);
//     });

//     it('should initialize pagination UI', () => {
//       // Initialize with 30 items (3 pages)
//       paginationManager.initialize(container, 30);

//       // Check if pagination container has content
//       const paginationContainer = container.querySelector('#pagination-container');
//       expect(paginationContainer?.innerHTML).not.toBe('');

//       // First page button should be disabled initially
//       const firstPageBtn = container.querySelector('#first-page') as HTMLButtonElement;
//       expect(firstPageBtn?.disabled).toBe(true);
//     });

//     it('should set page and notify', () => {
//       // Initialize with 30 items (3 pages)
//       paginationManager.initialize(container, 30);

//       // Set page to 2
//       paginationManager.setPage(2, 30);

//       // Check if current page was updated
//       expect(paginationManager.getCurrentPage()).toBe(2);

//       // Check if callback was called
//       expect(pageChangeSpy).toHaveBeenCalledWith(2);
//     });

//     it('should jump to first/last page', () => {
//       // Initialize with 30 items (3 pages)
//       paginationManager.initialize(container, 30);

//       // Set page to 2 first
//       paginationManager.setPage(2, 30);

//       // Jump to last page
//       paginationManager.jumpToPage('last');

//       // Check if current page is now 3
//       expect(paginationManager.getCurrentPage()).toBe(3);

//       // Jump to first page
//       paginationManager.jumpToPage('first');

//       // Check if current page is now 1
//       expect(paginationManager.getCurrentPage()).toBe(1);
//     });

//     it('should calculate total pages correctly', () => {
//       // Initialize with 25 items and page size 10
//       paginationManager.initialize(container, 25);

//       // Total pages should be 3 (25 / 10 = 2.5, ceil to 3)
//       expect(paginationManager.getTotalPages()).toBe(3);
//     });
//   });

//   // SearchManager tests
//   describe('SearchManager', () => {
//     let searchManager: SearchManager;
//     let container: HTMLElement;
//     let searchResultsSpy: jasmine.Spy;
//     let paginationManager: PaginationManager;

//     beforeEach(() => {
//       // Create a container element
//       container = document.createElement('div');
//       const searchContainer = document.createElement('div');
//       searchContainer.id = 'search-container-root';
//       container.appendChild(searchContainer);
//       document.body.appendChild(container);

//       // Create a mock pagination manager
//       paginationManager = new PaginationManager(() => { }, 10);
//       spyOn(paginationManager, 'setPage');

//       // Set up a spy for the search results callback
//       searchResultsSpy = jasmine.createSpy('onSearch');

//       // Create SearchManager
//       searchManager = new SearchManager(mockPredefinedLinks, searchResultsSpy, paginationManager);
//     });

//     afterEach(() => {
//       // Clean up
//       if (container && container.parentNode) {
//         container.parentNode.removeChild(container);
//       }
//       searchManager.destroy();
//     });

//     it('should initialize with search UI', () => {
//       // Initialize the search manager
//       searchManager.initialize(container);

//       // Check if the search container has content
//       const searchContainer = container.querySelector('#search-container-root');
//       expect(searchContainer?.innerHTML).not.toBe('');

//       // Search input should exist
//       const searchInput = container.querySelector('#search-input') as HTMLInputElement;
//       expect(searchInput).toBeTruthy();
//     });

//     it('should update search query on input change', () => {
//       // Initialize the search manager
//       searchManager.initialize(container);

//       // Get the search input
//       const searchInput = container.querySelector('#search-input') as HTMLInputElement;

//       // Set up the jasmine clock for debounce
//       jasmine.clock().install();

//       // Trigger input change
//       searchInput.value = 'home';
//       const inputEvent = new Event('input');
//       searchInput.dispatchEvent(inputEvent);

//       // Expect the current search query to be updated
//       expect(searchManager.getCurrentSearchQuery()).toBe('home');

//       // Advance the clock to trigger the debounced search
//       jasmine.clock().tick(400); // More than the 300ms debounce

//       // Expect pagination to be reset and search results called
//       expect(paginationManager.setPage).toHaveBeenCalled();
//       expect(searchResultsSpy).toHaveBeenCalled();

//       jasmine.clock().uninstall();
//     });

//     it('should perform search when search button clicked', () => {
//       // Initialize the search manager
//       searchManager.initialize(container);

//       // Get the search button
//       const searchBtn = container.querySelector('#search-btn') as HTMLButtonElement;

//       // Set up a spy on the performSearch method
//       spyOn((searchManager as any), 'performSearch');

//       // Click the search button
//       searchBtn.click();

//       // Expect performSearch to be called
//       expect((searchManager as any).performSearch).toHaveBeenCalled();
//     });

//     it('should reset search state', () => {
//       // Initialize the search manager with a query
//       searchManager.initialize(container);
//       (searchManager as any).currentSearchQuery = 'test';

//       // Reset the search
//       searchManager.reset();

//       // Check if the search query is cleared
//       expect(searchManager.getCurrentSearchQuery()).toBe('');

//       // Check if the filters are reset
//       expect((searchManager as any).selectedFilters.baseOrClientSpecific.length).toBe(0);
//       expect((searchManager as any).selectedFilters.pageType.length).toBe(0);
//       expect((searchManager as any).selectedFilters.domain.length).toBe(0);
//     });

//     it('should filter data based on search query', () => {
//       // Initialize the search manager
//       searchManager.initialize(container);

//       // Set a search query
//       (searchManager as any).currentSearchQuery = 'home';

//       // Call the update method directly
//       (searchManager as any).updateFilteredData();

//       // Check if the filtered data has only items matching 'home'
//       const filteredData = searchResultsSpy.calls.mostRecent().args[0];
//       expect(filteredData.length).toBe(1);
//       expect(filteredData[0].predefinedLinkName).toBe('homepage');
//     });

//     it('should filter data based on selected filters', () => {
//       // Initialize the search manager
//       searchManager.initialize(container);

//       // Set a filter
//       (searchManager as any).selectedFilters.baseOrClientSpecific = ['client'];

//       // Call the update method directly
//       (searchManager as any).updateFilteredData();

//       // Check if the filtered data has only items matching the filter
//       const filteredData = searchResultsSpy.calls.mostRecent().args[0];
//       expect(filteredData.length).toBe(1);
//       expect(filteredData[0].baseOrClientSpecific).toBe('client');
//     });
//   });
// });
