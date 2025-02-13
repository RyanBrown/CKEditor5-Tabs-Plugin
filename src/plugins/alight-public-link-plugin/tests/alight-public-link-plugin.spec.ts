// src/plugins/alight-public-link-plugin/tests/alight-public-link-plugin.spec.ts
import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import { Editor } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import AlightPublicLinkPlugin from '../alight-public-link-plugin';
import { LICENSE_KEY } from '../../../ckeditor';
import AlightPublicLinkPluginEditing from '../alight-public-link-plugin-editing';
import AlightPublicLinkPluginUI from '../alight-public-link-plugin-ui';
import { setData } from '@ckeditor/ckeditor5-engine/src/dev-utils/view';

describe('AlightPublicLinkPlugin', () => {
  let editor: any;
  let element: HTMLElement;
  let ui: AlightPublicLinkPluginUI;

  beforeEach(async () => {
    element = document.createElement('div');
    document.body.appendChild(element);

    editor = await ClassicEditor.create(element, {
      plugins: [Essentials, Paragraph, Link, AlightPublicLinkPlugin],
      toolbar: ['alightPublicLinkPlugin'],
      licenseKey: LICENSE_KEY
    });

    ui = editor.plugins.get('AlightPublicLinkPluginUI');
  });

  afterEach(async () => {
    await editor?.destroy();
    element?.remove();
  });

  it('should be named correctly', () => {
    expect(AlightPublicLinkPlugin.pluginName).toBe('AlightPublicLinkPlugin');
  });

  it('should require proper dependencies', () => {
    const requires = AlightPublicLinkPlugin.requires;
    expect(requires).toEqual([AlightPublicLinkPluginEditing, AlightPublicLinkPluginUI, Link]);
  });

  describe('integration', () => {
    it('should handle link creation and editing workflow', async () => {
      // Set initial selection using model.setData instead of view.setData
      editor.model.change((writer: any) => {
        editor.model.insertContent(writer.createText('Test'));
        editor.model.change((writer: any) => {
          const range = editor.model.document.selection.getFirstRange()!;
          writer.setSelection(range);
        });
      });

      // Create a new link
      editor.execute('alightPublicLinkPlugin', {
        url: 'https://example.com',
        orgName: 'Example Org'
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify link was created
      const command = editor.commands.get('alightPublicLinkPlugin');
      expect(command.value).toBeTruthy();
      expect(command.value.url).toBe('https://example.com');
      expect(command.value.orgName).toBe('Example Org');

      // Remove the link
      editor.execute('alightPublicLinkPlugin');

      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify link was removed
      expect(command.value).toBeUndefined();
    });
  });
});
