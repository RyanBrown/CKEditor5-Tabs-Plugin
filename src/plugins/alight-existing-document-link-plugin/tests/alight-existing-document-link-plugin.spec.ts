// // src/plugins/alight-existing-document-link-plugin/tests/alight-existing-document-link-plugin.spec.ts
// // Mock imports for CKEditor test utilities
// import ClassicTestEditor from '@ckeditor/ckeditor5-core/tests/_utils/classictesteditor';
// import ModelTestEditor from '@ckeditor/ckeditor5-core/tests/_utils/modeltesteditor';
// import { getData as getModelData, setData as setModelData } from '@ckeditor/ckeditor5-engine/tests/_utils/model';
// import { getData as getViewData } from '@ckeditor/ckeditor5-engine/tests/_utils/view';
// import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
// import ClickObserver from '@ckeditor/ckeditor5-engine/src/view/observer/clickobserver';
// import global from '@ckeditor/ckeditor5-utils/src/dom/global';
// import { isWidget } from '@ckeditor/ckeditor5-widget';
// import { KeystrokeHandler } from '@ckeditor/ckeditor5-utils';
// import { Collection } from '@ckeditor/ckeditor5-utils';
// import { TextWatcher } from '@ckeditor/ckeditor5-typing';
// import Delete from '@ckeditor/ckeditor5-typing/src/delete';
// import Link from '@ckeditor/ckeditor5-link/src/link';
// import TwoStepCaretMovement from '@ckeditor/ckeditor5-typing/src/twostepcaretmovement';
// import Input from '@ckeditor/ckeditor5-typing/src/input';
// import ClipboardPipeline from '@ckeditor/ckeditor5-clipboard/src/clipboardpipeline';
// import { keyCodes } from '@ckeditor/ckeditor5-utils/src/keyboard';

// // Import the plugin components
// import AlightExistingDocumentLinkPlugin from '../link';
// import AlightExistingDocumentLinkPluginEditing from '../linkediting';
// import AlightExistingDocumentLinkPluginUI from '../linkui';
// import AlightExistingDocumentLinkPluginAutoLink from '../autolink';
// import AlightExistingDocumentLinkPluginCommand from '../linkcommand';
// import AlightExistingDocumentLinkPluginUnlinkCommand from '../unlinkcommand';
// import AlightExternalLinkPluginIntegration from '../linkpluginintegration';
// import * as utils from '../utils';

// // Define interfaces for better type safety
// interface EditorInstance {
//   model: any;
//   editing: any;
//   plugins: any;
//   commands: any;
//   config: any;
//   setData: (data: string) => void;
//   destroy: () => Promise<void>;
// }

// interface ModelInstance {
//   document: any;
//   schema: any;
//   change: (callback: (writer: any) => any) => any;
//   on: (event: string, callback: Function) => void;
// }

// interface PluginInstance {
//   init: () => void;
//   listenTo: any;
//   _enableLinkOpen: () => void;
// }

// interface CommandInstance {
//   isEnabled: boolean;
//   value: any;
//   manualDecorators: any;
//   automaticDecorators: any;
//   refresh: () => void;
//   execute: (href: string) => void;
//   on: (event: string, callback: Function) => void;
//   restoreManualDecoratorStates: () => void;
// }

// describe('AlightExistingDocumentLinkPlugin', () => {
//   let element: HTMLElement;
//   let editor: EditorInstance;
//   let model: ModelInstance;

//   beforeEach(() => {
//     element = global.document.createElement('div');
//     global.document.body.appendChild(element);

//     return ClassicTestEditor.create(element, {
//       plugins: [
//         Paragraph,
//         AlightExistingDocumentLinkPlugin
//       ],
//       link: {
//         defaultProtocol: 'http://'
//       }
//     }).then((newEditor: EditorInstance) => {
//       editor = newEditor;
//       model = editor.model;
//     });
//   });

//   afterEach(() => {
//     element.remove();
//     return editor.destroy();
//   });

//   it('should be loaded', () => {
//     const plugin = editor.plugins.get('AlightExistingDocumentLinkPlugin');
//     expect(plugin).toBeDefined();
//     expect(plugin instanceof AlightExistingDocumentLinkPlugin).toBeTruthy();
//   });

//   it('should have proper plugin name', () => {
//     expect(AlightExistingDocumentLinkPlugin.pluginName).toEqual('AlightExistingDocumentLinkPlugin');
//   });

