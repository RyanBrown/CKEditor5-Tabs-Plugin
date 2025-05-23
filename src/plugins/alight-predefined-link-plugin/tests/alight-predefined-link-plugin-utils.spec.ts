// src/plugins/alight-predefined-link-plugin/tests/alight-predefined-link-plugin-utils.spec.ts
import AutomaticDecorators from '../utils/automaticdecorators';
import ManualDecorator from '../utils/manualdecorator';
import type { NormalizedLinkDecoratorAutomaticDefinition } from '../utils';
import type {
  DowncastAttributeEvent,
  DowncastDispatcher,
  ViewElement,
  Schema,
  Mapper,
  Writer,
  Range,
  ViewRange,
  Item
} from '@ckeditor/ckeditor5-engine';

// Define the ConsumableInterface type
interface ConsumableInterface {
  test(item: any, type: string): boolean;
  consume(item: any, type: string): void;
}

// Define the Writer interface with all required methods
interface WriterInterface {
  setAttribute(key: string, value: any, element: any): void;
  addClass(classes: string[], element: any): void;
  setStyle(property: string, value: string, element: any): void;
  setCustomProperty(key: string, value: any, element: any): void;
}

describe('AutomaticDecorators', () => {
  let automaticDecorators: AutomaticDecorators;
  let mockDispatcher: jasmine.SpyObj<DowncastDispatcher>;
  let mockWriter: jasmine.SpyObj<WriterInterface>;
  let mockSchema: jasmine.SpyObj<Schema>;
  let mockMapper: jasmine.SpyObj<Mapper>;
  let mockConsumable: jasmine.SpyObj<ConsumableInterface>;
  let mockViewElement: jasmine.SpyObj<ViewElement>;
  let mockViewRange: jasmine.SpyObj<ViewRange>;

  beforeEach(() => {
    automaticDecorators = new AutomaticDecorators();
    mockDispatcher = jasmine.createSpyObj('DowncastDispatcher', ['on']);
    mockWriter = jasmine.createSpyObj('Writer', [
      'setAttribute',
      'addClass',
      'setStyle',
      'setCustomProperty'
    ]) as jasmine.SpyObj<WriterInterface>;
    mockSchema = jasmine.createSpyObj('Schema', ['isInline']);
    mockMapper = jasmine.createSpyObj('Mapper', ['toViewRange']);
    mockConsumable = jasmine.createSpyObj('Consumable', ['test', 'consume']);

    // Create a more complete mock ViewElement
    const mockViewElementBase = {
      parent: {} as any,
      rootName: 'root',
      _index: 0,
      _startOffset: 0,
      startOffset: 0,
      endOffset: 0,
      _endOffset: 0,
      _parent: {} as any,
      _children: [] as any[],
      is: jasmine.createSpy('is')
    };
    mockViewElement = jasmine.createSpyObj('ViewElement', [], mockViewElementBase);

    mockViewRange = jasmine.createSpyObj('ViewRange', ['getItems']);
  });

  describe('length getter', () => {
    it('should return 0 when no decorators are added', () => {
      expect(automaticDecorators.length).toBe(0);
    });

    it('should return correct count when decorators are added', () => {
      const decorator: NormalizedLinkDecoratorAutomaticDefinition = {
        id: 'unique-decorator-id',
        mode: 'automatic',
        callback: () => true,
        attributes: { target: '_blank' }
      };

      automaticDecorators.add(decorator);
      expect(automaticDecorators.length).toBe(1);
    });
  });

  describe('add()', () => {
    it('should add a single decorator', () => {
      const decorator: NormalizedLinkDecoratorAutomaticDefinition = {
        id: 'unique-decorator-id',
        mode: 'automatic',
        callback: () => true,
        attributes: { target: '_blank' }
      };

      automaticDecorators.add(decorator);
      expect(automaticDecorators.length).toBe(1);
    });

    it('should add multiple decorators from an array', () => {
      const decorators: NormalizedLinkDecoratorAutomaticDefinition[] = [
        {
          id: 'decorator1',
          mode: 'automatic',
          callback: () => true,
          attributes: { target: '_blank' }
        },
        {
          id: 'decorator2',
          mode: 'automatic',
          callback: () => false,
          classes: ['external-link']
        }
      ];

      automaticDecorators.add(decorators);
      expect(automaticDecorators.length).toBe(2);
    });

    it('should not add duplicate decorators', () => {
      const decorator: NormalizedLinkDecoratorAutomaticDefinition = {
        id: 'unique-decorator-id',
        mode: 'automatic',
        callback: () => true,
        attributes: { target: '_blank' }
      };

      automaticDecorators.add(decorator);
      automaticDecorators.add(decorator); // Add same reference again
      expect(automaticDecorators.length).toBe(1);
    });
  });

  describe('getDispatcher()', () => {
    let eventHandler: (evt: DowncastAttributeEvent, data: any, conversionApi: any) => void;
    let mockEvent: DowncastAttributeEvent;
    let mockData: any;
    let mockConversionApi: any;

    beforeEach(() => {
      const dispatcher = automaticDecorators.getDispatcher();
      dispatcher(mockDispatcher);

      // Extract the event handler
      eventHandler = mockDispatcher.on.calls.argsFor(0)[1] as any;
      mockEvent = {} as DowncastAttributeEvent;
      mockData = {
        item: { is: jasmine.createSpy('is') },
        attributeNewValue: 'https://example.com',
        range: {}
      };
      mockConversionApi = {
        consumable: mockConsumable,
        schema: mockSchema,
        writer: mockWriter,
        mapper: mockMapper
      };
    });

    it('should return a dispatcher function', () => {
      const dispatcher = automaticDecorators.getDispatcher();
      expect(typeof dispatcher).toBe('function');
    });

    it('should register event handler when dispatcher is called', () => {
      const dispatcher = automaticDecorators.getDispatcher();
      dispatcher(mockDispatcher);

      expect(mockDispatcher.on).toHaveBeenCalledWith(
        'attribute:alightPredefinedLinkPluginHref',
        jasmine.any(Function),
        { priority: 'high' }
      );
    });

    it('should apply attributes to view elements', () => {
      const decorator: NormalizedLinkDecoratorAutomaticDefinition = {
        id: 'applyAttributesToViewElements',
        mode: 'automatic',
        callback: () => true,
        attributes: { target: '_blank', rel: 'noopener' }
      };
      automaticDecorators.add(decorator);

      mockConsumable.test.and.returnValue(true);
      mockData.item.is.and.returnValue(false);
      mockSchema.isInline.and.returnValue(true);
      mockMapper.toViewRange.and.returnValue(mockViewRange);
      mockViewElement.is.and.returnValue(true);
      mockViewRange.getItems.and.returnValue([mockViewElement]);

      eventHandler(mockEvent, mockData, mockConversionApi);

      expect(mockWriter.setAttribute).toHaveBeenCalledWith('target', '_blank', jasmine.anything());
      expect(mockWriter.setAttribute).toHaveBeenCalledWith('rel', 'noopener', jasmine.anything());
      expect(mockWriter.setCustomProperty).toHaveBeenCalledWith('alight-predefined-link', true, jasmine.anything());
      expect(mockConsumable.consume).toHaveBeenCalledWith(mockData.item, 'attribute:alightPredefinedLinkPluginHref');
    });

    it('should apply classes to view elements', () => {
      const decorator: NormalizedLinkDecoratorAutomaticDefinition = {
        id: 'applyClassesDecorator',
        mode: 'automatic',
        callback: () => true,
        classes: ['external', 'link']
      };
      automaticDecorators.add(decorator);

      mockConsumable.test.and.returnValue(true);
      mockData.item.is.and.returnValue(false);
      mockSchema.isInline.and.returnValue(true);
      mockMapper.toViewRange.and.returnValue(mockViewRange);
      mockViewElement.is.and.returnValue(true);
      mockViewRange.getItems.and.returnValue([mockViewElement]);

      eventHandler(mockEvent, mockData, mockConversionApi);

      expect(mockWriter.addClass).toHaveBeenCalledWith(['external', 'link'], jasmine.anything());
      expect(mockConsumable.consume).toHaveBeenCalledWith(mockData.item, 'attribute:alightPredefinedLinkPluginHref');
    });

    it('should apply styles to view elements', () => {
      const decorator: NormalizedLinkDecoratorAutomaticDefinition = {
        id: 'applyStylesDecorator',
        mode: 'automatic',
        callback: () => true,
        styles: { color: 'red', 'text-decoration': 'underline' }
      };
      automaticDecorators.add(decorator);

      mockConsumable.test.and.returnValue(true);
      mockData.item.is.and.returnValue(false);
      mockSchema.isInline.and.returnValue(true);
      mockMapper.toViewRange.and.returnValue(mockViewRange);
      mockViewElement.is.and.returnValue(true);
      mockViewRange.getItems.and.returnValue([mockViewElement]);

      eventHandler(mockEvent, mockData, mockConversionApi);

      expect(mockWriter.setStyle).toHaveBeenCalledWith('color', 'red', jasmine.anything());
      expect(mockWriter.setStyle).toHaveBeenCalledWith('text-decoration', 'underline', jasmine.anything());
      expect(mockConsumable.consume).toHaveBeenCalledWith(mockData.item, 'attribute:alightPredefinedLinkPluginHref');
    });

    it('should handle decorators that return false', () => {
      const decorator: NormalizedLinkDecoratorAutomaticDefinition = {
        id: 'falseReturningDecorator',
        mode: 'automatic',
        callback: () => false,
        attributes: { target: '_blank' }
      };
      automaticDecorators.add(decorator);

      mockConsumable.test.and.returnValue(true);
      mockData.item.is.and.returnValue(false);
      mockSchema.isInline.and.returnValue(true);

      eventHandler(mockEvent, mockData, mockConversionApi);

      expect(mockConsumable.consume).not.toHaveBeenCalled();
    });

    it('should handle null href value', () => {
      const decorator: NormalizedLinkDecoratorAutomaticDefinition = {
        id: 'nullHrefDecorator',
        mode: 'automatic',
        callback: (href) => href === null,
        attributes: { target: '_blank' }
      };
      automaticDecorators.add(decorator);

      mockConsumable.test.and.returnValue(true);
      mockData.item.is.and.returnValue(false);
      mockSchema.isInline.and.returnValue(true);
      mockData.attributeNewValue = null;
      mockMapper.toViewRange.and.returnValue(mockViewRange);
      mockViewElement.is.and.returnValue(true);
      mockViewRange.getItems.and.returnValue([mockViewElement]);

      eventHandler(mockEvent, mockData, mockConversionApi);

      expect(mockWriter.setAttribute).toHaveBeenCalled();
      expect(mockConsumable.consume).toHaveBeenCalledWith(mockData.item, 'attribute:alightPredefinedLinkPluginHref');
    });

    it('should handle errors during decoration application', () => {
      const decorator: NormalizedLinkDecoratorAutomaticDefinition = {
        id: 'errorHandlingDecorator',
        mode: 'automatic',
        callback: () => true,
        attributes: { target: '_blank' }
      };
      automaticDecorators.add(decorator);

      mockConsumable.test.and.returnValue(true);
      mockData.item.is.and.returnValue(false);
      mockSchema.isInline.and.returnValue(true);
      mockMapper.toViewRange.and.throwError('Mapping error');

      spyOn(console, 'error');

      eventHandler(mockEvent, mockData, mockConversionApi);

      expect(console.error).toHaveBeenCalledWith('Error applying automatic decorator:', jasmine.any(Error));
      expect(mockConsumable.consume).not.toHaveBeenCalled();
    });

    it('should not process if no range is provided', () => {
      const decorator: NormalizedLinkDecoratorAutomaticDefinition = {
        id: 'noRangeDecorator',
        mode: 'automatic',
        callback: () => true,
        attributes: { target: '_blank' }
      };
      automaticDecorators.add(decorator);

      mockConsumable.test.and.returnValue(true);
      mockData.item.is.and.returnValue(false);
      mockSchema.isInline.and.returnValue(true);
      mockData.range = undefined;

      eventHandler(mockEvent, mockData, mockConversionApi);

      expect(mockMapper.toViewRange).not.toHaveBeenCalled();
      expect(mockConsumable.consume).not.toHaveBeenCalled();
    });
  });
});

