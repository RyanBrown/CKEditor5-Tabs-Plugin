// // src/plugins/alight-predefined-link-plugin/tests/alight-predefined-link-plugin.spec.ts
// import { Plugin, Command } from '@ckeditor/ckeditor5-core';
// import {
//   Model, Writer, Range, Position, Element, DocumentSelection,
//   ViewDocument, ViewElement, ViewAttributeElement, DowncastConversionApi,
//   Schema, DataProcessor, ViewDocumentFragment
// } from '@ckeditor/ckeditor5-engine';
// import { Delete, TextWatcher, findAttributeRange } from '@ckeditor/ckeditor5-typing';
// import { Collection } from '@ckeditor/ckeditor5-utils';
// import { ContextualBalloon, ButtonView } from '@ckeditor/ckeditor5-ui';

// // Import all the modules we're testing
// import AlightPredefinedLinkPlugin from '../link';
// import AlightPredefinedLinkPluginAutoLink from '../autolink';
// import AlightPredefinedLinkPluginCommand from '../linkcommand';
// import AlightPredefinedLinkPluginUnlinkCommand from '../unlinkcommand';
// import AlightPredefinedLinkPluginEditing from '../linkediting';
// import AlightPredefinedLinkPluginIntegration from '../linkpluginintegration';
// import AlightPredefinedLinkPluginUI from '../linkui';
// import * as utils from '../utils';
// import LinkActionsView from '../ui/linkactionsview';
// import ManualDecorator from '../utils/manualdecorator';
// import { CkAlightModalDialog } from './../../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
// import LinksLoadService from '../../../services/links-load-service';

// describe('AlightPredefinedLinkPlugin', () => {
//   let editor: any;
//   let model: any;
//   let modelRoot: any;
//   let view: any;
//   let viewDocument: any;
//   let plugin: AlightPredefinedLinkPlugin;

//   beforeEach(() => {
//     // Create mock editor
//     editor = {
//       model: {
//         document: {
//           selection: {
//             on: jasmine.createSpy('on'),
//             hasAttribute: jasmine.createSpy('hasAttribute').and.returnValue(false),
//             getAttribute: jasmine.createSpy('getAttribute'),
//             getRanges: jasmine.createSpy('getRanges').and.returnValue([]),
//             getFirstPosition: jasmine.createSpy('getFirstPosition').and.returnValue(null),
//             isCollapsed: true
//           }
//         },
//         change: jasmine.createSpy('change').and.callFake((callback: Function) => {
//           const writer = createMockWriter();
//           callback(writer);
//         }),
//         createRange: jasmine.createSpy('createRange').and.returnValue({}),
//         schema: {
//           checkAttributeInSelection: jasmine.createSpy('checkAttributeInSelection').and.returnValue(true)
//         },
//         on: jasmine.createSpy('on')
//       },
//       commands: {
//         get: jasmine.createSpy('get').and.returnValue({
//           on: jasmine.createSpy('on'),
//           execute: jasmine.createSpy('execute')
//         })
//       },
//       data: {
//         processor: {
//           toData: jasmine.createSpy('toData').and.returnValue('<p>test</p>')
//         }
//       },
//       plugins: {
//         get: jasmine.createSpy('get').and.returnValue({})
//       },
//       config: {
//         get: jasmine.createSpy('get').and.returnValue({})
//       }
//     };

//     model = editor.model;
//     modelRoot = model.document;

//     plugin = new AlightPredefinedLinkPlugin(editor);
//   });

//   describe('init()', () => {
//     it('should handle link command execution', () => {
//       plugin.init();

//       expect(editor.commands.get).toHaveBeenCalledWith('alight-predefined-link');
//     });

//     it('should register data processor', () => {
//       plugin.init();

//       expect(editor.data.processor.toData).toBeDefined();
//     });

//     it('should handle predefined link command execution', (done) => {
//       const mockCommand = {
//         on: jasmine.createSpy('on').and.callFake((event: string, callback: Function) => {
//           if (event === 'execute') {
//             setTimeout(() => {
//               callback({}, ['predefinedLink123']);
//               done();
//             }, 0);
//           }
//         })
//       };

//       editor.commands.get.and.returnValue(mockCommand);
//       plugin.init();

//       expect(mockCommand.on).toHaveBeenCalledWith('execute', jasmine.any(Function), { priority: 'low' });
//     });
//   });

//   describe('_processNewPredefinedLink()', () => {
//     it('should process predefined links with valid selection', () => {
//       const mockSelection = {
//         hasAttribute: jasmine.createSpy('hasAttribute').and.returnValue(true),
//         getAttribute: jasmine.createSpy('getAttribute').and.returnValue('predefinedLink123'),
//         isCollapsed: false,
//         getRanges: jasmine.createSpy('getRanges').and.returnValue([{
//           getItems: jasmine.createSpy('getItems').and.returnValue([{
//             is: jasmine.createSpy('is').and.returnValue(true),
//             hasAttribute: jasmine.createSpy('hasAttribute').and.returnValue(true),
//             getAttribute: jasmine.createSpy('getAttribute').and.returnValue('predefinedLink123')
//           }])
//         }])
//       };

//       editor.model.document.selection = mockSelection;

//       plugin['_processNewPredefinedLink']('predefinedLink123');

//       expect(editor.model.change).toHaveBeenCalled();
//     });
//   });

//   describe('_ensurePredefinedLinkAttributes()', () => {
//     it('should set correct attributes for predefined links', () => {
//       const mockWriter = createMockWriter();
//       const mockItem = {
//         hasAttribute: jasmine.createSpy('hasAttribute').and.returnValue(false),
//         getAttribute: jasmine.createSpy('getAttribute')
//       };

//       plugin['_ensurePredefinedLinkAttributes'](mockWriter, mockItem, 'predefinedLink123');

//       expect(mockWriter.setAttribute).toHaveBeenCalledWith('alightPredefinedLinkPluginFormat', 'ahcustom', mockItem);
//       expect(mockWriter.setAttribute).toHaveBeenCalledWith('alightPredefinedLinkPluginLinkName', 'predefinedLink123', mockItem);
//     });
//   });

//   describe('_registerDataProcessor()', () => {
//     it('should override toData method', () => {
//       const originalToData = editor.data.processor.toData;
//       plugin['_registerDataProcessor']();