//   it('should require proper plugins', () => {
//     expect(AlightExistingDocumentLinkPlugin.requires).toContain(AlightExistingDocumentLinkPluginEditing);
//     expect(AlightExistingDocumentLinkPlugin.requires).toContain(AlightExistingDocumentLinkPluginUI);
//     expect(AlightExistingDocumentLinkPlugin.requires).toContain(AlightExistingDocumentLinkPluginAutoLink);
//     expect(AlightExistingDocumentLinkPlugin.requires).toContain(AlightExternalLinkPluginIntegration);
//   });

//   it('should handle link interception for existing document links', () => {
//     // Initialize the plugin manually to test init() method
//     const plugin = new AlightExistingDocumentLinkPlugin(editor) as PluginInstance;
//     plugin.init();

//     // Create a spy to track model changes
//     const changeSpy = jasmine.createSpy('change spy');
//     model.on('change', changeSpy);

//     // Insert a document that should be treated as an existing document link
//     setModelData(model, '<paragraph>[]</paragraph>');
//     model.change((writer: any) => {
//       const text = writer.createText('Test document link', {
//         alightExistingDocumentLinkPluginHref: 'test-document-123'
//       });
//       writer.insert(text, model.document.getRoot().getChild(0), 0);
//     });

//     // The model change should have occurred
//     expect(changeSpy).toHaveBeenCalled();

//     // The link should have the appropriate attributes
//     expect(getModelData(model)).toContain('alightExistingDocumentLinkPluginHref="test-document-123"');
//   });
// });

// describe('AlightExistingDocumentLinkPluginEditing', () => {
//   let element: HTMLElement;
//   let editor: EditorInstance;
//   let model: ModelInstance;
//   let view: any;
//   let editing: any;

//   beforeEach(() => {
//     element = global.document.createElement('div');
//     global.document.body.appendChild(element);

//     return ClassicTestEditor.create(element, {
//       plugins: [
//         Paragraph,
//         AlightExistingDocumentLinkPluginEditing
//       ],
//       link: {
//         defaultProtocol: 'http://'
//       }
//     }).then((newEditor: EditorInstance) => {
//       editor = newEditor;
//       model = editor.model;
//       view = editor.editing.view;
//       editing = editor.editing;
//     });
//   });

//   afterEach(() => {
//     element.remove();
//     return editor.destroy();
//   });

//   it('should be loaded', () => {
//     const plugin = editor.plugins.get('AlightExistingDocumentLinkPluginEditing');
//     expect(plugin).toBeDefined();
//     expect(plugin instanceof AlightExistingDocumentLinkPluginEditing).toBeTruthy();
//   });

//   it('should have proper plugin name', () => {
//     expect(AlightExistingDocumentLinkPluginEditing.pluginName).toEqual('AlightExistingDocumentLinkPluginEditing');
//   });

//   it('should require proper plugins', () => {
//     expect(AlightExistingDocumentLinkPluginEditing.requires).toEqual([TwoStepCaretMovement, Input, ClipboardPipeline]);
//   });

//   it('should set proper schema rules', () => {
//     expect(model.schema.checkAttribute(['$text'], 'alightExistingDocumentLinkPluginHref')).toBe(true);
//     expect(model.schema.checkAttribute(['$text'], 'AlightExistingDocumentPluginLinkName')).toBe(true);
//     expect(model.schema.checkAttribute(['$text'], 'AlightExistingDocumentLinkPluginFormat')).toBe(true);
//     expect(model.schema.checkAttribute(['$text'], 'orgnameattr')).toBe(true);
//   });

//   it('should register proper commands', () => {
//     expect(editor.commands.get('alight-existing-document-link')).toBeInstanceOf(AlightExistingDocumentLinkPluginCommand);
//     expect(editor.commands.get('alight-existing-document-unlink')).toBeInstanceOf(AlightExistingDocumentLinkPluginUnlinkCommand);
//   });

//   it('should convert link element from model to view', () => {
//     setModelData(model, '<paragraph><$text alightExistingDocumentLinkPluginHref="test-document-123">Test link</$text></paragraph>');

//     expect(getViewData(view)).toContain('href="test-document-123"');
//     expect(getViewData(view)).toContain('data-id="existing-document_link"');
//     expect(getViewData(view)).toContain('class="document_tag"');
//   });

//   it('should convert link element from view to model', () => {
//     editor.setData('<p><a href="https://example.com">Test link</a></p>');

//     expect(getModelData(model)).toContain('alightExistingDocumentLinkPluginHref="https://example.com"');
//   });

