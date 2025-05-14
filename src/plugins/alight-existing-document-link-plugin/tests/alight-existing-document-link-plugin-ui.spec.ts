// src/plugins/alight-existing-document-link-plugin/tests/alight-existing-document-link-plugin-ui.spec.ts
import { FocusTracker, KeystrokeHandler } from 'ckeditor5/src/utils';
import { ButtonView, View } from 'ckeditor5/src/ui';

import LinkActionsView from '../ui/linkactionsview';
import { ContentManager } from '../ui/linkmodal-ContentManager';
import { PaginationManager } from '../ui/linkmodal-PaginationManager';
import { SearchManager } from '../ui/linkmodal-SearchManager';
import { DocumentLink } from '../ui/linkmodal-modal-types';

// Global variables for mocks
let CkAlightSelectMenuMock: any;
let AlightOverlayPanelMock: any;

// Mock classes for elements that might not be available in test env
class CkAlightSelectMenu<T> {
  private options: any[];
  private value: any;
  private container: HTMLElement | null = null;
  private dropdown: HTMLElement | null = null;
  private button: HTMLElement | null = null;
  private onChange: (value: any) => void;
  private isOpen = false;

  constructor(config: any) {
    this.options = config.options || [];
    this.value = config.value;
    this.onChange = config.onChange || (() => { });

    // Create elements on construction
    this.button = document.createElement('button');
    this.button.className = 'cka-select-button';

    this.dropdown = document.createElement('div');
    this.dropdown.className = 'cka-select-dropdown';
    this.dropdown.style.display = 'none';
    this.dropdown.style.position = 'fixed';

    // Add options to dropdown
    this.refreshOptions();

    // Handle click events
    this.button.addEventListener('click', () => this.toggleDropdown());
  }

  mount(container: HTMLElement): void {
    this.container = container;
    if (container) {
      container.appendChild(this.button);
      document.body.appendChild(this.dropdown); // Append to body for positioning
    }
  }

  setOptions(newOptions: any[]): void {
    this.options = newOptions;
    this.refreshOptions();
  }

  setValue(newValue: any): void {
    this.value = newValue;
    this.updateButtonText();
    // Trigger onChange when value is set programmatically
    this.onChange(newValue);
  }

  getValue(): any {
    return this.value;
  }

  private toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    if (this.dropdown) {
      this.dropdown.style.display = this.isOpen ? 'block' : 'none';
      if (this.isOpen) {
        this.button.classList.add('cka-select-button-open');
      } else {
        this.button.classList.remove('cka-select-button-open');
      }
    }
  }

  private refreshOptions(): void {
    if (this.dropdown) {
      this.dropdown.innerHTML = '';

      // Create options
      this.options.forEach((option, index) => {
        const optionEl = document.createElement('div');
        optionEl.className = 'cka-select-option';
        optionEl.textContent = option.label || option;
        optionEl.addEventListener('click', () => {
          this.setValue(option.value !== undefined ? option.value : option);
          this.toggleDropdown();
        });
        this.dropdown?.appendChild(optionEl);
      });

      this.updateButtonText();
    }
  }

  private updateButtonText(): void {
    if (this.button) {
      // Find selected option
      const selectedOption = this.options.find(opt =>
        (opt.value !== undefined ? opt.value : opt) === this.value
      );

      // Set button text
      this.button.textContent = selectedOption ?
        (selectedOption.label || selectedOption) :
        'Select an option';
    }
  }

  destroy(): void {
    // Clean up event listeners
    if (this.button) {
      const newButton = this.button.cloneNode(true);
      if (this.button.parentNode) {
        this.button.parentNode.replaceChild(newButton, this.button);
      }
      this.button = null;
    }

    // Remove dropdown from DOM
    if (this.dropdown && this.dropdown.parentNode) {
      this.dropdown.parentNode.removeChild(this.dropdown);
    }
    this.dropdown = null;
    this.container = null;
  }
}

class AlightOverlayPanel {
  private trigger: HTMLElement;
  private panel: HTMLElement | null = null;
  private options: any;
  private isVisible = false;

  constructor(trigger: HTMLElement, options: any) {
    this.trigger = trigger;
    this.options = options || {};

    // Create panel element
    this.panel = document.createElement('div');
    this.panel.className = 'cka-overlay-panel';
    this.panel.style.display = 'none';

    // Get panel ID from trigger
    const panelId = trigger.getAttribute('data-panel-id');
    if (!panelId) {
      console.warn('No panel ID specified for trigger');
    } else {
      this.panel.setAttribute('data-id', panelId);
      document.body.appendChild(this.panel);

      // Set up trigger click handler
      trigger.addEventListener('click', () => this.toggle());
    }
  }

  show(): void {
    if (this.panel) {
      this.panel.style.display = 'block';
      this.isVisible = true;

      // Call onShow callback if provided
      if (this.options.onShow) {
        this.options.onShow();
      }
    }
  }