//       expect(editor.data.processor.toData).not.toBe(originalToData);
//     });

//     it('should handle errors in toData processing', () => {
//       editor.data.processor.toData = jasmine.createSpy('toData').and.throwError('Test error');

//       plugin['_registerDataProcessor']();
//       const result = editor.data.processor.toData({});

//       expect(result).toBeDefined();
//     });
//   });

//   describe('destroy()', () => {
//     it('should clean up resources', () => {
//       plugin['_processingTimeout'] = 123;
//       plugin['_pendingChanges'].add('test');

//       spyOn(window, 'clearTimeout');
//       plugin.destroy();

//       expect(window.clearTimeout).toHaveBeenCalledWith(123);
//       expect(plugin['_pendingChanges'].size).toBe(0);
//     });
//   });
// });

// // describe('AlightPredefinedLinkPluginAutoLink', () => {
// //   let editor: any;
// //   let plugin: AlightPredefinedLinkPluginAutoLink;
// //   let textWatcher: any;

// //   beforeEach(() => {
// //     textWatcher = {
// //       on: jasmine.createSpy('on'),
// //       bind: jasmine.createSpy('bind').and.returnValue({
// //         to: jasmine.createSpy('to')
// //       })
// //     };

// //     // Mock TextWatcher constructor
// //     const OriginalTextWatcher = TextWatcher;
// //     spyOn(window as any, 'TextWatcher').and.returnValue(textWatcher);

// //     editor = createMockEditor();
// //     editor.plugins.get.and.callFake((name: string) => {
// //       if (name === 'ClipboardPipeline') {
// //         return { on: jasmine.createSpy('on') };
// //       }
// //       if (name === 'Delete') {
// //         return { requestUndoOnBackspace: jasmine.createSpy('requestUndoOnBackspace') };
// //       }
// //       return {};
// //     });

// //     spyOn(TextWatcher.prototype, 'constructor').and.returnValue(textWatcher);

// //     plugin = new AlightPredefinedLinkPluginAutoLink(editor);
// //   });

// describe('init()', () => {
//   it('should disable plugin when selection is in code block', () => {
//     const mockSelection = {
//       on: jasmine.createSpy('on').and.callFake((event: string, callback: Function) => {
//         if (event === 'change:range') {
//           callback();
//         }
//       }),
//       anchor: {
//         parent: {
//           is: jasmine.createSpy('is').and.returnValue(true)
//         }
//       }
//     };

//     editor.model.document.selection = mockSelection;
//     plugin.init();

//     expect(plugin.isEnabled).toBe(false);
//   });

//   it('should enable typing handling', () => {
//     plugin.init();

//     expect(textWatcher.on).toHaveBeenCalled();
//   });
// });

// describe('afterInit()', () => {
//   it('should enable all handlers', () => {
//     spyOn(plugin as any, '_enableEnterHandling');
//     spyOn(plugin as any, '_enableShiftEnterHandling');
//     spyOn(plugin as any, '_enablePasteLinking');

//     plugin.afterInit();

//     expect(plugin['_enableEnterHandling']).toHaveBeenCalled();
//     expect(plugin['_enableShiftEnterHandling']).toHaveBeenCalled();
//     expect(plugin['_enablePasteLinking']).toHaveBeenCalled();
//   });
// });

// describe('_enablePasteLinking()', () => {
//   it('should handle paste events with URLs', () => {
//     const clipboardPipeline = {
//       on: jasmine.createSpy('on').and.callFake((event: string, callback: Function) => {
//         const data = {
//           method: 'paste',
//           dataTransfer: {
//             getData: jasmine.createSpy('getData').and.returnValue('https://example.com')
//           }
//         };
//         const evt = { stop: jasmine.createSpy('stop') };
//         callback(evt, data);
//       })
//     };

//     editor.plugins.get.and.returnValue(clipboardPipeline);
//     editor.model.document.selection.isCollapsed = false;
//     editor.model.document.selection.rangeCount = 1;
//     editor.model.document.selection.getFirstRange = jasmine.createSpy('getFirstRange').and.returnValue({});

//     plugin['_enablePasteLinking']();

//     expect(clipboardPipeline.on).toHaveBeenCalled();
//   });
// });

// describe('_enableTypingHandling()', () => {
//   it('should detect URLs while typing', () => {
//     const mockData = {
//       batch: { isTyping: true },
//       range: {
//         end: {
//           getShiftedBy: jasmine.createSpy('getShiftedBy').and.returnValue({
//             getShiftedBy: jasmine.createSpy('getShiftedBy').and.returnValue({})
//           })
//         }
//       },
//       url: 'https://example.com',
//       removedTrailingCharacters: 1
//     };

//     textWatcher.on.and.callFake((event: string, callback: Function) => {
//       if (event === 'matched:data') {
//         callback({}, mockData);
//       }
//     });

//     spyOn(plugin as any, '_applyAutoLink');
//     plugin['_enableTypingHandling']();

//     expect(plugin['_applyAutoLink']).toHaveBeenCalled();
//   });
// });

// describe('_checkAndApplyAutoLinkOnRange()', () => {
//   it('should apply auto link on valid range', () => {
//     const mockRange = {
//       end: {
//         getShiftedBy: jasmine.createSpy('getShiftedBy').and.returnValue({})
//       }
//     };

//     spyOn(plugin as any, '_applyAutoLink');
//     plugin['_checkAndApplyAutoLinkOnRange'](mockRange);

//     // Test would need proper mock setup for getLastTextLine
//   });
// });
// });

// describe('AlightPredefinedLinkPluginCommand', () => {
//   let editor: any;
//   let command: AlightPredefinedLinkPluginCommand;

//   beforeEach(() => {
//     editor = createMockEditor();
//     command = new AlightPredefinedLinkPluginCommand(editor);
//   });

//   describe('refresh()', () => {
//     it('should enable command for non-collapsed selection', () => {
//       editor.model.document.selection.isCollapsed = false;
//       editor.model.document.selection.getAttribute.and.returnValue(undefined);

//       command.refresh();

//       expect(command.isEnabled).toBe(true);
//     });

//     it('should enable command when inside existing link', () => {
//       editor.model.document.selection.isCollapsed = true;
//       editor.model.document.selection.getAttribute.and.returnValue('https://example.com');

