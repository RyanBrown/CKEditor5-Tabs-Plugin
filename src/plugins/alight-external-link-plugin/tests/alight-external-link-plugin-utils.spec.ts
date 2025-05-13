// // src/plugins/alight-external-link-plugin/tests/alight-external-link-plugin-utils.spec.ts
// import AutomaticDecorators from '../utils/automaticdecorators';
// import ManualDecorator from '../utils/manualdecorator';
// import { DowncastDispatcher, AttributeElement } from '@ckeditor/ckeditor5-engine';

// describe('AutomaticDecorators', () => {
//   let automaticDecorators: AutomaticDecorators;
//   let dispatcher: DowncastDispatcher;
//   let mockEvt: any;
//   let mockData: any;
//   let mockConversionApi: any;
//   let mockViewWriter: any;
//   let mockViewSelection: any;
//   let mockViewRange: any;
//   let mockMapperRange: any;

//   beforeEach(() => {
//     automaticDecorators = new AutomaticDecorators();

//     // Mock dispatcher
//     dispatcher = {
//       on: jasmine.createSpy('on').and.callFake(() => { })
//     } as any;

//     // Mock view writer and related objects
//     mockViewRange = { id: 'viewRange' };
//     mockMapperRange = { id: 'mapperRange' };
//     mockViewSelection = {
//       getFirstRange: jasmine.createSpy('getFirstRange').and.returnValue(mockViewRange)
//     };

//     mockViewWriter = {
//       document: {
//         selection: mockViewSelection
//       },
//       createAttributeElement: jasmine.createSpy('createAttributeElement').and.returnValue({
//         name: 'a',
//         id: 'mockElement'
//       }),
//       addClass: jasmine.createSpy('addClass'),
//       setStyle: jasmine.createSpy('setStyle'),
//       setCustomProperty: jasmine.createSpy('setCustomProperty'),
//       wrap: jasmine.createSpy('wrap'),
//       unwrap: jasmine.createSpy('unwrap')
//     };

//     // Mock conversion API
//     mockConversionApi = {
//       consumable: {
//         test: jasmine.createSpy('test').and.returnValue(true)
//       },
//       schema: {
//         isInline: jasmine.createSpy('isInline').and.returnValue(true)
//       },
//       writer: mockViewWriter,
//       mapper: {
//         toViewRange: jasmine.createSpy('toViewRange').and.returnValue(mockViewRange)
//       }
//     };

//     // Mock event data
//     mockData = {
//       item: {
//         is: jasmine.createSpy('is').and.callFake((type: string) => type === '$text'),
//         hasAttribute: jasmine.createSpy('hasAttribute').and.returnValue(false),
//         getAttribute: jasmine.createSpy('getAttribute').and.returnValue('Organization Name'),
//         data: 'Link text (Organization Name)'
//       },
//       attributeNewValue: 'https://example.com',
//       range: {
//         id: 'dataRange'
//       }
//     };

//     mockEvt = {
//       stop: jasmine.createSpy('stop')
//     };
//   });

//   describe('add', () => {
//     it('should add a single definition', () => {
//       const definition = {
//         id: 'test',
//         attributes: { target: '_blank' },
//         classes: ['external-link'],
//         styles: { color: 'blue' },
//         callback: (href: string | null) => !!href && href.startsWith('http')
//       };

//       automaticDecorators.add(definition);
//       expect(automaticDecorators.length).toBe(1);
//     });

//     it('should add an array of definitions', () => {
//       const definitions = [
//         {
//           id: 'test1',
//           attributes: { target: '_blank' },
//           classes: ['external-link'],
//           styles: { color: 'blue' },
//           callback: (href: string | null) => !!href && href.startsWith('http')
//         },
//         {
//           id: 'test2',
//           attributes: { rel: 'noopener' },
//           classes: ['secure-link'],
//           styles: { fontWeight: 'bold' },
//           callback: (href: string | null) => !!href && href.includes('secure')
//         }
//       ];

//       automaticDecorators.add(definitions);
//       expect(automaticDecorators.length).toBe(2);
//     });
//   });

//   describe('length', () => {
//     it('should return the number of definitions', () => {
//       expect(automaticDecorators.length).toBe(0);

//       automaticDecorators.add({
//         id: 'test',
//         attributes: { target: '_blank' },
//         classes: ['external-link'],
//         styles: { color: 'blue' },
//         callback: (href: string | null) => !!href && href.startsWith('http')
//       });