  hide(): void {
    if (this.panel) {
      this.panel.style.display = 'none';
      this.isVisible = false;

      // Call onHide callback if provided
      if (this.options.onHide) {
        this.options.onHide();
      }
    }
  }

  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  destroy(): void {
    // Remove panel from DOM
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
    this.panel = null;

    // Clean up event listeners on trigger
    const newTrigger = this.trigger.cloneNode(true);
    if (this.trigger.parentNode) {
      this.trigger.parentNode.replaceChild(newTrigger, this.trigger);
    }
  }
}

describe('LinkActionsView', () => {
  let locale: any;
  let view: LinkActionsView;

  beforeEach(() => {
    locale = { t: (str: string) => str };
    view = new LinkActionsView(locale as any);
  });

  afterEach(() => {
    view.destroy();
  });

  it('should create view instance with all required properties', () => {
    expect(view instanceof LinkActionsView).toBe(true);
    expect(view.focusTracker instanceof FocusTracker).toBe(true);
    expect(view.keystrokes instanceof KeystrokeHandler).toBe(true);
    expect(view.previewButtonView instanceof View).toBe(true);
    expect(view.unlinkButtonView instanceof ButtonView).toBe(true);
    expect(view.editButtonView instanceof ButtonView).toBe(true);
    expect(view.href).toBeUndefined();
  });

  it('should create action buttons that delegate to the view', () => {
    // Directly set up event listeners to test delegation
    const editHandler = jasmine.createSpy('editHandler');
    const unlinkHandler = jasmine.createSpy('unlinkHandler');

    view.on('edit', editHandler);
    view.on('unlink', unlinkHandler);

    // Simulate button clicks
    view.editButtonView.fire('execute');
    view.unlinkButtonView.fire('execute');

    // Check if events were delegated correctly
    expect(editHandler).toHaveBeenCalled();
    expect(unlinkHandler).toHaveBeenCalled();
  });

  it('should bind href value to preview button', () => {
    view.set('href', 'https://example.com');
    expect(view.href).toBe('https://example.com');

    view.set('href', undefined);
    expect(view.href).toBeUndefined();
  });

  it('should clean up resources in destroy()', () => {
    // Create spies
    spyOn(view.focusTracker, 'destroy');
    spyOn(view.keystrokes, 'destroy');

    // Call destroy
    view.destroy();

    // Check if resources were cleaned up
    expect(view.focusTracker.destroy).toHaveBeenCalled();
    expect(view.keystrokes.destroy).toHaveBeenCalled();
  });

  it('should handle focus method correctly', () => {
    // Create spy for focusFirst
    spyOn((view as any)._focusCycler, 'focusFirst');

    // Call focus
    view.focus();

    // Check if focus was called
    expect((view as any)._focusCycler.focusFirst).toHaveBeenCalled();
  });

  it('should create preview button with correct template', () => {
    // Check if the preview button has the expected template structure
    const previewButton = view.previewButtonView;
    expect(previewButton).toBeDefined();

    // Verify the button's template structure
    const template = (previewButton as any).template;
    expect(template).toBeDefined();
  });
});