//       command.refresh();

//       expect(command.isEnabled).toBe(true);
//       expect(command.value).toBe('https://example.com');
//     });

//     it('should handle linkable elements', () => {
//       const mockElement = { getAttribute: jasmine.createSpy('getAttribute').and.returnValue('test-link') };
//       editor.model.document.selection.getSelectedElement.and.returnValue(mockElement);
//       editor.model.schema.checkAttribute.and.returnValue(true);

//       spyOn(utils, 'isLinkableElement').and.returnValue(true);

//       command.refresh();

//       expect(command.value).toBe('test-link');
//       expect(command.isEnabled).toBe(true);
//     });
//   });

//   describe('execute()', () => {
//     it('should handle predefined links', () => {
//       spyOn(utils, 'isPredefinedLink').and.returnValue(true);
//       spyOn(utils, 'extractPredefinedLinkId').and.returnValue('link123');

//       command.execute('predefinedLink123');

//       expect(editor.model.change).toHaveBeenCalled();
//     });

//     it('should handle collapsed selection with existing link', () => {
//       editor.model.document.selection.isCollapsed = true;
//       editor.model.document.selection.hasAttribute.and.returnValue(true);
//       editor.model.document.selection.getAttribute.and.returnValue('oldLink');

//       const mockPosition = {};
//       editor.model.document.selection.getFirstPosition.and.returnValue(mockPosition);

//       spyOn(findAttributeRange, 'default').and.returnValue({});

//       command.execute('newLink');

//       expect(editor.model.change).toHaveBeenCalled();
//     });

//     it('should create new link at position', () => {
//       editor.model.document.selection.isCollapsed = true;
//       editor.model.document.selection.hasAttribute.and.returnValue(false);

//       const mockPosition = {};
//       editor.model.document.selection.getFirstPosition.and.returnValue(mockPosition);
//       editor.model.insertContent.and.returnValue({ end: {} });

//       command.execute('https://example.com');

//       expect(editor.model.change).toHaveBeenCalled();
//     });

//     it('should handle non-collapsed selection', () => {
//       editor.model.document.selection.isCollapsed = false;
//       editor.model.schema.getValidRanges.and.returnValue([{}]);

//       command.execute('https://example.com');

//       expect(editor.model.change).toHaveBeenCalled();
//     });
//   });

//   describe('restoreManualDecoratorStates()', () => {
//     it('should restore decorator states', () => {
//       const mockDecorator = {
//         id: 'linkTest',
//         value: false
//       };

//       command.manualDecorators.add(mockDecorator as any);
//       spyOn(command as any, '_getDecoratorStateFromModel').and.returnValue(true);

//       command.restoreManualDecoratorStates();

//       expect(mockDecorator.value).toBe(true);
//     });
//   });
// });

// describe('AlightPredefinedLinkPluginUnlinkCommand', () => {
//   let editor: any;
//   let command: AlightPredefinedLinkPluginUnlinkCommand;

//   beforeEach(() => {
//     editor = createMockEditor();
//     command = new AlightPredefinedLinkPluginUnlinkCommand(editor);
//   });

//   describe('refresh()', () => {
//     it('should enable command when selection has link attribute', () => {
//       editor.model.schema.checkAttributeInSelection.and.returnValue(true);

//       command.refresh();

//       expect(command.isEnabled).toBe(true);
//     });

//     it('should handle linkable elements', () => {
//       const mockElement = {};
//       editor.model.document.selection.getSelectedElement.and.returnValue(mockElement);
//       spyOn(utils, 'isLinkableElement').and.returnValue(true);
//       editor.model.schema.checkAttribute.and.returnValue(true);

//       command.refresh();

//       expect(command.isEnabled).toBe(true);
//     });
//   });

//   describe('execute()', () => {
//     // it('should remove link attributes from collapsed selection', () => {
//     //   editor.model.document.selection.isCollapsed = true;
//     //   editor.model.document.selection.getAttribute.and.returnValue('https://example.com');

//     //   const mockRange = {};
//     //   spyOn(findAttributeRange, 'default').and.returnValue(mockRange);

//     //   command.execute();

//     //   expect(editor.model.change).toHaveBeenCalled();
//     // });

//     it('should remove link attributes from ranges', () => {
//       editor.model.document.selection.isCollapsed = false;
//       editor.model.schema.getValidRanges.and.returnValue([{}, {}]);

//       command.execute();

//       expect(editor.model.change).toHaveBeenCalled();
//     });

//     // it('should remove manual decorator attributes', () => {
//     //   const mockLinkCommand = {
//     //     manualDecorators: [{ id: 'linkTest' }]
//     //   };

//     //   editor.commands.get.and.returnValue(mockLinkCommand);
//     //   editor.model.schema.getValidRanges.and.returnValue([{}]);

//     //   command.execute();

//     //   expect(editor.model.change).toHaveBeenCalled();
//     // });
//   });
// });

// describe('AlightPredefinedLinkPluginEditing', () => {
//   let editor: any;
//   let plugin: AlightPredefinedLinkPluginEditing;

//   beforeEach(() => {
//     editor = createMockEditor();
//     editor.config.define = jasmine.createSpy('define');
//     editor.model.schema.extend = jasmine.createSpy('extend');
//     editor.conversion = {
//       for: jasmine.createSpy('for').and.returnValue({
//         add: jasmine.createSpy('add'),
//         attributeToElement: jasmine.createSpy('attributeToElement'),
//         elementToAttribute: jasmine.createSpy('elementToAttribute')
//       })
//     };
//     editor.plugins.get.and.callFake((name: string) => {
//       if (name === 'TwoStepCaretMovement') {
//         return { registerAttribute: jasmine.createSpy('registerAttribute') };
//       }
//       return {};
//     });
//     editor.editing = {
//       view: {
//         document: {
//           on: jasmine.createSpy('on')
//         }
//       }
//     };

//     plugin = new AlightPredefinedLinkPluginEditing(editor);
//   });

//   describe('init()', () => {
//     it('should setup schema and conversions', () => {
//       spyOn(plugin as any, '_setupConversions');
//       spyOn(plugin as any, '_enableLinkOpen');
//       spyOn(plugin as any, '_enableSelectionAttributesFixer');
//       spyOn(plugin as any, '_checkForConflicts');