//   it('should convert custom document_tag links', () => {
//     // This test is more complex and would need manually creating view elements and conversion
//     // For now we test if the converter is registered
//     const plugin = editor.plugins.get('AlightExistingDocumentLinkPluginEditing');
//     expect(plugin).toBeDefined();
//   });

//   it('should handle link following by CTRL+click', () => {
//     // Create a spy on event handling
//     const spy = jasmine.createSpy('click handler');
//     const plugin = editor.plugins.get('AlightExistingDocumentLinkPluginEditing') as PluginInstance;
//     plugin.listenTo = spy;

//     // Re-initialize to test _enableLinkOpen
//     plugin._enableLinkOpen();

//     // Verify that listenTo was called
//     expect(spy).toHaveBeenCalled();
//   });

//   it('should enable clipboard integration for adding protocol to pasted links', () => {
//     // Create a link in a document
//     setModelData(model, '<paragraph>[]</paragraph>');

//     // Simulate pasting content with links without protocol
//     const inputData = {
//       content: model.change((writer: any) => {
//         const text = writer.createText('example.com', {
//           alightExistingDocumentLinkPluginHref: 'example.com'
//         });
//         const paragraph = writer.createElement('paragraph');
//         writer.append(text, paragraph);
//         return paragraph;
//       })
//     };

//     // Trigger the contentInsertion event
//     editor.plugins.get('ClipboardPipeline').fire('contentInsertion', inputData);

//     // The model should update the href with the default protocol
//     const href = inputData.content.getChild(0).getAttribute('alightExistingDocumentLinkPluginHref');
//     expect(href).toBe('http://example.com');
//   });
// });

// describe('AlightExistingDocumentLinkPluginCommand', () => {
//   let editor: EditorInstance;
//   let model: ModelInstance;
//   let command: CommandInstance;

//   beforeEach(() => {
//     return ModelTestEditor.create({
//       plugins: [Paragraph]
//     }).then((newEditor: EditorInstance) => {
//       editor = newEditor;
//       model = editor.model;
//       command = new AlightExistingDocumentLinkPluginCommand(editor) as CommandInstance;
//       editor.commands.add('alight-existing-document-link', command);

//       // Set up schema
//       model.schema.extend('$text', {
//         allowAttributes: [
//           'alightExistingDocumentLinkPluginHref',
//           'alightExistingDocumentLinkPluginFormat',
//           'alightExistingDocumentPluginLinkName',
//           'orgnameattr'
//         ]
//       });

//       // Register a test image element for linkable element tests
//       model.schema.register('image', {
//         allowWhere: '$block',
//         isObject: true,
//         isBlock: true,
//         allowAttributes: ['alightExistingDocumentLinkPluginHref']
//       });
//     });
//   });

//   afterEach(() => {
//     return editor.destroy();
//   });

//   it('should have proper properties', () => {
//     expect(command.value).toBeUndefined();
//     expect(command.manualDecorators).toBeInstanceOf(Collection);
//     expect(command.automaticDecorators).toBeDefined();
//   });

//   describe('refresh()', () => {
//     it('should be disabled when selection is not in link', () => {
//       setModelData(model, '<paragraph>foo[]</paragraph>');
//       command.refresh();

//       expect(command.isEnabled).toBe(false);
//       expect(command.value).toBeUndefined();
//     });

//     it('should be enabled when selection is in link', () => {
//       setModelData(model, '<paragraph><$text alightExistingDocumentLinkPluginHref="url">foo[]</$text></paragraph>');
//       command.refresh();

//       expect(command.isEnabled).toBe(true);
//       expect(command.value).toBe('url');
//     });

//     it('should be enabled for linkable element', () => {
//       setModelData(model, '[<image alightExistingDocumentLinkPluginHref="url"></image>]');
//       command.refresh();

//       expect(command.isEnabled).toBe(true);
//       expect(command.value).toBe('url');
//     });
//   });

//   describe('execute()', () => {
//     it('should create a link in selection', () => {
//       setModelData(model, '<paragraph>f[oo]</paragraph>');
//       command.execute('url');

//       expect(getModelData(model)).toBe('<paragraph>f<$text alightExistingDocumentLinkPluginHref="url">oo</$text></paragraph>');
//     });

//     it('should create a link on selected linkable element', () => {
//       setModelData(model, '[<image></image>]');
//       command.execute('url');

//       expect(getModelData(model)).toBe('[<image alightExistingDocumentLinkPluginHref="url"></image>]');
//     });

//     it('should update existing link', () => {
//       setModelData(model, '<paragraph><$text alightExistingDocumentLinkPluginHref="old-url">f[]oo</$text></paragraph>');
//       command.execute('new-url');

