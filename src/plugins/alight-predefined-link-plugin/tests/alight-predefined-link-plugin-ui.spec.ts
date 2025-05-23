// // src/plugins/alight-predefined-link-plugin/tests/alight-predefined-link-plugin-ui.spec.ts
// import LinkActionsView from '../ui/linkactionsview';
// import { ContentManager } from '../ui/linkmodal-ContentManager';
// import { PaginationManager } from '../ui/linkmodal-PaginationManager';
// import { SearchManager } from '../ui/linkmodal-SearchManager';
// import { PredefinedLink } from '../ui/linkmodal-modal-types';
// import { Locale } from '@ckeditor/ckeditor5-utils';

// // Mock CKEditor components
// class MockButtonView {
//   set = jasmine.createSpy('set');
//   delegate = jasmine.createSpy('delegate').and.returnValue({ to: jasmine.createSpy('to') });
//   element = document.createElement('button');
// }

// class MockView {
//   locale: any;
//   setTemplate = jasmine.createSpy('setTemplate');
//   bindTemplate = { to: jasmine.createSpy('to').and.returnValue('bound value') };
//   constructor(locale: any) {
//     this.locale = locale;
//   }
// }

// class MockCkAlightSelectMenu {
//   mount = jasmine.createSpy('mount');
//   constructor(public config: any) { }
// }

// class MockAlightOverlayPanel {
//   hide = jasmine.createSpy('hide');
//   constructor(public trigger: HTMLElement, public options: any) { }
// }

// // Mock window.fs for file reading
// (window as any).fs = {
//   readFile: jasmine.createSpy('readFile').and.returnValue(Promise.resolve('file content'))
// };

// describe('LinkActionsView', () => {
//   let view: LinkActionsView;
//   let locale: Locale;

//   beforeEach(() => {
//     locale = new Locale({ uiLanguage: 'en' });

//     // Mock ButtonView
//     spyOn(window, 'ButtonView' as any).and.returnValue(new MockButtonView());

//     view = new LinkActionsView(locale);
//   });

//   afterEach(() => {
//     if (view && view.element) {
//       view.destroy();
//     }
//   });

//   describe('constructor', () => {
//     it('should create view with correct properties', () => {
//       expect(view.href).toBeUndefined();
//       expect(view.focusTracker).toBeDefined();
//       expect(view.keystrokes).toBeDefined();
//       expect(view.previewButtonView).toBeDefined();
//       expect(view.unlinkButtonView).toBeDefined();
//       expect(view.editButtonView).toBeDefined();
//     });

//     it('should set the template correctly', () => {
//       expect(view.setTemplate).toHaveBeenCalledWith(jasmine.objectContaining({
//         tag: 'div',
//         attributes: jasmine.objectContaining({
//           class: ['ck', 'ck-link-actions', 'ck-responsive-form'],
//           tabindex: '-1'
//         })
//       }));
//     });
//   });

//   describe('setPredefinedLinks', () => {
//     it('should set predefined links', () => {
//       const links: PredefinedLink[] = [
//         {
//           predefinedLinkName: 'test-link',
//           destination: 'https://example.com',
//           baseOrClientSpecific: 'base',
//           pageType: 'home',
//           domain: 'example.com',
//           predefinedLinksDetails: false,
//           predefinedLinkDescription: '',
//           pageCode: '',
//           uniqueId: '',
//           attributeName: '',
//           attributeValue: ''
//         }
//       ];

//       view.setPredefinedLinks(links);
//       expect(view['_predefinedLinks']).toEqual(links);
//     });
//   });

//   describe('_findPredefinedLink', () => {
//     const mockLinks: PredefinedLink[] = [
//       {
//         uniqueId: '123',
//         predefinedLinkName: 'test-link-1',
//         destination: 'https://example.com/page1',
//         baseOrClientSpecific: 'base',
//         pageType: 'home',
//         domain: 'example.com',
//         predefinedLinksDetails: false,
//         predefinedLinkDescription: '',
//         pageCode: '',
//         attributeName: '',
//         attributeValue: ''
//       },
//       {
//         predefinedLinkName: 'test-link-2',
//         destination: 'https://example.com/test-link-2',
//         baseOrClientSpecific: 'client',
//         pageType: 'landing',
//         domain: 'example.com',
//         predefinedLinksDetails: false,
//         predefinedLinkDescription: '',
//         pageCode: '',
//         uniqueId: '',
//         attributeName: '',
//         attributeValue: ''
//       }
//     ];

//     beforeEach(() => {
//       view.setPredefinedLinks(mockLinks);
//     });

//     it('should return null if href is undefined', () => {
//       const result = view['_findPredefinedLink'](undefined);
//       expect(result).toBeNull();
//     });

//     it('should return null if no predefined links are set', () => {
//       view.setPredefinedLinks([]);
//       const result = view['_findPredefinedLink']('predefined://test-link');
//       expect(result).toBeNull();
//     });

//     it('should find link by uniqueId', () => {
//       const result = view['_findPredefinedLink']('predefined://123');
//       expect(result).toEqual(mockLinks[0]);
//     });

//     it('should find link by predefinedLinkName', () => {
//       const result = view['_findPredefinedLink']('predefined://test-link-2');
//       expect(result).toEqual(mockLinks[1]);
//     });

//     it('should find link by destination containing ID', () => {
//       const result = view['_findPredefinedLink']('predefined://test-link-2');
//       expect(result).toEqual(mockLinks[1]);
//     });

//     it('should return null if link is not found', () => {
//       const result = view['_findPredefinedLink']('predefined://non-existent');
//       expect(result).toBeNull();
//     });
//   });

