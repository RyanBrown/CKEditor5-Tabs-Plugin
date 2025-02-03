// src/plugins/alight-link-plugin/alight-link-plugin-editing.ts
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import { AlightLinkPluginCommand } from './alight-link-plugin-command';
import { getPredefinedLinkContent } from './modal-content/predefined-link';
import { getPublicIntranetLinkContent } from './modal-content/public-intranet-link';
import { getExistingDocumentLinkContent } from './modal-content/existing-document-link';
import { getNewDocumentsLinkContent } from './modal-content/new-document-link';

export default class AlightLinkPluginEditing extends Plugin {
  init() {
    const editor = this.editor;

    // Two separate commands for two types of content
    editor.commands.add(
      'linkOption1',
      new AlightLinkPluginCommand(editor, {
        title: 'Choose a Predefined Link',
        primaryButtonLabel: 'Choose',
        // loadContent: async () => getPredefinedLinkContent(3)
        loadContent: async () => getPublicIntranetLinkContent()
      })
    );
    editor.commands.add(
      'linkOption2',
      new AlightLinkPluginCommand(editor, {
        title: 'Public Website Link',
        primaryButtonLabel: 'Continue',
        loadContent: async () => getPublicIntranetLinkContent()
      })
    );
    editor.commands.add(
      'linkOption3',
      new AlightLinkPluginCommand(editor, {
        title: 'Intranet Link',
        primaryButtonLabel: 'Continue',
        loadContent: async () => getPublicIntranetLinkContent()
      })
    );
    editor.commands.add(
      'linkOption4',
      new AlightLinkPluginCommand(editor, {
        title: 'Existing Document Link',
        primaryButtonLabel: 'Continue',
        loadContent: async () => getExistingDocumentLinkContent()
      })
    );
    editor.commands.add(
      'linkOption5',
      new AlightLinkPluginCommand(editor, {
        title: 'New Document Link',
        primaryButtonLabel: 'Continue',
        loadContent: async () => getNewDocumentsLinkContent()
      })
    );
  }
}