//       expect(getModelData(model)).toBe('<paragraph><$text alightExistingDocumentLinkPluginHref="new-url">foo</$text></paragraph>');
//     });

//     it('should remove orgnameattr when updating a link', () => {
//       setModelData(model, '<paragraph><$text alightExistingDocumentLinkPluginHref="url" orgnameattr="test">f[]oo</$text></paragraph>');
//       command.execute('new-url');

//       expect(getModelData(model)).not.toContain('orgnameattr');
//     });

//     it('should handle existing document links with special attributes', () => {
//       setModelData(model, '<paragraph>f[oo]</paragraph>');
//       command.execute('test-document-123');

//       expect(getModelData(model)).toContain('alightExistingDocumentLinkPluginHref="test-document-123"');
//       expect(getModelData(model)).toContain('alightExistingDocumentLinkPluginFormat="standard"');
//       expect(getModelData(model)).toContain('alightExistingDocumentPluginLinkName="test-document-123"');
//     });

//     it('should fire events after execution', () => {
//       const spy = jasmine.createSpy('execute event');
//       command.on('executed', spy);

//       setModelData(model, '<paragraph>f[oo]</paragraph>');
//       command.execute('url');

//       expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({
//         href: 'url'
//       }), jasmine.any(Object));
//     });
//   });

//   describe('restoreManualDecoratorStates()', () => {
//     it('should restore decorator states from model', () => {
//       // Create decorator
//       const decorator = {
//         id: 'testDecorator',
//         value: false
//       };
//       command.manualDecorators.add(decorator);

//       // Add schema rule
//       model.schema.extend('$text', { allowAttributes: 'testDecorator' });

//       // Create text with decorator
//       setModelData(model, '<paragraph><$text alightExistingDocumentLinkPluginHref="url" testDecorator="true">foo[]</$text></paragraph>');
//       command.refresh();

//       // Restore decorator state
//       command.restoreManualDecoratorStates();

//       expect(decorator.value).toBe(true);
//     });
//   });
// });

// describe('AlightExistingDocumentLinkPluginUnlinkCommand', () => {
//   let editor: EditorInstance;
//   let model: ModelInstance;
//   let command: CommandInstance;

//   beforeEach(() => {
//     return ModelTestEditor.create({
//       plugins: [Paragraph]
//     }).then((newEditor: EditorInstance) => {
//       editor = newEditor;
//       model = editor.model;
//       command = new AlightExistingDocumentLinkPluginUnlinkCommand(editor) as CommandInstance;
//       editor.commands.add('alight-existing-document-unlink', command);

//       // Add a link command for testing manual decorators
//       const linkCommand = new AlightExistingDocumentLinkPluginCommand(editor) as CommandInstance;
//       editor.commands.add('alight-existing-document-link', linkCommand);

//       // Set up schema
//       model.schema.extend('$text', {
//         allowAttributes: [
//           'alightExistingDocumentLinkPluginHref',
//           'alightExistingDocumentLinkPluginFormat',
//           'alightExistingDocumentPluginLinkName',
//           'orgnameattr'
//         ]
//       });

//       // Register a test image element for linkable element tests
//       model.schema.register('image', {
//         allowWhere: '$block',
//         isObject: true,
//         isBlock: true,
//         allowAttributes: ['alightExistingDocumentLinkPluginHref']
//       });
//     });
//   });

//   afterEach(() => {
//     return editor.destroy();
//   });

//   describe('refresh()', () => {
//     it('should be disabled when selection is not in link', () => {
//       setModelData(model, '<paragraph>foo[]</paragraph>');
//       command.refresh();

//       expect(command.isEnabled).toBe(false);
//     });

//     it('should be enabled when selection is in link', () => {
//       setModelData(model, '<paragraph><$text alightExistingDocumentLinkPluginHref="url">foo[]</$text></paragraph>');
//       command.refresh();

//       expect(command.isEnabled).toBe(true);
//     });

//     it('should be enabled for linkable element', () => {
//       setModelData(model, '[<image alightExistingDocumentLinkPluginHref="url"></image>]');
//       command.refresh();

//       expect(command.isEnabled).toBe(true);
//     });
//   });

//   describe('execute()', () => {
//     it('should remove link from collapsed selection', () => {
//       setModelData(model, '<paragraph><$text alightExistingDocumentLinkPluginHref="url">foo[]bar</$text></paragraph>');
//       command.execute();

//       expect(getModelData(model)).toBe('<paragraph>foo[]bar</paragraph>');
//     });