//   describe('render', () => {
//     it('should render and set up focus tracking', () => {
//       const focusTrackerSpy = spyOn(view.focusTracker, 'add');
//       const keystrokesSpy = spyOn(view.keystrokes, 'listenTo');

//       view.render();

//       expect(focusTrackerSpy).toHaveBeenCalledTimes(2); // For edit and unlink buttons
//       expect(keystrokesSpy).toHaveBeenCalled();
//     });
//   });

//   describe('destroy', () => {
//     it('should clean up resources', () => {
//       view.render();

//       const focusTrackerSpy = spyOn(view.focusTracker, 'destroy');
//       const keystrokesSpy = spyOn(view.keystrokes, 'destroy');

//       view.destroy();

//       expect(focusTrackerSpy).toHaveBeenCalled();
//       expect(keystrokesSpy).toHaveBeenCalled();
//     });
//   });

//   describe('focus', () => {
//     it('should focus the first focusable element', () => {
//       view.render();
//       const focusCyclerSpy = spyOn(view['_focusCycler'], 'focusFirst');

//       view.focus();

//       expect(focusCyclerSpy).toHaveBeenCalled();
//     });
//   });

//   describe('_createPreviewButton', () => {
//     it('should display predefinedLinkName for predefined links', () => {
//       const mockLink: PredefinedLink = {
//         predefinedLinkName: 'Test Link Name',
//         predefinedLinkDescription: 'Test Description',
//         destination: 'https://example.com',
//         baseOrClientSpecific: 'base',
//         pageType: 'home',
//         domain: 'example.com'
//       };

//       view.setPredefinedLinks([mockLink]);
//       view.href = 'predefined://Test Link Name';

//       const previewButton = view['_createPreviewButton']();
//       expect(view.bindTemplate.to).toHaveBeenCalledWith('href', jasmine.any(Function));
//     });
//   });
// });

// describe('ContentManager', () => {
//   let contentManager: ContentManager;
//   let container: HTMLElement;
//   let mockLinks: PredefinedLink[];

//   beforeEach(() => {
//     // Create container
//     container = document.createElement('div');
//     container.innerHTML = `
//       <div id="search-container-root"></div>
//       <div id="links-container"></div>
//       <div id="pagination-container"></div>
//     `;
//     document.body.appendChild(container);

//     // Create mock data
//     mockLinks = [
//       {
//         uniqueId: '1',
//         predefinedLinkName: 'link-1',
//         predefinedLinkDescription: 'Description 1',
//         destination: 'https://example.com/1',
//         baseOrClientSpecific: 'base',
//         pageType: 'home',
//         domain: 'example.com'
//       },
//       {
//         uniqueId: '2',
//         predefinedLinkName: 'link-2',
//         predefinedLinkDescription: 'Description 2',
//         destination: 'https://example.com/2',
//         baseOrClientSpecific: 'client',
//         pageType: 'landing',
//         domain: 'example.com'
//       }
//     ];

//     contentManager = new ContentManager('', mockLinks);
//   });

//   afterEach(() => {
//     contentManager.destroy();
//     document.body.removeChild(container);
//   });

//   describe('constructor', () => {
//     it('should initialize with empty URL and no data', () => {
//       const cm = new ContentManager();
//       expect(cm.getSelectedLink()).toBeNull();
//     });

//     it('should preselect link by predefinedLinkName', () => {
//       const cm = new ContentManager('link-1', mockLinks);
//       const selected = cm.getSelectedLink();
//       expect(selected).toBeTruthy();
//       expect(selected?.predefinedLinkName).toBe('link-1');
//     });

//     it('should preselect link by uniqueId', () => {
//       const cm = new ContentManager('2', mockLinks);
//       const selected = cm.getSelectedLink();
//       expect(selected).toBeTruthy();
//       expect(selected?.predefinedLinkName).toBe('link-2');
//     });

//     it('should preselect link by destination', () => {
//       const cm = new ContentManager('https://example.com/1', mockLinks);
//       const selected = cm.getSelectedLink();
//       expect(selected).toBeTruthy();
//       expect(selected?.predefinedLinkName).toBe('link-1');
//     });
//   });

//   describe('normalizeUrl', () => {
//     it('should handle empty URL', () => {
//       expect(contentManager.normalizeUrl('')).toBe('');
//     });

//     it('should remove trailing slash', () => {
//       expect(contentManager.normalizeUrl('https://example.com/')).toBe('example.com');
//     });

//     it('should remove protocol and convert to lowercase', () => {
//       expect(contentManager.normalizeUrl('HTTPS://EXAMPLE.COM')).toBe('example.com');
//       expect(contentManager.normalizeUrl('http://example.com')).toBe('example.com');
//     });
//   });

//   describe('alerts', () => {
//     it('should show alert', (done) => {
//       contentManager.renderContent(container);
//       contentManager.showAlert('Test message', 'error', 100);

//       setTimeout(() => {
//         const alert = container.querySelector('.cka-alert-error');
//         expect(alert).toBeTruthy();
//         expect(alert?.textContent).toContain('Test message');
//         done();
//       }, 10);
//     });

//     it('should remove alert after timeout', (done) => {
//       contentManager.renderContent(container);
//       contentManager.showAlert('Test message', 'info', 100);

//       setTimeout(() => {
//         const alerts = container.querySelectorAll('.cka-alert');
//         expect(alerts.length).toBe(0);
//         done();
//       }, 700); // Wait for animation + timeout
//     });

//     it('should remove specific alert', (done) => {
//       contentManager.renderContent(container);
//       contentManager.showAlert('Alert 1', 'error', 0);
//       contentManager.showAlert('Alert 2', 'success', 0);

//       setTimeout(() => {
//         const alerts = container.querySelectorAll('.cka-alert');
//         expect(alerts.length).toBe(2);

