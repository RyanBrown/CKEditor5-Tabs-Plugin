// src/plugins/alight-paste-plugin/tests/alight-paste-plugin.spec.ts
import { Editor, Plugin } from '@ckeditor/ckeditor5-core';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import AlightPastePlugin from './../alight-paste-plugin';
import AlightPastePluginCommand from './../alight-paste-plugin-command';

describe('AlightPastePlugin', () => {
  let editor: Editor;
  let plugin: AlightPastePlugin;

  beforeEach(() => {
    // Create a more complete mock editor with document
    editor = {
      t: (str: string) => str,
      commands: {
        add: jasmine.createSpy('add'),
        get: jasmine.createSpy('get').and.returnValue({
          isEnabled: true
        })
      },
      ui: {
        componentFactory: {
          add: jasmine.createSpy('add')
        }
      },
      execute: jasmine.createSpy('execute'),
      document: {
        selection: {
          getFirstPosition: () => null,
          getLastPosition: () => null
        },
        on: jasmine.createSpy('on'),
        roots: new Map()
      },
      model: {
        document: {
          selection: {
            getFirstPosition: () => null,
            getLastPosition: () => null
          }
        }
      },
      editing: {
        view: {
          document: {
            selection: {
              getFirstPosition: () => null,
              getLastPosition: () => null
            }
          }
        }
      }
    } as unknown as Editor;
  });

  describe('pluginName', () => {
    it('should return the correct plugin name', () => {
      expect(AlightPastePlugin.pluginName).toBe('AlightPastePlugin');
    });
  });

  describe('constructor and inheritance', () => {
    beforeEach(() => {
      plugin = new AlightPastePlugin(editor);
    });

    it('should be created with proper editor instance', () => {
      expect(plugin.editor).toBe(editor);
    });

    it('should extend Plugin', () => {
      // Test both instanceof and prototype chain
      expect(plugin instanceof Plugin).toBe(true);
      expect(Object.getPrototypeOf(plugin.constructor)).toBe(Plugin);
    });
  });

  describe('init()', () => {
    beforeEach(() => {
      plugin = new AlightPastePlugin(editor);
      plugin.init();
    });

    it('should register the AlightPastePlugin command', () => {
      expect(editor.commands.add).toHaveBeenCalledWith(
        'alightPastePlugin',
        jasmine.any(AlightPastePluginCommand)
      );
    });

    it('should register the UI component factory', () => {
      expect(editor.ui.componentFactory.add).toHaveBeenCalledWith(
        'alightPastePlugin',
        jasmine.any(Function)
      );
    });

    describe('UI Button', () => {
      let button: ButtonView;
      let locale: any;

      beforeEach(() => {
        locale = {
          t: (str: string) => str
        };

        // Get the factory function and create the button
        const factoryFn = (editor.ui.componentFactory.add as jasmine.Spy).calls.mostRecent().args[1];
        button = factoryFn(locale);
      });

      it('should create a button with correct properties', () => {
        expect(button instanceof ButtonView).toBe(true);
        expect(button.label).toBe('Paste with Styles');
        expect(button.tooltip).toBe(true);
        expect(button.icon).toBeDefined();
      });

      it('should execute the command when clicked', () => {
        button.fire('execute');
        expect(editor.execute).toHaveBeenCalledWith('alightPastePlugin');
      });

      it('should have the correct icon set', () => {
        expect(button.icon).toBeTruthy();
      });
    });
  });

  // Error cases
  describe('error handling', () => {
    beforeEach(() => {
      plugin = new AlightPastePlugin(editor);
    });

    it('should handle missing command registration gracefully', () => {
      const editorWithError = {
        ...editor,
        commands: {
          add: () => { throw new Error('Command registration failed'); }
        }
      } as unknown as Editor;

      const pluginWithError = new AlightPastePlugin(editorWithError);
      expect(() => pluginWithError.init()).toThrow();
    });
  });
});