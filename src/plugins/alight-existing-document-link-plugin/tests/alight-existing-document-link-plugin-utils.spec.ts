// src/plugins/alight-existing-document-link-plugin/tests/alight-existing-document-link-plugin-utils.spec.ts
import AutomaticDecorators from '../utils/automaticdecorators';
import ManualDecorator from '../utils/manualdecorator';
import { DowncastDispatcher } from '@ckeditor/ckeditor5-engine';

describe('AutomaticDecorators', () => {
  let automaticDecorators: AutomaticDecorators;

  beforeEach(() => {
    automaticDecorators = new AutomaticDecorators();
  });

  describe('add()', () => {
    it('should add a single decorator definition', () => {
      // We need to pass a valid definition that matches the type expected by AutomaticDecorators
      automaticDecorators.add({
        id: 'test-decorator',
        mode: 'automatic',
        callback: (url: string | null) => url?.includes('example.com') ?? false,
        attributes: { target: '_blank', rel: 'noopener noreferrer' },
        classes: ['external-link'],
        styles: { color: 'blue' }
      } as any);

      expect(automaticDecorators.length).toBe(1);
    });

    it('should add multiple decorator definitions', () => {
      automaticDecorators.add([
        {
          id: 'example-decorator',
          mode: 'automatic',
          callback: (url: string | null) => url?.includes('example.com') ?? false,
          attributes: { target: '_blank' }
        },
        {
          id: 'test-decorator',
          mode: 'automatic',
          callback: (url: string | null) => url?.includes('test.com') ?? false,
          classes: ['test-link']
        }
      ] as any);

      expect(automaticDecorators.length).toBe(2);
    });
  });

  describe('length', () => {
    it('should return 0 for empty decorators', () => {
      expect(automaticDecorators.length).toBe(0);
    });

    it('should return the number of added decorators', () => {
      automaticDecorators.add({
        id: 'first-decorator',
        mode: 'automatic',
        callback: (url: string | null) => true,
        attributes: { target: '_blank' }
      } as any);

      automaticDecorators.add({
        id: 'second-decorator',
        mode: 'automatic',
        callback: (url: string | null) => true,
        classes: ['test']
      } as any);

      expect(automaticDecorators.length).toBe(2);
    });
  });

  describe('getDispatcher()', () => {
    let dispatcher: DowncastDispatcher;
    let dispatcherCallback: (dispatcher: DowncastDispatcher) => void;
    let mockEvent: any;
    let mockData: any;
    let mockConversionApi: any;

    beforeEach(() => {
      dispatcher = {
        on: jasmine.createSpy('on')
      } as unknown as DowncastDispatcher;

      dispatcherCallback = automaticDecorators.getDispatcher();
    });

    it('should return a function', () => {
      expect(typeof dispatcherCallback).toBe('function');
    });

    it('should register an event handler with the dispatcher', () => {
      // Act
      dispatcherCallback(dispatcher);

      // Assert
      expect(dispatcher.on).toHaveBeenCalledTimes(1);
      expect(dispatcher.on).toHaveBeenCalledWith(
        'attribute:alightPredefinedLinkPluginHref',
        jasmine.any(Function),
        { priority: 'high' }
      );
    });

    describe('Dispatcher event handling', () => {
      let eventCallback: Function;

      beforeEach(() => {
        // Setup mock dispatcher
        (dispatcher.on as jasmine.Spy).and.callFake((event, callback) => {
          eventCallback = callback;
        });

        // Add decorators for testing
        automaticDecorators.add({
          id: 'example-link',
          mode: 'automatic',
          callback: (url: string) => url === 'https://example.com',
          attributes: { target: '_blank' },
          classes: ['external-link'],
          styles: { color: 'blue' }
        } as any);

        // Setup dispatcher
        dispatcherCallback(dispatcher);

        // Setup mock event data
        mockEvent = {};
        mockData = {
          item: {
            is: jasmine.createSpy('is').and.returnValue(false),
            getAttribute: jasmine.createSpy('getAttribute')
          },
          attributeNewValue: 'https://example.com',
          range: {}
        };
        mockConversionApi = {
          consumable: {
            test: jasmine.createSpy('test').and.returnValue(true),
            consume: jasmine.createSpy('consume')
          },
          writer: {
            createAttributeElement: jasmine.createSpy('createAttributeElement').and.returnValue({}),
            addClass: jasmine.createSpy('addClass'),
            setStyle: jasmine.createSpy('setStyle'),
            setCustomProperty: jasmine.createSpy('setCustomProperty'),
            document: {
              selection: {}
            },
            setAttribute: jasmine.createSpy('setAttribute')
          },
          mapper: {
            toViewRange: jasmine.createSpy('toViewRange').and.returnValue({
              getItems: jasmine.createSpy('getItems').and.returnValue([])
            })
          },
          schema: {
            isInline: jasmine.createSpy('isInline').and.returnValue(true)
          }
        };
      });

      it('should return early if the attribute is already consumed', () => {
        // Arrange
        mockConversionApi.consumable.test.and.returnValue(false);

        // Act
        eventCallback(mockEvent, mockData, mockConversionApi);

        // Assert
        expect(mockConversionApi.consumable.consume).not.toHaveBeenCalled();
      });

      it('should return early if the item is not a selection and not inline', () => {
        // Arrange
        mockConversionApi.schema.isInline.and.returnValue(false);

        // Act
        eventCallback(mockEvent, mockData, mockConversionApi);

        // Assert
        expect(mockConversionApi.consumable.consume).not.toHaveBeenCalled();
      });

      it('should handle a selection when decorator callback returns true', () => {
        // Arrange
        mockData.item.is.and.callFake((type: string) => type === 'selection');

        // Act
        eventCallback(mockEvent, mockData, mockConversionApi);

        // Assert
        expect(mockConversionApi.writer.createAttributeElement).toHaveBeenCalledWith(
          'a',
          { target: '_blank' },
          { priority: 5 }
        );
        expect(mockConversionApi.writer.addClass).toHaveBeenCalledWith(['external-link'], jasmine.any(Object));
        expect(mockConversionApi.writer.setStyle).toHaveBeenCalledWith('color', 'blue', jasmine.any(Object));
        expect(mockConversionApi.writer.setCustomProperty).toHaveBeenCalledWith(
          'alight-predefined-link',
          true,
          jasmine.any(Object)
        );
        expect(mockConversionApi.consumable.consume).toHaveBeenCalledWith(
          mockData.item,
          'attribute:alightPredefinedLinkPluginHref'
        );
      });

      it('should handle non-selection items with view elements', () => {
        // Arrange - test the branch for non-selection items
        mockData.item.is.and.returnValue(false);

        // Create mock view elements to be returned from getItems
        const mockViewElement = {
          is: jasmine.createSpy('is').and.callFake((type) => type === 'element' || type === 'attributeElement')
        };

        // Setup view range to return our mock elements
        mockConversionApi.mapper.toViewRange.and.returnValue({
          getItems: jasmine.createSpy('getItems').and.returnValue([mockViewElement])
        });

        // Act
        eventCallback(mockEvent, mockData, mockConversionApi);

        // Assert
        expect(mockConversionApi.writer.setAttribute).toHaveBeenCalledWith(
          'target',
          '_blank',
          mockViewElement
        );
        expect(mockConversionApi.writer.addClass).toHaveBeenCalledWith(['external-link'], mockViewElement);
        expect(mockConversionApi.writer.setStyle).toHaveBeenCalledWith('color', 'blue', mockViewElement);
        expect(mockConversionApi.writer.setCustomProperty).toHaveBeenCalledWith(
          'alight-predefined-link',
          true,
          mockViewElement
        );
        expect(mockConversionApi.consumable.consume).toHaveBeenCalledWith(
          mockData.item,
          'attribute:alightPredefinedLinkPluginHref'
        );
      });

      it('should handle non-matching URL in decorator callback', () => {
        // Arrange
        mockData.item.is.and.callFake((type: string) => type === 'selection');
        mockData.attributeNewValue = 'https://non-matching-url.com';

        // Act
        eventCallback(mockEvent, mockData, mockConversionApi);

        // Assert - should not consume the attribute since no decorator matched
        expect(mockConversionApi.consumable.consume).not.toHaveBeenCalled();
      });

      it('should handle non-element items in the view range', () => {
        // Arrange - test the branch for non-selection items
        mockData.item.is.and.returnValue(false);

        // Create mock items that are not elements (text nodes, etc.)
        const mockTextNode = {
          is: jasmine.createSpy('is').and.returnValue(false)
        };

        // Setup view range to return our mock non-elements
        mockConversionApi.mapper.toViewRange.and.returnValue({
          getItems: jasmine.createSpy('getItems').and.returnValue([mockTextNode])
        });

        // Act
        eventCallback(mockEvent, mockData, mockConversionApi);

        // Assert - should not apply any attributes to non-elements
        expect(mockConversionApi.writer.setAttribute).not.toHaveBeenCalled();
        expect(mockConversionApi.writer.addClass).not.toHaveBeenCalled();
        expect(mockConversionApi.writer.setStyle).not.toHaveBeenCalled();
        expect(mockConversionApi.consumable.consume).not.toHaveBeenCalled();
      });

      it('should handle errors during decorator application', () => {
        // Arrange
        mockData.item.is.and.callFake((type: string) => type === 'selection');

        // Set up a method to throw an error
        mockConversionApi.writer.createAttributeElement.and.throwError(new Error('Test error'));

        // Spy on console.error
        spyOn(console, 'error');

        // Act
        eventCallback(mockEvent, mockData, mockConversionApi);

        // Assert
        expect(console.error).toHaveBeenCalledWith(
          'Error applying automatic decorator:',
          jasmine.any(Error)
        );
        // Verify that consumable.consume was not called because of the error
        expect(mockConversionApi.consumable.consume).not.toHaveBeenCalled();
      });

      it('should apply different decorator aspects based on availability', () => {
        // Arrange
        automaticDecorators.add({
          id: 'partial-decorator',
          mode: 'automatic',
          callback: (url: string) => url === 'https://example.com',
          // Only specify attributes, no classes or styles
          attributes: { rel: 'nofollow' }
        } as any);

        mockData.item.is.and.callFake((type: string) => type === 'selection');

        // Act
        eventCallback(mockEvent, mockData, mockConversionApi);

        // Assert - should only apply the attributes, not classes or styles for the second decorator
        expect(mockConversionApi.writer.createAttributeElement).toHaveBeenCalled();
        expect(mockConversionApi.writer.setCustomProperty).toHaveBeenCalled();
        expect(mockConversionApi.consumable.consume).toHaveBeenCalled();
      });

      it('should handle decorator with only styles, no classes or attributes', () => {
        // Reset the decorators
        automaticDecorators = new AutomaticDecorators();

        // Add a decorator with only styles
        automaticDecorators.add({
          id: 'styles-only-decorator',
          mode: 'automatic',
          callback: (url: string) => url === 'https://example.com',
          styles: { 'text-decoration': 'underline' }
        } as any);

        // Set up dispatcher again
        dispatcherCallback = automaticDecorators.getDispatcher();
        (dispatcher.on as jasmine.Spy).and.callFake((event, callback) => {
          eventCallback = callback;
        });
        dispatcherCallback(dispatcher);

        mockData.item.is.and.callFake((type: string) => type === 'selection');

        // Act
        eventCallback(mockEvent, mockData, mockConversionApi);

        // Assert - should only apply styles, not classes or attributes
        expect(mockConversionApi.writer.createAttributeElement).toHaveBeenCalledWith(
          'a',
          {}, // Empty attributes
          { priority: 5 }
        );
        expect(mockConversionApi.writer.setStyle).toHaveBeenCalledWith(
          'text-decoration',
          'underline',
          jasmine.any(Object)
        );
        expect(mockConversionApi.consumable.consume).toHaveBeenCalled();
      });

      it('should handle decorator with only classes, no styles or attributes', () => {
        // Reset the decorators
        automaticDecorators = new AutomaticDecorators();

        // Add a decorator with only classes
        automaticDecorators.add({
          id: 'classes-only-decorator',
          mode: 'automatic',
          callback: (url: string) => url === 'https://example.com',
          classes: ['highlight', 'special-link']
        } as any);

        // Set up dispatcher again
        dispatcherCallback = automaticDecorators.getDispatcher();
        (dispatcher.on as jasmine.Spy).and.callFake((event, callback) => {
          eventCallback = callback;
        });
        dispatcherCallback(dispatcher);

        mockData.item.is.and.callFake((type: string) => type === 'selection');

        // Act
        eventCallback(mockEvent, mockData, mockConversionApi);

        // Assert - should only apply classes, not styles or attributes
        expect(mockConversionApi.writer.createAttributeElement).toHaveBeenCalledWith(
          'a',
          {}, // Empty attributes
          { priority: 5 }
        );
        expect(mockConversionApi.writer.addClass).toHaveBeenCalledWith(
          ['highlight', 'special-link'],
          jasmine.any(Object)
        );
        expect(mockConversionApi.consumable.consume).toHaveBeenCalled();
      });
    });
  });
});