//         const alertId = alerts[0].getAttribute('data-alert-id');
//         if (alertId) {
//           contentManager.removeAlert(alertId);

//           setTimeout(() => {
//             const remainingAlerts = container.querySelectorAll('.cka-alert');
//             expect(remainingAlerts.length).toBe(1);
//             done();
//           }, 600);
//         }
//       }, 10);
//     });

//     it('should clear all alerts', () => {
//       contentManager.renderContent(container);
//       contentManager.showAlert('Alert 1', 'error', 0);
//       contentManager.showAlert('Alert 2', 'warning', 0);

//       contentManager.clearAlerts();

//       const alerts = container.querySelectorAll('.cka-alert');
//       expect(alerts.length).toBe(0);
//     });

//     it('should handle alert dismissal click', (done) => {
//       contentManager.renderContent(container);
//       contentManager.showAlert('Test alert', 'info', 0);

//       setTimeout(() => {
//         const dismissBtn = container.querySelector('.cka-alert-dismiss') as HTMLElement;
//         expect(dismissBtn).toBeTruthy();

//         dismissBtn.click();

//         setTimeout(() => {
//           const alerts = container.querySelectorAll('.cka-alert');
//           expect(alerts.length).toBe(0);
//           done();
//         }, 600);
//       }, 10);
//     });
//   });

//   describe('renderContent', () => {
//     it('should show loading state when no data', () => {
//       const cm = new ContentManager('', []);
//       cm.renderContent(container);

//       const loading = container.querySelector('.cka-loading-container');
//       expect(loading).toBeTruthy();
//     });

//     it('should render search container', () => {
//       contentManager.renderContent(container);

//       const searchContainer = container.querySelector('#search-container-root');
//       expect(searchContainer).toBeTruthy();
//     });

//     it('should render links', () => {
//       contentManager.renderContent(container);

//       const links = container.querySelectorAll('.cka-link-item');
//       expect(links.length).toBeGreaterThan(0);
//     });

//     it('should show selected URL info when initial URL is provided', () => {
//       const cm = new ContentManager('link-1', mockLinks);
//       cm.renderContent(container);

//       const selectedInfo = container.querySelector('.cka-current-url-info');
//       expect(selectedInfo).toBeTruthy();
//       expect(selectedInfo?.textContent).toContain('Current Selected Link');
//     });

//     it('should show message for non-predefined initial URL', () => {
//       const cm = new ContentManager('https://other.com', mockLinks);
//       cm.renderContent(container);

//       const noteMessage = container.querySelector('.cka-note-message');
//       expect(noteMessage).toBeTruthy();
//       expect(noteMessage?.textContent).toContain('not in the predefined links list');
//     });

//     it('should prevent recursive rendering', () => {
//       const renderSpy = spyOn(contentManager, 'buildContentForPage').and.callThrough();

//       contentManager.renderContent(container);

//       // Try to trigger recursive render during render
//       contentManager['isRendering'] = true;
//       contentManager.renderContent(container);

//       expect(renderSpy).toHaveBeenCalledTimes(1);
//     });

//     it('should show no results message when filtered data is empty', () => {
//       contentManager['filteredLinksData'] = [];
//       contentManager.renderContent(container);

//       const message = container.querySelector('.cka-center-modal-message');
//       expect(message).toBeTruthy();
//       expect(message?.textContent).toContain('No results found');
//     });
//   });

//   describe('link selection', () => {
//     beforeEach(() => {
//       contentManager.renderContent(container);
//     });

//     it('should handle link item click', () => {
//       const linkItem = container.querySelector('.cka-link-item') as HTMLElement;
//       const callback = jasmine.createSpy('onLinkSelected');
//       contentManager.onLinkSelected = callback;

//       linkItem.click();

//       expect(callback).toHaveBeenCalled();
//       expect(linkItem.classList.contains('selected')).toBe(true);
//     });

//     it('should handle radio button change', () => {
//       const radio = container.querySelector('cka-radio-button') as any;
//       const callback = jasmine.createSpy('onLinkSelected');
//       contentManager.onLinkSelected = callback;

//       radio.checked = true;
//       radio.dispatchEvent(new Event('change'));

//       expect(callback).toHaveBeenCalled();
//     });

//     it('should ignore clicks on links', () => {
//       const link = document.createElement('a');
//       link.href = '#';
//       const linkItem = container.querySelector('.cka-link-item') as HTMLElement;
//       linkItem.appendChild(link);

//       const callback = jasmine.createSpy('onLinkSelected');
//       contentManager.onLinkSelected = callback;

//       link.click();

//       expect(callback).not.toHaveBeenCalled();
//     });

//     it('should update visual state on selection', () => {
//       const linkItems = container.querySelectorAll('.cka-link-item');
//       const firstItem = linkItems[0] as HTMLElement;
//       const secondItem = linkItems[1] as HTMLElement;

//       firstItem.click();
//       expect(firstItem.classList.contains('selected')).toBe(true);

//       secondItem.click();
//       expect(firstItem.classList.contains('selected')).toBe(false);
//       expect(secondItem.classList.contains('selected')).toBe(true);
//     });
//   });

//   describe('search integration', () => {
//     it('should handle search results', () => {
//       contentManager.renderContent(container);

//       const filteredLinks = [mockLinks[0]];
//       contentManager['handleSearchResults'](filteredLinks);

//       expect(contentManager['filteredLinksData']).toEqual(filteredLinks);
//     });

//     it('should maintain selected link if in filtered results', () => {
//       contentManager['selectedLink'] = mockLinks[0];
//       const callback = jasmine.createSpy('onLinkSelected');
//       contentManager.onLinkSelected = callback;