//       plugin.init();

//       expect(editor.model.schema.extend).toHaveBeenCalledWith('$text', jasmine.any(Object));
//       expect(plugin['_setupConversions']).toHaveBeenCalled();
//       expect(editor.commands.add).toHaveBeenCalledWith('alight-predefined-link', jasmine.any(AlightPredefinedLinkPluginCommand));
//       expect(editor.commands.add).toHaveBeenCalledWith('alight-predefined-unlink', jasmine.any(AlightPredefinedLinkPluginUnlinkCommand));
//     });

//     it('should enable automatic decorators', () => {
//       const mockDecorators = [{
//         mode: 'automatic',
//         callback: () => { },
//         attributes: {}
//       }];

//       editor.config.get.and.returnValue({ decorators: mockDecorators });
//       spyOn(utils, 'normalizeDecorators').and.returnValue(mockDecorators);
//       spyOn(utils, 'getLocalizedDecorators').and.returnValue(mockDecorators);

//       plugin.init();

//       expect(editor.conversion.for).toHaveBeenCalledWith('downcast');
//     });

//     it('should enable manual decorators', () => {
//       const mockDecorators = [{
//         mode: 'manual',
//         label: 'Test',
//         attributes: {},
//         id: 'linkTest'
//       }];

//       editor.config.get.and.returnValue({ decorators: mockDecorators });
//       spyOn(utils, 'normalizeDecorators').and.returnValue(mockDecorators);
//       spyOn(utils, 'getLocalizedDecorators').and.returnValue(mockDecorators);

//       plugin.init();

//       expect(editor.model.schema.extend).toHaveBeenCalled();
//     });
//   });

//   describe('_setupDataDowncast()', () => {
//     it('should handle predefined links with ah:link structure', () => {
//       const mockDispatcher = {
//         on: jasmine.createSpy('on').and.callFake((event: string, callback: Function) => {
//           const data = {
//             item: {
//               getAttribute: jasmine.createSpy('getAttribute').and.callFake((attr: string) => {
//                 if (attr === 'alightPredefinedLinkPluginHref') return 'predefinedLink123';
//                 if (attr === 'alightPredefinedLinkPluginLinkName') return 'predefinedLink123';
//                 if (attr === 'alightPredefinedLinkPluginFormat') return 'ahcustom';
//               }),
//               is: jasmine.createSpy('is').and.returnValue(true)
//             },
//             attributeNewValue: 'predefinedLink123',
//             range: {}
//           };

//           const conversionApi = {
//             consumable: {
//               test: jasmine.createSpy('test').and.returnValue(true),
//               consume: jasmine.createSpy('consume')
//             },
//             writer: createMockViewWriter(),
//             mapper: {
//               toViewRange: jasmine.createSpy('toViewRange').and.returnValue({
//                 start: {},
//                 getWalker: jasmine.createSpy('getWalker').and.returnValue({
//                   [Symbol.iterator]: function* () {
//                     yield { item: { is: () => true, data: 'Link Text' } };
//                   }
//                 })
//               })
//             }
//           };

//           callback({}, data, conversionApi);
//         })
//       };

//       editor.conversion.for.and.returnValue({ add: (fn: Function) => fn(mockDispatcher) });

//       plugin['_setupDataDowncast']();

//       expect(mockDispatcher.on).toHaveBeenCalled();
//     });
//   });

//   describe('_setupUpcast()', () => {
//     it('should handle predefined links with ah:link', () => {
//       const mockAhLink = {
//         is: jasmine.createSpy('is').and.returnValue(true),
//         getAttribute: jasmine.createSpy('getAttribute').and.returnValue('predefinedLink123'),
//         getChildren: jasmine.createSpy('getChildren').and.returnValue([])
//       };

//       const mockViewElement = {
//         hasClass: jasmine.createSpy('hasClass').and.returnValue(true),
//         getAttribute: jasmine.createSpy('getAttribute').and.returnValue('#'),
//         getChildren: jasmine.createSpy('getChildren').and.returnValue([mockAhLink])
//       };

//       const mockDispatcher = {
//         on: jasmine.createSpy('on').and.callFake((event: string, callback: Function) => {
//           const data = {
//             viewItem: mockViewElement,
//             modelCursor: {},
//             modelRange: null as any
//           };

//           const conversionApi = {
//             consumable: {
//               test: jasmine.createSpy('test').and.returnValue(true),
//               consume: jasmine.createSpy('consume')
//             },
//             writer: {
//               createText: jasmine.createSpy('createText').and.returnValue({}),
//               insert: jasmine.createSpy('insert'),
//               createRange: jasmine.createSpy('createRange').and.returnValue({})
//             }
//           };

//           callback({}, data, conversionApi);
//         })
//       };

//       editor.conversion.for.and.returnValue({ add: (fn: Function) => fn(mockDispatcher) });

//       plugin['_setupUpcast']();

//       expect(mockDispatcher.on).toHaveBeenCalled();
//     });

//     it('should handle regular links', () => {
//       const mockViewElement = {
//         hasClass: jasmine.createSpy('hasClass').and.returnValue(false),
//         getAttribute: jasmine.createSpy('getAttribute').and.returnValue('https://example.com'),
//         getChildren: jasmine.createSpy('getChildren').and.returnValue([])
//       };

//       const mockDispatcher = {
//         on: jasmine.createSpy('on').and.callFake((event: string, callback: Function) => {
//           const data = {
//             viewItem: mockViewElement,
//             modelCursor: { getShiftedBy: jasmine.createSpy('getShiftedBy').and.returnValue({}) },
//             modelRange: null as any
//           };

//           const conversionApi = {
//             consumable: {
//               test: jasmine.createSpy('test').and.returnValue(true),
//               consume: jasmine.createSpy('consume')
//             },
//             writer: {
//               createText: jasmine.createSpy('createText').and.returnValue({}),
//               insert: jasmine.createSpy('insert'),
//               createRange: jasmine.createSpy('createRange').and.returnValue({ end: {} })
//             }
//           };

//           callback({}, data, conversionApi);
//         })
//       };

//       editor.conversion.for.and.returnValue({ add: (fn: Function) => fn(mockDispatcher) });
//       spyOn(plugin as any, '_getTextFromElement').and.returnValue('Link Text');

//       plugin['_setupUpcast']();

