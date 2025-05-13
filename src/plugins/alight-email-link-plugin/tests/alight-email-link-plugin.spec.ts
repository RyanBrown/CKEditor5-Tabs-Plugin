// // src/plugins/alight-email-link-plugin/tests/alight-email-link-plugin.spec.ts
// import AlightEmailLinkPlugin from '../link';
// import AlightEmailLinkPluginEditing from '../linkediting';
// import AlightEmailLinkPluginUI from '../linkui';
// import AlightEmailAutoLink from '../autolink';
// import EmailLinkHandler from '../emaillinkhandler';
// import AlightEmailLinkPluginCommand from '../linkcommand';
// import AlightEmailUnlinkCommand from '../unlinkcommand';
// import * as utils from '../utils';

// // Import the augmentation to properly extend EditorConfig
// import '../augmentation';

// describe('AlightEmailLinkPlugin', () => {
//   describe('plugin definition', () => {
//     it('should have proper name', () => {
//       expect(AlightEmailLinkPlugin.pluginName).toEqual('AlightEmailLinkPlugin');
//     });

//     it('should require proper plugins', () => {
//       expect(AlightEmailLinkPlugin.requires).toEqual([
//         AlightEmailLinkPluginEditing,
//         AlightEmailLinkPluginUI,
//         AlightEmailAutoLink,
//         EmailLinkHandler
//       ]);
//     });

//     it('should be marked as official plugin', () => {
//       expect(AlightEmailLinkPlugin.isOfficialPlugin).toBe(true);
//     });
//   });

//   describe('AlightEmailLinkPluginEditing', () => {
//     it('should have proper name', () => {
//       expect(AlightEmailLinkPluginEditing.pluginName).toEqual('AlightEmailLinkPluginEditing');
//     });

//     it('should be marked as official plugin', () => {
//       expect(AlightEmailLinkPluginEditing.isOfficialPlugin).toBe(true);
//     });
//   });

//   describe('AlightEmailAutoLink', () => {
//     it('should have proper name', () => {
//       expect(AlightEmailAutoLink.pluginName).toEqual('AlightEmailAutoLink');
//     });

//     it('should be marked as official plugin', () => {
//       expect(AlightEmailAutoLink.isOfficialPlugin).toBe(true);
//     });

//     it('should require appropriate plugins', () => {
//       expect(AlightEmailAutoLink.requires).toContain(AlightEmailLinkPluginEditing);
//     });
//   });

//   describe('EmailLinkHandler', () => {
//     it('should have proper name', () => {
//       expect(EmailLinkHandler.pluginName).toEqual('EmailLinkHandler');
//     });

//     it('should require AlightEmailLinkPluginEditing plugin', () => {
//       expect(EmailLinkHandler.requires).toContain(AlightEmailLinkPluginEditing);
//     });
//   });

//   describe('AlightEmailLinkPluginUI', () => {
//     it('should have proper name', () => {
//       expect(AlightEmailLinkPluginUI.pluginName).toEqual('AlightEmailLinkPluginUI');
//     });

//     it('should be marked as official plugin', () => {
//       expect(AlightEmailLinkPluginUI.isOfficialPlugin).toBe(true);
//     });

//     it('should require proper plugins', () => {
//       expect(AlightEmailLinkPluginUI.requires).toContain(AlightEmailLinkPluginEditing);
//     });
//   });

//   describe('Command definitions', () => {
//     let command: AlightEmailLinkPluginCommand;
//     let unlinkCommand: AlightEmailUnlinkCommand;
//     let mockEditor: any;
//     let mockModel: any;
//     let mockSchema: any;
//     let mockDocument: any;
//     let mockSelection: any;
//     let mockWriter: any;
//     let mockRoot: any;

//     beforeEach(() => {
//       // Create mock for the writer
//       mockWriter = {
//         setAttribute: jasmine.createSpy('setAttribute'),
//         removeAttribute: jasmine.createSpy('removeAttribute'),
//         removeSelectionAttribute: jasmine.createSpy('removeSelectionAttribute'),
//         setSelection: jasmine.createSpy('setSelection'),
//         createPositionAt: jasmine.createSpy('createPositionAt').and.returnValue({ parent: {} })
//       };

//       // Mock root element
//       mockRoot = {
//         rootName: 'main',
//         document: {}
//       };