//       contentManager['handleSearchResults']([mockLinks[0]]);

//       expect(contentManager['selectedLink']).toEqual(mockLinks[0]);
//       expect(callback).not.toHaveBeenCalled();
//     });

//     it('should clear selection if selected link not in filtered results', () => {
//       contentManager['selectedLink'] = mockLinks[0];
//       const callback = jasmine.createSpy('onLinkSelected');
//       contentManager.onLinkSelected = callback;

//       contentManager['handleSearchResults']([mockLinks[1]]);

//       expect(contentManager['selectedLink']).toBeNull();
//       expect(callback).toHaveBeenCalledWith(null);
//     });

//     it('should keep selection if it matches initial URL even when filtered out', () => {
//       const cm = new ContentManager('link-1', mockLinks);
//       cm.renderContent(container);

//       cm['handleSearchResults']([mockLinks[1]]);

//       expect(cm['selectedLink']).toBeTruthy();
//       expect(cm['selectedLink']?.predefinedLinkName).toBe('link-1');
//     });

//     it('should reset search', () => {
//       contentManager['selectedLink'] = mockLinks[0];
//       const callback = jasmine.createSpy('onLinkSelected');
//       contentManager.onLinkSelected = callback;

//       contentManager.resetSearch();

//       expect(contentManager['selectedLink']).toBeNull();
//       expect(contentManager['filteredLinksData']).toEqual(mockLinks);
//       expect(callback).toHaveBeenCalledWith(null);
//     });
//   });

//   describe('_doesLinkMatchCurrentSearch', () => {
//     it('should match by predefinedLinkName', () => {
//       spyOn(contentManager['searchManager'], 'getCurrentSearchQuery').and.returnValue('link-1');

//       const result = contentManager['_doesLinkMatchCurrentSearch'](mockLinks[0]);
//       expect(result).toBe(true);
//     });

//     it('should match by description', () => {
//       spyOn(contentManager['searchManager'], 'getCurrentSearchQuery').and.returnValue('description 2');

//       const result = contentManager['_doesLinkMatchCurrentSearch'](mockLinks[1]);
//       expect(result).toBe(true);
//     });

//     it('should match by destination', () => {
//       spyOn(contentManager['searchManager'], 'getCurrentSearchQuery').and.returnValue('example.com/1');

//       const result = contentManager['_doesLinkMatchCurrentSearch'](mockLinks[0]);
//       expect(result).toBe(true);
//     });

//     it('should return true when no search query', () => {
//       spyOn(contentManager['searchManager'], 'getCurrentSearchQuery').and.returnValue('');

//       const result = contentManager['_doesLinkMatchCurrentSearch'](mockLinks[0]);
//       expect(result).toBe(true);
//     });
//   });

//   describe('pagination', () => {
//     it('should handle page changes', () => {
//       spyOn(contentManager, 'renderContent');
//       contentManager['container'] = container;

//       contentManager['handlePageChange'](2);

//       expect(contentManager.renderContent).toHaveBeenCalledWith(container);
//     });

//     it('should not render during existing render', () => {
//       spyOn(contentManager, 'renderContent');
//       contentManager['container'] = container;
//       contentManager['isRendering'] = true;

//       contentManager['handlePageChange'](2);

//       expect(contentManager.renderContent).not.toHaveBeenCalled();
//     });
//   });
// });

// describe('PaginationManager', () => {
//   let paginationManager: PaginationManager;
//   let container: HTMLElement;
//   let onPageChange: jasmine.Spy;

//   beforeEach(() => {
//     container = document.createElement('div');
//     container.innerHTML = '<div id="pagination-container"></div>';
//     document.body.appendChild(container);

//     onPageChange = jasmine.createSpy('onPageChange');
//     paginationManager = new PaginationManager(onPageChange, 5);

//     // Mock CkAlightSelectMenu
//     (window as any).CkAlightSelectMenu = MockCkAlightSelectMenu;
//   });

//   afterEach(() => {
//     paginationManager.destroy();
//     document.body.removeChild(container);
//   });

//   describe('initialize', () => {
//     it('should initialize with pagination UI', () => {
//       paginationManager.initialize(container, 20);

//       const pagination = container.querySelector('#pagination');
//       expect(pagination).toBeTruthy();

//       const buttons = container.querySelectorAll('.cka-button');
//       expect(buttons.length).toBe(4); // first, prev, next, last
//     });

//     it('should not show pagination for single page', () => {
//       paginationManager.initialize(container, 3);

//       const pagination = container.querySelector('#pagination');
//       expect(pagination).toBeFalsy();
//     });

//     it('should handle missing pagination container', () => {
//       const emptyContainer = document.createElement('div');
//       spyOn(console, 'error');

//       paginationManager.initialize(emptyContainer, 10);

//       expect(console.error).toHaveBeenCalledWith('Pagination container not found');
//     });

//     it('should adjust current page if out of bounds', () => {
//       paginationManager['currentPage'] = 10;
//       paginationManager.initialize(container, 10);

//       expect(paginationManager.getCurrentPage()).toBe(2); // 10 items / 5 per page = 2 pages
//     });
//   });

//   describe('pagination navigation', () => {
//     beforeEach(() => {
//       paginationManager.initialize(container, 20); // 4 pages total
//     });

//     it('should navigate to next page', () => {
//       const nextBtn = container.querySelector('#next-page') as HTMLElement;
//       nextBtn.click();

//       expect(onPageChange).toHaveBeenCalledWith(2);
//       expect(paginationManager.getCurrentPage()).toBe(2);
//     });

//     it('should navigate to previous page', () => {
//       paginationManager.setPage(3, 20);
//       onPageChange.calls.reset();

//       const prevBtn = container.querySelector('#prev-page') as HTMLElement;
//       prevBtn.click();