//       expect(mockDispatcher.on).toHaveBeenCalled();
//     });
//   });

//   describe('_enableLinkOpen()', () => {
//     it('should handle click events with Ctrl/Cmd key', () => {
//       const mockEvent = { stop: jasmine.createSpy('stop') };
//       const mockData = {
//         domEvent: { ctrlKey: true },
//         domTarget: {
//           tagName: 'A',
//           getAttribute: jasmine.createSpy('getAttribute').and.returnValue('https://example.com'),
//           closest: jasmine.createSpy('closest')
//         },
//         preventDefault: jasmine.createSpy('preventDefault')
//       };

//       editor.editing.view.document.on.and.callFake((event: string, callback: Function) => {
//         if (event === 'click') {
//           callback(mockEvent, mockData);
//         }
//       });

//       plugin['_enableLinkOpen']();

//       expect(mockEvent.stop).toHaveBeenCalled();
//       expect(mockData.preventDefault).toHaveBeenCalled();
//     });

//     it('should handle Alt+Enter keypress', () => {
//       const mockEvent = { stop: jasmine.createSpy('stop') };
//       const mockData = {
//         keyCode: 13, // Enter key
//         altKey: true
//       };

//       const mockCommand = {
//         value: 'https://example.com'
//       };

//       editor.commands.get.and.returnValue(mockCommand);
//       editor.editing.view.document.on.and.callFake((event: string, callback: Function) => {
//         if (event === 'keydown') {
//           callback(mockEvent, mockData);
//         }
//       });

//       plugin['_enableLinkOpen']();

//       expect(mockEvent.stop).toHaveBeenCalled();
//     });
//   });

//   describe('_checkForConflicts()', () => {
//     it('should warn about conflicting plugins', () => {
//       spyOn(console, 'warn');
//       editor.plugins.has = jasmine.createSpy('has').and.returnValue(true);

//       plugin['_checkForConflicts']();

//       expect(console.warn).toHaveBeenCalledTimes(2);
//     });
//   });
// });

// describe('AlightPredefinedLinkPluginIntegration', () => {
//   let editor: any;
//   let plugin: AlightPredefinedLinkPluginIntegration;

//   beforeEach(() => {
//     editor = createMockEditor();
//     plugin = new AlightPredefinedLinkPluginIntegration(editor);
//   });

//   // describe('init()', () => {
//   //   it('should integrate with standard Link plugin', () => {
//   //     const mockLinkUI = {
//   //       _showUI: jasmine.createSpy('_showUI')
//   //     };

//   //     const mockLinkCommand = {
//   //       value: 'predefinedLink123',
//   //       on: jasmine.createSpy('on')
//   //     };

//   //     editor.plugins.has.and.returnValue(true);
//   //     editor.plugins.get.and.callFake((name: string) => {
//   //       if (name === 'LinkUI') return mockLinkUI;
//   //       if (name === 'AlightPredefinedLinkPluginUI') {
//   //         return { showUI: jasmine.createSpy('showUI') };
//   //       }
//   //       return {};
//   //     });

//   //     editor.commands.get.and.returnValue(mockLinkCommand);
//   //     spyOn(utils, 'isPredefinedLink').and.returnValue(true);

//   //     plugin.init();

//   //     // Test overridden _showUI
//   //     mockLinkUI._showUI(true);

//   //     expect(editor.plugins.get('AlightPredefinedLinkPluginUI').showUI).toHaveBeenCalled();
//   //   });

//   //   it('should intercept standard link command execution', () => {
//   //     const mockEvent = { stop: jasmine.createSpy('stop') };
//   //     const mockLinkCommand = {
//   //       on: jasmine.createSpy('on').and.callFake((event: string, callback: Function) => {
//   //         if (event === 'execute') {
//   //           callback(mockEvent, ['predefinedLink123']);
//   //         }
//   //       })
//   //     };

//   //     editor.model.document.selection.hasAttribute.and.returnValue(true);
//   //     editor.model.document.selection.getAttribute.and.returnValue('predefinedLink123');
//   //     editor.plugins.has.and.returnValue(true);
//   //     editor.commands.get.and.returnValue(mockLinkCommand);

//   //     spyOn(utils, 'isPredefinedLink').and.returnValue(true);

//   //     plugin.init();

//   //     expect(mockEvent.stop).toHaveBeenCalled();
//   //     expect(editor.execute).toHaveBeenCalledWith('alight-predefined-link', 'predefinedLink123');
//   //   });
//   // });
// });

// describe('AlightPredefinedLinkPluginUI', () => {
//   let editor: any;
//   let plugin: AlightPredefinedLinkPluginUI;
//   let balloon: any;

//   beforeEach(() => {
//     balloon = {
//       hasView: jasmine.createSpy('hasView').and.returnValue(false),
//       add: jasmine.createSpy('add'),
//       remove: jasmine.createSpy('remove'),
//       updatePosition: jasmine.createSpy('updatePosition'),
//       view: { element: {} }
//     };

//     editor = createMockEditor();
//     editor.editing = {
//       view: {
//         addObserver: jasmine.createSpy('addObserver'),
//         document: {
//           on: jasmine.createSpy('on'),
//           selection: {
//             getFirstPosition: jasmine.createSpy('getFirstPosition').and.returnValue({}),
//             getFirstRange: jasmine.createSpy('getFirstRange').and.returnValue({}),
//             getSelectedElement: jasmine.createSpy('getSelectedElement'),
//             isCollapsed: true
//           }
//         },
//         domConverter: {
//           mapViewToDom: jasmine.createSpy('mapViewToDom').and.returnValue({}),
//           viewRangeToDom: jasmine.createSpy('viewRangeToDom').and.returnValue({})
//         }
//       }
//     };

//     editor.plugins.get.and.callFake((name: string) => {
//       if (name === 'ContextualBalloon') return balloon;
//       return {};
//     });

//     editor.ui = {
//       componentFactory: {
//         add: jasmine.createSpy('add')
//       },
//       on: jasmine.createSpy('on'),
//       update: jasmine.createSpy('update')
//     };

//     editor.accessibility = {
//       addKeystrokeInfos: jasmine.createSpy('addKeystrokeInfos')
//     };

//     editor.t = jasmine.createSpy('t').and.callFake((str: string) => str);
//     editor.locale = { t: editor.t };