//     it('should remove link from selected text', () => {
//       setModelData(model, '<paragraph><$text alightExistingDocumentLinkPluginHref="url">foo[bar]baz</$text></paragraph>');
//       command.execute();

//       expect(getModelData(model)).toContain('<$text alightExistingDocumentLinkPluginHref="url">foo</$text>[bar]<$text alightExistingDocumentLinkPluginHref="url">baz</$text>');
//     });

//     it('should remove all link-related attributes', () => {
//       setModelData(model, '<paragraph><$text alightExistingDocumentLinkPluginHref="url" alightExistingDocumentLinkPluginFormat="standard" alightExistingDocumentPluginLinkName="test" orgnameattr="test">foo[]bar</$text></paragraph>');
//       command.execute();

//       expect(getModelData(model)).not.toContain('alightExistingDocumentLinkPluginHref');
//       expect(getModelData(model)).not.toContain('alightExistingDocumentLinkPluginFormat');
//       expect(getModelData(model)).not.toContain('alightExistingDocumentPluginLinkName');
//       expect(getModelData(model)).not.toContain('orgnameattr');
//     });

//     it('should remove manual decorator attributes', () => {
//       // Add decorator to the command and schema
//       const linkCommand = editor.commands.get('alight-existing-document-link') as CommandInstance;
//       const decorator = {
//         id: 'testDecorator'
//       };
//       linkCommand.manualDecorators.add(decorator);
//       model.schema.extend('$text', { allowAttributes: 'testDecorator' });

//       // Set up text with link and decorator
//       setModelData(model, '<paragraph><$text alightExistingDocumentLinkPluginHref="url" testDecorator="true">foo[]bar</$text></paragraph>');

//       // Execute unlink
//       command.execute();

//       // Check that decorator was also removed
//       expect(getModelData(model)).not.toContain('testDecorator');
//     });
//   });
// });

// describe('AlightExistingDocumentLinkPluginAutoLink', () => {
//   let editor: EditorInstance;
//   let model: ModelInstance;
//   let autoLink: any;

//   beforeEach(() => {
//     return ModelTestEditor.create({
//       plugins: [
//         Paragraph,
//         AlightExistingDocumentLinkPluginEditing,
//         AlightExistingDocumentLinkPluginAutoLink,
//         TwoStepCaretMovement,
//         Input,
//         Delete,
//         ClipboardPipeline
//       ],
//       link: {
//         defaultProtocol: 'http://'
//       }
//     }).then((newEditor: EditorInstance) => {
//       editor = newEditor;
//       model = editor.model;
//       autoLink = editor.plugins.get('AlightExistingDocumentLinkPluginAutoLink');
//     });
//   });

//   afterEach(() => {
//     return editor.destroy();
//   });

//   it('should be loaded correctly', () => {
//     expect(autoLink instanceof AlightExistingDocumentLinkPluginAutoLink).toBe(true);
//   });

//   it('should have proper plugin name', () => {
//     expect(AlightExistingDocumentLinkPluginAutoLink.pluginName).toEqual('AlightExistingDocumentLinkPluginAutoLink');
//   });

//   it('should require AlightExistingDocumentLinkPluginEditing and Delete', () => {
//     expect(AlightExistingDocumentLinkPluginAutoLink.requires).toContain(AlightExistingDocumentLinkPluginEditing);
//     expect(AlightExistingDocumentLinkPluginAutoLink.requires).toContain(Delete);
//   });

//   it('should auto-link URL when typing space after it', () => {
//     // Create a TextWatcher for testing
//     const watcher = new TextWatcher(editor.model, (text: string) => {
//       // Basic simulation of the TextWatcher logic from the plugin
//       if (text.endsWith(' ') && text.length > 5) {
//         const url = text.slice(0, -1);
//         if (url.startsWith('http://')) {
//           return {
//             url,
//             removedTrailingCharacters: 1
//           };
//         }
//       }
//       return null;
//     });

//     // Spy on the TextWatcher's event
//     const spy = jasmine.createSpy('matched:data event');
//     watcher.on('matched:data', spy);

//     // Trigger the text checking with a URL
//     watcher.check('http://example.com ');

//     // The event should have been fired with the URL
//     expect(spy).toHaveBeenCalled();
//     expect(spy.calls.argsFor(0)[1].url).toBe('http://example.com');
//   });

//   it('should be disabled when selection is in a code block', () => {
//     // Register code block in schema
//     model.schema.register('codeBlock', {
//       allowWhere: '$block',
//       allowChildren: '$text'
//     });

//     // Set selection in a code block
//     setModelData(model, '<codeBlock>[]</codeBlock>');