//       expect(onPageChange).toHaveBeenCalledWith(2);
//       expect(paginationManager.getCurrentPage()).toBe(2);
//     });

//     it('should jump to first page', () => {
//       paginationManager.setPage(3, 20);
//       onPageChange.calls.reset();

//       const firstBtn = container.querySelector('#first-page') as HTMLElement;
//       firstBtn.click();

//       expect(onPageChange).toHaveBeenCalledWith(1);
//       expect(paginationManager.getCurrentPage()).toBe(1);
//     });

//     it('should jump to last page', () => {
//       const lastBtn = container.querySelector('#last-page') as HTMLElement;
//       lastBtn.click();

//       expect(onPageChange).toHaveBeenCalledWith(4);
//       expect(paginationManager.getCurrentPage()).toBe(4);
//     });

//     it('should ignore clicks on disabled buttons', () => {
//       const firstBtn = container.querySelector('#first-page') as HTMLElement;
//       firstBtn.setAttribute('disabled', 'true');

//       firstBtn.click();

//       expect(onPageChange).not.toHaveBeenCalled();
//     });

//     it('should handle invalid page navigation', () => {
//       const button = document.createElement('button');
//       button.className = 'cka-button';
//       container.querySelector('#pagination-container')?.appendChild(button);

//       button.click();

//       expect(onPageChange).not.toHaveBeenCalled();
//     });
//   });

//   describe('setPage', () => {
//     it('should update page within bounds', () => {
//       paginationManager.initialize(container, 20);

//       paginationManager.setPage(3, 20);

//       expect(paginationManager.getCurrentPage()).toBe(3);
//       expect(onPageChange).toHaveBeenCalledWith(3);
//     });

//     it('should clamp to max page', () => {
//       paginationManager.initialize(container, 20);

//       paginationManager.setPage(10, 20);

//       expect(paginationManager.getCurrentPage()).toBe(4);
//     });

//     it('should clamp to min page', () => {
//       paginationManager.initialize(container, 20);

//       paginationManager.setPage(0, 20);

//       expect(paginationManager.getCurrentPage()).toBe(1);
//     });

//     it('should redraw pagination when total pages change', () => {
//       paginationManager.initialize(container, 20);

//       paginationManager.setPage(1, 30); // Now 6 pages instead of 4

//       const pageSelect = container.querySelector('#page-select-container');
//       expect(pageSelect).toBeTruthy();
//     });

//     it('should prevent concurrent updates', () => {
//       paginationManager.initialize(container, 20);
//       paginationManager['isUpdating'] = true;

//       paginationManager.setPage(2, 20);

//       expect(onPageChange).not.toHaveBeenCalled();
//     });

//     it('should handle errors gracefully', () => {
//       paginationManager.initialize(container, 20);
//       spyOn(console, 'error');

//       // Force an error by removing the container
//       paginationManager['containerRef'] = null;

//       paginationManager.setPage(2, 20);

//       expect(console.error).toHaveBeenCalledWith('Error in setPage:', jasmine.any(Error));
//     });

//     it('should skip update if nothing changed', () => {
//       paginationManager.initialize(container, 20);
//       onPageChange.calls.reset();

//       paginationManager.setPage(1, 20); // Already on page 1

//       expect(onPageChange).not.toHaveBeenCalled();
//     });

//     it('should handle missing pagination container', () => {
//       paginationManager['containerRef'] = container;
//       container.innerHTML = ''; // Remove pagination container

//       paginationManager.setPage(2, 20);

//       expect(onPageChange).toHaveBeenCalledWith(2);
//     });
//   });

//   describe('jumpToPage', () => {
//     beforeEach(() => {
//       paginationManager.initialize(container, 20);
//     });

//     it('should do nothing if already on target page', () => {
//       onPageChange.calls.reset();

//       paginationManager.jumpToPage('first');

//       expect(onPageChange).not.toHaveBeenCalled();
//     });

//     it('should prevent concurrent jumps', () => {
//       paginationManager['isUpdating'] = true;

//       paginationManager.jumpToPage('last');

//       expect(onPageChange).not.toHaveBeenCalled();
//     });

//     it('should handle errors gracefully', () => {
//       spyOn(console, 'error');
//       paginationManager['containerRef'] = null;

//       paginationManager.jumpToPage('last');

//       expect(console.error).toHaveBeenCalledWith('Error jumping to page:', jasmine.any(Error));
//     });
//   });

//   describe('button state updates', () => {
//     beforeEach(() => {
//       paginationManager.initialize(container, 20);
//     });

//     it('should disable first/prev buttons on first page', () => {
//       const firstBtn = container.querySelector('#first-page') as HTMLButtonElement;
//       const prevBtn = container.querySelector('#prev-page') as HTMLButtonElement;

//       expect(firstBtn.disabled).toBe(true);
//       expect(prevBtn.disabled).toBe(true);
//     });

//     it('should disable next/last buttons on last page', () => {
//       paginationManager.setPage(4, 20);

//       const nextBtn = container.querySelector('#next-page') as HTMLButtonElement;
//       const lastBtn = container.querySelector('#last-page') as HTMLButtonElement;

//       expect(nextBtn.disabled).toBe(true);
//       expect(lastBtn.disabled).toBe(true);
//     });

//     it('should update data-page attributes', () => {
//       paginationManager.setPage(2, 20);

//       const prevBtn = container.querySelector('#prev-page') as HTMLButtonElement;
//       const nextBtn = container.querySelector('#next-page') as HTMLButtonElement;

//       expect(prevBtn.getAttribute('data-page')).toBe('1');
//       expect(nextBtn.getAttribute('data-page')).toBe('3');
//     });
//   });