//     plugin = new AlightPredefinedLinkPluginUI(editor);
//   });

//   describe('init()', () => {
//     it('should create UI components', () => {
//       spyOn(plugin as any, '_createActionsView').and.returnValue({
//         keystrokes: { set: jasmine.createSpy('set') },
//         editButtonView: { bind: jasmine.createSpy('bind').and.returnValue({ to: jasmine.createSpy('to') }) },
//         unlinkButtonView: { bind: jasmine.createSpy('bind').and.returnValue({ to: jasmine.createSpy('to') }) },
//         bind: jasmine.createSpy('bind').and.returnValue({ to: jasmine.createSpy('to') }),
//         setPredefinedLinks: jasmine.createSpy('setPredefinedLinks'),
//         set: jasmine.createSpy('set')
//       });

//       spyOn(plugin as any, '_createToolbarLinkButton');
//       spyOn(plugin as any, '_enableUIActivators');
//       spyOn(plugin as any, '_enableBalloonInteractions');

//       plugin.init();

//       expect(plugin['_createActionsView']).toHaveBeenCalled();
//       expect(plugin['_createToolbarLinkButton']).toHaveBeenCalled();
//       expect(editor.ui.componentFactory.add).toHaveBeenCalled();
//     });

//     it('should setup conversion for visual selection marker', () => {
//       plugin.init();

//       expect(editor.conversion.for).toHaveBeenCalledWith('editingDowncast');
//     });
//   });

//   // describe('setModalContents()', () => {
//   //   it('should load predefined links', (done) => {
//   //     const mockLinks = [
//   //       { predefinedLinkName: 'Link1', predefinedLinkDescription: 'Desc1', destination: 'url1' },
//   //       { predefinedLinkName: 'Link2', predefinedLinkDescription: 'Desc2', destination: 'url2' }
//   //     ];

//   //     spyOn(LinksLoadService.prototype, 'loadPredefinedLinks').and.returnValue(
//   //       Promise.resolve(mockLinks)
//   //     );

//   //     plugin.setModalContents();

//   //     setTimeout(() => {
//   //       expect(plugin['_predefinedLinks'].length).toBe(2);
//   //       expect(plugin['_dataLoaded']).toBe(true);
//   //       done();
//   //     }, 0);
//   //   });

//   //   it('should handle loading errors', (done) => {
//   //     spyOn(LinksLoadService.prototype, 'loadPredefinedLinks').and.returnValue(
//   //       Promise.reject(new Error('Loading failed'))
//   //     );

//   //     spyOn(console, 'log');

//   //     plugin.setModalContents();

//   //     setTimeout(() => {
//   //       expect(plugin['_dataLoaded']).toBe(false);
//   //       expect(console.log).toHaveBeenCalled();
//   //       done();
//   //     }, 0);
//   //   });
//   // });

//   // describe('_sortPredefinedLinks()', () => {
//   //   it('should sort links alphabetically and remove duplicates', () => {
//   //     const links = [
//   //       { predefinedLinkName: 'C', predefinedLinkDescription: 'Desc C', uniqueId: '3' },
//   //       { predefinedLinkName: 'A', predefinedLinkDescription: 'Desc A', uniqueId: '1' },
//   //       { predefinedLinkName: 'B', predefinedLinkDescription: 'Desc B', uniqueId: '2' },
//   //       { predefinedLinkName: 'A', predefinedLinkDescription: 'Desc A', uniqueId: '1' } // Duplicate
//   //     ];

//   //     const sorted = plugin['_sortPredefinedLinks'](links, true);

//   //     expect(sorted.length).toBe(3);
//   //     expect(sorted[0].predefinedLinkName).toBe('A');
//   //     expect(sorted[1].predefinedLinkName).toBe('B');
//   //     expect(sorted[2].predefinedLinkName).toBe('C');
//   //   });

//   //   it('should sort in descending order', () => {
//   //     const links = [
//   //       { predefinedLinkName: 'A', predefinedLinkDescription: 'Desc A' },
//   //       { predefinedLinkName: 'B', predefinedLinkDescription: 'Desc B' }
//   //     ];

//   //     const sorted = plugin['_sortPredefinedLinks'](links, false);

//   //     expect(sorted[0].predefinedLinkName).toBe('B');
//   //     expect(sorted[1].predefinedLinkName).toBe('A');
//   //   });
//   // });

//   // describe('_showUI()', () => {
//   //   it('should show modal dialog for link creation', () => {
//   //     plugin['_dataLoaded'] = true;
//   //     plugin['_predefinedLinks'] = [{ predefinedLinkName: 'Test' }];

//   //     const mockCommand = { isEnabled: true };
//   //     editor.commands.get.and.returnValue(mockCommand);

//   //     spyOn(plugin as any, '_createCustomContent').and.returnValue(document.createElement('div'));

//   //     plugin['_showUI'](false);

//   //     expect(plugin['_modalDialog']).toBeDefined();
//   //   });

//   //   it('should not show UI when data not loaded', () => {
//   //     plugin['_dataLoaded'] = false;
//   //     spyOn(console, 'warn');

//   //     plugin['_showUI']();

//   //     expect(console.warn).toHaveBeenCalledWith('Cannot show UI - data not loaded yet');
//   //   });
//   // });

//   describe('_showBalloon()', () => {
//     it('should add actions view to balloon', () => {
//       plugin.actionsView = {
//         setPredefinedLinks: jasmine.createSpy('setPredefinedLinks')
//       } as any;

//       plugin['_predefinedLinks'] = [{ predefinedLinkName: 'Test' }];

//       spyOn(plugin as any, '_getSelectedLinkElement').and.returnValue({
//         getAttribute: jasmine.createSpy('getAttribute').and.returnValue('predefinedLink123')
//       });

//       spyOn(plugin as any, '_getBalloonPositionData').and.returnValue({ target: {} });
//       spyOn(plugin as any, '_startUpdatingUI');
//       spyOn(utils, 'isPredefinedLink').and.returnValue(true);

//       plugin['_showBalloon']();

//       expect(balloon.add).toHaveBeenCalled();
//       expect(plugin['_startUpdatingUI']).toHaveBeenCalled();
//     });
//   });