//     // Trigger selection change
//     model.document.selection.fire('change:range');

//     // Plugin should be disabled
//     expect(autoLink.isEnabled).toBe(false);
//   });

//   it('should auto-link when pasting URL over selection', () => {
//     // Set up data with selection
//     setModelData(model, '<paragraph>[text]</paragraph>');

//     // Create mock clipboard data with URL
//     const data = {
//       dataTransfer: {
//         getData: (type: string) => type === 'text/plain' ? 'http://example.com' : ''
//       },
//       method: 'paste'
//     };

//     // Spy on link command execution
//     const linkCommand = editor.commands.get('alight-existing-document-link') as CommandInstance;
//     const spy = spyOn(linkCommand, 'execute');

//     // Simulate clipboard paste
//     const clipboardPipeline = editor.plugins.get('ClipboardPipeline');
//     clipboardPipeline.fire('inputTransformation', data);

//     // Link command should have been executed with the URL
//     expect(spy).toHaveBeenCalledWith('http://example.com');
//   });
// });

// describe('AlightExternalLinkPluginIntegration', () => {
//   let element: HTMLElement;
//   let editor: EditorInstance;
//   let plugin: PluginInstance;

//   beforeEach(() => {
//     element = global.document.createElement('div');
//     global.document.body.appendChild(element);

//     // Mock the Link plugin
//     const mockLinkUI = {
//       _showUI: jasmine.createSpy('_showUI'),
//     };

//     const mockLinkCommand = {
//       on: jasmine.createSpy('on'),
//     };

//     return ClassicTestEditor.create(element, {
//       plugins: [Paragraph, AlightExistingDocumentLinkPlugin]
//     }).then((newEditor: EditorInstance) => {
//       editor = newEditor;

//       // Mock the Link plugin being available
//       spyOn(editor.plugins, 'has').and.returnValue(true);
//       spyOn(editor.plugins, 'get').and.callFake((name: string) => {
//         if (name === 'LinkUI') return mockLinkUI;
//         if (name === 'link') return mockLinkCommand;
//         if (name === 'AlightExistingDocumentLinkPluginUI') return { showUI: jasmine.createSpy('showUI') };
//         return editor.plugins.get(name);
//       });

//       // Create and initialize the plugin
//       plugin = new AlightExternalLinkPluginIntegration(editor) as PluginInstance;
//       plugin.init();
//     });
//   });

//   afterEach(() => {
//     element.remove();
//     return editor.destroy();
//   });

//   it('should have proper plugin name', () => {
//     expect(AlightExternalLinkPluginIntegration.pluginName).toEqual('AlightExternalLinkPluginIntegration');
//   });

//   it('should override standard LinkUI._showUI method', () => {
//     const standardLinkUI = editor.plugins.get('LinkUI');

//     // The original method should have been bound to a new function
//     expect(standardLinkUI._showUI).toBeDefined();
//   });

//   it('should listen to standard link command execute event', () => {
//     const linkCommand = editor.plugins.get('link');

//     // Should have registered a listener
//     expect(linkCommand.on).toHaveBeenCalledWith('execute', jasmine.any(Function), jasmine.objectContaining({ priority: 'high' }));
//   });
// });

// describe('Utils', () => {
//   describe('isLinkElement()', () => {
//     it('should return true for elements with alight-existing-document-link custom property', () => {
//       const element = {
//         is: () => true,
//         getCustomProperty: (name: string) => name === 'alight-existing-document-link'
//       };

//       expect(utils.isLinkElement(element as any)).toBe(true);
//     });

//     it('should return true for elements with document_tag class', () => {
//       const element = {
//         is: () => true,
//         getCustomProperty: () => false,
//         hasClass: (className: string) => className === 'document_tag'
//       };

//       expect(utils.isLinkElement(element as any)).toBe(true);
//     });

//     it('should return true for elements with data-id="existing-document_link" attribute', () => {
//       const element = {
//         is: () => true,
//         getCustomProperty: () => false,
//         hasClass: () => false,
//         getAttribute: (name: string) => name === 'data-id' ? 'existing-document_link' : null
//       };

//       expect(utils.isLinkElement(element as any)).toBe(true);
//     });

//     it('should return false for non-link elements', () => {
//       const element = {
//         is: () => false,
//         getCustomProperty: () => false,
//         hasClass: () => false,
//         getAttribute: () => null
//       };

//       expect(utils.isLinkElement(element as any)).toBe(false);
//     });
//   });