//   describe('page select', () => {
//     it('should create page select with correct options', () => {
//       paginationManager.initialize(container, 20);

//       const selectContainer = container.querySelector('#page-select-container');
//       expect(selectContainer).toBeTruthy();
//       expect(MockCkAlightSelectMenu).toHaveBeenCalledWith(jasmine.objectContaining({
//         options: jasmine.arrayContaining([
//           { label: '1 of 4', value: 1 },
//           { label: '2 of 4', value: 2 },
//           { label: '3 of 4', value: 3 },
//           { label: '4 of 4', value: 4 }
//         ]),
//         value: 1
//       }));
//     });

//     it('should handle page select change', () => {
//       paginationManager.initialize(container, 20);

//       const selectConfig = (MockCkAlightSelectMenu as any).calls.mostRecent().args[0];
//       selectConfig.onChange(3);

//       expect(onPageChange).toHaveBeenCalledWith(3);
//     });

//     it('should fallback to text display on error', () => {
//       (window as any).CkAlightSelectMenu = jasmine.createSpy().and.throwError('Mock error');
//       spyOn(console, 'error');

//       paginationManager.initialize(container, 20);

//       const selectContainer = container.querySelector('#page-select-container');
//       expect(selectContainer?.innerHTML).toContain('Page 1 of 4');
//       expect(console.error).toHaveBeenCalled();
//     });

//     it('should ignore invalid select changes', () => {
//       paginationManager.initialize(container, 20);

//       const selectConfig = (MockCkAlightSelectMenu as any).calls.mostRecent().args[0];

//       selectConfig.onChange(null);
//       expect(onPageChange).not.toHaveBeenCalled();

//       selectConfig.onChange('invalid');
//       expect(onPageChange).not.toHaveBeenCalled();

//       selectConfig.onChange(1); // Current page
//       expect(onPageChange).not.toHaveBeenCalled();
//     });
//   });

//   describe('getters', () => {
//     it('should return current page', () => {
//       expect(paginationManager.getCurrentPage()).toBe(1);
//     });

//     it('should return page size', () => {
//       expect(paginationManager.getPageSize()).toBe(5);
//     });

//     it('should return total pages', () => {
//       paginationManager['totalItems'] = 23;
//       expect(paginationManager.getTotalPages()).toBe(5);
//     });
//   });

//   describe('destroy', () => {
//     it('should clean up resources', () => {
//       paginationManager.initialize(container, 20);

//       paginationManager.destroy();

//       expect(paginationManager['selectMenu']).toBeNull();
//       expect(paginationManager['containerRef']).toBeNull();
//       expect(paginationManager['isUpdating']).toBe(false);
//     });

//     it('should remove event listeners', () => {
//       paginationManager.initialize(container, 20);
//       const paginationContainer = container.querySelector('#pagination-container') as HTMLElement;
//       spyOn(paginationContainer, 'removeEventListener');

//       paginationManager.destroy();

//       expect(paginationContainer.removeEventListener).toHaveBeenCalledWith('click', jasmine.any(Function));
//     });
//   });
// });

// describe('SearchManager', () => {
//   let searchManager: SearchManager;
//   let container: HTMLElement;
//   let onSearch: jasmine.Spy;
//   let paginationManager: PaginationManager;
//   let mockLinks: PredefinedLink[];

//   beforeEach(() => {
//     container = document.createElement('div');
//     container.innerHTML = '<div id="search-container-root"></div>';
//     document.body.appendChild(container);

//     mockLinks = [
//       {
//         predefinedLinkName: 'test-link-1',
//         predefinedLinkDescription: 'Description 1',
//         destination: 'https://example.com/1',
//         baseOrClientSpecific: 'base',
//         pageType: 'home',
//         domain: 'example.com'
//       },
//       {
//         predefinedLinkName: 'test-link-2',
//         predefinedLinkDescription: 'Description 2',
//         destination: 'https://example.com/2',
//         baseOrClientSpecific: 'client',
//         pageType: 'landing',
//         domain: 'test.com'
//       }
//     ];

//     onSearch = jasmine.createSpy('onSearch');
//     paginationManager = new PaginationManager(jasmine.createSpy(), 10);
//     searchManager = new SearchManager(mockLinks, onSearch, paginationManager);

//     // Mock AlightOverlayPanel
//     (window as any).AlightOverlayPanel = MockAlightOverlayPanel;
//   });

//   afterEach(() => {
//     searchManager.destroy();
//     document.body.removeChild(container);
//   });

//   describe('initialize', () => {
//     it('should inject search UI', () => {
//       searchManager.initialize(container);

//       const searchInput = container.querySelector('#search-input');
//       const searchBtn = container.querySelector('#search-btn');
//       const advancedBtn = container.querySelector('#advanced-search-trigger');

//       expect(searchInput).toBeTruthy();
//       expect(searchBtn).toBeTruthy();
//       expect(advancedBtn).toBeTruthy();
//     });

//     it('should preserve search query value', () => {
//       searchManager['currentSearchQuery'] = 'test query';
//       searchManager.initialize(container);

//       const searchInput = container.querySelector('#search-input') as HTMLInputElement;
//       expect(searchInput.value).toBe('test query');
//     });

//     it('should handle missing search container', () => {
//       const emptyContainer = document.createElement('div');
//       spyOn(console, 'error');

//       searchManager.initialize(emptyContainer);

//       expect(console.error).toHaveBeenCalledWith('Search container not found');
//     });

//     it('should not duplicate UI on re-initialization', () => {
//       searchManager.initialize(container);
//       const firstInput = container.querySelector('#search-input');

//       searchManager.initialize(container);
//       const secondInput = container.querySelector('#search-input');

