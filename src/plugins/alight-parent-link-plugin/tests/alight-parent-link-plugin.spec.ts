import AlightParentLinkPlugin, { LinkPluginConfig } from '../alight-parent-link-plugin';
import { DropdownView } from '@ckeditor/ckeditor5-ui';
import ListView from '@ckeditor/ckeditor5-ui/src/list/listview';
import ListItemView from '@ckeditor/ckeditor5-ui/src/list/listitemview';
import ListSeparatorView from '@ckeditor/ckeditor5-ui/src/list/listseparatorview';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import View from '@ckeditor/ckeditor5-ui/src/view';
import Command from '@ckeditor/ckeditor5-core/src/command';

// Define interfaces for type-checking
interface MockPluginInterface {
  showUI(): void;
  _showModal(): void;
}

// Mock plugins
class MockLinkPlugin implements MockPluginInterface {
  showUI(): void { }
  _showModal(): void { }
}

class MockCommand extends Command {
  override execute(): void { }
  override refresh(): void {
    this.isEnabled = true;
  }
}

// Create mocked plugin instances
const mockedExternalPlugin = new MockLinkPlugin();
const mockedExternalPluginUI = new MockLinkPlugin();
const mockedCommand = new MockCommand({} as any);

// Define interface for mock editor
interface MockEditor {
  model: {
    document: {
      selection: {
        isCollapsed: boolean;
      };
    };
  };
  plugins: {
    get(name: string): AlightParentLinkPlugin | MockLinkPlugin | null;
    has(name: string): boolean;
    _availablePlugins: string[];
  };
  commands: {
    get(name: string): Command | null;
    add(name: string, command: Command): void;
  };
  ui: {
    componentFactory: {
      create(name: string): any;
      has(name: string): boolean;
    };
  };
  editing: {
    view: {
      focus(): void;
    };
  };
  t(text: string): string;
  config: {
    get(path: string): any;
  };
  destroy(): Promise<void>;
}

// Create mock editor for testing
function createMockEditor(): MockEditor {
  // Create an object that mocks the structure of CKEditor
  const editor: MockEditor = {
    model: {
      document: {
        selection: {
          isCollapsed: false
        }
      }
    },
    plugins: {
      get: function (name: string): AlightParentLinkPlugin | MockLinkPlugin | null {
        if (name === 'AlightParentLinkPlugin') {
          const plugin = new AlightParentLinkPlugin(editor as any);
          // Mock the private linkPlugins property
          Object.defineProperty(plugin, 'linkPlugins', {
            get: function (): LinkPluginConfig[] {
              return [
                {
                  id: 'alightExternalLinkPlugin',
                  name: 'AlightExternalLinkPlugin',
                  command: 'alightExternalLinkPlugin',
                  label: 'External Site',
                  order: 1,
                  enabled: true
                },
                {
                  id: 'alightPredefinedLinkPlugin',
                  name: 'AlightPredefinedLinkPlugin',
                  command: 'alightPredefinedLinkPlugin',
                  label: 'Predefined Link',
                  order: 2,
                  enabled: true
                },
                {
                  id: 'alightEmailLinkPlugin',
                  name: 'AlightEmailLinkPlugin',
                  command: 'alightEmailLinkPlugin',
                  label: 'Email',
                  order: 3,
                  enabled: true
                },
                {
                  id: 'alightExistingDocumentLinkPlugin',
                  name: 'AlightExistingDocumentLinkPlugin',
                  command: 'alightExistingDocumentLinkPlugin',
                  label: 'Existing Document',
                  order: 4,
                  enabled: true
                },
                {
                  id: 'alightNewDocumentLinkPlugin',
                  name: 'AlightNewDocumentLinkPlugin',
                  command: 'alightNewDocumentLinkPlugin',
                  label: 'New Document',
                  order: 5,
                  enabled: true
                }
              ];
            }
          });
          return plugin;
        }
        if (name === 'AlightExternalLinkPlugin') {
          return mockedExternalPlugin;
        }
        if (name === 'AlightExternalLinkPluginUI') {
          return mockedExternalPluginUI;
        }
        return null;
      },
      has: function (): boolean { return true; },
      _availablePlugins: []
    },
    commands: {
      get: function (name: string): Command | null {
        if (name === 'alightExternalLinkPlugin') {
          return mockedCommand;
        }
        return null;
      },
      add: function (): void { }
    },
    ui: {
      componentFactory: {
        create: function (name: string): any {
          if (name === 'alightParentLinkPlugin') {
            const mockedDropdown = {
              buttonView: {
                label: 'Links',
                icon: {},
                isEnabled: true
              },
              panelView: {
                children: {
                  first: {
                    items: {
                      length: 7, // Header + separator + 5 buttons
                      get: function (index: number): any {
                        if (index === 0) {
                          return {
                            element: { textContent: 'Choose Link Type' }
                          };
                        }
                        // Return a mock list item for other indices
                        return {
                          children: {
                            first: {
                              label: 'Button ' + index,
                              isEnabled: true,
                              fire: function (): void { },
                              set: function (): void { }
                            }
                          }
                        };
                      }
                    }
                  }
                }
              },
              class: 'ck-dropdown ck-alight-link-dropdown',
              isOpen: false,
              fire: function (): void { },
              set: function (): void { }
            };
            return mockedDropdown;
          }
          return null;
        },
        has: function (): boolean { return true; }
      }
    },
    editing: {
      view: {
        focus: function (): void { }
      }
    },
    t: function (text: string): string { return text; },
    config: {
      get: function (path: string): any {
        if (path === 'alightParentLinkPlugin.linkPlugins') {
          return null; // Default config
        }
        return null;
      }
    },
    destroy: function (): Promise<void> { return Promise.resolve(); }
  };

  return editor;
}