describe('ContentManager', () => {
  let contentManager: ContentManager;
  let mockDocumentLinks: DocumentLink[];
  let mockContainer: HTMLElement;

  beforeEach(() => {
    mockDocumentLinks = [
      {
        serverFilePath: '/path/to/doc1',
        title: 'Document 1',
        fileId: 'file1',
        fileType: 'pdf',
        population: 'General',
        locale: 'en-US',
        lastUpdated: Date.now(),
        updatedBy: 'user1',
        upointLink: '/link/to/doc1',
        documentDescription: 'A test document',
        expiryDate: '2025-12-31'
      },
      {
        serverFilePath: '/path/to/doc2',
        title: 'Document 2',
        fileId: 'file2',
        fileType: 'docx',
        population: 'Healthcare',
        locale: 'en-GB',
        lastUpdated: Date.now(),
        updatedBy: 'user2',
        upointLink: '/link/to/doc2',
        documentDescription: 'Another test document',
        expiryDate: '2025-12-31'
      },
      {
        serverFilePath: '/path/to/doc3',
        title: 'Document 3',
        fileId: 'file3',
        fileType: 'pdf',
        population: 'General',
        locale: 'en-US',
        lastUpdated: Date.now(),
        updatedBy: 'user3',
        upointLink: '/link/to/doc3',
        documentDescription: 'A third test document',
        expiryDate: '2025-12-31'
      }
    ];

    contentManager = new ContentManager('', mockDocumentLinks);
    mockContainer = document.createElement('div');

    // Set up container with necessary elements for testing
    const paginationContainer = document.createElement('div');
    paginationContainer.id = 'pagination-container';

    const searchContainer = document.createElement('div');
    searchContainer.id = 'search-container-root';

    const linksContainer = document.createElement('div');
    linksContainer.id = 'links-container';

    mockContainer.appendChild(paginationContainer);
    mockContainer.appendChild(searchContainer);
    mockContainer.appendChild(linksContainer);
  });

  afterEach(() => {
    contentManager.destroy();
  });

  it('should initialize with the provided data', () => {
    expect(contentManager.getSelectedLink()).toBeNull();
    expect(contentManager.normalizeUrl('https://example.com/')).toBe('example.com');
  });

  it('should select a link if initialUrl matches a document', () => {
    const initialUrl = '/path/to/doc1';
    const contentManagerWithInitialUrl = new ContentManager(initialUrl, mockDocumentLinks);

    expect(contentManagerWithInitialUrl.getSelectedLink()).toEqual({
      destination: '/path/to/doc1',
      title: 'Document 1'
    });

    contentManagerWithInitialUrl.destroy();
  });

  it('should show and remove alerts', () => {
    // Mock renderContent to avoid DOM manipulation issues in tests
    spyOn(contentManager, 'renderContent');

    // Show an alert
    contentManager.showAlert('Test alert', 'info', 100);

    // Check if the alert was added to the alerts array
    expect((contentManager as any).alerts.length).toBe(1);
    expect((contentManager as any).alerts[0].message).toBe('Test alert');
    expect((contentManager as any).alerts[0].type).toBe('info');

    // Get the alert ID
    const alertId = (contentManager as any).alerts[0].id;

    // Remove the alert
    contentManager.removeAlert(alertId);

    // Simulate timeout callback
    jasmine.clock().install();
    jasmine.clock().tick(600);
    jasmine.clock().uninstall();

    // Check if alert was removed (we can't verify this directly because of the timeout)
    // But we can verify that removeAlert was called with the right ID
    expect((contentManager as any).alerts.length).toBe(0);
  });

  it('should clear all alerts', () => {
    // Mock renderContent to avoid DOM manipulation issues in tests
    spyOn(contentManager, 'renderContent');

    // Add multiple alerts
    contentManager.showAlert('Alert 1', 'info');
    contentManager.showAlert('Alert 2', 'error');

    // Verify alerts were added
    expect((contentManager as any).alerts.length).toBe(2);

    // Clear all alerts
    contentManager.clearAlerts();

    // Verify all alerts were removed
    expect((contentManager as any).alerts.length).toBe(0);
  });

  it('should handle search results updates', () => {
    // Mock onLinkSelected callback
    (contentManager as any).onLinkSelected = jasmine.createSpy('onLinkSelected');

    // Mock renderContent to avoid DOM manipulation issues
    spyOn(contentManager, 'renderContent');

    // Set a selected link
    (contentManager as any).selectedLink = mockDocumentLinks[0];

    // Call handleSearchResults with filtered data that doesn't include the selected link
    const filteredData = [mockDocumentLinks[1], mockDocumentLinks[2]];
    (contentManager as any).handleSearchResults(filteredData);

    // Verify selected link was cleared and onLinkSelected was called
    expect((contentManager as any).selectedLink).toBeNull();
    expect((contentManager as any).onLinkSelected).toHaveBeenCalledWith(null);

    // Call handleSearchResults with filtered data that includes the selected link
    (contentManager as any).selectedLink = mockDocumentLinks[0];
    (contentManager as any).handleSearchResults([...mockDocumentLinks]);

    // Verify selected link was not cleared
    expect((contentManager as any).selectedLink).toBe(mockDocumentLinks[0]);
  });

  // it('should handle reset search', () => {
  //   // Mock dependencies
  //   (contentManager as any).searchManager = {
  //     reset: jasmine.createSpy('reset')
  //   };
  //   (contentManager as any).onLinkSelected = jasmine.createSpy('onLinkSelected');
  //   spyOn(contentManager, 'renderContent');

  //   // Set a selected link
  //   (contentManager as any).selectedLink = mockDocumentLinks[0];

  //   // Call resetSearch
  //   contentManager.resetSearch();

  //   // Verify searchManager.reset was called
  //   expect((contentManager as any).searchManager.reset).toHaveBeenCalled();

  //   // Verify selected link was cleared
  //   expect((contentManager as any).selectedLink).toBeNull();

  //   // Verify onLinkSelected was called with null
  //   expect((contentManager as any).onLinkSelected).toHaveBeenCalledWith(null);
  // });

  it('should handle link selection', () => {
    // Mock onLinkSelected callback
    (contentManager as any).onLinkSelected = jasmine.createSpy('onLinkSelected');

    // Create mock link item and container
    const mockLinkItem = document.createElement('div');
    mockLinkItem.dataset.linkName = '/path/to/doc1';

    const mockContainer = document.createElement('div');
    mockContainer.classList.add('cka-existing-document-link-content');

    const mockRadio = document.createElement('div');
    // Use setAttribute for custom elements instead of changing tagName
    mockRadio.setAttribute('is', 'cka-radio-button');
    mockLinkItem.appendChild(mockRadio);

    // Mock DOM methods
    spyOn(mockLinkItem, 'closest').and.returnValue(mockContainer);
    spyOn(mockContainer, 'querySelectorAll').and.returnValue([mockLinkItem] as any);

    // Call handleLinkSelection
    (contentManager as any).handleLinkSelection('/path/to/doc1', mockLinkItem);

    // Verify selected link was set
    expect((contentManager as any).selectedLink).toEqual(mockDocumentLinks[0]);

    // Verify onLinkSelected was called
    expect((contentManager as any).onLinkSelected).toHaveBeenCalledWith(mockDocumentLinks[0]);
  });

  it('should render content in the container', () => {
    // Mock internal methods to avoid DOM issues
    spyOn(contentManager as any, 'buildContentForPage').and.returnValue('<div>Mock content</div>');
    spyOn(contentManager as any, 'initializeComponents');

    // Call renderContent
    contentManager.renderContent(mockContainer);

    // Verify methods were called
    expect((contentManager as any).buildContentForPage).toHaveBeenCalled();
    expect((contentManager as any).initializeComponents).toHaveBeenCalled();

    // Verify isRendering flag was reset
    expect((contentManager as any).isRendering).toBe(false);
  });

  it('should handle rendering errors and reset isRendering flag', () => {
    // Force an error during rendering
    spyOn(contentManager as any, 'buildContentForPage').and.throwError('Rendering error');

    // Spy on console.error
    spyOn(console, 'error');

    // Call renderContent
    contentManager.renderContent(mockContainer);

    // Verify error was logged
    expect(console.error).toHaveBeenCalled();

    // Verify isRendering flag was reset
    expect((contentManager as any).isRendering).toBe(false);
  });
});