//       expect(firstInput).toBe(secondInput);
//     });
//   });

//   describe('search functionality', () => {
//     beforeEach(() => {
//       searchManager.initialize(container);
//     });

//     it('should perform search on button click', () => {
//       const searchInput = container.querySelector('#search-input') as HTMLInputElement;
//       searchInput.value = 'test';

//       const searchBtn = container.querySelector('#search-btn') as HTMLElement;
//       searchBtn.click();

//       expect(onSearch).toHaveBeenCalled();
//       const filteredData = onSearch.calls.mostRecent().args[0];
//       expect(filteredData.length).toBe(2); // Both contain 'test'
//     });

//     it('should perform search on Enter key', () => {
//       const searchInput = container.querySelector('#search-input') as HTMLInputElement;
//       searchInput.value = 'link-1';

//       const event = new KeyboardEvent('keypress', { key: 'Enter' });
//       searchInput.dispatchEvent(event);

//       expect(onSearch).toHaveBeenCalled();
//       const filteredData = onSearch.calls.mostRecent().args[0];
//       expect(filteredData.length).toBe(1);
//     });

//     it('should debounce search input', (done) => {
//       const searchInput = container.querySelector('#search-input') as HTMLInputElement;

//       searchInput.value = 't';
//       searchInput.dispatchEvent(new Event('input'));

//       searchInput.value = 'te';
//       searchInput.dispatchEvent(new Event('input'));

//       searchInput.value = 'test';
//       searchInput.dispatchEvent(new Event('input'));

//       expect(onSearch).not.toHaveBeenCalled();

//       setTimeout(() => {
//         expect(onSearch).toHaveBeenCalledTimes(1);
//         done();
//       }, 350);
//     });

//     it('should cancel debounce on immediate Enter', (done) => {
//       const searchInput = container.querySelector('#search-input') as HTMLInputElement;

//       searchInput.value = 'test';
//       searchInput.dispatchEvent(new Event('input'));

//       // Immediately press Enter
//       const event = new KeyboardEvent('keypress', { key: 'Enter' });
//       searchInput.dispatchEvent(event);

//       expect(onSearch).toHaveBeenCalledTimes(1);

//       setTimeout(() => {
//         // Should not be called again after debounce timeout
//         expect(onSearch).toHaveBeenCalledTimes(1);
//         done();
//       }, 350);
//     });

//     it('should show/hide reset button based on input', () => {
//       const searchInput = container.querySelector('#search-input') as HTMLInputElement;
//       const resetBtn = container.querySelector('#reset-search-btn') as HTMLElement;

//       expect(resetBtn.style.display).toBe('none');

//       searchInput.value = 'test';
//       searchInput.dispatchEvent(new Event('input'));

//       expect(resetBtn.style.display).toBe('inline-flex');
//     });

//     it('should reset search', () => {
//       const searchInput = container.querySelector('#search-input') as HTMLInputElement;
//       const resetBtn = container.querySelector('#reset-search-btn') as HTMLElement;

//       searchInput.value = 'test';
//       searchInput.dispatchEvent(new Event('input'));

//       resetBtn.click();

//       expect(searchInput.value).toBe('');
//       expect(resetBtn.style.display).toBe('none');
//       expect(searchManager.getCurrentSearchQuery()).toBe('');
//     });
//   });

//   describe('advanced search', () => {
//     beforeEach(() => {
//       searchManager.initialize(container);
//     });

//     it('should create filter sections', () => {
//       const advancedPanel = document.querySelector('.cka-overlay-panel');

//       expect(advancedPanel).toBeTruthy();
//       expect(advancedPanel?.innerHTML).toContain('Base/Client Specific');
//       expect(advancedPanel?.innerHTML).toContain('Page Type');
//       expect(advancedPanel?.innerHTML).toContain('Domain');
//     });

//     it('should show empty message for no options', () => {
//       const emptySearchManager = new SearchManager([], onSearch, paginationManager);
//       emptySearchManager.initialize(container);

//       const advancedPanel = document.querySelector('.cka-overlay-panel');
//       expect(advancedPanel?.innerHTML).toContain('No options available');
//     });

//     it('should apply filters', () => {
//       const applyBtn = document.querySelector('#apply-filters') as HTMLElement;
//       const checkbox = document.querySelector('cka-checkbox[data-value="base"]') as any;

//       checkbox.checked = true;
//       checkbox.dispatchEvent(new Event('change'));

//       applyBtn.click();

//       expect(onSearch).toHaveBeenCalled();
//       const filteredData = onSearch.calls.mostRecent().args[0];
//       expect(filteredData.length).toBe(1);
//       expect(filteredData[0].baseOrClientSpecific).toBe('base');
//     });

//     it('should clear filters', () => {
//       const clearBtn = document.querySelector('#clear-filters') as HTMLElement;
//       const checkbox = document.querySelector('cka-checkbox[data-value="base"]') as any;

//       checkbox.checked = true;
//       checkbox.dispatchEvent(new Event('change'));

//       clearBtn.click();

//       expect(checkbox.checked).toBe(false);
//       expect(onSearch).toHaveBeenCalled();
//       const filteredData = onSearch.calls.mostRecent().args[0];
//       expect(filteredData.length).toBe(2);
//     });

//     it('should handle checkbox changes', () => {
//       const checkbox = document.querySelector('cka-checkbox[data-value="base"]') as any;

//       // Check
//       checkbox.checked = true;
//       checkbox.dispatchEvent(new Event('change'));
//       expect(searchManager['selectedFilters'].baseOrClientSpecific).toContain('base');

//       // Uncheck
//       checkbox.checked = false;
//       checkbox.dispatchEvent(new Event('change'));
//       expect(searchManager['selectedFilters'].baseOrClientSpecific).not.toContain('base');
//     });

