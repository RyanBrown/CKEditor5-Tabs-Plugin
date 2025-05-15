// src/plugins/alight-email-link-plugin/tests/alight-email-link-plugin-utils.spec.ts
import AutomaticDecorators from './../utils/automaticdecorators';
import ManualDecorator from './../utils/manualdecorator';
import type { DowncastAttributeEvent, DowncastDispatcher } from '@ckeditor/ckeditor5-engine';
import type { NormalizedLinkDecoratorAutomaticDefinition, NormalizedLinkDecoratorManualDefinition } from '../utils';

describe('AutomaticDecorators', () => {
  let automaticDecorators: AutomaticDecorators;

  beforeEach(() => {
    automaticDecorators = new AutomaticDecorators();
  });

  describe('constructor()', () => {
    it('should create instance with empty definitions', () => {
      expect(automaticDecorators).toBeDefined();
      expect(automaticDecorators.length).toBe(0);
    });
  });

  describe('add()', () => {
    it('should add a single decorator', () => {
      const definition: NormalizedLinkDecoratorAutomaticDefinition = {
        id: 'test-decorator-1',
        mode: 'automatic',
        callback: () => true,
        attributes: { 'data-test': 'test-value' }
      };

      automaticDecorators.add(definition);

      expect(automaticDecorators.length).toBe(1);
    });

    it('should add multiple decorators from an array', () => {
      const definitions: NormalizedLinkDecoratorAutomaticDefinition[] = [
        {
          id: 'test-decorator-2',
          mode: 'automatic',
          callback: () => true,
          attributes: { 'data-test-1': 'test-value-1' }
        },
        {
          id: 'test-decorator-3',
          mode: 'automatic',
          callback: () => false,
          attributes: { 'data-test-2': 'test-value-2' }
        }
      ];

      automaticDecorators.add(definitions);

      expect(automaticDecorators.length).toBe(2);
    });
  });

  describe('length', () => {
    it('should return the number of decorators', () => {
      expect(automaticDecorators.length).toBe(0);

      automaticDecorators.add({
        id: 'test-decorator-4',
        mode: 'automatic',
        callback: () => true,
        attributes: { 'data-test': 'test' }
      });

      expect(automaticDecorators.length).toBe(1);

      automaticDecorators.add([
        {
          id: 'test-decorator-5',
          mode: 'automatic',
          callback: () => true,
          attributes: { 'data-test-2': 'test-2' }
        },
        {
          id: 'test-decorator-6',
          mode: 'automatic',
          callback: () => true,
          attributes: { 'data-test-3': 'test-3' }
        }
      ]);

      expect(automaticDecorators.length).toBe(3);
    });
  });

  describe('getDispatcher()', () => {
    it('should return a function', () => {
      const dispatcher = automaticDecorators.getDispatcher();

      expect(typeof dispatcher).toBe('function');
    });

    describe('dispatcher', () => {
      let dispatcherCallback: (dispatcher: DowncastDispatcher) => void;
      let dispatcher: any;
      let eventCallbacks: Map<string, Function[]>;

      beforeEach(() => {
        eventCallbacks = new Map();

        dispatcher = {
          on: jasmine.createSpy('on').and.callFake((eventName, callback, options) => {
            if (!eventCallbacks.has(eventName)) {
              eventCallbacks.set(eventName, []);
            }
            eventCallbacks.get(eventName)!.push(callback);
            return { priority: options?.priority };
          })
        };

        dispatcherCallback = automaticDecorators.getDispatcher();
      });

      it('should register attribute:alightEmailLinkPluginHref event handler with high priority', () => {
        dispatcherCallback(dispatcher as any);

        expect(dispatcher.on).toHaveBeenCalledWith(
          'attribute:alightEmailLinkPluginHref',
          jasmine.any(Function),
          { priority: 'high' }
        );
      });

      describe('attribute:alightEmailLinkPluginHref event handler', () => {
        let eventCallback: Function;
        let data: any;
        let conversionApi: any;

        beforeEach(() => {
          dispatcherCallback(dispatcher as any);
          eventCallback = eventCallbacks.get('attribute:alightEmailLinkPluginHref')![0];

          automaticDecorators.add({
            id: 'test-decorator-7',
            mode: 'automatic',
            callback: (url) => url === 'https://example.com',
            attributes: { 'data-test': 'test-value' },
            classes: ['test-class'],
            styles: { color: 'red' }
          });

          data = {
            item: {
              is: (type: string) => type === '$text',
              hasAttribute: jasmine.createSpy('hasAttribute').and.callFake((attr) => attr === 'alightEmailLinkPluginOrgName'),
              getAttribute: jasmine.createSpy('getAttribute').and.returnValue('Test Org'),
              data: 'Test text (Test Org)'
            },
            attributeNewValue: 'https://example.com',
            range: { /* mock range */ }
          };

          conversionApi = {
            consumable: {
              test: jasmine.createSpy('test').and.returnValue(true)
            },
            schema: {
              isInline: jasmine.createSpy('isInline').and.returnValue(true)
            },
            writer: {
              document: {
                selection: { getFirstRange: jasmine.createSpy('getFirstRange').and.returnValue({}) }
              },
              createAttributeElement: jasmine.createSpy('createAttributeElement').and.returnValue({}),
              addClass: jasmine.createSpy('addClass'),
              setStyle: jasmine.createSpy('setStyle'),
              setCustomProperty: jasmine.createSpy('setCustomProperty'),
              wrap: jasmine.createSpy('wrap'),
              unwrap: jasmine.createSpy('unwrap')
            },
            mapper: {
              toViewRange: jasmine.createSpy('toViewRange').and.callFake((range) => range)
            }
          };
        });

        it('should return early if item cannot be consumed', () => {
          conversionApi.consumable.test.and.returnValue(false);

          eventCallback({} as DowncastAttributeEvent, data, conversionApi);

          expect(conversionApi.writer.createAttributeElement).not.toHaveBeenCalled();
        });

        it('should return early if item is not selection and not inline', () => {
          conversionApi.schema.isInline.and.returnValue(false);
          data.item.is = (type: string) => type !== 'selection';

          eventCallback({} as DowncastAttributeEvent, data, conversionApi);

          expect(conversionApi.writer.createAttributeElement).not.toHaveBeenCalled();
        });

        it('should wrap view range with attribute element when callback returns true', () => {
          eventCallback({} as DowncastAttributeEvent, data, conversionApi);

          expect(conversionApi.writer.createAttributeElement).toHaveBeenCalledWith(
            'a',
            jasmine.objectContaining({
              'data-test': 'test-value',
              'data-id': 'email_link',
              'orgnameattr': 'Test Org'
            }),
            { priority: 5 }
          );

          expect(conversionApi.writer.addClass).toHaveBeenCalledWith(['test-class'], jasmine.anything());
          expect(conversionApi.writer.setStyle).toHaveBeenCalledWith('color', 'red', jasmine.anything());
          expect(conversionApi.writer.setCustomProperty).toHaveBeenCalledWith('alight-email-link', true, jasmine.anything());
          expect(conversionApi.writer.wrap).toHaveBeenCalledWith(data.range, jasmine.anything());
        });

        it('should unwrap view range when callback returns false', () => {
          data.attributeNewValue = 'https://different-url.com';

          eventCallback({} as DowncastAttributeEvent, data, conversionApi);

          expect(conversionApi.writer.unwrap).toHaveBeenCalled();
        });

        it('should wrap selection range when item is selection', () => {
          data.item = {
            is: (type: string) => type === 'selection',
          };

          eventCallback({} as DowncastAttributeEvent, data, conversionApi);

          expect(conversionApi.writer.wrap).toHaveBeenCalledWith(
            jasmine.anything(),
            jasmine.anything()
          );
        });

        it('should extract organization name from text content when no attribute is present', () => {
          data.item = {
            is: (type: string) => type === '$text',
            hasAttribute: jasmine.createSpy('hasAttribute').and.returnValue(false),
            data: 'Link text (Organization Name)'
          };

          eventCallback({} as DowncastAttributeEvent, data, conversionApi);

          expect(conversionApi.writer.createAttributeElement).toHaveBeenCalledWith(
            'a',
            jasmine.objectContaining({
              'orgnameattr': 'Organization Name'
            }),
            jasmine.anything()
          );
        });
      });
    });
  });
});