//   describe('_hideUI()', () => {
//     it('should remove balloon view', () => {
//       plugin.actionsView = {} as any;
//       balloon.hasView.and.returnValue(true);

//       plugin['_hideUI']();

//       expect(balloon.remove).toHaveBeenCalledWith(plugin.actionsView);
//     });

//     it('should handle recursive calls', () => {
//       plugin['_isUpdatingUI'] = true;

//       plugin['_hideUI']();

//       expect(balloon.remove).not.toHaveBeenCalled();
//     });
//   });

//   describe('_getSelectedLinkElement()', () => {
//     it('should return link element for collapsed selection', () => {
//       const mockLinkElement = {
//         is: jasmine.createSpy('is').and.returnValue(true),
//         getAttribute: jasmine.createSpy('getAttribute')
//       };

//       const mockPosition = {
//         getAncestors: jasmine.createSpy('getAncestors').and.returnValue([mockLinkElement])
//       };

//       editor.editing.view.document.selection.getFirstPosition.and.returnValue(mockPosition);
//       spyOn(utils, 'isLinkElement').and.returnValue(true);

//       const result = plugin['_getSelectedLinkElement']();

//       expect(result).toBe(mockLinkElement);
//     });

//     it('should return null for invalid selection', () => {
//       editor.editing.view.document.selection.getFirstPosition.and.returnValue(null);

//       const result = plugin['_getSelectedLinkElement']();

//       expect(result).toBeNull();
//     });
//   });
// });

// describe('Utils', () => {
//   describe('isLinkElement()', () => {
//     it('should return true for link elements', () => {
//       const element = {
//         is: jasmine.createSpy('is').and.returnValue(true),
//         getCustomProperty: jasmine.createSpy('getCustomProperty').and.returnValue(true)
//       };

//       expect(utils.isLinkElement(element as any)).toBe(true);
//     });

//     it('should return false for non-link elements', () => {
//       const element = {
//         is: jasmine.createSpy('is').and.returnValue(false)
//       };

//       expect(utils.isLinkElement(element as any)).toBe(false);
//     });

//     it('should return false for null', () => {
//       expect(utils.isLinkElement(null as any)).toBe(false);
//     });
//   });

//   describe('isPredefinedLink()', () => {
//     it('should return true for non-empty URLs', () => {
//       expect(utils.isPredefinedLink('predefinedLink123')).toBe(true);
//     });

//     it('should return false for empty URLs', () => {
//       expect(utils.isPredefinedLink('')).toBe(false);
//       expect(utils.isPredefinedLink(null)).toBe(false);
//       expect(utils.isPredefinedLink(undefined)).toBe(false);
//     });
//   });

//   describe('createLinkElement()', () => {
//     it('should create link element with correct attributes', () => {
//       const mockWriter = createMockViewWriter();
//       const conversionApi = { writer: mockWriter } as any;

//       const element = utils.createLinkElement('https://example.com', conversionApi);

//       expect(mockWriter.createAttributeElement).toHaveBeenCalledWith(
//         'a',
//         jasmine.objectContaining({
//           href: 'https://example.com',
//           class: 'AHCustomeLink',
//           'data-id': 'predefined_link'
//         }),
//         jasmine.any(Object)
//       );
//     });
//   });

//   describe('ensureSafeUrl()', () => {
//     it('should return safe URLs unchanged', () => {
//       expect(utils.ensureSafeUrl('https://example.com')).toBe('https://example.com');
//       expect(utils.ensureSafeUrl('http://example.com')).toBe('http://example.com');
//     });

//     it('should return # for unsafe URLs', () => {
//       expect(utils.ensureSafeUrl('javascript:alert(1)')).toBe('#');
//     });

//     it('should handle predefined links', () => {
//       spyOn(utils, 'isPredefinedLink').and.returnValue(true);
//       expect(utils.ensureSafeUrl('predefinedLink123')).toBe('predefinedLink123');
//     });
//   });

//   describe('getLocalizedDecorators()', () => {
//     it('should localize decorator labels', () => {
//       const t = jasmine.createSpy('t').and.returnValue('Translated');
//       const decorators = [
//         { mode: 'manual', label: 'Open in a new tab', id: 'linkTest' }
//       ] as any;

//       const result = utils.getLocalizedDecorators(t, decorators);

//       expect(t).toHaveBeenCalledWith('Open in a new tab');
//       expect(result[0].label).toBe('Translated');
//     });
//   });

//   describe('normalizeDecorators()', () => {
//     it('should convert decorator object to array', () => {
//       const decorators = {
//         openInNewTab: { mode: 'manual', label: 'New tab' }
//       };

//       const result = utils.normalizeDecorators(decorators as any);

//       expect(result.length).toBe(1);
//       expect(result[0].id).toBe('linkOpenInNewTab');
//     });

//     it('should handle undefined decorators', () => {
//       const result = utils.normalizeDecorators(undefined);
//       expect(result).toEqual([]);
//     });
//   });

//   describe('isLinkableElement()', () => {
//     it('should check schema for link attribute', () => {
//       const element = { name: 'image' };
//       const schema = {
//         checkAttribute: jasmine.createSpy('checkAttribute').and.returnValue(true)
//       };

//       const result = utils.isLinkableElement(element as any, schema as any);

//       expect(result).toBe(true);
//       expect(schema.checkAttribute).toHaveBeenCalledWith('image', 'alightPredefinedLinkPluginHref');
//     });

//     it('should return false for null element', () => {
//       const schema = { checkAttribute: jasmine.createSpy('checkAttribute') };

//       const result = utils.isLinkableElement(null, schema as any);

//       expect(result).toBe(false);
//     });
//   });

//   describe('addLinkProtocolIfApplicable()', () => {
//     it('should add protocol when needed', () => {
//       spyOn(utils, 'linkHasProtocol').and.returnValue(false);

//       const result = utils.addLinkProtocolIfApplicable('example.com', 'https://');

//       expect(result).toBe('https://example.com');
//     });

//     it('should not add protocol for predefined links', () => {
//       spyOn(utils, 'isPredefinedLink').and.returnValue(true);

//       const result = utils.addLinkProtocolIfApplicable('predefinedLink123', 'https://');

//       expect(result).toBe('predefinedLink123');
//     });
//   });