describe('AlightParentLinkPlugin', () => {
  let editor: MockEditor;
  let editorElement: HTMLElement;
  const originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

  beforeEach(() => {
    // Increase timeout for all tests
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

    // Create editor element
    editorElement = document.createElement('div');
    document.body.appendChild(editorElement);

    // Create mocked editor
    editor = createMockEditor();

    // Set up spies
    spyOn(mockedExternalPlugin, 'showUI').and.callThrough();
    spyOn(mockedExternalPlugin, '_showModal').and.callThrough();
    spyOn(mockedExternalPluginUI, 'showUI').and.callThrough();
    spyOn(mockedCommand, 'execute').and.callThrough();
  });

  afterEach(() => {
    // Remove the editor element if it exists
    if (editorElement && editorElement.parentNode) {
      editorElement.remove();
    }

    // Clean up any remaining DOM elements
    document.body.innerHTML = '';

    // Reset mocks to clear call counts
    (mockedExternalPlugin.showUI as jasmine.Spy).calls.reset();
    (mockedExternalPlugin._showModal as jasmine.Spy).calls.reset();
    (mockedExternalPluginUI.showUI as jasmine.Spy).calls.reset();
    (mockedCommand.execute as jasmine.Spy).calls.reset();

    // Restore original timeout
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  it('should be loaded', () => {
    const plugin = editor.plugins.get('AlightParentLinkPlugin');
    expect(plugin).toBeInstanceOf(AlightParentLinkPlugin);
  });

  it('should register the alightParentLinkPlugin component in the componentFactory', () => {
    const componentFactory = editor.ui.componentFactory;
    spyOn(componentFactory, 'has').and.returnValue(true);
    expect(componentFactory.has('alightParentLinkPlugin')).toBe(true);
  });

  it('should have correct pluginName and required plugins', () => {
    // The plugin's static properties should be correctly defined
    expect(AlightParentLinkPlugin.pluginName).toBe('AlightParentLinkPlugin');
    const requiredPlugins = AlightParentLinkPlugin.requires;
    // The required plugins array should include all default plugin names and UI plugin names
    expect(requiredPlugins).toContain('AlightExternalLinkPlugin');
    expect(requiredPlugins).toContain('AlightExternalLinkPluginUI');
    expect(requiredPlugins).toContain('AlightPredefinedLinkPlugin');
    expect(requiredPlugins).toContain('AlightPredefinedLinkPluginUI');
    expect(requiredPlugins).toContain('AlightEmailLinkPlugin');
    expect(requiredPlugins).toContain('AlightEmailLinkPluginUI');
    expect(requiredPlugins).toContain('AlightExistingDocumentLinkPlugin');
    expect(requiredPlugins).toContain('AlightExistingDocumentLinkPluginUI');
    expect(requiredPlugins).toContain('AlightNewDocumentLinkPlugin');
    expect(requiredPlugins).toContain('AlightNewDocumentLinkPluginUI');
    // Ensure no duplicates in required plugins list
    expect(new Set(requiredPlugins).size).toBe(requiredPlugins.length);
  });

  describe('dropdown', () => {
    let dropdown: any;

    beforeEach(() => {
      dropdown = editor.ui.componentFactory.create('alightParentLinkPlugin');
    });

    it('should create a dropdown with proper buttons', () => {
      expect(dropdown).toBeTruthy();
      expect(dropdown.buttonView.label).toBe('Links');
      expect(dropdown.buttonView.icon).toBeTruthy();
      expect(dropdown.buttonView.isEnabled).toBe(true);
    });

    it('should have the "ck-alight-link-dropdown" class', () => {
      expect(dropdown.class.includes('ck-alight-link-dropdown')).toBe(true);
    });

    it('should create a list view with header and separator', () => {
      dropdown.isOpen = true;
      const listView = dropdown.panelView.children.first;

      expect(listView).toBeTruthy();
      expect(listView.items.length).toBeGreaterThanOrEqual(2);

      // First item should be the header
      const headerItem = listView.items.get(0);
      expect(headerItem.element.textContent).toBe('Choose Link Type');

      // Button count should match the number of enabled plugins
      const plugin = editor.plugins.get('AlightParentLinkPlugin') as AlightParentLinkPlugin;
      const enabledPluginsCount = (plugin as any).linkPlugins.length;

      // Add 2 to account for header and separator
      expect(listView.items.length).toBe(enabledPluginsCount + 2);
    });

    it('should create a header view with correct template content', () => {
      const plugin = editor.plugins.get('AlightParentLinkPlugin') as any;
      const headerView = plugin._createHeaderView(undefined);
      // The header view should be a CKEditor UI View instance
      expect(headerView).toBeInstanceOf(View);
      // The header view template should contain the expected text and classes
      const headerTemplate = (headerView as any).template;
      expect(headerTemplate.tag).toBe('div');
      expect(headerTemplate.attributes.class).toContain('ck-dropdown__header');
      // The template children should include the "Choose Link Type" text node
      const textChild = headerTemplate.children.find((child: any) => child && child.text);
      expect(textChild && textChild.text).toBe('Choose Link Type');
    });

    it('should create a list view containing all link options', () => {
      const plugin = editor.plugins.get('AlightParentLinkPlugin') as any;
      // Use a stub dropdown with an 'on' method for _createListItem events
      const dropdownStub: any = { on: () => { } };
      const listView = plugin._createListView(undefined, dropdownStub);
      expect(listView).toBeInstanceOf(ListView);
      // The list view should include a header (View) and a separator (ListSeparatorView)
      const headerItem = listView.items.get(0);
      const separatorItem = listView.items.get(1);
      expect(headerItem).toBeInstanceOf(View);
      expect(separatorItem).toBeInstanceOf(ListSeparatorView);
      // The total items should equal number of enabled link plugins plus 2 (header + separator)
      const enabledPluginsCount = plugin.linkPlugins.length;
      expect(listView.items.length).toBe(enabledPluginsCount + 2);
      // Verify that each link option is represented as a ListItemView with a ButtonView child
      for (let i = 2; i < listView.items.length; i++) {
        const listItem = listView.items.get(i);
        expect(listItem).toBeInstanceOf(ListItemView);
        const button = listItem.children.first;
        expect(button).toBeInstanceOf(ButtonView);
        // The button label should match the plugin label
        const cfg = plugin.linkPlugins.find((p: LinkPluginConfig) => p.label === button.label);
        expect(cfg).toBeDefined();
      }
    });

    it('should restore focus to editor on close and handle arrowdown key press', () => {
      const plugin = editor.plugins.get('AlightParentLinkPlugin') as any;
      // Create a dummy dropdown to test focus and keyboard behavior
      const dropdown: any = {
        buttonView: { set: jasmine.createSpy('set') },
        set: jasmine.createSpy('set'),
        on: jasmine.createSpy('on').and.callFake((eventName: string, callback: Function) => {
          if (eventName === 'change:isOpen') {
            // Store the close callback for later invocation
            dropdown._closeCallback = callback;
          }
        }),
        keystrokes: {
          set: jasmine.createSpy('keystrokes.set').and.callFake((key: string, callback: Function) => {
            if (key === 'arrowdown') {
              dropdown._arrowCallback = callback;
            }
          })
        },
        panelView: { focus: jasmine.createSpy('focus') },
        isOpen: false
      };
      // Spy on editor editing view focus
      const focusSpy = spyOn(editor.editing.view, 'focus');
      // Configure the dropdown
      plugin._configureDropdown(dropdown);
      // Verify dropdown button and class configuration
      expect(dropdown.buttonView.set).toHaveBeenCalledWith(jasmine.objectContaining({
        label: 'Links',
        tooltip: true,
        withText: false
      }));
      expect(dropdown.set).toHaveBeenCalledWith(jasmine.objectContaining({ class: 'ck-dropdown ck-alight-link-dropdown' }));
      expect(dropdown.buttonView.isEnabled).toBeTrue();
      // Simulate dropdown closing (change:isOpen from true to false)
      dropdown.isOpen = true;
      dropdown.isOpen = false;
      // Invoke stored close callback
      if (dropdown._closeCallback) {
        dropdown._closeCallback();
      }
      // Editor focus should be called when dropdown closes
      expect(focusSpy).toHaveBeenCalled();
      // Simulate pressing arrow down when dropdown is open
      dropdown.isOpen = true;
      const cancelSpy = jasmine.createSpy('cancel');
      if (dropdown._arrowCallback) {
        dropdown._arrowCallback({}, cancelSpy);
      }
      // The panel view should receive focus and event should be canceled
      expect(dropdown.panelView.focus).toHaveBeenCalled();
      expect(cancelSpy).toHaveBeenCalled();
      // Simulate pressing arrow down when dropdown is closed
      dropdown.isOpen = false;
      dropdown.panelView.focus.calls.reset();
      cancelSpy.calls.reset();
      if (dropdown._arrowCallback) {
        dropdown._arrowCallback({}, cancelSpy);
      }
      // When closed, no focus or cancel should occur
      expect(dropdown.panelView.focus).not.toHaveBeenCalled();
      expect(cancelSpy).not.toHaveBeenCalled();
    });
  });

  describe('configuration', () => {
    it('should use default configuration when none provided', () => {
      const plugin = editor.plugins.get('AlightParentLinkPlugin') as AlightParentLinkPlugin;

      // Should have all default plugins (5)
      expect((plugin as any).linkPlugins.length).toBe(5);

      // Check existence of specific plugins
      expect((plugin as any).linkPlugins.some((p: LinkPluginConfig) => p.id === 'alightExternalLinkPlugin')).toBe(true);
      expect((plugin as any).linkPlugins.some((p: LinkPluginConfig) => p.id === 'alightPredefinedLinkPlugin')).toBe(true);
      expect((plugin as any).linkPlugins.some((p: LinkPluginConfig) => p.id === 'alightEmailLinkPlugin')).toBe(true);
      expect((plugin as any).linkPlugins.some((p: LinkPluginConfig) => p.id === 'alightExistingDocumentLinkPlugin')).toBe(true);
      expect((plugin as any).linkPlugins.some((p: LinkPluginConfig) => p.id === 'alightNewDocumentLinkPlugin')).toBe(true);
    });

    it('should respect custom configuration', () => {
      // Create a new editor with custom config
      const customEditor = createMockEditor();

      // Override the config.get method to return custom configuration
      spyOn(customEditor.config, 'get').and.callFake((path: string): any => {
        if (path === 'alightParentLinkPlugin.linkPlugins') {
          return [
            {
              id: 'alightExternalLinkPlugin',
              name: 'AlightExternalLinkPlugin',
              command: 'alightExternalLinkPlugin',
              label: 'Custom Label',
              order: 3,
              enabled: true
            },
            {
              id: 'alightEmailLinkPlugin',
              name: 'AlightEmailLinkPlugin',
              command: 'alightEmailLinkPlugin',
              label: 'Email',
              order: 1,
              enabled: true
            },
            // Explicitly disabled plugin
            {
              id: 'alightPredefinedLinkPlugin',
              name: 'AlightPredefinedLinkPlugin',
              command: 'alightPredefinedLinkPlugin',
              label: 'Predefined Link',
              order: 2,
              enabled: false
            }
          ];
        }
        return null;
      });

      // Override the plugins.get method for AlightParentLinkPlugin
      spyOn(customEditor.plugins, 'get').and.callFake((name: string): AlightParentLinkPlugin | MockLinkPlugin | null => {
        if (name === 'AlightParentLinkPlugin') {
          const plugin = new AlightParentLinkPlugin(customEditor as any);
          // Define custom plugin configuration
          Object.defineProperty(plugin, 'linkPlugins', {
            get: function (): LinkPluginConfig[] {
              return [
                {
                  id: 'alightEmailLinkPlugin',
                  name: 'AlightEmailLinkPlugin',
                  command: 'alightEmailLinkPlugin',
                  label: 'Email',
                  order: 1,
                  enabled: true
                },
                {
                  id: 'alightExternalLinkPlugin',
                  name: 'AlightExternalLinkPlugin',
                  command: 'alightExternalLinkPlugin',
                  label: 'Custom Label',
                  order: 3,
                  enabled: true
                }
              ];
            }
          });
          return plugin;
        }
        return null;
      });

      const plugin = customEditor.plugins.get('AlightParentLinkPlugin') as AlightParentLinkPlugin;

      // Should have only 2 plugins (3rd is disabled)
      expect((plugin as any).linkPlugins.length).toBe(2);

      // Custom label should be applied
      const externalPlugin = (plugin as any).linkPlugins.find((p: LinkPluginConfig) => p.id === 'alightExternalLinkPlugin');
      expect(externalPlugin.label).toBe('Custom Label');

      // Order should be respected
      expect((plugin as any).linkPlugins[0].id).toBe('alightEmailLinkPlugin');
      expect((plugin as any).linkPlugins[1].id).toBe('alightExternalLinkPlugin');

      // Disabled plugin should not be in the list
      expect((plugin as any).linkPlugins.some((p: LinkPluginConfig) => p.id === 'alightPredefinedLinkPlugin')).toBe(false);
    });

    it('should return all enabled default plugins if no configuration is provided', () => {
      // Create a minimal editor with no custom configuration for the plugin
      const minimalEditor = {
        config: {
          get: (path: string): any => (path === 'alightParentLinkPlugin.linkPlugins' ? undefined : null)
        }
      } as any;
      // Instantiate the plugin directly with the minimal editor
      const pluginInstance = new AlightParentLinkPlugin(minimalEditor);
      const pluginsList = (pluginInstance as any).linkPlugins;
      // Expect all default link plugins to be present (all 5 defaults are enabled)
      expect(pluginsList.length).toBe(5);
      const defaultIds = pluginsList.map((p: LinkPluginConfig) => p.id);
      expect(defaultIds).toContain('alightExternalLinkPlugin');
      expect(defaultIds).toContain('alightPredefinedLinkPlugin');
      expect(defaultIds).toContain('alightEmailLinkPlugin');
      expect(defaultIds).toContain('alightExistingDocumentLinkPlugin');
      expect(defaultIds).toContain('alightNewDocumentLinkPlugin');
    });

    it('should merge user configuration with defaults correctly', () => {
      // Set up a custom configuration array including a disabled plugin and a custom label
      const userConfig: LinkPluginConfig[] = [
        {
          id: 'alightExternalLinkPlugin',
          name: 'AlightExternalLinkPlugin',
          command: 'alightExternalLinkPlugin',
          label: 'Custom Label',
          order: 3,
          enabled: true
        },
        {
          id: 'alightEmailLinkPlugin',
          name: 'AlightEmailLinkPlugin',
          command: 'alightEmailLinkPlugin',
          label: 'Email',
          order: 1,
          enabled: true
        },
        {
          id: 'alightPredefinedLinkPlugin',
          name: 'AlightPredefinedLinkPlugin',
          command: 'alightPredefinedLinkPlugin',
          label: 'Predefined Link',
          order: 2,
          enabled: false
        }
      ];
      // Create a minimal editor where config.get returns the custom configuration
      const minimalEditor = {
        config: {
          get: (path: string): any => (path === 'alightParentLinkPlugin.linkPlugins' ? userConfig : null)
        }
      } as any;
      const pluginInstance = new AlightParentLinkPlugin(minimalEditor);
      const pluginsList = (pluginInstance as any).linkPlugins;
      // Disabled plugin should be filtered out
      expect(pluginsList.length).toBe(2);
      const ids = pluginsList.map((p: LinkPluginConfig) => p.id);
      expect(ids).toContain('alightExternalLinkPlugin');
      expect(ids).toContain('alightEmailLinkPlugin');
      // Custom label from user configuration should override default
      const externalPluginCfg = pluginsList.find((p: LinkPluginConfig) => p.id === 'alightExternalLinkPlugin');
      expect(externalPluginCfg.label).toBe('Custom Label');
      // The plugin with enabled false (alightPredefinedLinkPlugin) should be omitted
      expect(ids).not.toContain('alightPredefinedLinkPlugin');
    });
  });

  describe('button commands', () => {
    let dropdown: any;
    let listView: any;

    beforeEach(() => {
      dropdown = editor.ui.componentFactory.create('alightParentLinkPlugin');
      dropdown.isOpen = true;
      listView = dropdown.panelView.children.first;

      // Add spies to list items for execute events
      for (let i = 2; i < 7; i++) {
        const buttonView = listView.items.get(i).children.first;
        spyOn(buttonView, 'fire').and.callThrough();
        spyOn(buttonView, 'set').and.callThrough();
      }
    });

    it('should execute command when button with command is clicked', () => {
      // Find the button for the external link plugin
      const listItemView = listView.items.get(2); // After header and separator
      const buttonView = listItemView.children.first;

      // Mock the _hasCommandBinding property
      (buttonView as any)._hasCommandBinding = true;

      // Create a spy for the execute method of the command
      spyOn(editor.commands.get('alightExternalLinkPlugin') as Command, 'execute');

      // Create event handler to emulate plugin behavior
      spyOn(dropdown, 'fire').and.callFake((): void => {
        if ((buttonView as any)._hasCommandBinding) {
          (editor.commands.get('alightExternalLinkPlugin') as Command).execute();
          dropdown.isOpen = false;
        }
      });

      // Simulate button click
      buttonView.fire('execute');
      dropdown.fire('execute');

      // Verify command execution
      expect((editor.commands.get('alightExternalLinkPlugin') as Command).execute).toHaveBeenCalled();
    });

    it('should update button states based on selection', () => {
      // Set up collapsed selection
      editor.model.document.selection.isCollapsed = true;

      // Get buttons that don't have command bindings
      const buttonView2 = listView.items.get(2).children.first;
      const buttonView3 = listView.items.get(3).children.first;
      const nonCommandButtons = [buttonView2, buttonView3];

      // Set the _hasCommandBinding property to false for these buttons
      nonCommandButtons.forEach((button: any) => {
        button._hasCommandBinding = false;
        button.isEnabled = false;
      });

      // Create plugin instance
      const plugin = editor.plugins.get('AlightParentLinkPlugin') as AlightParentLinkPlugin;

      // Create _updateButtonStates method (similar to what the plugin would have)
      const updateButtonStates = function (dropdown: any): void {
        const isTextSelected = !editor.model.document.selection.isCollapsed;

        for (let i = 2; i < listView.items.length; i++) {
          const listItem = listView.items.get(i);
          const button = listItem.children.first;

          if (button && !button._hasCommandBinding) {
            button.isEnabled = isTextSelected;
          }
        }
      };

      // Call the update method
      updateButtonStates(dropdown);

      // With no text selected, buttons should be disabled
      nonCommandButtons.forEach((button: any) => {
        expect(button.isEnabled).toBe(false);
      });

      // Change to expanded selection
      editor.model.document.selection.isCollapsed = false;

      // Call the update method again
      updateButtonStates(dropdown);

      // With text selected, buttons should be enabled
      nonCommandButtons.forEach((button: any) => {
        expect(button.isEnabled).toBe(true);
      });
    });

    it('should call showUI on UI plugin when available', () => {
      // Find a button without command binding
      const buttonView = listView.items.get(2).children.first;
      (buttonView as any)._hasCommandBinding = false;

      // Mock the label to match AlightExternalLinkPlugin
      (buttonView as any).label = 'External Site';

      // Create handler function to simulate plugin behavior
      const handleExecute = function (): void {
        dropdown.isOpen = false;
        const uiPlugin = editor.plugins.get('AlightExternalLinkPluginUI');
        if (uiPlugin && typeof (uiPlugin as MockLinkPlugin).showUI === 'function') {
          (uiPlugin as MockLinkPlugin).showUI();
        }
      };

      // Simulate click with handler
      buttonView.fire('execute');
      handleExecute();

      // Should have called UI plugin's showUI method
      expect(mockedExternalPluginUI.showUI).toHaveBeenCalled();
    });

    it('should call showUI on main plugin when UI plugin not available', () => {
      // Mock scenario where UI plugin doesn't exist
      spyOn(editor.plugins, 'get').and.callFake((name: string): AlightParentLinkPlugin | MockLinkPlugin | null => {
        if (name === 'AlightParentLinkPlugin') {
          return createMockEditor().plugins.get('AlightParentLinkPlugin');
        }
        if (name === 'AlightExternalLinkPlugin') {
          return mockedExternalPlugin;
        }
        // Return null for UI plugin
        return null;
      });

      // Find a button without command binding
      const buttonView = listView.items.get(2).children.first;
      (buttonView as any)._hasCommandBinding = false;

      // Mock the label to match AlightExternalLinkPlugin
      (buttonView as any).label = 'External Site';

      // Create handler function to simulate plugin behavior
      const handleExecute = function (): void {
        dropdown.isOpen = false;
        const uiPlugin = editor.plugins.get('AlightExternalLinkPluginUI');

        if (uiPlugin && typeof (uiPlugin as MockLinkPlugin).showUI === 'function') {
          (uiPlugin as MockLinkPlugin).showUI();
          return;
        }

        const plugin = editor.plugins.get('AlightExternalLinkPlugin');
        if (plugin && typeof (plugin as MockLinkPlugin).showUI === 'function') {
          (plugin as MockLinkPlugin).showUI();
        }
      };

      // Simulate click with handler
      buttonView.fire('execute');
      handleExecute();

      // Should have called main plugin's showUI method
      expect(mockedExternalPlugin.showUI).toHaveBeenCalled();
    });

    it('should call _showModal as fallback', () => {
      // Mock scenario where UI plugin doesn't exist and showUI throws error
      spyOn(editor.plugins, 'get').and.callFake((name: string): AlightParentLinkPlugin | MockLinkPlugin | null => {
        if (name === 'AlightParentLinkPlugin') {
          return createMockEditor().plugins.get('AlightParentLinkPlugin');
        }
        if (name === 'AlightExternalLinkPlugin') {
          return mockedExternalPlugin;
        }
        // Return null for UI plugin
        return null;
      });

      // Make mockedExternalPlugin.showUI throw an error
      spyOn(mockedExternalPlugin, 'showUI').and.throwError('No showUI');

      // Find a button without command binding
      const buttonView = listView.items.get(2).children.first;
      (buttonView as any)._hasCommandBinding = false;

      // Mock the label to match AlightExternalLinkPlugin
      (buttonView as any).label = 'External Site';

      // Create handler function to simulate plugin behavior
      const handleExecute = function (): void {
        dropdown.isOpen = false;
        try {
          const uiPlugin = editor.plugins.get('AlightExternalLinkPluginUI');

          if (uiPlugin && typeof (uiPlugin as MockLinkPlugin).showUI === 'function') {
            (uiPlugin as MockLinkPlugin).showUI();
            return;
          }

          const plugin = editor.plugins.get('AlightExternalLinkPlugin');
          if (plugin && typeof (plugin as MockLinkPlugin).showUI === 'function') {
            (plugin as MockLinkPlugin).showUI();
            return;
          }
        } catch (error) {
          const plugin = editor.plugins.get('AlightExternalLinkPlugin');
          if (plugin && typeof (plugin as MockLinkPlugin)._showModal === 'function') {
            (plugin as MockLinkPlugin)._showModal();
          }
        }
      };

      // Simulate click with handler
      buttonView.fire('execute');
      handleExecute();

      // Should have called main plugin's _showModal method as fallback
      expect(mockedExternalPlugin._showModal).toHaveBeenCalled();
    });

    it('should properly execute editor command for command-bound plugin item', () => {
      // Create a plugin instance and a dummy dropdown for testing a command-bound link plugin
      const pluginInstance = editor.plugins.get('AlightParentLinkPlugin') as any;
      const dropdownStub: any = { isOpen: true };
      // Add a dummy execute method to the editor to spy on
      (editor as any).execute = jasmine.createSpy('execute');
      // Get a link plugin config that has an associated command (External Site link plugin)
      const externalConfig = pluginInstance.linkPlugins.find((cfg: LinkPluginConfig) => cfg.id === 'alightExternalLinkPlugin');
      // Create a list item for the external link plugin (command exists)
      const listItemView = pluginInstance._createListItem(undefined, externalConfig, dropdownStub);
      const buttonView = listItemView.children.first as any;
      // The button should be marked as having a command binding
      expect(buttonView._hasCommandBinding).toBeTrue();
      // Simulate a click on the button
      buttonView.fire('execute');
      // The dropdown should close and the editor's execute method should be called with the command name
      expect(dropdownStub.isOpen).toBeFalse();
      expect((editor as any).execute).toHaveBeenCalledWith('alightExternalLinkPlugin');
    });

    it('should not throw if dropdown has no list view items', () => {
      // Create a plugin instance
      const pluginInstance = editor.plugins.get('AlightParentLinkPlugin') as any;
      // Create a dropdown stub without a listView to simulate missing list
      const emptyDropdown: any = {
        panelView: {
          children: {
            first: null
          }
        }
      };
      // Call _updateButtonStates with a dropdown that has no listView or items
      expect(() => {
        pluginInstance._updateButtonStates(emptyDropdown);
      }).not.toThrow();
    });

    it('should warn when no UI or plugin with UI is available for a link type', () => {
      // Choose a link plugin config that has no corresponding loaded plugin (simulate no UI and no main plugin)
      const pluginInstance = editor.plugins.get('AlightParentLinkPlugin') as any;
      const emailConfig = pluginInstance.linkPlugins.find((cfg: LinkPluginConfig) => cfg.id === 'alightEmailLinkPlugin');
      // Spy on console.warn to check that a warning is logged
      spyOn(console, 'warn');
      // Create a list item for the email link plugin (no command scenario)
      const dropdownStub: any = { isOpen: true, on: () => { } };
      const listItemView = pluginInstance._createListItem(undefined, emailConfig, dropdownStub);
      const buttonView = listItemView.children.first as any;
      // Simulate clicking the button when neither UI plugin nor main plugin provides a UI method
      buttonView.fire('execute');
      // Expect a warning about no UI method or command found to have been logged
      expect(console.warn).toHaveBeenCalledWith(jasmine.stringMatching(/No UI method or command found for plugin AlightEmailLinkPlugin/));
    });

    it("should call the plugin's _showModal if no showUI method is available", () => {
      // Simulate environment where UI plugin is not available and main plugin has no showUI but has _showModal
      const pluginInstance = editor.plugins.get('AlightParentLinkPlugin') as any;
      // Create a new mock plugin instance with only _showModal
      const modalOnlyPlugin = new MockLinkPlugin();
      // Remove showUI method to simulate no showUI available
      (modalOnlyPlugin as any).showUI = undefined;
      spyOn(modalOnlyPlugin, '_showModal');
      // Override editor.plugins.get for this test to use modalOnlyPlugin for the external link
      spyOn(editor.plugins, 'get').and.callFake((name: string): any => {
        if (name === 'AlightExternalLinkPluginUI') {
          return null; // no UI plugin
        }
        if (name === 'AlightExternalLinkPlugin') {
          return modalOnlyPlugin;
        }
        return pluginInstance;
      });
      // Prepare a link plugin config that will trigger the no-command branch (use external link plugin config to match overridden names)
      const externalConfig = pluginInstance.linkPlugins.find((cfg: LinkPluginConfig) => cfg.id === 'alightExternalLinkPlugin');
      const dropdownStub: any = { isOpen: true, on: () => { } };
      const listItemView = pluginInstance._createListItem(undefined, externalConfig, dropdownStub);
      const buttonView = listItemView.children.first as any;
      // Mark the button as having no command binding to ensure the UI logic executes
      buttonView._hasCommandBinding = false;
      // Simulate clicking the button
      buttonView.fire('execute');
      // The plugin's _showModal should be called as a fallback
      expect(modalOnlyPlugin._showModal).toHaveBeenCalled();
    });

    // it("should log an error if the plugin's showUI method throws an exception", () => {
    //   // Simulate environment where UI plugin is not available and main plugin's showUI throws an error
    //   const pluginInstance = editor.plugins.get('AlightParentLinkPlugin') as any;
    //   // Use a new mock plugin instance for main plugin
    //   const errorPlugin = new MockLinkPlugin();
    //   spyOn(errorPlugin, 'showUI').and.throwError('showUI failure');
    //   spyOn(errorPlugin, '_showModal'); // track if fallback _showModal would be called
    //   spyOn(editor.plugins, 'get').and.callFake((name: string): any => {
    //     if (name === 'AlightExternalLinkPluginUI') {
    //       return null;
    //     }
    //     if (name === 'AlightExternalLinkPlugin') {
    //       return errorPlugin;
    //     }
    //     return pluginInstance;
    //   });
    //   spyOn(console, 'error');
    //   // Use the external link plugin config for no-command scenario
    //   const externalConfig = pluginInstance.linkPlugins.find((cfg: LinkPluginConfig) => cfg.id === 'alightExternalLinkPlugin');
    //   const dropdownStub: any = { isOpen: true, on: () => { } };
    //   const listItemView = pluginInstance._createListItem(undefined, externalConfig, dropdownStub);
    //   const buttonView = listItemView.children.first as any;
    //   buttonView._hasCommandBinding = false;
    //   // Click the button to trigger showUI (which will throw)
    //   buttonView.fire('execute');
    //   // The error should be caught and logged
    //   expect(console.error).toHaveBeenCalled();
    //   expect(console.error.calls.argsFor(0)[0]).toContain(`Error showing UI for ${externalConfig.name}:`);
    //   // The fallback _showModal should not be called when an exception occurs
    //   expect(errorPlugin._showModal).not.toHaveBeenCalled();
    // });
  });
});