//   describe('isExistingDocumentLink()', () => {
//     it('should return true for valid existing document links', () => {
//       expect(utils.isExistingDocumentLink('test-document-123')).toBe(true);
//     });

//     it('should return false for null or undefined values', () => {
//       expect(utils.isExistingDocumentLink(null)).toBe(false);
//       expect(utils.isExistingDocumentLink(undefined)).toBe(false);
//       expect(utils.isExistingDocumentLink('')).toBe(false);
//     });
//   });

//   describe('createLinkElement()', () => {
//     it('should create a basic link element', () => {
//       const writer = {
//         createAttributeElement: jasmine.createSpy('createAttributeElement').and.returnValue({}),
//         setCustomProperty: jasmine.createSpy('setCustomProperty'),
//         addClass: jasmine.createSpy('addClass')
//       };

//       const downcaster = { writer };

//       utils.createLinkElement('https://example.com', downcaster);

//       expect(writer.createAttributeElement).toHaveBeenCalledWith('a', jasmine.objectContaining({
//         href: 'https://example.com'
//       }), jasmine.any(Object));

//       expect(writer.setCustomProperty).toHaveBeenCalledWith('alight-existing-document-link', true, jasmine.any(Object));
//     });

//     it('should create an existing document link element', () => {
//       const writer = {
//         createAttributeElement: jasmine.createSpy('createAttributeElement').and.returnValue({}),
//         setCustomProperty: jasmine.createSpy('setCustomProperty'),
//         addClass: jasmine.createSpy('addClass')
//       };

//       const downcaster = { writer };

//       utils.createLinkElement('test-document-123', downcaster);

//       expect(writer.createAttributeElement).toHaveBeenCalledWith('a', jasmine.objectContaining({
//         href: 'test-document-123',
//         'data-id': 'existing-document_link'
//       }), jasmine.any(Object));

//       expect(writer.addClass).toHaveBeenCalledWith('document_tag', jasmine.any(Object));
//     });
//   });

//   describe('ensureSafeUrl()', () => {
//     it('should return the same URL for safe URLs', () => {
//       expect(utils.ensureSafeUrl('https://example.com')).toBe('https://example.com');
//       expect(utils.ensureSafeUrl('http://example.com')).toBe('http://example.com');
//       expect(utils.ensureSafeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
//     });

//     it('should return # for unsafe URLs', () => {
//       expect(utils.ensureSafeUrl('javascript:alert(1)')).toBe('#');
//       expect(utils.ensureSafeUrl('data:text/html,<script>alert(1)</script>')).toBe('#');
//     });

//     it('should accept existing document links as safe', () => {
//       expect(utils.ensureSafeUrl('test-document-123')).toBe('test-document-123');
//     });
//   });

//   describe('getLocalizedDecorators()', () => {
//     it('should translate common decorator labels', () => {
//       const t = (label: string) => {
//         return {
//           'Open in a new tab': 'Open in a new window',
//           'Downloadable': 'Download this file'
//         }[label] || label;
//       };

//       const decorators = [
//         { id: 'linkNewTab', mode: 'manual', label: 'Open in a new tab' },
//         { id: 'linkDownload', mode: 'manual', label: 'Downloadable' },
//         { id: 'linkCustom', mode: 'manual', label: 'Custom label' }
//       ];

//       const result = utils.getLocalizedDecorators(t, decorators);

//       expect(result[0].label).toBe('Open in a new window');
//       expect(result[1].label).toBe('Download this file');
//       expect(result[2].label).toBe('Custom label'); // Not translated
//     });
//   });

//   describe('normalizeDecorators()', () => {
//     it('should convert decorator object to array with ids', () => {
//       const decorators = {
//         newTab: {
//           mode: 'manual',
//           label: 'Open in a new tab',
//           attributes: {
//             target: '_blank'
//           }
//         },
//         download: {
//           mode: 'automatic',
//           callback: (url?: string) => url?.endsWith('.pdf')
//         }
//       };

//       const result = utils.normalizeDecorators(decorators);

//       expect(result.length).toBe(2);
//       expect(result[0].id).toBe('linkNewTab');
//       expect(result[1].id).toBe('linkDownload');
//     });

//     it('should return empty array when decorators is undefined', () => {
//       const result = utils.normalizeDecorators(undefined);

//       expect(result).toEqual([]);
//     });
//   });

//   describe('isLinkableElement()', () => {
//     it('should return true for elements that allow alightExistingDocumentLinkPluginHref attribute', () => {
//       const element = {
//         name: 'image'
//       };

//       const schema = {
//         checkAttribute: jasmine.createSpy('checkAttribute').and.returnValue(true)
//       };