//     it('should handle invalid checkbox attributes', () => {
//       const checkbox = document.createElement('cka-checkbox');
//       document.body.appendChild(checkbox);

//       checkbox.dispatchEvent(new Event('change'));

//       // Should not throw error
//       expect(searchManager['selectedFilters'].baseOrClientSpecific.length).toBe(0);

//       document.body.removeChild(checkbox);
//     });

//     it('should hide overlay on apply', () => {
//       const applyBtn = document.querySelector('#apply-filters') as HTMLElement;

//       applyBtn.click();

//       expect(MockAlightOverlayPanel.prototype.hide).toHaveBeenCalled();
//     });
//   });

//   describe('filtering logic', () => {
//     beforeEach(() => {
//       searchManager.initialize(container);
//     });

//     it('should filter by link name', () => {
//       searchManager['currentSearchQuery'] = 'link-1';
//       searchManager['updateFilteredData']();

//       expect(onSearch).toHaveBeenCalled();
//       const filteredData = onSearch.calls.mostRecent().args[0];
//       expect(filteredData.length).toBe(1);
//       expect(filteredData[0].predefinedLinkName).toBe('test-link-1');
//     });

//     it('should filter by description', () => {
//       searchManager['currentSearchQuery'] = 'Description 2';
//       searchManager['updateFilteredData']();

//       const filteredData = onSearch.calls.mostRecent().args[0];
//       expect(filteredData.length).toBe(1);
//       expect(filteredData[0].predefinedLinkName).toBe('test-link-2');
//     });

//     it('should filter by destination', () => {
//       searchManager['currentSearchQuery'] = 'example.com/2';
//       searchManager['updateFilteredData']();

//       const filteredData = onSearch.calls.mostRecent().args[0];
//       expect(filteredData.length).toBe(1);
//       expect(filteredData[0].predefinedLinkName).toBe('test-link-2');
//     });

//     it('should apply multiple filters', () => {
//       searchManager['selectedFilters'] = {
//         baseOrClientSpecific: ['client'],
//         pageType: ['landing'],
//         domain: ['test.com']
//       };
//       searchManager['updateFilteredData']();

//       const filteredData = onSearch.calls.mostRecent().args[0];
//       expect(filteredData.length).toBe(1);
//       expect(filteredData[0].predefinedLinkName).toBe('test-link-2');
//     });

//     it('should combine search and filters', () => {
//       searchManager['currentSearchQuery'] = 'test';
//       searchManager['selectedFilters'] = {
//         baseOrClientSpecific: ['base'],
//         pageType: [],
//         domain: []
//       };
//       searchManager['updateFilteredData']();

//       const filteredData = onSearch.calls.mostRecent().args[0];
//       expect(filteredData.length).toBe(1);
//       expect(filteredData[0].baseOrClientSpecific).toBe('base');
//     });

//     it('should handle empty filters', () => {
//       searchManager['selectedFilters'] = {
//         baseOrClientSpecific: [],
//         pageType: [],
//         domain: []
//       };
//       searchManager['updateFilteredData']();

//       const filteredData = onSearch.calls.mostRecent().args[0];
//       expect(filteredData.length).toBe(2);
//     });
//   });

//   describe('reset', () => {
//     it('should reset all state', () => {
//       searchManager.initialize(container);
//       const searchInput = container.querySelector('#search-input') as HTMLInputElement;

//       searchInput.value = 'test';
//       searchManager['currentSearchQuery'] = 'test';
//       searchManager['selectedFilters'].baseOrClientSpecific = ['base'];

//       searchManager.reset();

//       expect(searchInput.value).toBe('');
//       expect(searchManager.getCurrentSearchQuery()).toBe('');
//       expect(searchManager['selectedFilters']).toEqual({
//         baseOrClientSpecific: [],
//         pageType: [],
//         domain: []
//       });
//     });
//   });

//   describe('destroy', () => {
//     it('should remove event listeners', () => {
//       searchManager.initialize(container);

//       const searchBtn = container.querySelector('#search-btn') as HTMLElement;
//       const searchInput = container.querySelector('#search-input') as HTMLInputElement;
//       const resetBtn = container.querySelector('#reset-search-btn') as HTMLElement;

//       spyOn(searchBtn, 'removeEventListener');
//       spyOn(searchInput, 'removeEventListener');
//       spyOn(resetBtn, 'removeEventListener');

//       searchManager.destroy();

//       expect(searchBtn.removeEventListener).toHaveBeenCalled();
//       expect(searchInput.removeEventListener).toHaveBeenCalledTimes(2); // input and keypress
//       expect(resetBtn.removeEventListener).toHaveBeenCalled();
//     });

//     it('should clear references', () => {
//       searchManager.initialize(container);
//       searchManager.destroy();

//       expect(searchManager['searchInput']).toBeNull();
//       expect(searchManager['containerRef']).toBeNull();
//       expect(searchManager['overlayPanel']).toBeNull();
//       expect(searchManager['isInitialized']).toBe(false);
//     });

//     it('should cancel pending debounce', (done) => {
//       searchManager.initialize(container);
//       const searchInput = container.querySelector('#search-input') as HTMLInputElement;

//       searchInput.value = 'test';
//       searchInput.dispatchEvent(new Event('input'));

//       searchManager.destroy();

//       setTimeout(() => {
//         expect(onSearch).not.toHaveBeenCalled();
//         done();
//       }, 350);
//     });
//   });

//   describe('getCurrentSearchQuery', () => {
//     it('should return current search query', () => {
//       searchManager['currentSearchQuery'] = 'test query';
//       expect(searchManager.getCurrentSearchQuery()).toBe('test query');
//     });
//   });
// });
