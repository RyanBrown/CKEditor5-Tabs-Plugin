// src/plugins/alight-generic-link-plugin/tests/alight-generic-link-plugin.spec.ts
import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import { Editor } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import AlightGenericLinkPlugin from '../alight-generic-link-plugin';
import { LICENSE_KEY } from '../../../ckeditor';
import AlightGenericLinkPluginEditing from '../alight-generic-link-plugin-editing';
import AlightGenericLinkPluginUI from '../alight-generic-link-plugin-ui';
import { setData } from '@ckeditor/ckeditor5-engine/src/dev-utils/view';

describe('AlightGenericLinkPlugin', () => {
  let editor: any;
  let element: HTMLElement;
  let ui: AlightGenericLinkPluginUI;

  beforeEach(async () => {
    element = document.createElement('div');
    document.body.appendChild(element);

    editor = await ClassicEditor.create(element, {
      plugins: [Essentials, Paragraph, Link, AlightGenericLinkPlugin],
      toolbar: ['alightGenericLinkPlugin'],
      licenseKey: LICENSE_KEY
    });

    ui = editor.plugins.get('AlightGenericLinkPluginUI');
  });

  afterEach(async () => {
    await editor?.destroy();
    element?.remove();
  });

  it('should be named correctly', () => {
    expect(AlightGenericLinkPlugin.pluginName).toBe('AlightGenericLinkPlugin');
  });

  it('should require proper dependencies', () => {
    const requires = AlightGenericLinkPlugin.requires;
    expect(requires).toEqual([AlightGenericLinkPluginEditing, AlightGenericLinkPluginUI, Link]);
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
  //     editor.execute('alightGenericLinkPlugin', {
  //       url: 'https://example.com',
  //       orgName: 'Example Org'
  //     });

  //     await new Promise(resolve => setTimeout(resolve, 50));

  //     // Verify link was created
  //     const command = editor.commands.get('alightGenericLinkPlugin');
  //     expect(command.value).toBeTruthy();
  //     expect(command.value.url).toBe('https://example.com');
  //     expect(command.value.orgName).toBe('Example Org');

  //     // Remove the link
  //     editor.execute('alightGenericLinkPlugin');

  //     await new Promise(resolve => setTimeout(resolve, 50));

  //     // Verify link was removed
  //     expect(command.value).toBeUndefined();
  //   });
  // });
});