//       expect(utils.isLinkableElement(element as any, schema as any)).toBe(true);
//       expect(schema.checkAttribute).toHaveBeenCalledWith('image', 'alightExistingDocumentLinkPluginHref');
//     });

//     it('should return false for null or undefined elements', () => {
//       const schema = {
//         checkAttribute: jasmine.createSpy('checkAttribute')
//       };

//       expect(utils.isLinkableElement(null, schema as any)).toBe(false);
//       expect(schema.checkAttribute).not.toHaveBeenCalled();
//     });
//   });

//   describe('isEmail()', () => {
//     it('should return true for valid email addresses', () => {
//       expect(utils.isEmail('test@example.com')).toBe(true);
//       expect(utils.isEmail('user.name+tag@example.co.uk')).toBe(true);
//     });

//     it('should return false for invalid email addresses', () => {
//       expect(utils.isEmail('not-an-email')).toBe(false);
//       expect(utils.isEmail('missing@tld')).toBe(false);
//     });
//   });

//   describe('addLinkProtocolIfApplicable()', () => {
//     it('should add protocol to links without protocol', () => {
//       expect(utils.addLinkProtocolIfApplicable('example.com', 'http://')).toBe('http://example.com');
//     });

//     it('should add mailto: to email addresses', () => {
//       expect(utils.addLinkProtocolIfApplicable('test@example.com')).toBe('mailto:test@example.com');
//     });

//     it('should not modify links that already have protocol', () => {
//       expect(utils.addLinkProtocolIfApplicable('https://example.com', 'http://')).toBe('https://example.com');
//     });

//     it('should not modify existing document links', () => {
//       expect(utils.addLinkProtocolIfApplicable('test-document-123', 'http://')).toBe('test-document-123');
//     });
//   });

//   describe('linkHasProtocol()', () => {
//     it('should return true for links with protocol', () => {
//       expect(utils.linkHasProtocol('https://example.com')).toBe(true);
//       expect(utils.linkHasProtocol('http://example.com')).toBe(true);
//       expect(utils.linkHasProtocol('mailto:test@example.com')).toBe(true);
//     });

//     it('should return false for links without protocol', () => {
//       expect(utils.linkHasProtocol('example.com')).toBe(false);
//       expect(utils.linkHasProtocol('test@example.com')).toBe(false);
//     });
//   });

//   describe('extractExternalDocumentLinkId()', () => {
//     it('should extract document ID from links', () => {
//       expect(utils.extractExternalDocumentLinkId('test-document-123')).toBe('test-document-123');
//     });

//     it('should extract ID from ah:link name attribute', () => {
//       expect(utils.extractExternalDocumentLinkId('<ah:link name="test-document-123"></ah:link>')).toBe('test-document-123');
//     });

//     it('should return null for null, undefined, or empty values', () => {
//       expect(utils.extractExternalDocumentLinkId(null)).toBeNull();
//       expect(utils.extractExternalDocumentLinkId(undefined)).toBeNull();
//       expect(utils.extractExternalDocumentLinkId('')).toBeNull();
//     });
//   });

//   describe('hasDocumentTagClass()', () => {
//     it('should return true for elements with document_tag class', () => {
//       const element = {
//         hasClass: jasmine.createSpy('hasClass').and.returnValue(true)
//       };

//       expect(utils.hasDocumentTagClass(element as any)).toBe(true);
//       expect(element.hasClass).toHaveBeenCalledWith('document_tag');
//     });

//     it('should return false for elements without document_tag class', () => {
//       const element = {
//         hasClass: jasmine.createSpy('hasClass').and.returnValue(false)
//       };

//       expect(utils.hasDocumentTagClass(element as any)).toBe(false);
//     });
//   });

//   describe('filterLinkAttributes()', () => {
//     it('should filter unwanted attributes', () => {
//       const attributes = {
//         href: 'https://example.com',
//         'data-cke-saved-href': 'https://example.com',
//         target: '_blank'
//       };

//       const filtered = utils.filterLinkAttributes(attributes);

//       expect(filtered.href).toBe('https://example.com');
//       expect(filtered['data-cke-saved-href']).toBeUndefined();
//       expect(filtered.target).toBe('_blank');
//     });

//     it('should handle empty href for existing document links', () => {
//       const attributes = {
//         href: '',
//         'data-id': 'existing-document_link'
//       };

//       const filtered = utils.filterLinkAttributes(attributes);

//       expect(filtered.href).toBe('#existing-document-link');
//     });
//   });
// });