describe('ManualDecorator', () => {
  describe('constructor()', () => {
    it('should create instance with provided properties', () => {
      const decoratorConfig: NormalizedLinkDecoratorManualDefinition = {
        id: 'testDecorator',
        mode: 'manual',
        label: 'Test Decorator',
        attributes: { 'data-decorator': 'test' },
        classes: ['decorator-class'],
        styles: { color: 'blue' },
        defaultValue: true
      };

      const decorator = new ManualDecorator(decoratorConfig);

      expect(decorator).toBeDefined();
      expect(decorator.id).toBe('testDecorator');
      expect(decorator.label).toBe('Test Decorator');
      expect(decorator.attributes).toEqual({ 'data-decorator': 'test' });
      expect(decorator.classes).toEqual(['decorator-class']);
      expect(decorator.styles).toEqual({ color: 'blue' });
      expect(decorator.defaultValue).toBe(true);
      expect(decorator.value).toBeUndefined();
    });

    it('should create instance with minimal properties', () => {
      const decoratorConfig: NormalizedLinkDecoratorManualDefinition = {
        id: 'minimalDecorator',
        mode: 'manual',
        label: 'Minimal Decorator'
      };

      const decorator = new ManualDecorator(decoratorConfig);

      expect(decorator).toBeDefined();
      expect(decorator.id).toBe('minimalDecorator');
      expect(decorator.label).toBe('Minimal Decorator');
      expect(decorator.attributes).toBeUndefined();
      expect(decorator.classes).toBeUndefined();
      expect(decorator.styles).toBeUndefined();
      expect(decorator.defaultValue).toBeUndefined();
      expect(decorator.value).toBeUndefined();
    });
  });

  describe('_createPattern()', () => {
    it('should create matcher pattern with all properties', () => {
      const decorator = new ManualDecorator({
        id: 'testDecorator',
        mode: 'manual',
        label: 'Test Decorator',
        attributes: { 'data-decorator': 'test' },
        classes: ['decorator-class'],
        styles: { color: 'blue' }
      });

      const pattern = decorator._createPattern();

      expect(pattern).toEqual({
        attributes: { 'data-decorator': 'test' },
        classes: ['decorator-class'],
        styles: { color: 'blue' }
      });
    });

    it('should create matcher pattern with only defined properties', () => {
      const decorator = new ManualDecorator({
        id: 'partialDecorator',
        mode: 'manual',
        label: 'Partial Decorator',
        classes: ['decorator-class']
      });

      const pattern = decorator._createPattern();

      expect(pattern).toEqual({
        attributes: undefined,
        classes: ['decorator-class'],
        styles: undefined
      });
    });
  });

  describe('value property', () => {
    it('should be observable', () => {
      const decorator = new ManualDecorator({
        id: 'testDecorator',
        mode: 'manual',
        label: 'Test Decorator'
      });

      const spy = jasmine.createSpy('changeValue');
      decorator.on('change:value', spy);

      decorator.value = true;

      expect(spy).toHaveBeenCalled();
      expect(decorator.value).toBe(true);
    });
  });
});