//       // Mock first position - needed for many command operations
//       const mockPosition = {
//         parent: {
//           is: () => false,
//           getAttributes: () => [['attribute', 'value']]
//         },
//         textNode: {
//           data: 'test@example.com',
//           hasAttribute: jasmine.createSpy('hasAttribute').and.returnValue(false),
//           getAttribute: jasmine.createSpy('getAttribute').and.returnValue('mailto:test@example.com'),
//           getAttributes: () => [['alightEmailLinkPluginHref', 'mailto:test@example.com']]
//         }
//       };

//       // Mock document selection with all needed methods
//       mockSelection = {
//         isCollapsed: false,
//         getFirstPosition: jasmine.createSpy('getFirstPosition').and.returnValue(mockPosition),
//         getLastPosition: jasmine.createSpy('getLastPosition').and.returnValue(mockPosition),
//         hasAttribute: jasmine.createSpy('hasAttribute').and.returnValue(false),
//         getAttribute: jasmine.createSpy('getAttribute').and.returnValue('mailto:test@example.com'),
//         getAttributes: () => [['alightEmailLinkPluginHref', 'mailto:test@example.com']],
//         getFirstRange: jasmine.createSpy('getFirstRange').and.returnValue({
//           getTrimmed: jasmine.createSpy('getTrimmed').and.returnValue({}),
//           getItems: () => []
//         }),
//         getRanges: jasmine.createSpy('getRanges').and.returnValue([{}]),
//         getSelectedElement: jasmine.createSpy('getSelectedElement').and.returnValue(null),
//         getSelectedBlocks: jasmine.createSpy('getSelectedBlocks').and.returnValue([]),
//         rangeCount: 1
//       };

//       // Mock document with selection
//       mockDocument = {
//         selection: mockSelection,
//         getRoot: jasmine.createSpy('getRoot').and.returnValue(mockRoot)
//       };

//       // Mock model schema with validation methods
//       mockSchema = {
//         checkAttribute: jasmine.createSpy('checkAttribute').and.returnValue(true),
//         checkAttributeInSelection: jasmine.createSpy('checkAttributeInSelection').and.returnValue(true),
//         getValidRanges: jasmine.createSpy('getValidRanges').and.returnValue([{}]),
//         getDefinition: jasmine.createSpy('getDefinition').and.returnValue({
//           allowAttributes: ['alightEmailLinkPluginHref', 'alightEmailLinkPluginOrgName']
//         })
//       };

//       // Mock model with document and schema
//       mockModel = {
//         document: mockDocument,
//         schema: mockSchema,
//         change: jasmine.createSpy('change').and.callFake((callback) => {
//           if (callback) {
//             callback(mockWriter);
//           }
//           return {};
//         }),
//         enqueueChange: jasmine.createSpy('enqueueChange').and.callFake((callback) => {
//           if (typeof callback === 'function') {
//             callback(mockWriter);
//           } else {
//             const secondCallback = arguments[1];
//             if (secondCallback) {
//               secondCallback(mockWriter);
//             }
//           }
//         }),
//         createRange: jasmine.createSpy('createRange').and.returnValue({}),
//         createSelection: jasmine.createSpy('createSelection').and.returnValue({
//           getFirstRange: () => ({})
//         }),
//         createRangeIn: jasmine.createSpy('createRangeIn').and.returnValue({
//           getItems: () => []
//         }),
//         createPositionAt: jasmine.createSpy('createPositionAt').and.returnValue({})
//       };

//       // Mock editor with model
//       mockEditor = {
//         model: mockModel,
//         commands: new Map([
//           ['link', { execute: jasmine.createSpy('execute') }]
//         ]),
//         t: (text: string) => text,
//         config: {
//           get: jasmine.createSpy('get').and.returnValue({
//             defaultProtocol: 'mailto:'
//           })
//         }
//       };

//       // Create command instances
//       command = new AlightEmailLinkPluginCommand(mockEditor);
//       unlinkCommand = new AlightEmailUnlinkCommand(mockEditor);
//     });

//     describe('AlightEmailLinkPluginCommand', () => {
//       it('should create command instance', () => {
//         expect(command).toBeDefined();
//       });

//       it('should have manualDecorators collection', () => {
//         expect(command.manualDecorators).toBeDefined();
//       });

