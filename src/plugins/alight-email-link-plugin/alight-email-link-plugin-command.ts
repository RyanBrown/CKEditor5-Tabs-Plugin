// src/plugins/alight-email-link-plugin/alight-email-link-plugin-command.ts
import { Command } from '@ckeditor/ckeditor5-core';
import type { Editor } from '@ckeditor/ckeditor5-core';
import { findAttributeRange } from '@ckeditor/ckeditor5-typing';
import { type Item, type Node } from '@ckeditor/ckeditor5-engine';

export interface LinkAttributes {
  url: string;
  orgName?: string;
}

export default class AlightEmailLinkPluginCommand extends Command {
  declare value: LinkAttributes | undefined;

  constructor(editor: Editor) {
    super(editor);

    // Refresh the command state whenever the selection range changes
    this.listenTo(editor.model.document.selection, 'change:range', () => {
      this.refresh();
    });
  }

  override refresh(): void {
    const model = this.editor.model;
    const selection = model.document.selection;
    const firstPosition = selection.getFirstPosition();

    if (firstPosition) {
      const element = firstPosition.parent;
      if (element && model.schema.isLimit(element)) {
        this.isEnabled = false;
        this.value = undefined;
        return;
      }
    }

    this.isEnabled = model.schema.checkAttributeInSelection(selection, 'alightEmailLinkPlugin');

    if (!firstPosition) {
      this.value = undefined;
      return;
    }

    const attributeValue = selection.getAttribute('alightEmailLinkPlugin');
    if (attributeValue && typeof attributeValue === 'object') {
      this.value = attributeValue as LinkAttributes;
    } else {
      this.value = undefined;
    }
  }

  override execute(linkData?: LinkAttributes): void {
    const model = this.editor.model;
    const selection = model.document.selection;

    model.change(writer => {
      // If no link data is provided, remove the link and associated organization name
      if (!linkData) {
        const ranges = selection.isCollapsed
          ? [findAttributeRange(
            selection.getFirstPosition()!,
            'alightEmailLinkPlugin',
            selection.getAttribute('alightEmailLinkPlugin'),
            model
          )]
          : selection.getRanges();

        for (const range of ranges) {
          const items = Array.from(range.getItems());
          const text = items
            .map(item => {
              if (item.is('$text') || item.is('$textProxy')) {
                return item.data;
              }
              return '';
            })
            .join('')
            .replace(/ \([^)]+\)$/, '');

          writer.remove(range);
          writer.insertText(text, range.start);
          writer.removeAttribute('alightEmailLinkPlugin', range);
        }
        return;
      }

      if (selection.isCollapsed) {
        // If the selection is collapsed, find the range of the current link and update it
        const position = selection.getFirstPosition()!;
        const range = findAttributeRange(
          position,
          'alightEmailLinkPlugin',
          selection.getAttribute('alightEmailLinkPlugin'),
          model
        );

        const items = Array.from(range.getItems());
        const text = items
          .map(item => {
            if (item.is('$text') || item.is('$textProxy')) {
              return item.data;
            }
            return '';
          })
          .join('')
          .replace(/ \([^)]+\)$/, '');

        const newText = linkData.orgName
          ? `${text} (${linkData.orgName})`
          : text;

        writer.remove(range);
        writer.insertText(newText, range.start);
        writer.setAttribute('alightEmailLinkPlugin', linkData, range);
      } else {
        // If the selection is not collapsed, apply attributes to the selected range
        const ranges = model.schema.getValidRanges(selection.getRanges(), 'alightEmailLinkPlugin');

        for (const range of ranges) {
          const items = Array.from(range.getItems());
          const text = items
            .map(item => {
              if (item.is('$text') || item.is('$textProxy')) {
                return item.data;
              }
              return '';
            })
            .join('')
            .replace(/ \([^)]+\)$/, '');

          const newText = linkData.orgName
            ? `${text} (${linkData.orgName})`
            : text;

          writer.remove(range);
          writer.insertText(newText, range.start);
          writer.setAttribute('alightEmailLinkPlugin', linkData, range);
        }
      }
    });
  }
}
