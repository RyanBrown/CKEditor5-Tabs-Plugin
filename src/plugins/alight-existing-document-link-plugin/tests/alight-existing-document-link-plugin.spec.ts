// src/plugins/alight-predefined-link-plugin/tests/alight-predefined-link-plugin.spec.ts
import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import { Editor } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import AlightExistingDocumentLinkPlugin from '../alight-existing-document-link-plugin';
import { LICENSE_KEY } from '../../../ckeditor';
import AlightExistingDocumentLinkPluginEditing from '../alight-existing-document-link-plugin-editing';
import AlightExistingDocumentLinkPluginUI from '../alight-existing-document-link-plugin-ui';
import { setData } from '@ckeditor/ckeditor5-engine/src/dev-utils/view';

describe('AlightExistingDocumentLinkPlugin', () => {
  let editor: any;
  let element: HTMLElement;
  let ui: AlightExistingDocumentLinkPluginUI;

  beforeEach(async () => {
    element = document.createElement('div');
    document.body.appendChild(element);

    editor = await ClassicEditor.create(element, {
      plugins: [Essentials, Paragraph, Link, AlightExistingDocumentLinkPlugin],
      toolbar: ['alightExistingDocumentLinkPlugin'],
      licenseKey: LICENSE_KEY
    });

    ui = editor.plugins.get('AlightExistingDocumentLinkPluginUI');
  });

  afterEach(async () => {
    await editor?.destroy();
    element?.remove();
  });

  it('should be named correctly', () => {
    expect(AlightExistingDocumentLinkPlugin.pluginName).toBe('AlightExistingDocumentLinkPlugin');
  });

  it('should require proper dependencies', () => {
    const requires = AlightExistingDocumentLinkPlugin.requires;
    expect(requires).toEqual([AlightExistingDocumentLinkPluginEditing, AlightExistingDocumentLinkPluginUI, Link]);
  });

  // describe('integration', () => {
  //   it('should handle link creation and editing workflow', async () => {
  //     editor.model.change((writer: any) => {
  //       const root = editor.model.document.getRoot();
  //       const text = writer.createText('Test');
  //       writer.insert(text, root.getChild(0), 0);

  //       // Set selection on entire text
  //       const range = writer.createRangeOn(text);
  //       writer.setSelection(range);
  //     });

  //     // Create a new link
  //     editor.execute('alightExistingDocumentLinkPlugin', {
  //       url: 'https://example.com',
  //       orgName: 'Example Org'
  //     });

  //     await new Promise(resolve => setTimeout(resolve, 50));

  //     // Verify link was created
  //     const command = editor.commands.get('alightExistingDocumentLinkPlugin');
  //     expect(command.value).toBeTruthy();
  //     expect(command.value.url).toBe('https://example.com');
  //     expect(command.value.orgName).toBe('Example Org');

  //     // Remove the link
  //     editor.execute('alightExistingDocumentLinkPlugin');

  //     await new Promise(resolve => setTimeout(resolve, 50));

  //     // Verify link was removed
  //     expect(command.value).toBeUndefined();
  //   });
  // });
});