//       it('should have automaticDecorators property', () => {
//         expect(command.automaticDecorators).toBeDefined();
//       });

//       it('should enable command when schema allows it', () => {
//         // Setup schema check to return true
//         mockSchema.checkAttributeInSelection.and.returnValue(true);
//         mockSelection.hasAttribute.and.returnValue(true);

//         // Call refresh to update the command state
//         command.refresh();

//         // Verify schema check was called
//         expect(mockSchema.checkAttributeInSelection).toHaveBeenCalled();

//         // Verify command is enabled
//         expect(command.isEnabled).toBe(true);
//       });

//       it('should execute with editor.model.change', () => {
//         // Setup callbacks to make execute work
//         mockModel.change.and.callFake((callback) => {
//           callback(mockWriter);
//           return true;
//         });

//         // Call execute
//         command.execute('mailto:test@example.com');

//         // Verify model.change was called
//         expect(mockModel.change).toHaveBeenCalled();
//       });

//       it('should execute with organization name', () => {
//         // Setup callbacks to make execute work
//         mockModel.change.and.callFake((callback) => {
//           callback(mockWriter);
//           return true;
//         });

//         // Call execute with organization
//         command.execute('mailto:test@example.com', { organization: 'Test Org' });

//         // Verify model.change was called
//         expect(mockModel.change).toHaveBeenCalled();
//       });

//       it('should update value from selection', () => {
//         // Setup selection to have the href attribute
//         mockSelection.hasAttribute.and.callFake((attrName) => {
//           return attrName === 'alightEmailLinkPluginHref';
//         });

//         mockSelection.getAttribute.and.callFake((attrName) => {
//           if (attrName === 'alightEmailLinkPluginHref') {
//             return 'mailto:test@example.com';
//           }
//           return undefined;
//         });

//         // Call refresh to update the command state
//         command.refresh();

//         // Verify value was updated
//         expect(command.value).toBe('mailto:test@example.com');
//       });
//     });

//     describe('AlightEmailUnlinkCommand', () => {
//       it('should create command instance', () => {
//         expect(unlinkCommand).toBeDefined();
//       });

//       it('should enable command when schema allows it', () => {
//         // Setup schema check to return true
//         mockSchema.checkAttributeInSelection.and.returnValue(true);

//         // Call refresh to update the command state
//         unlinkCommand.refresh();

//         // Verify schema check was called
//         expect(mockSchema.checkAttributeInSelection).toHaveBeenCalled();

//         // Verify command is enabled
//         expect(unlinkCommand.isEnabled).toBe(true);
//       });

//       it('should execute with editor.model.change', () => {
//         // Setup callbacks to make execute work
//         mockModel.change.and.callFake((callback) => {
//           callback(mockWriter);
//           return {};
//         });

//         // Setup findAttributeRange for selection.isCollapsed case
//         const { findAttributeRange } = require('@ckeditor/ckeditor5-typing');
//         spyOn(findAttributeRange, 'findAttributeRange').and.returnValue({});

//         // Call execute
//         unlinkCommand.execute();

//         // Verify model.change was called
//         expect(mockModel.change).toHaveBeenCalled();
//       });

//       it('should operate on selection ranges', () => {
//         // Setup callbacks to make execute work
//         mockModel.change.and.callFake((callback) => {
//           callback(mockWriter);
//           return {};
//         });

//         // Setup selection to have ranges
//         mockSelection.isCollapsed = false;
//         mockSchema.getValidRanges.and.returnValue([{}]);

//         // Call execute
//         unlinkCommand.execute();

//         // Verify getValidRanges was called for non-collapsed selection
//         expect(mockSchema.getValidRanges).toHaveBeenCalled();
//       });
//     });
//   });

//   describe('Email Address Detection', () => {
//     it('should detect email addresses with isEmail util', () => {
//       expect(utils.isEmail('test@example.com')).toBe(true);
//       expect(utils.isEmail('invalid')).toBe(false);
//       expect(utils.isEmail('test@example')).toBe(false);
//       expect(utils.isEmail('mailto:test@example.com')).toBe(true);
//     });

