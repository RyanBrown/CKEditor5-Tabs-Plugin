// src/plugins/alight-link-parent-plugin/tests/alight-link-parent-plugin.spec .ts
import AlightLinkParentPluginUI from './../alight-link-parent-plugin';
import { Editor } from '@ckeditor/ckeditor5-core';
import { DropdownView } from '@ckeditor/ckeditor5-ui';
import { Locale } from '@ckeditor/ckeditor5-utils';

describe('AlightLinkParentPluginUI', () => {
  let plugin: AlightLinkParentPluginUI;
  let editor: any;
  let dropdown: DropdownView;

  beforeEach(() => {
    // Mock editor
    editor = {
      t: jasmine.createSpy('t').and.returnValue('translated text'),
      ui: {
        componentFactory: {
          add: jasmine.createSpy('add')
        }
      },
      commands: {
        get: jasmine.createSpy('get').and.returnValue({
          isEnabled: true
        })
      },
      plugins: {
        get: jasmine.createSpy('get').and.returnValue({
          _showModal: jasmine.createSpy('_showModal')
        })
      },
      editing: {
        view: {
          focus: jasmine.createSpy('focus')
        }
      }
    };

    // Initialize plugin
    plugin = new AlightLinkParentPluginUI(editor);
    plugin.init();
  });

  describe('pluginName', () => {
    it('should return correct plugin name', () => {
      expect(AlightLinkParentPluginUI.pluginName).toBe('AlightLinkParentPluginUI');
    });
  });

  describe('requires', () => {
    it('should return required plugins', () => {
      expect(AlightLinkParentPluginUI.requires).toEqual([
        'AlightPublicLinkPluginUI',
        'AlightPredefinedLinkPluginUI',
        'AlightPublicLinkPlugin',
        'AlightPredefinedLinkPlugin'
      ]);
    });
  });

  describe('init()', () => {
    it('should register component factory', () => {
      expect(editor.ui.componentFactory.add).toHaveBeenCalledWith(
        'alightLinkParentPlugin',
        jasmine.any(Function)
      );
    });

    it('should create dropdown with correct configuration', () => {
      // Get factory callback
      const factoryCallback = editor.ui.componentFactory.add.calls.mostRecent().args[1];
      const locale = new Locale();

      // Execute factory callback
      dropdown = factoryCallback(locale);

      expect(dropdown instanceof DropdownView).toBeTruthy();
      expect(dropdown.buttonView.icon).toBeDefined();
      expect(dropdown.buttonView.label).toBe('translated text');
      expect(dropdown.buttonView.tooltip).toBeTruthy();
      expect(dropdown.buttonView.withText).toBeTruthy();
      expect(dropdown.class).toBe('ck-dropdown ck-alight-link-dropdown');
    });
  });

  describe('dropdown functionality', () => {
    beforeEach(() => {
      const locale = new Locale();
      const factoryCallback = editor.ui.componentFactory.add.calls.mostRecent().args[1];
      dropdown = factoryCallback(locale);
    });

    it('should focus editor when dropdown closes', () => {
      dropdown.isOpen = true;
      dropdown.isOpen = false;

      expect(editor.editing.view.focus).toHaveBeenCalled();
    });
  });

  describe('list items', () => {
    let listView: any;

    beforeEach(() => {
      const locale = new Locale();
      const factoryCallback = editor.ui.componentFactory.add.calls.mostRecent().args[1];
      dropdown = factoryCallback(locale);
      listView = dropdown.panelView.children.first;
    });

    it('should create header with correct text', () => {
      const headerView = listView.items.first;
      expect(headerView.element.textContent).toBe('translated text');
    });

    it('should create list items for each child plugin', () => {
      const items = Array.from(listView.items);
      // Header + separator + 2 plugin items
      expect(items.length).toBe(4);
    });

    it('should execute child plugin command on button click', () => {
      const publicLinkItem = listView.items.get(2);
      const button = publicLinkItem.children.first;

      button.fire('execute');

      expect(dropdown.isOpen).toBeFalse();
      expect(editor.plugins.get).toHaveBeenCalledWith('AlightPublicLinkPluginUI');
      expect(editor.plugins.get()._showModal).toHaveBeenCalled();
    });

    it('should handle errors when executing child plugin command', () => {
      const consoleSpy = spyOn(console, 'error');
      editor.plugins.get.and.throwError('Test error');

      const publicLinkItem = listView.items.get(2);
      const button = publicLinkItem.children.first;

      button.fire('execute');

      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('command binding', () => {
    it('should bind dropdown state to command availability', () => {
      const publicCommand = { isEnabled: true };
      const predefinedCommand = { isEnabled: false };

      editor.commands.get.and.callFake((command: string) => {
        if (command === 'alightPublicLinkPlugin') return publicCommand;
        if (command === 'alightPredefinedLinkPlugin') return predefinedCommand;
        return null;
      });

      const locale = new Locale();
      const factoryCallback = editor.ui.componentFactory.add.calls.mostRecent().args[1];
      dropdown = factoryCallback(locale);

      expect(dropdown.isEnabled).toBeTruthy();
    });
  });
});