// src/plugins/ui-components/alight-tabs-component/alight-tabs-component.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { WidgetToolbarRepository } from '@ckeditor/ckeditor5-widget';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { first } from '@ckeditor/ckeditor5-utils';
import { Command } from '@ckeditor/ckeditor5-core';
import type { Editor } from '@ckeditor/ckeditor5-core';
import { toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget';
import type { Element, Node } from '@ckeditor/ckeditor5-engine';
import type { ViewElement } from '@ckeditor/ckeditor5-engine';
import { TabsView, TabView, TabPanelView, TabViewConfig } from './alight-tabs-component-view';
import './styles/alight-tabs-component.scss';

// Re-export the needed classes so they can be imported from this file
export { TabsView, TabView, TabPanelView, TabViewConfig };

export default class AlightTabsComponent extends Plugin {
  public static readonly pluginName = 'AlightTabsComponent' as const;
  public static readonly requires = [WidgetToolbarRepository] as const;

  public init(): void {
    const editor = this.editor;
    const t = editor.t;

    // Register UI component factory
    editor.ui.componentFactory.add('alightTabs', locale => {
      const button = new ButtonView(locale);

      button.set({
        label: t('Tabs'),
        tooltip: true,
        withText: true
      });

      // Add tab insertion command
      button.on('execute', () => {
        this._insertTabs();
      });

      return button;
    });

    // Define schema
    this._defineSchema();

    // Define converters
    this._defineConverters();

    // Register commands
    editor.commands.add('tabProperties', new TabPropertiesCommand(editor));
    editor.commands.add('tabDelete', new TabDeleteCommand(editor));
    editor.commands.add('tabAdd', new TabAddCommand(editor));
  }

  private _defineSchema(): void {
    const schema = this.editor.model.schema;

    schema.register('alightTabs', {
      isObject: true,
      allowWhere: '$block',
      allowContentOf: '$root'
    });

    schema.register('alightTabsHeader', {
      isLimit: true,
      allowIn: 'alightTabs',
      allowContentOf: '$root'
    });

    schema.register('alightTabButton', {
      isLimit: true,
      allowIn: 'alightTabsHeader',
      allowAttributes: ['id', 'label', 'isActive']
    });

    schema.register('alightTabContent', {
      isLimit: true,
      allowIn: 'alightTabs',
      allowContentOf: '$root',
      allowAttributes: ['id', 'tabId', 'isActive']
    });
  }

  private _defineConverters(): void {
    const editor = this.editor;
    const conversion = editor.conversion;

    // Tabs container
    conversion.for('dataDowncast').elementToElement({
      model: 'alightTabs',
      view: (modelElement, { writer }) => {
        return writer.createContainerElement('div', {
          class: 'cka-tabs'
        });
      }
    });

    conversion.for('editingDowncast').elementToElement({
      model: 'alightTabs',
      view: (modelElement, { writer }) => {
        const div = writer.createContainerElement('div', {
          class: 'cka-tabs'
        });
        return toWidget(div, writer, { label: 'tabs widget' });
      }
    });

    conversion.for('upcast').elementToElement({
      view: {
        name: 'div',
        classes: ['cka-tabs']
      },
      model: 'alightTabs'
    });

    // Tabs header
    conversion.for('dataDowncast').elementToElement({
      model: 'alightTabsHeader',
      view: (modelElement, { writer }) => {
        return writer.createContainerElement('div', {
          class: 'cka-tabs-header',
          role: 'tablist'
        });
      }
    });

    conversion.for('editingDowncast').elementToElement({
      model: 'alightTabsHeader',
      view: (modelElement, { writer }) => {
        const div = writer.createContainerElement('div', {
          class: 'cka-tabs-header',
          role: 'tablist'
        });
        // Use toWidget instead of toWidgetEditable for container elements
        return toWidget(div, writer, { label: 'tabs header' });
      }
    });

    conversion.for('upcast').elementToElement({
      view: {
        name: 'div',
        classes: ['cka-tabs-header']
      },
      model: 'alightTabsHeader'
    });

    // Tab button
    conversion.for('dataDowncast').elementToElement({
      model: 'alightTabButton',
      view: (modelElement, { writer }) => {
        const id = modelElement.getAttribute('id') as string;
        const label = modelElement.getAttribute('label') as string || '';
        const isActive = modelElement.getAttribute('isActive') as boolean || false;

        const buttonClass = isActive ? 'cka-tab-button active' : 'cka-tab-button';

        const button = writer.createContainerElement('button', {
          class: buttonClass,
          id: `tab-${id}`,
          'aria-controls': `cka-tab-content-${id}`,
          'aria-selected': isActive ? 'true' : 'false',
          role: 'tab'
        });

        const text = writer.createText(label);
        writer.insert(writer.createPositionAt(button, 0), text);

        return button;
      }
    });

    conversion.for('editingDowncast').elementToElement({
      model: 'alightTabButton',
      view: (modelElement, { writer }) => {
        const id = modelElement.getAttribute('id') as string;
        const label = modelElement.getAttribute('label') as string || '';
        const isActive = modelElement.getAttribute('isActive') as boolean || false;

        const buttonClass = isActive ? 'cka-tab-button active' : 'cka-tab-button';

        const button = writer.createContainerElement('button', {
          class: buttonClass,
          id: `tab-${id}`,
          'aria-controls': `cka-tab-content-${id}`,
          'aria-selected': isActive ? 'true' : 'false',
          role: 'tab'
        });

        const text = writer.createText(label);
        writer.insert(writer.createPositionAt(button, 0), text);

        return button;
      }
    });

    conversion.for('upcast').elementToElement({
      view: {
        name: 'button',
        classes: ['cka-tab-button']
      },
      model: (viewElement, { writer }) => {
        const id = (viewElement.getAttribute('id') as string)?.replace('tab-', '') || '';
        const isActive = viewElement.hasClass('active');

        // Create a safe way to get the text content
        let label = '';
        if (viewElement.childCount > 0) {
          const firstChild = viewElement.getChild(0);
          if (firstChild && firstChild.is('$text')) {
            label = firstChild.data;
          }
        }

        const tabButton = writer.createElement('alightTabButton', {
          id,
          label,
          isActive
        });

        return tabButton;
      }
    });

    // Tab content
    conversion.for('dataDowncast').elementToElement({
      model: 'alightTabContent',
      view: (modelElement, { writer }) => {
        const id = modelElement.getAttribute('id') as string;
        const tabId = modelElement.getAttribute('tabId') as string;
        const isActive = modelElement.getAttribute('isActive') as boolean || false;

        const contentClass = isActive ? 'cka-tab-content active' : 'cka-tab-content';

        return writer.createContainerElement('div', {
          class: contentClass,
          id: `cka-tab-content-${id}`,
          'aria-labelledby': `tab-${tabId}`,
          role: 'tabpanel',
          tabindex: '0'
        });
      }
    });

    conversion.for('editingDowncast').elementToElement({
      model: 'alightTabContent',
      view: (modelElement, { writer }) => {
        const id = modelElement.getAttribute('id') as string;
        const tabId = modelElement.getAttribute('tabId') as string;
        const isActive = modelElement.getAttribute('isActive') as boolean || false;

        const contentClass = isActive ? 'cka-tab-content active' : 'cka-tab-content';

        const div = writer.createContainerElement('div', {
          class: contentClass,
          id: `cka-tab-content-${id}`,
          'aria-labelledby': `tab-${tabId}`,
          role: 'tabpanel',
          tabindex: '0'
        });

        // For content areas, we want them to be editable, so we'll create proper EditableElement
        const editableDiv = toWidgetEditable(writer.createEditableElement('div', { class: 'tab-content-editable' }), writer);
        writer.insert(writer.createPositionAt(div, 0), editableDiv);

        return div;
      }
    });

    conversion.for('upcast').elementToElement({
      view: {
        name: 'div',
        classes: ['cka-tab-content']
      },
      model: (viewElement, { writer }) => {
        const id = (viewElement.getAttribute('id') as string)?.replace('cka-tab-content-', '') || '';
        const tabId = (viewElement.getAttribute('aria-labelledby') as string)?.replace('tab-', '') || '';
        const isActive = viewElement.hasClass('active');

        return writer.createElement('alightTabContent', {
          id,
          tabId,
          isActive
        });
      }
    });
  }

  private _insertTabs(): void {
    const editor = this.editor;
    const model = editor.model;
    const selection = model.document.selection;
    const position = selection.getFirstPosition();

    if (position) {
      model.change(writer => {
        // Create tabs container
        const tabsElement = writer.createElement('alightTabs');

        // Create tabs header
        const tabsHeader = writer.createElement('alightTabsHeader');

        // Create first tab button
        const tab1Id = 'tab1';
        const tab1Button = writer.createElement('alightTabButton', {
          id: tab1Id,
          label: 'Tab 1',
          isActive: true
        });

        // Create second tab button
        const tab2Id = 'tab2';
        const tab2Button = writer.createElement('alightTabButton', {
          id: tab2Id,
          label: 'Tab 2',
          isActive: false
        });

        // Add buttons to header
        writer.append(tab1Button, tabsHeader);
        writer.append(tab2Button, tabsHeader);

        // Create tab contents
        const tab1Content = writer.createElement('alightTabContent', {
          id: tab1Id,
          tabId: tab1Id,
          isActive: true
        });

        const tab2Content = writer.createElement('alightTabContent', {
          id: tab2Id,
          tabId: tab2Id,
          isActive: false
        });

        // Add default paragraph to tab content
        const paragraph1 = writer.createElement('paragraph');
        writer.append(paragraph1, tab1Content);

        const paragraph2 = writer.createElement('paragraph');
        writer.append(paragraph2, tab2Content);

        // Assemble tabs component
        writer.append(tabsHeader, tabsElement);
        writer.append(tab1Content, tabsElement);
        writer.append(tab2Content, tabsElement);

        // Insert tabs into document
        writer.insert(tabsElement, position);
      });
    }
  }
}

class TabPropertiesCommand extends Command {
  constructor(editor: Editor) {
    super(editor);
    this.set('value', undefined);
  }

  override refresh(): void {
    const model = this.editor.model;
    const selection = model.document.selection;
    const element = selection.getFirstPosition()?.findAncestor('alightTabButton');

    this.isEnabled = !!element;
    this.value = element || undefined;
  }

  override execute(options: Record<string, unknown> = {}): void {
    const model = this.editor.model;
    const selection = model.document.selection;
    const element = selection.getFirstPosition()?.findAncestor('alightTabButton');

    if (!element) return;

    model.change(writer => {
      for (const [key, value] of Object.entries(options)) {
        writer.setAttribute(key, value, element);
      }
    });
  }
}

class TabDeleteCommand extends Command {
  constructor(editor: Editor) {
    super(editor);
  }

  override refresh(): void {
    const model = this.editor.model;
    const selection = model.document.selection;
    const element = selection.getFirstPosition()?.findAncestor('alightTabButton');
    const tabsElement = selection.getFirstPosition()?.findAncestor('alightTabs');

    // Ensure there are at least 2 tabs before allowing deletion
    let tabCount = 0;
    if (tabsElement) {
      const tabsHeader = this._findTabsHeader(tabsElement as Element);

      if (tabsHeader) {
        tabCount = Array.from(tabsHeader.getChildren()).filter(
          child => (child as Element).name === 'alightTabButton'
        ).length;
      }
    }

    this.isEnabled = !!element && tabCount > 1;
  }

  override execute(): void {
    const model = this.editor.model;
    const selection = model.document.selection;
    const element = selection.getFirstPosition()?.findAncestor('alightTabButton') as Element;
    const tabsElement = selection.getFirstPosition()?.findAncestor('alightTabs') as Element;

    if (!element || !tabsElement) return;

    const tabId = element.getAttribute('id') as string;

    model.change(writer => {
      // Delete the tab button
      writer.remove(element);

      // Find and delete the corresponding tab content
      const tabContent = this._findTabContent(tabsElement, tabId);
      if (tabContent) {
        writer.remove(tabContent);
      }

      // If deleted tab was active, activate the first tab
      if (element.getAttribute('isActive')) {
        const tabsHeader = this._findTabsHeader(tabsElement);

        if (tabsHeader) {
          const firstTabButton = Array.from(tabsHeader.getChildren()).find(
            child => (child as Element).name === 'alightTabButton'
          ) as Element;

          if (firstTabButton) {
            writer.setAttribute('isActive', true, firstTabButton);

            const firstTabId = firstTabButton.getAttribute('id');
            const firstTabContent = this._findTabContent(tabsElement, firstTabId as string);

            if (firstTabContent) {
              writer.setAttribute('isActive', true, firstTabContent);
            }
          }
        }
      }
    });
  }

  // Helper method to find tabs header
  private _findTabsHeader(tabsElement: Element): Element | null {
    for (const child of tabsElement.getChildren()) {
      if ((child as Element).name === 'alightTabsHeader') {
        return child as Element;
      }
    }
    return null;
  }

  // Helper method to find tab content by tabId
  private _findTabContent(tabsElement: Element, tabId: string): Element | null {
    for (const child of tabsElement.getChildren()) {
      if ((child as Element).name === 'alightTabContent' && (child as Element).getAttribute('tabId') === tabId) {
        return child as Element;
      }
    }
    return null;
  }
}

class TabAddCommand extends Command {
  constructor(editor: Editor) {
    super(editor);
  }

  override refresh(): void {
    const selection = this.editor.model.document.selection;
    const tabsElement = selection.getFirstPosition()?.findAncestor('alightTabs');

    this.isEnabled = !!tabsElement;
  }

  override execute(): void {
    const model = this.editor.model;
    const selection = model.document.selection;
    const tabsElement = selection.getFirstPosition()?.findAncestor('alightTabs') as Element;

    if (!tabsElement) return;

    // Find the tabs header
    let tabsHeader: Element | null = null;
    for (const child of tabsElement.getChildren()) {
      if ((child as Element).name === 'alightTabsHeader') {
        tabsHeader = child as Element;
        break;
      }
    }

    if (!tabsHeader) return;

    model.change(writer => {
      // Generate unique ID
      const tabId = 'tab' + Date.now();

      // Create new tab button
      const newTabButton = writer.createElement('alightTabButton', {
        id: tabId,
        label: 'New Tab',
        isActive: false
      });

      // Add button to header
      writer.append(newTabButton, tabsHeader);

      // Create new tab content
      const newTabContent = writer.createElement('alightTabContent', {
        id: tabId,
        tabId: tabId,
        isActive: false
      });

      // Add default paragraph to content
      const paragraph = writer.createElement('paragraph');
      writer.append(paragraph, newTabContent);

      // Add content to tabs
      writer.append(newTabContent, tabsElement);
    });
  }
}
