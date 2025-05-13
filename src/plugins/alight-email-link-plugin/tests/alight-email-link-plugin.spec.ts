// src/plugins/alight-email-link-plugin/tests/alight-email-link-plugin.spec.ts
import AlightEmailLinkPlugin from '../link';
import AlightEmailLinkPluginEditing from '../linkediting';
import AlightEmailLinkPluginUI from '../linkui';
import AlightEmailAutoLink from '../autolink';
import EmailLinkHandler from '../emaillinkhandler';
import AlightEmailLinkPluginCommand from '../linkcommand';
import AlightEmailUnlinkCommand from '../unlinkcommand';
import LinkActionsView from '../ui/linkactionsview';
import * as utils from '../utils';

// Import the augmentation to properly extend EditorConfig
import '../augmentation';
import { Editor } from '@ckeditor/ckeditor5-core';

describe('AlightEmailLinkPlugin', () => {
  describe('plugin definition', () => {
    it('should have proper name', () => {
      expect(AlightEmailLinkPlugin.pluginName).toEqual('AlightEmailLinkPlugin');
    });

    it('should require proper plugins', () => {
      expect(AlightEmailLinkPlugin.requires).toEqual([
        AlightEmailLinkPluginEditing,
        AlightEmailLinkPluginUI,
        AlightEmailAutoLink,
        EmailLinkHandler
      ]);
    });

    it('should be marked as official plugin', () => {
      expect(AlightEmailLinkPlugin.isOfficialPlugin).toBe(true);
    });
  });

  describe('init()', () => {
    let plugin: AlightEmailLinkPlugin;
    let editor: Editor;
    let conversion: { attributeToElement: jasmine.Spy<jasmine.Func>; add: jasmine.Spy<jasmine.Func>; };

    beforeEach(() => {
      editor = {
        conversion: {
          for: () => conversion
        },
        commands: {
          get: jasmine.createSpy('get')
        },
        config: {
          get: jasmine.createSpy('get').and.returnValue({})
        },
        model: {
          document: {
            on: jasmine.createSpy('on')
          }
        },
        ui: {
          componentFactory: {
            add: jasmine.createSpy('add')
          }
        },
        on: jasmine.createSpy('on')
      };

      conversion = {
        attributeToElement: jasmine.createSpy('attributeToElement'),
        add: jasmine.createSpy('add')
      };

      plugin = new AlightEmailLinkPlugin(editor);
    });

    it('should initialize plugin', () => {
      // Mock editor.conversion.for() to return an object with attributeToElement
      editor.conversion.for = jasmine.createSpy('for').and.returnValue({
        attributeToElement: jasmine.createSpy('attributeToElement')
      });

      // Mock the command instance
      editor.commands.get.and.returnValue({ organization: 'Test Org' });

      // Call init
      plugin.init();

      // Verify conversion setup
      expect(editor.conversion.for).toHaveBeenCalledWith('dataDowncast');
      expect(editor.conversion.for).toHaveBeenCalledWith('editingDowncast');
    });

    it('should register toolbar button', () => {
      // Mock the config to enable toolbar button
      editor.config.get.and.returnValue({
        toolbar: { shouldAppearInToolbar: true }
      });

      // Call init
      plugin.init();

      // Verify component registration
      expect(editor.ui.componentFactory.add).toHaveBeenCalledWith('alightEmailLinkButton', jasmine.any(Function));
    });

    it('should setup mutation observer', () => {
      // Mock the document.getRoot() method
      editor.editing = {
        view: {
          getDomRoot: jasmine.createSpy('getDomRoot').and.returnValue(document.createElement('div')),
          document: {
            getRoot: jasmine.createSpy('getRoot').and.returnValue({})
          },
          createRangeIn: jasmine.createSpy('createRangeIn').and.returnValue({
            getItems: () => []
          }),
          change: jasmine.createSpy('change').and.callFake(cb => cb({}))
        },
        mapper: {
          toModelPosition: jasmine.createSpy('toModelPosition')
        }
      };

      // Mock MutationObserver
      global.MutationObserver = class MockMutationObserver {
        constructor(callback: any) {
          this.callback = callback;
        }
        observe() { }
        disconnect() { }
      };

      // Spy on MutationObserver constructor
      spyOn(global, 'MutationObserver').and.callThrough();

      // Call init
      plugin.init();

      // Trigger ready event manually
      const readyCallback = editor.on.calls.argsFor(0)[1];
      readyCallback();

      // Wait for setTimeout to execute
      jasmine.clock().install();
      jasmine.clock().tick(301);
      jasmine.clock().uninstall();

      // Verify MutationObserver was created
      expect(global.MutationObserver).toHaveBeenCalled();
    });

    it('should clean up observer on destroy', () => {
      // Create a real plugin instance and setup mock mutation observer
      plugin._mutationObserver = {
        disconnect: jasmine.createSpy('disconnect')
      };

      // Trigger destroy event
      const destroyCallback = editor.on.calls.argsFor(1)[1];
      destroyCallback();

      // Verify observer was disconnected
      expect(plugin._mutationObserver.disconnect).toHaveBeenCalled();
    });
  });

  describe('AlightEmailLinkPluginEditing', () => {
    it('should have proper name', () => {
      expect(AlightEmailLinkPluginEditing.pluginName).toEqual('AlightEmailLinkPluginEditing');
    });

    it('should be marked as official plugin', () => {
      expect(AlightEmailLinkPluginEditing.isOfficialPlugin).toBe(true);
    });

    it('should have proper required plugins', () => {
      expect(AlightEmailLinkPluginEditing.requires).toContain('TwoStepCaretMovement');
      expect(AlightEmailLinkPluginEditing.requires).toContain('Input');
      expect(AlightEmailLinkPluginEditing.requires).toContain('ClipboardPipeline');
    });

    describe('init()', () => {
      let plugin: AlightEmailLinkPluginEditing;
      let editor: Editor;
      let model;
      let schema: { extend: any; };
      let conversion;

      beforeEach(() => {
        schema = {
          extend: jasmine.createSpy('extend')
        };

        conversion = {
          attributeToElement: jasmine.createSpy('attributeToElement'),
          elementToAttribute: jasmine.createSpy('elementToAttribute'),
          attributeToAttribute: jasmine.createSpy('attributeToAttribute'),
          add: jasmine.createSpy('add')
        };

        model = {
          schema: schema
        };

        editor = {
          model: model,
          conversion: {
            for: jasmine.createSpy('for').and.returnValue(conversion)
          },
          commands: {
            add: jasmine.createSpy('add')
          },
          config: {
            define: jasmine.createSpy('define'),
            get: jasmine.createSpy('get').and.returnValue({})
          },
          plugins: {
            get: jasmine.createSpy('get').and.returnValue({
              registerAttribute: jasmine.createSpy('registerAttribute')
            }),
            has: jasmine.createSpy('has').and.returnValue(false)
          },
          t: (text: any) => text,
          ui: {
            componentFactory: {
              add: jasmine.createSpy('add')
            }
          },
          data: {
            on: jasmine.createSpy('on')
          }
        };

        plugin = new AlightEmailLinkPluginEditing(editor);
      });

      it('should configure schema and conversion', () => {
        // Call init
        plugin.init();

        // Verify schema was extended for text attributes
        expect(schema.extend).toHaveBeenCalledWith('$text', { allowAttributes: 'alightEmailLinkPluginHref' });
        expect(schema.extend).toHaveBeenCalledWith('$text', { allowAttributes: 'alightEmailLinkPluginOrgName' });

        // Verify conversion setup
        expect(editor.conversion.for).toHaveBeenCalledWith('dataDowncast');
        expect(editor.conversion.for).toHaveBeenCalledWith('editingDowncast');
        expect(editor.conversion.for).toHaveBeenCalledWith('upcast');

        // Verify commands were registered
        expect(editor.commands.add).toHaveBeenCalledWith('alight-email-link', jasmine.any(Object));
        expect(editor.commands.add).toHaveBeenCalledWith('alight-email-unlink', jasmine.any(Object));
      });

      it('should register link attribute with TwoStepCaretMovement', () => {
        // Call init
        plugin.init();

        // Verify attribute registration
        const twoStepCaretMovementPlugin = editor.plugins.get();
        expect(twoStepCaretMovementPlugin.registerAttribute).toHaveBeenCalledWith('alightEmailLinkPluginHref');
      });

      it('should set up clipboard integration when defaultProtocol is configured', () => {
        // Mock config to return a defaultProtocol
        editor.config.get.and.returnValue({ defaultProtocol: 'mailto:' });

        // Mock the ClipboardPipeline plugin
        const clipboardPipeline = {
          on: jasmine.createSpy('on')
        };
        editor.plugins.get.and.returnValue(clipboardPipeline);

        // Call init
        plugin.init();

        // Verify listener was added
        expect(clipboardPipeline.on).toHaveBeenCalledWith('contentInsertion', jasmine.any(Function), jasmine.any(Object));
      });
    });
  });

  describe('AlightEmailAutoLink', () => {
    it('should have proper name', () => {
      expect(AlightEmailAutoLink.pluginName).toEqual('AlightEmailAutoLink');
    });

    it('should be marked as official plugin', () => {
      expect(AlightEmailAutoLink.isOfficialPlugin).toBe(true);
    });

    it('should require appropriate plugins', () => {
      expect(AlightEmailAutoLink.requires).toContain('Delete');
      expect(AlightEmailAutoLink.requires).toContain(AlightEmailLinkPluginEditing);
    });

    describe('init() and afterInit()', () => {
      let plugin: AlightEmailAutoLink;
      let editor;
      let model: { document: any; change: any; schema?: { checkAttributeInSelection: jasmine.Spy<jasmine.Func>; }; enqueueChange?: jasmine.Spy<jasmine.Func>; createRangeIn?: jasmine.Spy<jasmine.Func>; createRange?: jasmine.Spy<jasmine.Func>; };
      let deletePlugin: { requestUndoOnBackspace: jasmine.Spy<jasmine.Func>; };
      let enterCommand: { on: any; };
      let shiftEnterCommand: { on: any; };
      let clipboardPipeline: { on: any; };

      beforeEach(() => {
        model = {
          document: {
            selection: {
              on: jasmine.createSpy('on'),
              anchor: {
                parent: {
                  is: jasmine.createSpy('is').and.returnValue(false)
                }
              }
            }
          },
          change: jasmine.createSpy('change').and.callFake(callback => {
            callback({
              setAttribute: jasmine.createSpy('setAttribute'),
              remove: jasmine.createSpy('remove'),
              insert: jasmine.createSpy('insert'),
              createText: jasmine.createSpy('createText').and.returnValue({})
            });
            return { enqueueChange: jasmine.createSpy('enqueueChange') };
          }),
          schema: {
            checkAttributeInSelection: jasmine.createSpy('checkAttributeInSelection').and.returnValue(true)
          },
          enqueueChange: jasmine.createSpy('enqueueChange'),
          createRangeIn: jasmine.createSpy('createRangeIn').and.returnValue({
            getItems: () => []
          }),
          createRange: jasmine.createSpy('createRange').and.returnValue({})
        };

        deletePlugin = {
          requestUndoOnBackspace: jasmine.createSpy('requestUndoOnBackspace')
        };

        enterCommand = {
          on: jasmine.createSpy('on')
        };

        shiftEnterCommand = {
          on: jasmine.createSpy('on')
        };

        clipboardPipeline = {
          on: jasmine.createSpy('on')
        };

        editor = {
          model: model,
          plugins: {
            get: jasmine.createSpy('get').and.callFake(name => {
              if (name === 'Delete') return deletePlugin;
              if (name === 'ClipboardPipeline') return clipboardPipeline;
              return null;
            })
          },
          commands: {
            get: jasmine.createSpy('get').and.callFake(name => {
              if (name === 'enter') return enterCommand;
              if (name === 'shiftEnter') return shiftEnterCommand;
              if (name === 'alight-email-link') return { isEnabled: true, execute: jasmine.createSpy('execute') };
              return null;
            })
          },
          config: {
            get: jasmine.createSpy('get').and.returnValue(null)
          }
        };

        plugin = new AlightEmailAutoLink(editor);
      });

      it('should initialize the plugin', () => {
        // Call init
        plugin.init();

        // Verify selection change listener was set up
        expect(model.document.selection.on).toHaveBeenCalledWith('change:range', jasmine.any(Function));
      });

      it('should set up typing watcher', () => {
        // Mock TextWatcher
        const TextWatcherMock = function () {
          return {
            on: jasmine.createSpy('on'),
            bind: jasmine.createSpy('bind')
          };
        };

        // Spy on TextWatcher constructor
        spyOn(window, 'TextWatcher').and.callFake(TextWatcherMock);

        // Call init
        plugin.init();

        // Verify TextWatcher was created
        expect(window.TextWatcher).toHaveBeenCalledWith(model, jasmine.any(Function));
      });

      it('should set up enter and shift+enter handling', () => {
        // Call afterInit
        plugin.afterInit();

        // Verify command listeners were set up
        expect(enterCommand.on).toHaveBeenCalledWith('execute', jasmine.any(Function));
        expect(shiftEnterCommand.on).toHaveBeenCalledWith('execute', jasmine.any(Function));
      });

      it('should set up paste linking', () => {
        // Call afterInit
        plugin.afterInit();

        // Verify clipboard pipeline listener was set up
        expect(clipboardPipeline.on).toHaveBeenCalledWith('inputTransformation', jasmine.any(Function), jasmine.any(Object));
      });

      it('should apply auto-link for email addresses', () => {
        // Mock a range for testing _applyAutoLink
        const range = {
          start: {
            getShiftedBy: jasmine.createSpy('getShiftedBy').and.returnValue({})
          },
          end: {
            getShiftedBy: jasmine.createSpy('getShiftedBy').and.returnValue({})
          }
        };

        // Mock isLinkAllowedOnRange to return true
        spyOn(window, 'isLinkAllowedOnRange').and.returnValue(true);

        // Mock linkIsAlreadySet to return false
        spyOn(window, 'linkIsAlreadySet').and.returnValue(false);

        // Call _applyAutoLink for an email
        plugin._applyAutoLink('mailto:test@example.com', range);

        // Verify model change was called
        expect(model.change).toHaveBeenCalled();
      });
    });
  });

  describe('EmailLinkHandler', () => {
    it('should have proper name', () => {
      expect(EmailLinkHandler.pluginName).toEqual('EmailLinkHandler');
    });

    it('should require AlightEmailLinkPluginEditing plugin', () => {
      expect(EmailLinkHandler.requires).toContain(AlightEmailLinkPluginEditing);
    });

    describe('init()', () => {
      let plugin: EmailLinkHandler;
      let editor: Editor;
      let model: { createRangeIn: any; document: any; change: any; };
      let view;
      let originalLinkCommand: { execute: any; };
      let alightEmailLinkCommand: { execute: any; };
      let clipboardPipeline: { on: any; };

      beforeEach(() => {
        originalLinkCommand = {
          execute: jasmine.createSpy('execute')
        };

        alightEmailLinkCommand = {
          execute: jasmine.createSpy('execute')
        };

        clipboardPipeline = {
          on: jasmine.createSpy('on')
        };

        model = {
          document: {
            on: jasmine.createSpy('on'),
            getRoot: jasmine.createSpy('getRoot').and.returnValue({})
          },
          change: jasmine.createSpy('change').and.callFake(callback => {
            callback({
              setAttribute: jasmine.createSpy('setAttribute'),
              removeAttribute: jasmine.createSpy('removeAttribute')
            });
            return {};
          }),
          createRangeIn: jasmine.createSpy('createRangeIn').and.returnValue({
            getItems: () => []
          })
        };

        view = {
          document: {
            getRoot: jasmine.createSpy('getRoot').and.returnValue({})
          },
          change: jasmine.createSpy('change').and.callFake(callback => {
            callback({ setAttribute: jasmine.createSpy('setAttribute') });
            return {};
          }),
          createRangeIn: jasmine.createSpy('createRangeIn').and.returnValue({
            getItems: () => []
          })
        };

        editor = {
          model: model,
          editing: {
            view: view,
            mapper: {
              toModelPosition: jasmine.createSpy('toModelPosition')
            }
          },
          commands: {
            get: jasmine.createSpy('get').and.callFake(name => {
              if (name === 'link') return originalLinkCommand;
              if (name === 'alight-email-link') return alightEmailLinkCommand;
              return null;
            })
          },
          conversion: {
            for: jasmine.createSpy('for').and.returnValue({
              elementToAttribute: jasmine.createSpy('elementToAttribute')
            })
          },
          plugins: {
            get: jasmine.createSpy('get').and.returnValue(clipboardPipeline)
          }
        };

        plugin = new EmailLinkHandler(editor);
      });

      it('should intercept standard link commands', () => {
        // Call init
        plugin.init();

        // Verify original execute was replaced
        expect(originalLinkCommand.execute).not.toBe(jasmine.any(Function));

        // Test the monkey-patched execute with a mailto link
        originalLinkCommand.execute('mailto:test@example.com');

        // Verify our command was called instead
        expect(alightEmailLinkCommand.execute).toHaveBeenCalledWith('mailto:test@example.com', {});
      });

      it('should add a custom upcast converter for mailto links', () => {
        // Call init
        plugin.init();

        // Verify conversion was set up
        expect(editor.conversion.for).toHaveBeenCalledWith('upcast');
        expect(editor.conversion.for().elementToAttribute).toHaveBeenCalledWith({
          view: {
            name: 'a',
            attributes: {
              href: /^mailto:|.*@.*$/
            }
          },
          model: {
            key: 'alightEmailLinkPluginHref',
            value: jasmine.any(Function)
          },
          converterPriority: 'highest'
        });
      });

      it('should handle conflicting links', () => {
        // Setup a test item with conflicting attributes
        const testItem = {
          is: jasmine.createSpy('is').and.returnValue(true),
          hasAttribute: jasmine.createSpy('hasAttribute').and.returnValue(true),
          getAttribute: jasmine.createSpy('getAttribute').and.returnValue('mailto:test@example.com')
        };

        // Setup model.createRangeIn to return our test item
        model.createRangeIn.and.returnValue({
          getItems: () => [testItem]
        });

        // Call init
        plugin.init();

        // Manually trigger document change handler
        const changeHandler = model.document.on.calls.argsFor(0)[1];

        // Mock differ to return changes
        const differ = {
          getChanges: jasmine.createSpy('getChanges').and.returnValue([{}])
        };
        model.document.differ = differ;

        // Call the handler
        changeHandler();

        // Verify model.change was called to resolve the conflict
        expect(model.change).toHaveBeenCalled();
      });

      it('should detect and convert mailto links', () => {
        // Call init
        plugin.init();

        // Verify clipboard listener was set up
        expect(clipboardPipeline.on).toHaveBeenCalledWith('inputTransformation', jasmine.any(Function), jasmine.any(Object));

        // Test the handler with an email
        const handler = clipboardPipeline.on.calls.argsFor(0)[1];
        const evt = {
          stop: jasmine.createSpy('stop')
        };
        const data = {
          method: 'paste',
          dataTransfer: {
            getData: jasmine.createSpy('getData').and.returnValue('test@example.com')
          }
        };

        // Call the handler
        handler(evt, data);

        // Verify event was stopped
        expect(evt.stop).toHaveBeenCalled();

        // Verify setTimeout was used (auto-link happens after paste)
        jasmine.clock().install();
        jasmine.clock().tick(1);
        expect(alightEmailLinkCommand.execute).toHaveBeenCalled();
        jasmine.clock().uninstall();
      });
    });
  });

  describe('AlightEmailLinkPluginUI', () => {
    it('should have proper name', () => {
      expect(AlightEmailLinkPluginUI.pluginName).toEqual('AlightEmailLinkPluginUI');
    });

    it('should be marked as official plugin', () => {
      expect(AlightEmailLinkPluginUI.isOfficialPlugin).toBe(true);
    });

    it('should require proper plugins', () => {
      expect(AlightEmailLinkPluginUI.requires).toContain(AlightEmailLinkPluginEditing);
      expect(AlightEmailLinkPluginUI.requires).toContain('ContextualBalloon');
    });

    describe('init()', () => {
      let plugin: AlightEmailLinkPluginUI;
      let editor: Editor;
      let locale: { t: (text: any) => any; };
      let linkCommand: { isEnabled: boolean; value: string; bind: jasmine.Spy<jasmine.Func>; on: jasmine.Spy<jasmine.Func>; organization: string; };
      let unlinkCommand: { isEnabled: boolean; bind: jasmine.Spy<jasmine.Func>; };
      let balloon: { hasView: any; remove: any; add: any; updatePosition?: jasmine.Spy<jasmine.Func>; view?: { element: HTMLDivElement; }; };
      let actionsView;

      beforeEach(() => {
        locale = {
          t: (text: any) => text
        };

        linkCommand = {
          isEnabled: true,
          value: 'mailto:test@example.com',
          bind: jasmine.createSpy('bind'),
          on: jasmine.createSpy('on'),
          organization: 'Test Org'
        };

        unlinkCommand = {
          isEnabled: true,
          bind: jasmine.createSpy('bind')
        };

        actionsView = {
          editButtonView: {
            bind: jasmine.createSpy('bind')
          },
          unlinkButtonView: {
            bind: jasmine.createSpy('bind')
          },
          bind: jasmine.createSpy('bind'),
          keystrokes: {
            set: jasmine.createSpy('set')
          }
        };

        balloon = {
          add: jasmine.createSpy('add'),
          hasView: jasmine.createSpy('hasView').and.returnValue(false),
          remove: jasmine.createSpy('remove'),
          updatePosition: jasmine.createSpy('updatePosition'),
          view: {
            element: document.createElement('div')
          }
        };

        editor = {
          locale: locale,
          editing: {
            view: {
              addObserver: jasmine.createSpy('addObserver'),
              document: {
                selection: {
                  getFirstRange: jasmine.createSpy('getFirstRange').and.returnValue({
                    getTrimmed: jasmine.createSpy('getTrimmed').and.returnValue({})
                  }),
                  getSelectedElement: jasmine.createSpy('getSelectedElement').and.returnValue(null)
                }
              },
              domConverter: {
                mapViewToDom: jasmine.createSpy('mapViewToDom'),
                viewRangeToDom: jasmine.createSpy('viewRangeToDom')
              }
            },
            mapper: {
              toModelPosition: jasmine.createSpy('toModelPosition')
            }
          },
          commands: {
            get: jasmine.createSpy('get').and.callFake(name => {
              if (name === 'alight-email-link') return linkCommand;
              if (name === 'alight-email-unlink') return unlinkCommand;
              return null;
            })
          },
          model: {
            document: {
              selection: {},
              on: jasmine.createSpy('on')
            }
          },
          plugins: {
            get: jasmine.createSpy('get').and.returnValue(balloon)
          },
          t: (text: any) => text,
          ui: {
            componentFactory: {
              add: jasmine.createSpy('add')
            }
          },
          conversion: {
            for: jasmine.createSpy('for').and.returnValue({
              markerToHighlight: jasmine.createSpy('markerToHighlight'),
              markerToElement: jasmine.createSpy('markerToElement')
            })
          },
          execute: jasmine.createSpy('execute'),
          accessibility: {
            addKeystrokeInfos: jasmine.createSpy('addKeystrokeInfos')
          }
        };

        // Mock LinkActionsView constructor
        spyOn(window, 'LinkActionsView').and.returnValue(actionsView);

        plugin = new AlightEmailLinkPluginUI(editor);
      });

      it('should initialize the plugin', () => {
        // Call init
        plugin.init();

        // Verify ClickObserver was added
        expect(editor.editing.view.addObserver).toHaveBeenCalledWith('ClickObserver');

        // Verify actions view was created
        expect(window.LinkActionsView).toHaveBeenCalledWith(locale);

        // Verify toolbar button registration
        expect(editor.ui.componentFactory.add).toHaveBeenCalledWith('menuBar:alightEmailLinkPlugin', jasmine.any(Function));

        // Verify conversion for visual markers
        expect(editor.conversion.for).toHaveBeenCalledWith('editingDowncast');
        expect(editor.conversion.for().markerToHighlight).toHaveBeenCalled();
        expect(editor.conversion.for().markerToElement).toHaveBeenCalled();

        // Verify accessibility info was added
        expect(editor.accessibility.addKeystrokeInfos).toHaveBeenCalledWith({
          keystrokes: [
            {
              label: 'Move out of an email link',
              keystroke: [
                ['arrowleft', 'arrowleft'],
                ['arrowright', 'arrowright']
              ]
            }
          ]
        });
      });

      it('should create button view', () => {
        // Call init
        plugin.init();

        // Create a button
        const button = plugin.createButtonView(locale);

        // Verify button properties
        expect(button.label).toBe('Email link');
        expect(button.isToggleable).toBe(true);
        expect(button.withText).toBe(true);
      });

      it('should destroy modal dialog when destroyed', () => {
        // Create a mock modal dialog
        plugin._modalDialog = {
          destroy: jasmine.createSpy('destroy')
        };

        // Mock actions view
        plugin.actionsView = {
          destroy: jasmine.createSpy('destroy')
        };

        // Call destroy
        plugin.destroy();

        // Verify modal and actionsView were destroyed
        expect(plugin._modalDialog.destroy).toHaveBeenCalled();
        expect(plugin.actionsView.destroy).toHaveBeenCalled();
      });

      it('should show UI', () => {
        // Mock the modal dialog
        plugin._modalDialog = {
          setTitle: jasmine.createSpy('setTitle'),
          setContent: jasmine.createSpy('setContent'),
          show: jasmine.createSpy('show'),
          getElement: jasmine.createSpy('getElement').and.returnValue(document.createElement('div')),
          on: jasmine.createSpy('on')
        };

        // Call init then showUI
        plugin.init();
        plugin._showUI(true);

        // Verify modal was shown with editing title
        expect(plugin._modalDialog.setTitle).toHaveBeenCalledWith('Edit email link');
        expect(plugin._modalDialog.show).toHaveBeenCalled();
      });

      it('should validate email addresses', () => {
        // Test different email validations
        expect(plugin._validateEmail('test@example.com')).toBe(true);
        expect(plugin._validateEmail('mailto:test@example.com')).toBe(true);
        expect(plugin._validateEmail('invalid')).toBe(false);
        expect(plugin._validateEmail('')).toBe(false);
      });

      it('should hide UI', () => {
        // Mock balloon with our view
        plugin.actionsView = {};
        balloon.hasView.and.returnValue(true);

        // Mock modal dialog
        plugin._modalDialog = {
          isVisible: true,
          hide: jasmine.createSpy('hide')
        };

        // Call hideUI
        plugin._hideUI();

        // Verify balloon and modal were hidden
        expect(balloon.remove).toHaveBeenCalled();
        expect(plugin._modalDialog.hide).toHaveBeenCalled();
      });

      it('should show balloon for existing links', () => {
        // Mock getSelectedLinkElement to return a link
        spyOn(plugin, '_getSelectedLinkElement').and.returnValue({
          hasAttribute: jasmine.createSpy('hasAttribute').and.returnValue(true),
          getAttribute: jasmine.createSpy('getAttribute').and.returnValue('mailto:test@example.com')
        });

        // Call _showBalloon
        plugin._showBalloon();

        // Verify balloon was added
        expect(balloon.add).toHaveBeenCalled();
      });
    });
  });

  describe('Command definitions', () => {
    let command: AlightEmailLinkPluginCommand;
    let unlinkCommand: AlightEmailUnlinkCommand;
    let mockEditor;
    let mockModel: { change: any; document?: { selection: { isCollapsed: boolean; getFirstPosition: jasmine.Spy<jasmine.Func>; getLastPosition: jasmine.Spy<jasmine.Func>; hasAttribute: jasmine.Spy<jasmine.Func>; getAttribute: jasmine.Spy<jasmine.Func>; getAttributes: () => string[][]; getFirstRange: jasmine.Spy<jasmine.Func>; getRanges: jasmine.Spy<jasmine.Func>; getSelectedElement: jasmine.Spy<jasmine.Func>; getSelectedBlocks: jasmine.Spy<jasmine.Func>; rangeCount: number; }; getRoot: jasmine.Spy<jasmine.Func>; differ: { getChanges: () => any[]; }; }; schema?: { checkAttribute: jasmine.Spy<jasmine.Func>; checkAttributeInSelection: jasmine.Spy<jasmine.Func>; getValidRanges: jasmine.Spy<jasmine.Func>; getDefinition: jasmine.Spy<jasmine.Func>; }; enqueueChange?: jasmine.Spy<jasmine.Func>; createRange?: jasmine.Spy<jasmine.Func>; createSelection?: jasmine.Spy<jasmine.Func>; createRangeIn?: jasmine.Spy<jasmine.Func>; createPositionAt?: jasmine.Spy<jasmine.Func>; };
    let mockSchema: { checkAttributeInSelection: any; getValidRanges: any; checkAttribute?: jasmine.Spy<jasmine.Func>; getDefinition?: jasmine.Spy<jasmine.Func>; };
    let mockDocument;
    let mockSelection: { hasAttribute: any; getAttribute: any; isCollapsed: any; getFirstPosition?: jasmine.Spy<jasmine.Func>; getLastPosition?: jasmine.Spy<jasmine.Func>; getAttributes?: () => string[][]; getFirstRange?: jasmine.Spy<jasmine.Func>; getRanges?: jasmine.Spy<jasmine.Func>; getSelectedElement?: jasmine.Spy<jasmine.Func>; getSelectedBlocks?: jasmine.Spy<jasmine.Func>; rangeCount?: number; };
    let mockWriter: { removeAttribute: any; setAttribute?: jasmine.Spy<jasmine.Func>; removeSelectionAttribute?: jasmine.Spy<jasmine.Func>; setSelection?: jasmine.Spy<jasmine.Func>; createText?: jasmine.Spy<jasmine.Func>; remove?: jasmine.Spy<jasmine.Func>; insert?: jasmine.Spy<jasmine.Func>; createPositionAt?: jasmine.Spy<jasmine.Func>; };
    let mockRoot;

    beforeEach(() => {
      // Create mock for the writer
      mockWriter = {
        setAttribute: jasmine.createSpy('setAttribute'),
        removeAttribute: jasmine.createSpy('removeAttribute'),
        removeSelectionAttribute: jasmine.createSpy('removeSelectionAttribute'),
        setSelection: jasmine.createSpy('setSelection'),
        createText: jasmine.createSpy('createText').and.returnValue({}),
        remove: jasmine.createSpy('remove'),
        insert: jasmine.createSpy('insert'),
        createPositionAt: jasmine.createSpy('createPositionAt').and.returnValue({ parent: {}, offset: 0 })
      };

      // Mock root element
      mockRoot = {
        rootName: 'main',
        document: {}
      };

      // Mock first position - needed for many command operations
      const mockPosition = {
        parent: {
          is: () => false,
          getAttributes: () => [['attribute', 'value']]
        },
        textNode: {
          data: 'test@example.com',
          hasAttribute: jasmine.createSpy('hasAttribute').and.returnValue(false),
          getAttribute: jasmine.createSpy('getAttribute').and.returnValue('mailto:test@example.com'),
          getAttributes: () => [['alightEmailLinkPluginHref', 'mailto:test@example.com']]
        }
      };

      // Mock document selection with all needed methods
      mockSelection = {
        isCollapsed: false,
        getFirstPosition: jasmine.createSpy('getFirstPosition').and.returnValue(mockPosition),
        getLastPosition: jasmine.createSpy('getLastPosition').and.returnValue(mockPosition),
        hasAttribute: jasmine.createSpy('hasAttribute').and.returnValue(false),
        getAttribute: jasmine.createSpy('getAttribute').and.returnValue('mailto:test@example.com'),
        getAttributes: () => [['alightEmailLinkPluginHref', 'mailto:test@example.com']],
        getFirstRange: jasmine.createSpy('getFirstRange').and.returnValue({
          getTrimmed: jasmine.createSpy('getTrimmed').and.returnValue({}),
          getItems: () => []
        }),
        getRanges: jasmine.createSpy('getRanges').and.returnValue([{
          getItems: () => []
        }]),
        getSelectedElement: jasmine.createSpy('getSelectedElement').and.returnValue(null),
        getSelectedBlocks: jasmine.createSpy('getSelectedBlocks').and.returnValue([]),
        rangeCount: 1
      };

      // Mock document with selection
      mockDocument = {
        selection: mockSelection,
        getRoot: jasmine.createSpy('getRoot').and.returnValue(mockRoot),
        differ: {
          getChanges: () => []
        }
      };

      // Mock model schema with validation methods
      mockSchema = {
        checkAttribute: jasmine.createSpy('checkAttribute').and.returnValue(true),
        checkAttributeInSelection: jasmine.createSpy('checkAttributeInSelection').and.returnValue(true),
        getValidRanges: jasmine.createSpy('getValidRanges').and.returnValue([{
          start: { parent: {}, offset: 0 },
          end: { parent: {}, offset: 5 },
          getItems: () => []
        }]),
        getDefinition: jasmine.createSpy('getDefinition').and.returnValue({
          allowAttributes: ['alightEmailLinkPluginHref', 'alightEmailLinkPluginOrgName']
        })
      };

      // Mock model with document and schema
      mockModel = {
        document: mockDocument,
        schema: mockSchema,
        change: jasmine.createSpy('change').and.callFake((callback) => {
          if (callback) {
            callback(mockWriter);
          }
          return {};
        }),
        enqueueChange: jasmine.createSpy('enqueueChange').and.callFake((callback) => {
          if (typeof callback === 'function') {
            callback(mockWriter);
          } else {
            const secondCallback = arguments[1];
            if (secondCallback) {
              secondCallback(mockWriter);
            }
          }
        }),
        createRange: jasmine.createSpy('createRange').and.returnValue({
          start: { parent: {}, offset: 0 },
          end: { parent: {}, offset: 5 },
          getItems: () => []
        }),
        createSelection: jasmine.createSpy('createSelection').and.returnValue({
          getFirstRange: () => ({})
        }),
        createRangeIn: jasmine.createSpy('createRangeIn').and.returnValue({
          getItems: () => []
        }),
        createPositionAt: jasmine.createSpy('createPositionAt').and.returnValue({})
      };

      // Mock editor with model
      mockEditor = {
        model: mockModel,
        commands: new Map([
          ['link', { execute: jasmine.createSpy('execute') }]
        ]),
        t: (text: any) => text,
        config: {
          get: jasmine.createSpy('get').and.returnValue({
            defaultProtocol: 'mailto:'
          })
        }
      };

      // Create command instances
      command = new AlightEmailLinkPluginCommand(mockEditor);
      unlinkCommand = new AlightEmailUnlinkCommand(mockEditor);
    });

    describe('AlightEmailLinkPluginCommand', () => {
      it('should create command instance', () => {
        expect(command).toBeDefined();
      });

      it('should have manualDecorators collection', () => {
        expect(command.manualDecorators).toBeDefined();
      });

      it('should have automaticDecorators property', () => {
        expect(command.automaticDecorators).toBeDefined();
      });

      it('should enable command when schema allows it', () => {
        // Setup schema check to return true
        mockSchema.checkAttributeInSelection.and.returnValue(true);
        mockSelection.hasAttribute.and.returnValue(true);

        // Call refresh to update the command state
        command.refresh();

        // Verify schema check was called
        expect(mockSchema.checkAttributeInSelection).toHaveBeenCalled();

        // Verify command is enabled
        expect(command.isEnabled).toBe(true);
      });

      it('should execute with editor.model.change', () => {
        // Setup callbacks to make execute work
        mockModel.change.and.callFake((callback: (arg0: any) => void) => {
          callback(mockWriter);
          return true;
        });

        // Call execute
        command.execute('mailto:test@example.com');

        // Verify model.change was called
        expect(mockModel.change).toHaveBeenCalled();
      });

      it('should execute with organization name', () => {
        // Setup callbacks to make execute work
        mockModel.change.and.callFake((callback: (arg0: any) => void) => {
          callback(mockWriter);
          return true;
        });

        // Call execute with organization
        command.execute('mailto:test@example.com', { organization: 'Test Org' });

        // Verify model.change was called
        expect(mockModel.change).toHaveBeenCalled();
      });

      it('should update value from selection', () => {
        // Setup selection to have the href attribute
        mockSelection.hasAttribute.and.callFake((attrName: string) => {
          return attrName === 'alightEmailLinkPluginHref';
        });

        mockSelection.getAttribute.and.callFake((attrName: string) => {
          if (attrName === 'alightEmailLinkPluginHref') {
            return 'mailto:test@example.com';
          }
          return undefined;
        });

        // Call refresh to update the command state
        command.refresh();

        // Verify value was updated
        expect(command.value).toBe('mailto:test@example.com');
      });

      it('should extract organization name from attribute', () => {
        // Setup selection to have the href and org attributes
        mockSelection.hasAttribute.and.callFake((attrName: string) => {
          return attrName === 'alightEmailLinkPluginHref' || attrName === 'alightEmailLinkPluginOrgName';
        });

        mockSelection.getAttribute.and.callFake((attrName: string) => {
          if (attrName === 'alightEmailLinkPluginHref') {
            return 'mailto:test@example.com';
          }
          if (attrName === 'alightEmailLinkPluginOrgName') {
            return 'Test Org';
          }
          return undefined;
        });

        // Mock the findAttributeRange function
        spyOn(require('@ckeditor/ckeditor5-typing'), 'findAttributeRange').and.returnValue({
          start: {},
          end: {},
          getItems: () => []
        });

        // Call refresh to update the command state
        command.refresh();

        // Verify organization was extracted
        expect(command.organization).toBe('Test Org');
      });
    });

    describe('AlightEmailUnlinkCommand', () => {
      it('should create command instance', () => {
        expect(unlinkCommand).toBeDefined();
      });

      it('should enable command when schema allows it', () => {
        // Setup schema check to return true
        mockSchema.checkAttributeInSelection.and.returnValue(true);

        // Call refresh to update the command state
        unlinkCommand.refresh();

        // Verify schema check was called
        expect(mockSchema.checkAttributeInSelection).toHaveBeenCalled();

        // Verify command is enabled
        expect(unlinkCommand.isEnabled).toBe(true);
      });

      it('should execute with editor.model.change', () => {
        // Setup callbacks to make execute work
        mockModel.change.and.callFake((callback: (arg0: any) => void) => {
          callback(mockWriter);
          return {};
        });

        // Setup findAttributeRange for selection.isCollapsed case
        const { findAttributeRange } = require('@ckeditor/ckeditor5-typing');
        spyOn(findAttributeRange, 'findAttributeRange').and.returnValue({
          start: {},
          end: {},
          getItems: () => []
        });

        // Call execute
        unlinkCommand.execute();

        // Verify model.change was called
        expect(mockModel.change).toHaveBeenCalled();
      });

      it('should operate on selection ranges', () => {
        // Setup callbacks to make execute work
        mockModel.change.and.callFake((callback: (arg0: any) => void) => {
          callback(mockWriter);
          return {};
        });

        // Setup selection to have ranges
        mockSelection.isCollapsed = false;
        mockSchema.getValidRanges.and.returnValue([{
          start: {},
          end: {},
          getItems: () => [{
            is: () => true,
            data: 'test@example.com (Test Org)'
          }]
        }]);

        // Call execute
        unlinkCommand.execute();

        // Verify getValidRanges was called for non-collapsed selection
        expect(mockSchema.getValidRanges).toHaveBeenCalled();
      });

      it('should remove organization name from text', () => {
        // Setup callbacks to make execute work
        mockModel.change.and.callFake((callback: (arg0: any) => void) => {
          callback(mockWriter);
          return {};
        });

        // Setup findAttributeRange to return a range with organization name
        const { findAttributeRange } = require('@ckeditor/ckeditor5-typing');
        spyOn(findAttributeRange, 'findAttributeRange').and.returnValue({
          start: { parent: {}, offset: 0 },
          end: { parent: {}, offset: 21 },
          getItems: () => [{
            is: () => true,
            data: 'test@example.com (Test Org)',
            getAttributes: () => [['alightEmailLinkPluginHref', 'mailto:test@example.com']]
          }]
        });

        // Call execute
        unlinkCommand.execute();

        // Verify model.change was called
        expect(mockModel.change).toHaveBeenCalled();

        // Verify removeAttribute was called
        expect(mockWriter.removeAttribute).toHaveBeenCalledWith('alightEmailLinkPluginHref', jasmine.any(Object));
        expect(mockWriter.removeAttribute).toHaveBeenCalledWith('alightEmailLinkPluginOrgName', jasmine.any(Object));
      });
    });
  });

  describe('Email Address Detection', () => {
    it('should detect email addresses with isEmail util', () => {
      expect(utils.isEmail('test@example.com')).toBe(true);
      expect(utils.isEmail('invalid')).toBe(false);
      expect(utils.isEmail('test@example')).toBe(false);
      expect(utils.isEmail('mailto:test@example.com')).toBe(true);
    });

    it('should add mailto protocol when needed', () => {
      expect(utils.addLinkProtocolIfApplicable('test@example.com', 'mailto:')).toBe('mailto:test@example.com');
      expect(utils.addLinkProtocolIfApplicable('mailto:test@example.com', 'mailto:')).toBe('mailto:test@example.com');
      expect(utils.addLinkProtocolIfApplicable('https://example.com', 'mailto:')).toBe('https://example.com');
    });

    it('should ensure safe URLs', () => {
      expect(utils.ensureSafeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
      expect(utils.ensureSafeUrl('javascript:alert(1)')).toBe('#'); // Should sanitize unsafe protocols
    });

    it('should check if link has protocol', () => {
      expect(utils.linkHasProtocol('https://example.com')).toBe(true);
      expect(utils.linkHasProtocol('mailto:test@example.com')).toBe(true);
      expect(utils.linkHasProtocol('example.com')).toBe(false);
    });
  });

  describe('Link Creation and Formatting', () => {
    it('should create proper link elements with createLinkElement util', () => {
      // Create a mock writer and conversion API
      const mockWriter = {
        createAttributeElement: jasmine.createSpy('createAttributeElement').and.returnValue({
          name: 'a',
          getAttribute: (name: string) => name === 'href' ? 'mailto:test@example.com' : null
        }),
        setCustomProperty: jasmine.createSpy('setCustomProperty')
      };

      const mockConversionApi = {
        writer: mockWriter,
        attrs: {
          orgnameattr: 'Test Org'
        }
      };

      // Call createLinkElement
      const element = utils.createLinkElement('mailto:test@example.com', mockConversionApi as any);

      // Verify the writer methods were called with right parameters
      expect(mockWriter.createAttributeElement).toHaveBeenCalledWith('a', {
        href: 'mailto:test@example.com',
        'data-id': 'email_link',
        orgnameattr: 'Test Org'
      }, { priority: 5 });

      expect(mockWriter.setCustomProperty).toHaveBeenCalledWith('alight-email-link', true, jasmine.any(Object));
    });

    it('should handle organization name extraction in email links', () => {
      // Test extractOrganization util
      expect(utils.extractOrganization('test@example.com (Test Org)')).toBe('Test Org');
      expect(utils.extractOrganization('test@example.com')).toBe(null);
    });

    it('should format links with organization name', () => {
      // Test formatEmailWithOrganization util
      expect(utils.formatEmailWithOrganization('test@example.com', 'Test Org')).toBe('test@example.com (Test Org)');
      expect(utils.formatEmailWithOrganization('test@example.com', null)).toBe('test@example.com');
    });

    it('should extract emails from mailto links', () => {
      expect(utils.extractEmail('mailto:test@example.com')).toBe('test@example.com');
      expect(utils.extractEmail('test@example.com')).toBe('test@example.com');
    });

    it('should ensure mailto: prefix for email links', () => {
      expect(utils.ensureMailtoLink('test@example.com')).toBe('mailto:test@example.com');
      expect(utils.ensureMailtoLink('mailto:test@example.com')).toBe('mailto:test@example.com');
      expect(utils.ensureMailtoLink('https://example.com')).toBe('https://example.com');
    });

    it('should detect mailto links', () => {
      expect(utils.isMailtoLink('mailto:test@example.com')).toBe(true);
      expect(utils.isMailtoLink('test@example.com')).toBe(false);
    });

    it('should extract organization name from links', () => {
      expect(utils.extractOrganizationName('test@example.com (Test Org)')).toBe('Test Org');
      expect(utils.extractOrganizationName('test@example.com')).toBe(null);
    });

    it('should add organization to text', () => {
      expect(utils.addOrganizationToText('test@example.com', 'Test Org')).toBe('test@example.com (Test Org)');
      expect(utils.addOrganizationToText('test@example.com', null)).toBe('test@example.com');
    });

    it('should remove organization from text', () => {
      expect(utils.removeOrganizationFromText('test@example.com (Test Org)')).toBe('test@example.com');
      expect(utils.removeOrganizationFromText('test@example.com')).toBe('test@example.com');
    });

    it('should get domain for display', () => {
      expect(utils.getDomainForDisplay('https://www.example.com/path')).toBe('example.com');
      expect(utils.getDomainForDisplay('https://example.com')).toBe('example.com');
    });

    it('should create link display text with organization', () => {
      expect(utils.createLinkDisplayText('https://example.com', 'Test Org')).toBe('example.com (Test Org)');
      expect(utils.createLinkDisplayText('https://example.com')).toBe('example.com');
    });

    it('should extract and apply organization name', () => {
      const mockTextNode = {
        is: (type: string) => type === '$text',
        hasAttribute: jasmine.createSpy('hasAttribute').and.returnValue(false),
        data: 'test@example.com (Test Org)',
        getAttributes: () => []
      };

      const mockWriter = {
        setAttribute: jasmine.createSpy('setAttribute')
      };

      const result = utils.extractAndApplyOrganizationName(mockTextNode, mockWriter);

      expect(result).toBe('Test Org');
      expect(mockWriter.setAttribute).toHaveBeenCalledWith('alightEmailLinkPluginOrgName', 'Test Org', mockTextNode);
    });

    it('should collect formatting attributes', () => {
      const mockNodes = [{
        getAttributes: () => [['bold', true], ['italic', false], ['alightEmailLinkPluginHref', 'mailto:test@example.com']]
      }];

      const result = utils.collectFormattingAttributes(mockNodes, ['alightEmailLinkPluginHref']);

      expect(result).toEqual({ bold: true, italic: false });
    });

    it('should preserve formatting when replacing text', () => {
      const mockRange = {
        start: { parent: {}, offset: 0 },
        end: { parent: {}, offset: 10 },
        getItems: () => [{
          is: (type: string) => type === '$text',
          data: 'old text',
          getAttributes: () => [['bold', true], ['italic', false]]
        }]
      };

      const mockWriter = {
        remove: jasmine.createSpy('remove'),
        createText: jasmine.createSpy('createText').and.returnValue('new text with formatting'),
        insert: jasmine.createSpy('insert'),
        createPositionAt: jasmine.createSpy('createPositionAt').and.returnValue({ parent: {}, offset: 9 })
      };

      utils.replaceTextPreservingFormatting(mockWriter, mockRange, 'new text', ['alightEmailLinkPluginHref']);

      expect(mockWriter.remove).toHaveBeenCalledWith(mockRange);
      expect(mockWriter.createText).toHaveBeenCalledWith('new text', { bold: true, italic: false });
      expect(mockWriter.insert).toHaveBeenCalled();
    });

    it('should update link text with organization', () => {
      const mockRange = {
        start: { parent: {}, offset: 0 },
        end: { parent: {}, offset: 15 },
        getItems: () => [{
          is: (type: string) => type === '$text',
          data: 'test@example.com',
          getAttributes: () => [['bold', true], ['alightEmailLinkPluginHref', 'mailto:test@example.com']]
        }]
      };

      const mockWriter = {
        remove: jasmine.createSpy('remove'),
        createText: jasmine.createSpy('createText').and.returnValue('formatted text with org'),
        insert: jasmine.createSpy('insert'),
        createPositionAt: jasmine.createSpy('createPositionAt').and.returnValue({ parent: {}, offset: 26 })
      };

      utils.updateLinkTextWithOrganization(mockWriter, mockRange, 'test@example.com', 'Test Org');

      expect(mockWriter.remove).toHaveBeenCalledWith(mockRange);
      expect(mockWriter.createText).toHaveBeenCalledWith('test@example.com (Test Org)', { bold: true });
      expect(mockWriter.insert).toHaveBeenCalled();
    });
  });

  describe('Decorator handling', () => {
    it('should normalize decorators', () => {
      const decoratorsConfig = {
        openInNewTab: {
          mode: 'manual',
          label: 'Open in a new tab',
          attributes: {
            target: '_blank',
            rel: 'noopener noreferrer'
          }
        }
      };

      const normalized = utils.normalizeDecorators(decoratorsConfig);

      expect(normalized[0].id).toBe('linkOpenInNewTab');
      expect(normalized[0].mode).toBe('manual');
      expect(normalized[0].attributes).toEqual({ target: '_blank', rel: 'noopener noreferrer' });
    });

    it('should get localized decorators', () => {
      const t = (text: string) => text === 'Open in a new tab' ? 'Abrir en nueva pestaña' : text;

      const decorators = [
        { id: 'linkOpenInNewTab', mode: 'manual', label: 'Open in a new tab' },
        { id: 'linkDownloadable', mode: 'manual', label: 'Downloadable' }
      ];

      const localized = utils.getLocalizedDecorators(t, decorators);

      expect(localized[0].label).toBe('Abrir en nueva pestaña');
      expect(localized[1].label).toBe('Downloadable'); // Not translated in this test
    });

    it('should check if element is linkable', () => {
      const mockSchema = {
        checkAttribute: jasmine.createSpy('checkAttribute').and.returnValue(true)
      };

      const mockElement = { name: 'paragraph' };

      expect(utils.isLinkableElement(mockElement, mockSchema)).toBe(true);
      expect(utils.isLinkableElement(null, mockSchema)).toBe(false);

      expect(mockSchema.checkAttribute).toHaveBeenCalledWith('paragraph', 'alightEmailLinkPluginHref');
    });

    it('should create bookmark callbacks', () => {
      const mockEditor = {
        plugins: {
          has: jasmine.createSpy('has').and.returnValue(true),
          get: jasmine.createSpy('get').and.returnValue({
            getElementForBookmarkId: jasmine.createSpy('getElementForBookmarkId').and.returnValue({})
          })
        },
        model: {
          change: jasmine.createSpy('change').and.callFake(cb => cb({}))
        },
        editing: {
          view: {
            scrollToTheSelection: jasmine.createSpy('scrollToTheSelection')
          }
        }
      };

      const callbacks = utils.createBookmarkCallbacks(mockEditor);

      expect(callbacks.isScrollableToTarget('#bookmark-id')).toBe(true);
      expect(callbacks.isScrollableToTarget('https://example.com')).toBe(false);

      // Test scrollToTarget
      callbacks.scrollToTarget('#bookmark-id');
      expect(mockEditor.model.change).toHaveBeenCalled();
      expect(mockEditor.editing.view.scrollToTheSelection).toHaveBeenCalledWith({
        alignToTop: true,
        forceScroll: true
      });
    });
  });

  describe('LinkActionsView', () => {
    it('should create view with proper buttons', () => {
      const mockLocale = {
        t: (text: any) => text,
        contentLanguageDirection: 'ltr'
      };

      const actionsView = new LinkActionsView(mockLocale);

      expect(actionsView.editButtonView).toBeDefined();
      expect(actionsView.unlinkButtonView).toBeDefined();
      expect(actionsView.href).toBe('');
    });

    it('should fire edit event when edit button is clicked', () => {
      const mockLocale = {
        t: (text: any) => text,
        contentLanguageDirection: 'ltr'
      };

      const actionsView = new LinkActionsView(mockLocale);

      const spy = jasmine.createSpy('editSpy');
      actionsView.on('edit', spy);

      actionsView.editButtonView.fire('execute');

      expect(spy).toHaveBeenCalled();
    });

    it('should fire unlink event when unlink button is clicked', () => {
      const mockLocale = {
        t: (text: any) => text,
        contentLanguageDirection: 'ltr'
      };

      const actionsView = new LinkActionsView(mockLocale);

      const spy = jasmine.createSpy('unlinkSpy');
      actionsView.on('unlink', spy);

      actionsView.unlinkButtonView.fire('execute');

      expect(spy).toHaveBeenCalled();
    });
  });
});