describe('ManualDecorator', () => {
  describe('constructor', () => {
    it('should initialize with all properties', () => {
      const config = {
        id: 'linkIsExternal',
        label: 'Open in new tab',
        attributes: { target: '_blank' },
        classes: ['external-link'],
        styles: { color: 'blue' },
        defaultValue: true,
        mode: 'manual' as const
      };

      const decorator = new ManualDecorator(config);

      expect(decorator.id).toBe('linkIsExternal');
      expect(decorator.label).toBe('Open in new tab');
      expect(decorator.attributes).toEqual({ target: '_blank' });
      expect(decorator.classes).toEqual(['external-link']);
      expect(decorator.styles).toEqual({ color: 'blue' });
      expect(decorator.defaultValue).toBe(true);
      expect(decorator.value).toBeUndefined();
    });

    it('should initialize with minimal properties', () => {
      const config = {
        id: 'linkMinimal',
        label: 'Minimal decorator',
        mode: 'manual' as const
      };

      const decorator = new ManualDecorator(config);

      expect(decorator.id).toBe('linkMinimal');
      expect(decorator.label).toBe('Minimal decorator');
      expect(decorator.attributes).toBeUndefined();
      expect(decorator.classes).toBeUndefined();
      expect(decorator.styles).toBeUndefined();
      expect(decorator.defaultValue).toBeUndefined();
      expect(decorator.value).toBeUndefined();
    });

    it('should allow setting value property', () => {
      const config = {
        id: 'linkTest',
        label: 'Test decorator',
        mode: 'manual' as const
      };

      const decorator = new ManualDecorator(config);
      decorator.value = true;

      expect(decorator.value).toBe(true);
    });
  });

  describe('_createPattern()', () => {
    it('should return pattern with all properties', () => {
      const config = {
        id: 'linkFull',
        label: 'Full decorator',
        attributes: { target: '_blank', rel: 'noopener' },
        classes: ['external', 'secure'],
        styles: { color: 'red', 'font-weight': 'bold' },
        mode: 'manual' as const
      };

      const decorator = new ManualDecorator(config);
      const pattern = decorator._createPattern();

      expect(pattern).toEqual({
        attributes: { target: '_blank', rel: 'noopener' },
        classes: ['external', 'secure'],
        styles: { color: 'red', 'font-weight': 'bold' }
      });
    });

    it('should return pattern with undefined properties', () => {
      const config = {
        id: 'linkEmpty',
        label: 'Empty decorator',
        mode: 'manual' as const
      };

      const decorator = new ManualDecorator(config);
      const pattern = decorator._createPattern();

      expect(pattern).toEqual({
        attributes: undefined,
        classes: undefined,
        styles: undefined
      });
    });

    it('should return pattern with partial properties', () => {
      const config = {
        id: 'linkPartial',
        label: 'Partial decorator',
        attributes: { target: '_self' },
        mode: 'manual' as const
      };

      const decorator = new ManualDecorator(config);
      const pattern = decorator._createPattern();

      expect(pattern).toEqual({
        attributes: { target: '_self' },
        classes: undefined,
        styles: undefined
      });
    });
  });

  describe('ObservableMixin', () => {
    it('should support observable value changes', () => {
      const config = {
        id: 'linkObservable',
        label: 'Observable decorator',
        mode: 'manual' as const
      };

      const decorator = new ManualDecorator(config);
      const spy = jasmine.createSpy('changeCallback');

      // Since ManualDecorator extends ObservableMixin, it should have observable capabilities
      (decorator as any).on('change:value', spy);

      decorator.value = true;

      expect(spy).toHaveBeenCalled();
    });
  });
});