describe('PaginationManager', () => {
  let paginationManager: PaginationManager;
  let onPageChangeSpy: jasmine.Spy;
  let mockContainer: HTMLElement;
  let mockSelectMenu: any = null;

  beforeEach(() => {
    // Create a fresh mock class for each test
    CkAlightSelectMenuMock = jasmine.createSpy('CkAlightSelectMenuMock').and.callFake(function (config: any) {
      mockSelectMenu = new CkAlightSelectMenu(config);
      return mockSelectMenu;
    });

    // Add to global/window scope
    (window as any).CkAlightSelectMenu = CkAlightSelectMenuMock;

    onPageChangeSpy = jasmine.createSpy('onPageChange');
    paginationManager = new PaginationManager(onPageChangeSpy, 10);

    // Create mock container
    mockContainer = document.createElement('div');
    const paginationContainer = document.createElement('div');
    paginationContainer.id = 'pagination-container';
    mockContainer.appendChild(paginationContainer);

    // Create a mock select container
    const selectContainer = document.createElement('div');
    selectContainer.id = 'page-select-container';
    paginationContainer.appendChild(selectContainer);
  });

  afterEach(() => {
    paginationManager.destroy();
    if (mockSelectMenu) {
      mockSelectMenu.destroy();
      mockSelectMenu = null;
    }
  });

  it('should initialize with default values', () => {
    expect(paginationManager.getCurrentPage()).toBe(1);
    expect(paginationManager.getPageSize()).toBe(10);
    expect(paginationManager.getTotalPages()).toBe(1);
  });

  it('should calculate total pages correctly', () => {
    // We can't directly test private methods, so we'll test the behavior
    // indirectly by checking the getTotalPages result after initialize

    // Spy on internal methods to avoid DOM issues
    spyOn(paginationManager as any, 'getPaginationMarkup').and.returnValue('<div>pagination</div>');
    spyOn(paginationManager as any, 'initializeComponents');

    // Initialize with 25 items (should be 3 pages with pageSize 10)
    paginationManager.initialize(mockContainer, 25);
    expect(paginationManager.getTotalPages()).toBe(3);

    // Initialize with 10 items (should be 1 page with pageSize 10)
    paginationManager.initialize(mockContainer, 10);
    expect(paginationManager.getTotalPages()).toBe(1);

    // Initialize with 0 items (should be 1 page minimum)
    paginationManager.initialize(mockContainer, 0);
    expect(paginationManager.getTotalPages()).toBe(1);
  });

  it('should clamp page number to valid range when setting page', () => {
    // Set up spies to avoid DOM issues
    spyOn(paginationManager as any, 'updateButtonStates');
    spyOn(paginationManager as any, 'updatePageSelect');

    // Initialize first to set up internal state
    paginationManager.initialize(mockContainer, 25);

    // Try to set page beyond total (should clamp to 3)
    paginationManager.setPage(5, 25);
    expect(paginationManager.getCurrentPage()).toBe(3);
    expect(onPageChangeSpy).toHaveBeenCalledWith(3);

    // Reset spy
    onPageChangeSpy.calls.reset();

    // Try to set page below 1 (should clamp to 1)
    paginationManager.setPage(0, 25);
    expect(paginationManager.getCurrentPage()).toBe(1);
    expect(onPageChangeSpy).toHaveBeenCalledWith(1);
  });

  it('should handle initialization when pagination container is not found', () => {
    // Create new container without pagination container
    const emptyContainer = document.createElement('div');

    // Spy on console.error
    spyOn(console, 'error');

    // Initialize with 25 items
    paginationManager.initialize(emptyContainer, 25);

    // Verify console.error was called
    expect(console.error).toHaveBeenCalledWith('Pagination container not found');
  });

  it('should handle jumps to first or last page', () => {
    // Set up spies to avoid DOM issues
    spyOn(paginationManager as any, 'updateButtonStates');
    spyOn(paginationManager as any, 'updatePageSelect');

    // Initialize first to set up internal state
    paginationManager.initialize(mockContainer, 25);

    // Set current page to middle
    (paginationManager as any).currentPage = 2;

    // Jump to first page
    paginationManager.jumpToPage('first');
    expect(paginationManager.getCurrentPage()).toBe(1);
    expect(onPageChangeSpy).toHaveBeenCalledWith(1);

    // Reset spy
    onPageChangeSpy.calls.reset();

    // Jump to last page
    paginationManager.jumpToPage('last');
    expect(paginationManager.getCurrentPage()).toBe(3);
    expect(onPageChangeSpy).toHaveBeenCalledWith(3);

    // Reset spy
    onPageChangeSpy.calls.reset();

    // Jump to current page should not trigger page change
    (paginationManager as any).isUpdating = false;
    (paginationManager as any).currentPage = 1;
    paginationManager.jumpToPage('first');
    expect(onPageChangeSpy).not.toHaveBeenCalled();
  });

  it('should handle pagination click events', () => {
    // Create mock elements for the test
    const buttonElement = document.createElement('button');
    buttonElement.setAttribute('data-page', '2');
    const event = {
      target: buttonElement,
      preventDefault: jasmine.createSpy('preventDefault')
    };

    // Spy on setPage method
    spyOn(paginationManager, 'setPage');
    spyOn(buttonElement, 'closest').and.returnValue(buttonElement);
    spyOn(buttonElement, 'hasAttribute').and.returnValue(false);

    // Call handlePaginationClick
    (paginationManager as any).handlePaginationClick(event);

    // Verify setPage was called with correct page
    expect(paginationManager.setPage).toHaveBeenCalled();

    // Test first/last page navigation
    buttonElement.removeAttribute('data-page');
    buttonElement.setAttribute('data-page-type', 'first');

    // Spy on jumpToPage method
    spyOn(paginationManager, 'jumpToPage');

    // Call handlePaginationClick
    (paginationManager as any).handlePaginationClick(event);

    // Verify jumpToPage was called
    expect(paginationManager.jumpToPage).toHaveBeenCalledWith('first');
  });

  it('should skip updates when isUpdating flag is true', () => {
    // Set isUpdating flag to true
    (paginationManager as any).isUpdating = true;

    // Spy on console.log
    spyOn(console, 'log');

    // Try to set page
    paginationManager.setPage(2, 25);

    // Verify console.log was called with expected message
    expect(console.log).toHaveBeenCalledWith('Update already in progress, skipping');
  });

  it('should handle errors in setPage method', () => {
    // Force an error during setPage
    spyOn(paginationManager as any, 'calculateTotalPages').and.throwError('Page calculation error');

    // Spy on console.error
    spyOn(console, 'error');

    // Call setPage
    paginationManager.setPage(2, 25);

    // Verify error was logged
    expect(console.error).toHaveBeenCalled();

    // Verify isUpdating flag was reset
    expect((paginationManager as any).isUpdating).toBe(false);
  });
});

