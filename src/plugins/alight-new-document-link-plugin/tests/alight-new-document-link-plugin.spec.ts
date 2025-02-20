// src/plugins/alight-new-document-link-plugin/tests/alight-new-document-link-plugin.spec.ts

import AlightNewDocumentLinkPlugin from '../alight-new-document-link-plugin';
import AlightNewDocumentLinkPluginUI from '../alight-new-document-link-plugin-ui';

describe('AlightNewDocumentLinkPlugin', () => {
  let plugin: AlightNewDocumentLinkPlugin;
  let editor: any;
  let mockDocument: any;
  let mockListenTo: jasmine.Spy;

  beforeEach(() => {
    // Create mock document
    mockDocument = {
      on: jasmine.createSpy('on'),
      fire: jasmine.createSpy('fire')
    };

    // Create mock editor
    editor = {
      editing: {
        view: {
          document: mockDocument
        }
      }
    };

    // Create spy for listenTo method
    mockListenTo = jasmine.createSpy('listenTo');

    // Initialize plugin with mocked dependencies
    plugin = new AlightNewDocumentLinkPlugin(editor);
    (plugin as any).listenTo = mockListenTo;
  });

  describe('static properties', () => {
    it('should define correct plugin name', () => {
      expect(AlightNewDocumentLinkPlugin.pluginName).toBe('AlightNewDocumentLinkPlugin');
    });

    it('should require AlightNewDocumentLinkPluginUI', () => {
      expect(AlightNewDocumentLinkPlugin.requires).toContain(AlightNewDocumentLinkPluginUI);
    });
  });

  describe('initialization', () => {
    it('should initialize event listeners', () => {
      plugin.init();

      expect(mockListenTo).toHaveBeenCalledWith(
        editor.editing.view.document,
        'newDocumentFormSubmit',
        jasmine.any(Function)
      );
    });

    it('should handle form submission events', () => {
      // Initialize plugin
      plugin.init();

      // Get the event handler function
      const eventHandler = mockListenTo.calls.mostRecent().args[2];

      // Create mock event data
      const mockEventData = {
        detail: {
          formData: {
            title: 'Test Document',
            content: 'Test Content'
          }
        }
      };

      // Create spy for console.log
      spyOn(console, 'log');

      // Call the event handler
      eventHandler(null, mockEventData);

      // Verify console.log was called with correct data
      expect(console.log).toHaveBeenCalledWith(
        'Form submitted with data:',
        mockEventData.detail.formData
      );
    });
  });

  describe('event handling', () => {
    beforeEach(() => {
      plugin.init();
    });

    it('should handle empty form data', () => {
      const eventHandler = mockListenTo.calls.mostRecent().args[2];
      const mockEventData = {
        detail: {
          formData: {}
        }
      };

      spyOn(console, 'log');
      eventHandler(null, mockEventData);

      expect(console.log).toHaveBeenCalledWith('Form submitted with data:', {});
    });

    it('should handle null form data', () => {
      const eventHandler = mockListenTo.calls.mostRecent().args[2];
      const mockEventData = {
        detail: {
          formData: null
        }
      };

      spyOn(console, 'log');
      eventHandler(null, mockEventData);

      expect(console.log).toHaveBeenCalledWith('Form submitted with data:', null);
    });

    it('should handle complex form data', () => {
      const eventHandler = mockListenTo.calls.mostRecent().args[2];
      const mockEventData = {
        detail: {
          formData: {
            title: 'Test Document',
            description: 'Test Description',
            files: ['file1.pdf', 'file2.doc'],
            metadata: {
              author: 'Test Author',
              date: '2024-02-19'
            }
          }
        }
      };

      spyOn(console, 'log');
      eventHandler(null, mockEventData);

      expect(console.log).toHaveBeenCalledWith(
        'Form submitted with data:',
        mockEventData.detail.formData
      );
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      plugin.init();
    });

    it('should handle event with missing detail property', () => {
      const eventHandler = mockListenTo.calls.mostRecent().args[2];
      const mockEventData = {};

      spyOn(console, 'log');
      eventHandler(null, mockEventData);

      expect(console.log).toHaveBeenCalledWith('Form submitted with data:', undefined);
    });

    it('should handle event with malformed data', () => {
      const eventHandler = mockListenTo.calls.mostRecent().args[2];
      const mockEventData = {
        detail: 'invalid data structure'
      };

      spyOn(console, 'log');
      eventHandler(null, mockEventData);

      expect(console.log).toHaveBeenCalledWith('Form submitted with data:', undefined);
    });
  });

  describe('plugin lifecycle', () => {
    it('should be able to initialize multiple times', () => {
      plugin.init();
      plugin.init();

      expect(mockListenTo).toHaveBeenCalledTimes(2);
    });

    it('should handle editor without view document', () => {
      // Create editor without view document
      editor.editing.view.document = undefined;

      expect(() => {
        plugin.init();
      }).not.toThrow();
    });
  });
});