//       expect(automaticDecorators.length).toBe(1);
//     });
//   });

//   describe('getDispatcher', () => {
//     it('should return a function', () => {
//       const dispatcherFn = automaticDecorators.getDispatcher();
//       expect(typeof dispatcherFn).toBe('function');
//     });

//     it('should register an event listener on the dispatcher', () => {
//       const dispatcherFn = automaticDecorators.getDispatcher();
//       dispatcherFn(dispatcher);

//       expect(dispatcher.on).toHaveBeenCalledWith(
//         'attribute:alightExternalLinkHref',
//         jasmine.any(Function),
//         { priority: 'high' }
//       );
//     });

//     describe('event handler', () => {
//       let eventHandler: Function;

//       beforeEach(() => {
//         const dispatcherFn = automaticDecorators.getDispatcher();
//         dispatcherFn(dispatcher);
//         // Get the callback function that was passed to dispatcher.on
//         eventHandler = (dispatcher.on as jasmine.Spy).calls.mostRecent().args[1];

//         // Add a test definition
//         automaticDecorators.add({
//           id: 'testDecorator',
//           attributes: { target: '_blank' },
//           classes: ['external-link'],
//           styles: { color: 'blue' },
//           callback: (href: string | null) => !!href && href.startsWith('http')
//         });
//       });

//       it('should return early if consumable test fails', () => {
//         mockConversionApi.consumable.test.and.returnValue(false);

//         eventHandler(mockEvt, mockData, mockConversionApi);

//         expect(mockViewWriter.createAttributeElement).not.toHaveBeenCalled();
//       });

//       it('should return early if item is not selection and not inline', () => {
//         mockConversionApi.schema.isInline.and.returnValue(false);
//         mockData.item.is.and.callFake((type: string) => type !== 'selection');

//         eventHandler(mockEvt, mockData, mockConversionApi);

//         expect(mockViewWriter.createAttributeElement).not.toHaveBeenCalled();
//       });

//       it('should process $text with alightExternalLinkPluginOrgName attribute', () => {
//         mockData.item.hasAttribute.and.callFake((attr: string) => attr === 'alightExternalLinkPluginOrgName');

//         eventHandler(mockEvt, mockData, mockConversionApi);

//         expect(mockViewWriter.createAttributeElement).toHaveBeenCalledWith(
//           'a',
//           jasmine.objectContaining({
//             'target': '_blank',
//             'data-id': 'external_link',
//             'orgnameattr': 'Organization Name'
//           }),
//           { priority: 5 }
//         );
//         expect(mockViewWriter.addClass).toHaveBeenCalledWith(['external-link'], jasmine.any(Object));
//         expect(mockViewWriter.setStyle).toHaveBeenCalledWith('color', 'blue', jasmine.any(Object));
//         expect(mockViewWriter.setCustomProperty).toHaveBeenCalledWith('alight-external-link', true, jasmine.any(Object));
//         expect(mockViewWriter.wrap).toHaveBeenCalledWith(mockViewRange, jasmine.any(Object));
//       });

//       it('should extract org name from text content when no attribute present', () => {
//         mockData.item.data = 'Link text (Extracted Org)';

//         eventHandler(mockEvt, mockData, mockConversionApi);

//         expect(mockViewWriter.createAttributeElement).toHaveBeenCalledWith(
//           'a',
//           jasmine.objectContaining({
//             'orgnameattr': 'Extracted Org'
//           }),
//           { priority: 5 }
//         );
//       });

//       it('should not set orgnameattr if org name cannot be extracted', () => {
//         mockData.item.data = 'Link text without org name';

//         eventHandler(mockEvt, mockData, mockConversionApi);

//         expect(mockViewWriter.createAttributeElement).toHaveBeenCalledWith(
//           'a',
//           jasmine.objectContaining({
//             'target': '_blank',
//             'data-id': 'external_link'
//           }),
//           { priority: 5 }
//         );
//         expect(mockViewWriter.createAttributeElement.calls.mostRecent().args[1].orgnameattr).toBeUndefined();
//       });

//       // it('should unwrap when callback returns false', () => {
//       //   // Need to properly set up the mocking because we're creating a new instance
//       //   const localDispatcher = {
//       //     on: jasmine.createSpy('on').and.callFake(() => { })
//       //   } as any;

