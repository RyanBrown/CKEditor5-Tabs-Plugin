// src/plugins/alight-existing-document-link-plugin/tests/alight-existing-document-link-plugin-ui.spec.ts
import { FocusTracker, KeystrokeHandler } from 'ckeditor5/src/utils';
import { ButtonView, View } from 'ckeditor5/src/ui';

import LinkActionsView from '../ui/linkactionsview';
import { ContentManager } from '../ui/linkmodal-ContentManager';
import { PaginationManager } from '../ui/linkmodal-PaginationManager';
import { SearchManager } from '../ui/linkmodal-SearchManager';
import { DocumentLink } from '../ui/linkmodal-modal-types';

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
});

describe('ContentManager', () => {
  let contentManager: ContentManager;
  let mockDocumentLinks: DocumentLink[];

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
      }
    ];

    contentManager = new ContentManager('', mockDocumentLinks);
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
});

describe('PaginationManager', () => {
  let paginationManager: PaginationManager;
  let onPageChangeSpy: jasmine.Spy;

  beforeEach(() => {
    onPageChangeSpy = jasmine.createSpy('onPageChange');
    paginationManager = new PaginationManager(onPageChangeSpy, 10);
  });

  afterEach(() => {
    paginationManager.destroy();
  });

  it('should initialize with default values', () => {
    expect(paginationManager.getCurrentPage()).toBe(1);
    expect(paginationManager.getPageSize()).toBe(10);
    expect(paginationManager.getTotalPages()).toBe(1);
  });

  it('should calculate total pages correctly', () => {
    // We can't directly test private methods, so we'll test the behavior
    // indirectly by checking the getTotalPages result after initialize

    // Mock container element - not actually used in this test
    const mockContainer = document.createElement('div');

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
    const mockContainer = document.createElement('div');
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
});

describe('SearchManager', () => {
  let searchManager: SearchManager;
  let mockDocumentLinks: DocumentLink[];
  let onSearchSpy: jasmine.Spy;
  let mockPaginationManager: any;

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

    onSearchSpy = jasmine.createSpy('onSearch');
    mockPaginationManager = {
      setPage: jasmine.createSpy('setPage')
    };

    searchManager = new SearchManager(
      mockDocumentLinks,
      onSearchSpy,
      mockPaginationManager as any
    );
  });

  afterEach(() => {
    searchManager.destroy();
  });

  it('should initialize with empty search query', () => {
    expect(searchManager.getCurrentSearchQuery()).toBe('');
  });

  // Testing basic filter functionality without DOM manipulation
  it('should filter documents based on search criteria', () => {
    // Access private method through any casting for testing
    const filterMethod = (searchManager as any).updateFilteredData.bind(searchManager);

    // Test title filter
    (searchManager as any).currentSearchQuery = 'Document 1';
    filterMethod();

    expect(mockPaginationManager.setPage).toHaveBeenCalledWith(1, jasmine.any(Number));
    expect(onSearchSpy).toHaveBeenCalled();

    // Get the argument passed to onSearch
    const filteredData = onSearchSpy.calls.mostRecent().args[0];
    expect(filteredData.length).toBe(1);
    expect(filteredData[0].title).toBe('Document 1');

    // Reset spies
    onSearchSpy.calls.reset();
    mockPaginationManager.setPage.calls.reset();

    // Test description filter
    (searchManager as any).currentSearchQuery = 'third';
    filterMethod();

    const filteredByDesc = onSearchSpy.calls.mostRecent().args[0];
    expect(filteredByDesc.length).toBe(1);
    expect(filteredByDesc[0].title).toBe('Document 3');
  });

  it('should provide a reset method that clears search state', () => {
    // Set some search state first
    (searchManager as any).currentSearchQuery = 'test';
    (searchManager as any).selectedFilters = {
      fileType: ['pdf'],
      population: ['General'],
      locale: ['en-US']
    };

    // Spy on the update method
    spyOn((searchManager as any), 'updateFilteredData');

    // Call reset
    searchManager.reset();

    // Check if state was reset
    expect(searchManager.getCurrentSearchQuery()).toBe('');
    expect((searchManager as any).selectedFilters.fileType).toEqual([]);
    expect((searchManager as any).selectedFilters.population).toEqual([]);
    expect((searchManager as any).selectedFilters.locale).toEqual([]);

    // Check if filtered data was updated
    expect((searchManager as any).updateFilteredData).toHaveBeenCalled();
  });
});
