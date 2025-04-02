// src/plugins/ui-components/alight-tabs-component/alight-tabs-component.ts
import { Plugin } from '@ckeditor/ckeditor5-core';
import { WidgetToolbarRepository } from '@ckeditor/ckeditor5-widget';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import { first } from '@ckeditor/ckeditor5-utils';
import { Command } from '@ckeditor/ckeditor5-core';
import type { Editor } from '@ckeditor/ckeditor5-core';
import { toWidget } from '@ckeditor/ckeditor5-widget';
import { TabsView, TabView, TabPanelView, TabViewConfig } from './alight-tabs-component-view';

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
  }

  private _defineSchema(): void {
    const schema = this.editor.model.schema;

    schema.register('alightTabs', {
      isObject: true,
      allowWhere: '$block',
      allowContentOf: '$root'
    });
  }

  private _defineConverters(): void {
    const editor = this.editor;

    // Define conversion for data
    editor.conversion.for('dataDowncast').elementToElement({
      model: 'alightTabs',
      view: (modelElement, { writer }) => {
        return writer.createContainerElement('div', {
          class: 'cka-tabs'
        });
      }
    });

    editor.conversion.for('editingDowncast').elementToElement({
      model: 'alightTabs',
      view: (modelElement, { writer }) => {
        const div = writer.createContainerElement('div', {
          class: 'cka-tabs'
        });
        return toWidget(div, writer, { label: 'tab widget' });
      }
    });

    editor.conversion.for('upcast').elementToElement({
      view: {
        name: 'div',
        classes: ['cka-tabs']
      },
      model: 'alightTabs'
    });
  }

  private _insertTabs(): void {
    const editor = this.editor;
    const selection = editor.model.document.selection;
    const position = selection.getFirstPosition();

    if (position) {
      editor.model.change(writer => {
        const tabsElement = writer.createElement('alightTabs');
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
    const element = first(selection.getSelectedBlocks());

    this.isEnabled = !!element && element.name === 'alightTabs';
    this.value = element || undefined;
  }

  override execute(options: Record<string, unknown> = {}): void {
    const model = this.editor.model;
    const selection = model.document.selection;
    const element = first(selection.getSelectedBlocks());

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
    const selection = this.editor.model.document.selection;
    const element = first(selection.getSelectedBlocks());

    this.isEnabled = !!element && element.name === 'alightTabs';
  }

  override execute(): void {
    const model = this.editor.model;
    const selection = model.document.selection;
    const element = first(selection.getSelectedBlocks());

    if (!element) return;

    model.change(writer => {
      writer.remove(element);
    });
  }
}