//       //   automaticDecorators = new AutomaticDecorators();
//       //   automaticDecorators.add({
//       //     id: 'testDecorator',
//       //     attributes: { target: '_blank' },
//       //     classes: ['external-link'],
//       //     styles: { color: 'blue' },
//       //     callback: () => false
//       //   });

//       //   // Get and execute the dispatcher function
//       //   const dispatcherFn = automaticDecorators.getDispatcher();
//       //   dispatcherFn(localDispatcher);

//       //   // Get the event handler that was registered
//       //   const localEventHandler = (localDispatcher.on as jasmine.Spy).calls.mostRecent().args[1];

//       //   // Make sure the viewWriter.createAttributeElement returns a value we can track
//       //   const mockElement = {
//       //     name: 'a',
//       //     id: 'mockElement'
//       //   };
//       //   mockViewWriter.createAttributeElement.and.returnValue(mockElement);

//       //   // Call the event handler
//       //   localEventHandler(mockEvt, mockData, mockConversionApi);

//       //   // Verify unwrap was called with the view range and the element
//       //   expect(mockViewWriter.unwrap).toHaveBeenCalledWith(mockViewRange, mockElement);
//       // });

//       it('should handle selection items', () => {
//         mockData.item.is.and.callFake((type: string) => type === 'selection');

//         eventHandler(mockEvt, mockData, mockConversionApi);

//         expect(mockViewSelection.getFirstRange).toHaveBeenCalled();
//         expect(mockViewWriter.wrap).toHaveBeenCalledWith(mockViewRange, jasmine.any(Object));
//       });
//     });
//   });
// });

// describe('ManualDecorator', () => {
//   describe('constructor', () => {
//     it('should initialize with provided values', () => {
//       const config = {
//         id: 'testDecorator',
//         label: 'Test Decorator',
//         attributes: { rel: 'nofollow' },
//         classes: ['test-class'],
//         styles: { color: 'red' },
//         defaultValue: true
//       };

//       const decorator = new ManualDecorator(config);

//       expect(decorator.id).toBe('testDecorator');
//       expect(decorator.label).toBe('Test Decorator');
//       expect(decorator.attributes).toEqual({ rel: 'nofollow' });
//       expect(decorator.classes).toEqual(['test-class']);
//       expect(decorator.styles).toEqual({ color: 'red' });
//       expect(decorator.defaultValue).toBe(true);
//       expect(decorator.value).toBeUndefined();
//     });

//     it('should initialize with minimal config', () => {
//       const config = {
//         id: 'minimalDecorator',
//         label: 'Minimal'
//       };

//       const decorator = new ManualDecorator(config);

//       expect(decorator.id).toBe('minimalDecorator');
//       expect(decorator.label).toBe('Minimal');
//       expect(decorator.attributes).toBeUndefined();
//       expect(decorator.classes).toBeUndefined();
//       expect(decorator.styles).toBeUndefined();
//       expect(decorator.defaultValue).toBeUndefined();
//     });
//   });

//   // describe('_createPattern', () => {
//   //   it('should create pattern with all properties', () => {
//   //     const decorator = new ManualDecorator({
//   //       id: 'testDecorator',
//   //       label: 'Test Decorator',
//   //       attributes: { rel: 'nofollow' },
//   //       classes: ['test-class'],
//   //       styles: { color: 'red' }
//   //     });

//   //     const pattern = decorator._createPattern();

//   //     expect(pattern).toEqual({
//   //       attributes: { rel: 'nofollow' },
//   //       classes: ['test-class'],
//   //       styles: { color: 'red' }
//   //     });
//   //   });

//   //   it('should create pattern with partial properties', () => {
//   //     const decorator = new ManualDecorator({
//   //       id: 'testDecorator',
//   //       label: 'Test Decorator',
//   //       attributes: { rel: 'nofollow' }
//   //     });

//   //     const pattern = decorator._createPattern();

//   //     expect(pattern).toEqual({
//   //       attributes: { rel: 'nofollow' },
//   //       classes: undefined,
//   //       styles: undefined
//   //     });
//   //   });
//   // });

//   // describe('observable properties', () => {
//   //   it('should be observable', () => {
//   //     const decorator = new ManualDecorator({
//   //       id: 'testDecorator',
//   //       label: 'Test Decorator'
//   //     });

//   //     const spy = jasmine.createSpy('valueSpy');
//   //     decorator.on('change:value', spy);

//   //     decorator.value = true;

//   //     expect(spy).toHaveBeenCalled();
//   //     expect(decorator.value).toBe(true);
//   //   });
//   // });
// });