//     it('should add mailto protocol when needed', () => {
//       expect(utils.addLinkProtocolIfApplicable('test@example.com', 'mailto:')).toBe('mailto:test@example.com');
//       expect(utils.addLinkProtocolIfApplicable('mailto:test@example.com', 'mailto:')).toBe('mailto:test@example.com');
//       expect(utils.addLinkProtocolIfApplicable('https://example.com', 'mailto:')).toBe('https://example.com');
//     });

//     it('should ensure safe URLs', () => {
//       expect(utils.ensureSafeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
//       expect(utils.ensureSafeUrl('javascript:alert(1)')).toBe('#'); // Should sanitize unsafe protocols
//     });
//   });

//   describe('Link Creation and Formatting', () => {
//     it('should create proper link elements with createLinkElement util', () => {
//       // Create a mock writer and conversion API
//       const mockWriter = {
//         createAttributeElement: jasmine.createSpy('createAttributeElement').and.returnValue({
//           name: 'a',
//           getAttribute: (name: string) => name === 'href' ? 'mailto:test@example.com' : null
//         }),
//         setCustomProperty: jasmine.createSpy('setCustomProperty')
//       };

//       const mockConversionApi = {
//         writer: mockWriter,
//         attrs: {
//           orgnameattr: 'Test Org'
//         }
//       };

//       // Call createLinkElement
//       const element = utils.createLinkElement('mailto:test@example.com', mockConversionApi as any);

//       // Verify the writer methods were called with right parameters
//       expect(mockWriter.createAttributeElement).toHaveBeenCalledWith('a', {
//         href: 'mailto:test@example.com',
//         'data-id': 'email_link',
//         orgnameattr: 'Test Org'
//       }, { priority: 5 });

//       expect(mockWriter.setCustomProperty).toHaveBeenCalledWith('alight-email-link', true, jasmine.any(Object));
//     });

//     it('should handle organization name extraction in email links', () => {
//       // Test extractOrganization util
//       expect(utils.extractOrganization('test@example.com (Test Org)')).toBe('Test Org');
//       expect(utils.extractOrganization('test@example.com')).toBe(null);
//     });

//     it('should format links with organization name', () => {
//       // Test formatEmailWithOrganization util
//       expect(utils.formatEmailWithOrganization('test@example.com', 'Test Org')).toBe('test@example.com (Test Org)');
//       expect(utils.formatEmailWithOrganization('test@example.com', null)).toBe('test@example.com');
//     });

//     it('should extract emails from mailto links', () => {
//       expect(utils.extractEmail('mailto:test@example.com')).toBe('test@example.com');
//       expect(utils.extractEmail('test@example.com')).toBe('test@example.com');
//     });

//     it('should ensure mailto: prefix for email links', () => {
//       expect(utils.ensureMailtoLink('test@example.com')).toBe('mailto:test@example.com');
//       expect(utils.ensureMailtoLink('mailto:test@example.com')).toBe('mailto:test@example.com');
//       expect(utils.ensureMailtoLink('https://example.com')).toBe('https://example.com');
//     });

//     it('should detect mailto links', () => {
//       expect(utils.isMailtoLink('mailto:test@example.com')).toBe(true);
//       expect(utils.isMailtoLink('test@example.com')).toBe(false);
//     });

//     it('should extract organization name from links', () => {
//       expect(utils.extractOrganizationName('test@example.com (Test Org)')).toBe('Test Org');
//       expect(utils.extractOrganizationName('test@example.com')).toBe(null);
//     });

//     it('should add organization to text', () => {
//       expect(utils.addOrganizationToText('test@example.com', 'Test Org')).toBe('test@example.com (Test Org)');
//       expect(utils.addOrganizationToText('test@example.com', null)).toBe('test@example.com');
//     });

//     it('should remove organization from text', () => {
//       expect(utils.removeOrganizationFromText('test@example.com (Test Org)')).toBe('test@example.com');
//       expect(utils.removeOrganizationFromText('test@example.com')).toBe('test@example.com');
//     });

//     it('should get domain for display', () => {
//       expect(utils.getDomainForDisplay('https://www.example.com/path')).toBe('example.com');
//       expect(utils.getDomainForDisplay('https://example.com')).toBe('example.com');
//     });

//     it('should create link display text with organization', () => {
//       expect(utils.createLinkDisplayText('https://example.com', 'Test Org')).toBe('example.com (Test Org)');
//       expect(utils.createLinkDisplayText('https://example.com')).toBe('example.com');
//     });
//   });
// });