describe('SearchManager', () => {
  let searchManager: SearchManager;
  let mockDocumentLinks: DocumentLink[];
  let onSearchSpy: jasmine.Spy;
  let mockPaginationManager: any;
  let mockContainer: HTMLElement;
  let mockOverlayPanel: any = null;

  beforeEach(() => {
    // Create a fresh mock class for each test
    AlightOverlayPanelMock = jasmine.createSpy('AlightOverlayPanelMock').and.callFake(function (trigger: HTMLElement, options: any) {
      mockOverlayPanel = new AlightOverlayPanel(trigger, options);
      return mockOverlayPanel;
    });

    // Add to global/window scope
    (window as any).AlightOverlayPanel = AlightOverlayPanelMock;

    mockDocumentLinks = [
      {
        serverFilePath: '/path/to/doc1',
        title: 'Document 1',
        fileId: 'file1',
        fileType: 'pdf',
        population: 'General',
        locale: 'en-US',
        lastUpdated: Date.now(),
        updatedBy: 'user1',
        upointLink: '/link/to/doc1',
        documentDescription: 'A test document',
        expiryDate: '2025-12-31'
      },
      {
        serverFilePath: '/path/to/doc2',
        title: 'Document 2',
        fileId: 'file2',
        fileType: 'docx',
        population: 'Healthcare',
        locale: 'en-GB',
        lastUpdated: Date.now(),
        updatedBy: 'user2',
        upointLink: '/link/to/doc2',
        documentDescription: 'Another test document',
        expiryDate: '2025-12-31'
      },
      {
        serverFilePath: '/path/to/doc3',
        title: 'Document 3',
        fileId: 'file3',
        fileType: 'pdf',
        population: 'General',
        locale: 'en-US',
        lastUpdated: Date.now(),
        updatedBy: 'user3',
        upointLink: '/link/to/doc3',
        documentDescription: 'A third test document',
        expiryDate: '2025-12-31'
      }
    ];

    onSearchSpy = jasmine.createSpy('onSearch');
    mockPaginationManager = {
      setPage: jasmine.createSpy('setPage'),
      destroy: jasmine.createSpy('destroy')
    };

    searchManager = new SearchManager(
      mockDocumentLinks,
      onSearchSpy,
      mockPaginationManager
    );

    // Create mock container with necessary elements
    mockContainer = document.createElement('div');
    const searchContainer = document.createElement('div');
    searchContainer.id = 'search-container-root';
    mockContainer.appendChild(searchContainer);

    // Create advanced search trigger button
    const triggerBtn = document.createElement('button');
    triggerBtn.id = 'advanced-search-trigger';
    triggerBtn.setAttribute('data-panel-id', 'advanced-search-panel');
    searchContainer.appendChild(triggerBtn);
  });

  afterEach(() => {
    searchManager.destroy();
    if (mockOverlayPanel) {
      mockOverlayPanel.destroy();
      mockOverlayPanel = null;
    }
  });

  it('should initialize with empty search query', () => {
    expect(searchManager.getCurrentSearchQuery()).toBe('');
  });

  it('should initialize search UI and components', () => {
    // Spy on internal methods to avoid DOM issues
    spyOn(searchManager as any, 'injectSearchUI');
    spyOn(searchManager as any, 'setupOverlayPanel');
    spyOn(searchManager as any, 'setupEventListeners');

    // Call initialize
    searchManager.initialize(mockContainer);

    // Verify methods were called
    expect(searchManager.initialize).toBeDefined();
    expect((searchManager as any).injectSearchUI).toHaveBeenCalled();
    expect((searchManager as any).setupOverlayPanel).toHaveBeenCalled();
    expect((searchManager as any).setupEventListeners).toHaveBeenCalled();
    expect((searchManager as any).isInitialized).toBe(true);
  });

  it('should handle search button click', () => {
    // Spy on performSearch method
    spyOn(searchManager as any, 'performSearch');

    // Call handleSearchBtnClick
    (searchManager as any).handleSearchBtnClick();

    // Verify performSearch was called
    expect((searchManager as any).performSearch).toHaveBeenCalled();
  });

  it('should handle search input changes with debounce', () => {
    // Create mock input element and event
    const mockInput = document.createElement('input');
    mockInput.value = 'test search';

    // Create a valid Event object
    const mockEvent = new Event('input');
    Object.defineProperty(mockEvent, 'target', { value: mockInput });

    // Set up containerRef and reset button
    (searchManager as any).containerRef = document.createElement('div');
    const resetBtn = document.createElement('button');
    spyOn((searchManager as any).containerRef, 'querySelector').and.returnValue(resetBtn);

    // Spy on window.setTimeout
    spyOn(window, 'setTimeout').and.callFake((callback: Function) => {
      callback();
      return 123;
    });

    // Spy on performSearch method
    spyOn(searchManager as any, 'performSearch');

    // Call handleSearchInputChange
    (searchManager as any).handleSearchInputChange(mockEvent);

    // Verify currentSearchQuery was updated
    expect((searchManager as any).currentSearchQuery).toBe('test search');

    // Verify reset button display was updated
    expect(resetBtn.style.display).toBe('inline-flex');

    // Verify setTimeout was called
    expect(window.setTimeout).toHaveBeenCalled();

    // Verify performSearch was called
    expect((searchManager as any).performSearch).toHaveBeenCalled();
  });

  it('should handle search input keypress for Enter key', () => {
    // Create a proper KeyboardEvent
    const keyEvent = new KeyboardEvent('keypress', { key: 'Enter' });

    // Set up searchDebounceTimer
    (searchManager as any).searchDebounceTimer = 123;

    // Spy on window.clearTimeout
    spyOn(window, 'clearTimeout');

    // Spy on performSearch method
    spyOn(searchManager as any, 'performSearch');

    // Call handleSearchInputKeypress
    (searchManager as any).handleSearchInputKeypress(keyEvent);

    // Verify clearTimeout was called
    expect(window.clearTimeout).toHaveBeenCalledWith(123);

    // Verify searchDebounceTimer was reset
    expect((searchManager as any).searchDebounceTimer).toBeNull();

    // Verify performSearch was called
    expect((searchManager as any).performSearch).toHaveBeenCalled();
  });

  it('should handle reset button click', () => {
    // Set up searchInput
    (searchManager as any).searchInput = document.createElement('input');
    (searchManager as any).searchInput.value = 'test search';

    // Set up containerRef and reset button
    (searchManager as any).containerRef = document.createElement('div');
    const resetBtn = document.createElement('button');
    spyOn((searchManager as any).containerRef, 'querySelector').and.returnValue(resetBtn);

    // Spy on updateFilteredData method
    spyOn(searchManager as any, 'updateFilteredData');

    // Call handleResetBtnClick
    (searchManager as any).handleResetBtnClick();

    // Verify searchInput value was cleared
    expect((searchManager as any).searchInput.value).toBe('');

    // Verify currentSearchQuery was cleared
    expect((searchManager as any).currentSearchQuery).toBe('');

    // Verify reset button display was updated
    expect(resetBtn.style.display).toBe('none');

    // Verify updateFilteredData was called
    expect((searchManager as any).updateFilteredData).toHaveBeenCalled();
  });

  it('should update filtered data based on search criteria', () => {
    // Set search queries and filters
    (searchManager as any).currentSearchQuery = 'Document 1';
    (searchManager as any).populationSearchQuery = '';
    (searchManager as any).selectedFilters = {
      fileType: [],
      population: [],
      locale: []
    };

    // Spy on console.log
    spyOn(console, 'log');

    // Call updateFilteredData
    (searchManager as any).updateFilteredData();

    // Verify paginationManager.setPage was called
    expect(mockPaginationManager.setPage).toHaveBeenCalledWith(1, 1);

    // Verify onSearch was called with filtered data
    expect(onSearchSpy).toHaveBeenCalled();
    const filteredData = onSearchSpy.calls.mostRecent().args[0];
    expect(filteredData.length).toBe(1);
    expect(filteredData[0].title).toBe('Document 1');

    // Test with document description filter
    onSearchSpy.calls.reset();
    mockPaginationManager.setPage.calls.reset();

    (searchManager as any).currentSearchQuery = 'third';
    (searchManager as any).updateFilteredData();

    const filteredByDesc = onSearchSpy.calls.mostRecent().args[0];
    expect(filteredByDesc.length).toBe(1);
    expect(filteredByDesc[0].title).toBe('Document 3');

    // Test with file type filter
    onSearchSpy.calls.reset();
    mockPaginationManager.setPage.calls.reset();

    (searchManager as any).currentSearchQuery = '';
    (searchManager as any).selectedFilters.fileType = ['pdf'];
    (searchManager as any).updateFilteredData();

    const filteredByType = onSearchSpy.calls.mostRecent().args[0];
    expect(filteredByType.length).toBe(2);
    expect(filteredByType[0].fileType).toBe('pdf');
    expect(filteredByType[1].fileType).toBe('pdf');

    // Test with population filter
    onSearchSpy.calls.reset();
    mockPaginationManager.setPage.calls.reset();

    (searchManager as any).selectedFilters.fileType = [];
    (searchManager as any).populationSearchQuery = 'Healthcare';
    (searchManager as any).updateFilteredData();

    const filteredByPopulation = onSearchSpy.calls.mostRecent().args[0];
    expect(filteredByPopulation.length).toBe(1);
    expect(filteredByPopulation[0].population).toBe('Healthcare');

    // Test with locale filter
    onSearchSpy.calls.reset();
    mockPaginationManager.setPage.calls.reset();

    (searchManager as any).populationSearchQuery = '';
    (searchManager as any).selectedFilters.locale = ['en-GB'];
    (searchManager as any).updateFilteredData();

    const filteredByLocale = onSearchSpy.calls.mostRecent().args[0];
    expect(filteredByLocale.length).toBe(1);
    expect(filteredByLocale[0].locale).toBe('en-GB');
  });

  // it('should handle apply filters action', () => {
  //   // Set up populationInput
  //   (searchManager as any).populationInput = document.createElement('input');
  //   (searchManager as any).populationInput.value = 'Healthcare';

  //   // Spy on updateFilteredData method
  //   spyOn(searchManager as any, 'updateFilteredData');

  //   // Use our actual mock overlay panel
  //   (searchManager as any).overlayPanel = mockOverlayPanel;
  //   spyOn(mockOverlayPanel, 'hide').and.callThrough();

  //   // Call handleApplyFilters
  //   (searchManager as any).handleApplyFilters();

  //   // Verify populationSearchQuery was updated
  //   expect((searchManager as any).populationSearchQuery).toBe('Healthcare');

  //   // Verify updateFilteredData was called
  //   expect((searchManager as any).updateFilteredData).toHaveBeenCalled();

  //   // Verify overlayPanel.hide was called
  //   expect(mockOverlayPanel.hide).toHaveBeenCalled();
  // });

  it('should handle clear filters action', () => {
    // Spy on clearFilters method
    spyOn(searchManager as any, 'clearFilters');

    // Call handleClearFilters
    (searchManager as any).handleClearFilters();

    // Verify clearFilters was called
    expect((searchManager as any).clearFilters).toHaveBeenCalled();
  });

  it('should handle checkbox change events', () => {
    // Create mock checkbox
    const mockCheckbox = document.createElement('div');
    mockCheckbox.setAttribute('data-filter-type', 'fileType');
    mockCheckbox.setAttribute('data-value', 'pdf');
    Object.defineProperty(mockCheckbox, 'checked', { value: true, writable: true });

    // Create event with target
    const mockEvent = new Event('change');
    Object.defineProperty(mockEvent, 'target', { value: mockCheckbox });

    // Call handleCheckboxChange
    (searchManager as any).handleCheckboxChange(mockEvent);

    // Verify selectedFilters was updated
    expect((searchManager as any).selectedFilters.fileType).toContain('pdf');

    // Test unchecking
    Object.defineProperty(mockCheckbox, 'checked', { value: false });
    (searchManager as any).handleCheckboxChange(mockEvent);

    // Verify item was removed from selectedFilters
    expect((searchManager as any).selectedFilters.fileType).not.toContain('pdf');
  });

  it('should clear filters', () => {
    // Set up initial state with filters
    (searchManager as any).selectedFilters = {
      fileType: ['pdf'],
      population: ['General'],
      locale: ['en-US']
    };
    (searchManager as any).populationSearchQuery = 'Healthcare';

    // Set up populationInput
    (searchManager as any).populationInput = document.createElement('input');
    (searchManager as any).populationInput.value = 'Healthcare';

    // Create mock checkbox elements with necessary properties
    class MockCheckbox {
      checked: boolean = true;
    }

    // Create NodeList-like array with item method
    const checkboxes = [new MockCheckbox(), new MockCheckbox()];
    const nodeList = {
      length: checkboxes.length,
      item: (index: number) => index < checkboxes.length ? checkboxes[index] : null,
      [Symbol.iterator]: function* () {
        for (let i = 0; i < checkboxes.length; i++) {
          yield checkboxes[i];
        }
      },
      forEach: function (callback: (item: any, index: number) => void) {
        for (let i = 0; i < checkboxes.length; i++) {
          callback(checkboxes[i], i);
        }
      }
    };

    // Mock document.querySelectorAll
    spyOn(document, 'querySelectorAll').and.returnValue(nodeList as unknown as NodeListOf<Element>);

    // Spy on updateFilteredData method
    spyOn(searchManager as any, 'updateFilteredData');

    // Call clearFilters
    (searchManager as any).clearFilters();

    // Verify filters were cleared
    expect((searchManager as any).selectedFilters.fileType).toEqual([]);
    expect((searchManager as any).selectedFilters.population).toEqual([]);
    expect((searchManager as any).selectedFilters.locale).toEqual([]);

    // Verify populationSearchQuery was cleared
    expect((searchManager as any).populationSearchQuery).toBe('');

    // Verify populationInput value was cleared
    expect((searchManager as any).populationInput.value).toBe('');

    // Verify checkboxes were unchecked
    expect(checkboxes[0].checked).toBe(false);
    expect(checkboxes[1].checked).toBe(false);

    // Verify updateFilteredData was called
    expect((searchManager as any).updateFilteredData).toHaveBeenCalled();
  });

  it('should reset all search state', () => {
    // Set up initial search state
    (searchManager as any).searchInput = document.createElement('input');
    (searchManager as any).searchInput.value = 'test search';
    (searchManager as any).currentSearchQuery = 'test search';
    (searchManager as any).populationSearchQuery = 'Healthcare';
    (searchManager as any).selectedFilters = {
      fileType: ['pdf'],
      population: ['General'],
      locale: ['en-US']
    };

    // Set up containerRef
    (searchManager as any).containerRef = document.createElement('div');

    // Create mock elements
    const mockSearchInput = document.createElement('input');
    const mockResetButton = document.createElement('button');

    // Mock querySelector to return our mock elements
    spyOn((searchManager as any).containerRef, 'querySelector')
      .and.returnValues(mockSearchInput, mockResetButton);

    // Spy on updateFilteredData method
    spyOn(searchManager as any, 'updateFilteredData');

    // Call reset
    searchManager.reset();

    // Verify search state was reset
    expect((searchManager as any).searchInput.value).toBe('');
    expect((searchManager as any).currentSearchQuery).toBe('');
    expect((searchManager as any).populationSearchQuery).toBe('');
    expect((searchManager as any).selectedFilters.fileType).toEqual([]);
    expect((searchManager as any).selectedFilters.population).toEqual([]);
    expect((searchManager as any).selectedFilters.locale).toEqual([]);

    // Verify DOM elements were updated
    expect(mockSearchInput.value).toBe('');
    expect(mockResetButton.style.display).toBe('none');

    // Verify updateFilteredData was called
    expect((searchManager as any).updateFilteredData).toHaveBeenCalled();
  });

  it('should clean up event listeners and resources in destroy', () => {
    // Set up necessary properties for cleanup
    (searchManager as any).searchDebounceTimer = 123;
    (searchManager as any).searchInput = document.createElement('input');
    (searchManager as any).populationInput = document.createElement('input');
    (searchManager as any).containerRef = document.createElement('div');
    (searchManager as any).overlayPanel = mockOverlayPanel;
    (searchManager as any).isInitialized = true;

    // Spy on methods
    spyOn(window, 'clearTimeout');
    spyOn(searchManager as any, 'removeEventListeners');

    // Call destroy
    searchManager.destroy();

    // Verify methods were called
    expect((searchManager as any).removeEventListeners).toHaveBeenCalled();

    // Verify properties were reset
    expect((searchManager as any).searchInput).toBeNull();
    expect((searchManager as any).populationInput).toBeNull();
    expect((searchManager as any).containerRef).toBeNull();
    expect((searchManager as any).overlayPanel).toBeNull();
    expect((searchManager as any).isInitialized).toBe(false);
  });
});