//   describe('linkHasProtocol()', () => {
//     it('should detect links with protocol', () => {
//       expect(utils.linkHasProtocol('https://example.com')).toBe(true);
//       expect(utils.linkHasProtocol('http://example.com')).toBe(true);
//       expect(utils.linkHasProtocol('ftp://example.com')).toBe(true);
//     });

//     it('should detect links without protocol', () => {
//       expect(utils.linkHasProtocol('example.com')).toBe(false);
//       expect(utils.linkHasProtocol('www.example.com')).toBe(false);
//     });
//   });

//   describe('extractPredefinedLinkId()', () => {
//     it('should extract numeric IDs', () => {
//       expect(utils.extractPredefinedLinkId('12345')).toBe('12345');
//     });

//     it('should extract from ah:link structure', () => {
//       expect(utils.extractPredefinedLinkId('name="testLink"')).toBe('testLink');
//     });

//     it('should return null for invalid input', () => {
//       expect(utils.extractPredefinedLinkId(null)).toBeNull();
//       expect(utils.extractPredefinedLinkId('')).toBeNull();
//     });
//   });

//   describe('ensurePredefinedLinkStructure()', () => {
//     it('should ensure ah:link structure in HTML', () => {
//       const html = '<a class="AHCustomeLink" href="#"><ah:link name="test">Link Text</ah:link></a>';

//       const result = utils.ensurePredefinedLinkStructure(html);

//       expect(result).toContain('ah:link');
//     });

//     it('should handle errors gracefully', () => {
//       spyOn(document, 'createElement').and.throwError('Test error');
//       spyOn(console, 'error');

//       const result = utils.ensurePredefinedLinkStructure('<p>test</p>');

//       expect(result).toBe('<p>test</p>');
//       expect(console.error).toHaveBeenCalled();
//     });
//   });
// });

// // Helper functions
// function createMockEditor() {
//   return {
//     model: {
//       document: {
//         selection: {
//           on: jasmine.createSpy('on'),
//           hasAttribute: jasmine.createSpy('hasAttribute').and.returnValue(false),
//           getAttribute: jasmine.createSpy('getAttribute'),
//           getSelectedElement: jasmine.createSpy('getSelectedElement'),
//           getSelectedBlocks: jasmine.createSpy('getSelectedBlocks').and.returnValue([]),
//           getRanges: jasmine.createSpy('getRanges').and.returnValue([]),
//           getFirstPosition: jasmine.createSpy('getFirstPosition').and.returnValue(null),
//           getLastPosition: jasmine.createSpy('getLastPosition').and.returnValue(null),
//           getFirstRange: jasmine.createSpy('getFirstRange').and.returnValue(null),
//           isCollapsed: true,
//           rangeCount: 0
//         }
//       },
//       change: jasmine.createSpy('change').and.callFake((callback: Function) => {
//         const writer = createMockWriter();
//         callback(writer);
//       }),
//       enqueueChange: jasmine.createSpy('enqueueChange').and.callFake((callback: Function) => {
//         const writer = createMockWriter();
//         callback(writer);
//       }),
//       createRange: jasmine.createSpy('createRange').and.returnValue({}),
//       createRangeIn: jasmine.createSpy('createRangeIn').and.returnValue({}),
//       createPositionAt: jasmine.createSpy('createPositionAt').and.returnValue({}),
//       insertContent: jasmine.createSpy('insertContent').and.returnValue({ end: {} }),
//       schema: {
//         checkAttribute: jasmine.createSpy('checkAttribute').and.returnValue(true),
//         checkAttributeInSelection: jasmine.createSpy('checkAttributeInSelection').and.returnValue(true),
//         getValidRanges: jasmine.createSpy('getValidRanges').and.returnValue([]),
//         getDefinition: jasmine.createSpy('getDefinition').and.returnValue({
//           allowAttributes: []
//         })
//       }
//     },
//     commands: {
//       add: jasmine.createSpy('add'),
//       get: jasmine.createSpy('get').and.returnValue(null)
//     },
//     execute: jasmine.createSpy('execute'),
//     conversion: {
//       for: jasmine.createSpy('for').and.returnValue({
//         add: jasmine.createSpy('add'),
//         attributeToElement: jasmine.createSpy('attributeToElement'),
//         elementToAttribute: jasmine.createSpy('elementToAttribute'),
//         markerToHighlight: jasmine.createSpy('markerToHighlight'),
//         markerToElement: jasmine.createSpy('markerToElement')
//       })
//     },
//     plugins: {
//       has: jasmine.createSpy('has').and.returnValue(false),
//       get: jasmine.createSpy('get').and.returnValue({})
//     },
//     config: {
//       get: jasmine.createSpy('get').and.returnValue({})
//     },
//     locale: {
//       t: jasmine.createSpy('t').and.callFake((str: string) => str)
//     },
//     t: jasmine.createSpy('t').and.callFake((str: string) => str)
//   };
// }

// function createMockWriter() {
//   return {
//     setAttribute: jasmine.createSpy('setAttribute'),
//     removeAttribute: jasmine.createSpy('removeAttribute'),
//     setSelection: jasmine.createSpy('setSelection'),
//     removeSelectionAttribute: jasmine.createSpy('removeSelectionAttribute'),
//     createText: jasmine.createSpy('createText').and.returnValue({}),
//     createRange: jasmine.createSpy('createRange').and.returnValue({})
//   };
// }

// function createMockViewWriter() {
//   return {
//     createAttributeElement: jasmine.createSpy('createAttributeElement').and.returnValue({
//       getCustomProperty: jasmine.createSpy('getCustomProperty'),
//       setCustomProperty: jasmine.createSpy('setCustomProperty')
//     }),
//     createContainerElement: jasmine.createSpy('createContainerElement').and.returnValue({}),
//     createText: jasmine.createSpy('createText').and.returnValue({}),
//     createUIElement: jasmine.createSpy('createUIElement').and.returnValue({}),
//     insert: jasmine.createSpy('insert'),
//     remove: jasmine.createSpy('remove'),
//     wrap: jasmine.createSpy('wrap'),
//     addClass: jasmine.createSpy('addClass'),
//     setStyle: jasmine.createSpy('setStyle'),
//     setCustomProperty: jasmine.createSpy('setCustomProperty'),
//     createPositionAt: jasmine.createSpy('createPositionAt').and.returnValue({})
//   };
// }