describe('ManualDecorator', () => {
  describe('constructor()', () => {
    it('should create a manual decorator with provided properties', () => {
      // Arrange
      const config = {
        mode: 'manual' as const,
        id: 'testDecorator',
        label: 'Test Decorator',
        attributes: { target: '_blank', rel: 'noopener noreferrer' },
        classes: ['test-class'],
        styles: { color: 'red' },
        defaultValue: true
      };

      // Act
      const decorator = new ManualDecorator(config);

      // Assert
      expect(decorator.id).toBe('testDecorator');
      expect(decorator.label).toBe('Test Decorator');
      expect(decorator.attributes).toEqual({ target: '_blank', rel: 'noopener noreferrer' });
      expect(decorator.classes).toEqual(['test-class']);
      expect(decorator.styles).toEqual({ color: 'red' });
      expect(decorator.defaultValue).toBe(true);
      expect(decorator.value).toBeUndefined();
    });

    it('should create a manual decorator with minimal properties', () => {
      // Arrange & Act
      const decorator = new ManualDecorator({
        mode: 'manual' as const,
        id: 'minimalDecorator',
        label: 'Minimal'
      });

      // Assert
      expect(decorator.id).toBe('minimalDecorator');
      expect(decorator.label).toBe('Minimal');
      expect(decorator.attributes).toBeUndefined();
      expect(decorator.classes).toBeUndefined();
      expect(decorator.styles).toBeUndefined();
      expect(decorator.defaultValue).toBeUndefined();
    });
  });

  describe('_createPattern()', () => {
    it('should create a pattern with all properties', () => {
      // Arrange
      const decorator = new ManualDecorator({
        mode: 'manual' as const,
        id: 'fullDecorator',
        label: 'Full Decorator',
        attributes: { target: '_blank', rel: 'noopener noreferrer' },
        classes: ['class1', 'class2'],
        styles: { color: 'blue', 'font-weight': 'bold' }
      });

      // Act
      const pattern = decorator._createPattern();

      // Use type assertion to work around TypeScript errors
      const attributes = pattern.attributes as any;

      // Assert using type assertion
      expect(attributes).toBeDefined();
      expect(attributes.target).toBe('_blank');
      expect(attributes.rel).toBe('noopener noreferrer');
      expect(attributes.class).toBe('class1 class2');
      expect(pattern.styles).toEqual({ color: 'blue', 'font-weight': 'bold' });
    });

    it('should create a pattern with only attributes', () => {
      // Arrange
      const decorator = new ManualDecorator({
        mode: 'manual' as const,
        id: 'attrDecorator',
        label: 'Attr Decorator',
        attributes: { target: '_blank' }
      });

      // Act
      const pattern = decorator._createPattern();

      // Use type assertion
      const attributes = pattern.attributes as any;

      // Assert
      expect(attributes).toBeDefined();
      expect(attributes.target).toBe('_blank');
      expect(attributes.class).toBeUndefined();
      expect(pattern.styles).toBeUndefined();
    });

    it('should create a pattern with only styles', () => {
      // Arrange
      const decorator = new ManualDecorator({
        mode: 'manual' as const,
        id: 'styleDecorator',
        label: 'Style Decorator',
        styles: { color: 'red' }
      });

      // Act
      const pattern = decorator._createPattern();

      // Assert
      expect(pattern.attributes).toBeUndefined();
      expect(pattern.styles).toEqual({ color: 'red' });
    });

    it('should handle a single class string', () => {
      // Arrange
      const decorator = new ManualDecorator({
        mode: 'manual' as const,
        id: 'singleClassDecorator',
        label: 'Single Class',
        attributes: {},
        classes: 'single-class' as any
      });

      // Act
      const pattern = decorator._createPattern();

      // Use type assertion
      const attributes = pattern.attributes as any;

      // Assert
      expect(attributes).toBeDefined();
      expect(attributes.class).toBe('single-class');
    });

    it('should create an empty pattern without attributes or styles', () => {
      // Arrange
      const decorator = new ManualDecorator({
        mode: 'manual' as const,
        id: 'emptyDecorator',
        label: 'Empty'
      });

      // Act
      const pattern = decorator._createPattern();

      // Assert
      expect(pattern).toEqual({});
    });
  });

  describe('observable properties', () => {
    it('should set and get value property', () => {
      // Arrange
      const decorator = new ManualDecorator({
        mode: 'manual' as const,
        id: 'testDecorator',
        label: 'Test'
      });

      const changeSpy = jasmine.createSpy('change');
      decorator.on('change:value', changeSpy);

      // Act
      decorator.set('value', true);

      // Assert
      expect(decorator.value).toBe(true);
      expect(changeSpy).toHaveBeenCalled();
    });
  });
});
