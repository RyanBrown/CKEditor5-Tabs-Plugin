// src/plugins/alight-public-link-plugin/tests/alight-public-link-plugin.spec.ts
import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import { Editor } from '@ckeditor/ckeditor5-core';
import { Link } from '@ckeditor/ckeditor5-link';
import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import AlightPublicLinkPlugin from '../alight-public-link-plugin';
import { LICENSE_KEY } from '../../../ckeditor';
import AlightPublicLinkEditing from '../alight-public-link-plugin-editing';
import AlightPublicLinkPluginUI from '../alight-public-link-plugin-ui';

describe('AlightPublicLinkPlugin', () => {
  let editor: any;
  let element: HTMLElement;
  let ui: AlightPublicLinkPluginUI;

  beforeEach(async () => {
    element = document.createElement('div');
    document.body.appendChild(element);

    editor = await ClassicEditor.create(element, {
      plugins: [Essentials, Paragraph, Link, AlightPublicLinkPlugin],
      toolbar: ['alightPublicLink'],
      licenseKey: LICENSE_KEY
    });

    ui = editor.plugins.get('AlightPublicLinkPluginUI');
  });

  afterEach(async () => {
    await editor?.destroy();
    element?.remove();
  });

  it('should be named correctly', () => {
    expect(AlightPublicLinkPlugin.pluginName).toBe('AlightPublicLink');
  });

  it('should require proper dependencies', () => {
    expect(AlightPublicLinkPlugin.requires).toEqual([
      AlightPublicLinkEditing,
      AlightPublicLinkPluginUI,
      Link
    ]);
  });

  it('should be loaded', () => {
    expect(editor.plugins.get(AlightPublicLinkPlugin)).toBeTruthy();
  });

  it('should load dependent plugins', () => {
    expect(editor.plugins.get(AlightPublicLinkEditing)).toBeTruthy();
    expect(editor.plugins.get(AlightPublicLinkPluginUI)).toBeTruthy();
    expect(editor.plugins.get(Link)).toBeTruthy();
  });

  it('should extend schema to allow alightPublicLinkPlugin attribute on text', () => {
    expect(editor.model.schema.checkAttribute(['$text'], 'alightPublicLinkPlugin')).toBe(true);
  });

  // describe('integration', () => {
  //   it('should handle link creation and editing workflow', () => {
  //     // Create a new link
  //     editor.execute('alightPublicLinkPlugin', {
  //       url: 'https://example.com',
  //       orgName: 'Example Org'
  //     });

  //     // Verify link was created
  //     let command = editor.commands.get('alightPublicLinkPlugin');
  //     expect(command.value).toEqual({
  //       url: 'https://example.com',
  //       orgName: 'Example Org'
  //     });

  //     // Edit the link
  //     editor.execute('alightPublicLinkPlugin', {
  //       url: 'https://new-example.com',
  //       orgName: 'New Org'
  //     });

  //     // Verify link was updated
  //     expect(command.value).toEqual({
  //       url: 'https://new-example.com',
  //       orgName: 'New Org'
  //     });

  //     // Remove the link
  //     editor.execute('alightPublicLinkPlugin');

  //     // Verify link was removed
  //     expect(command.value).toBeUndefined();
  //   });

  //   it('should maintain correct data in model-view conversion', () => {
  //     // Set initial data with a link
  //     editor.setData(
  //       '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">Test Link</a></p>'
  //     );

  //     // Get data back
  //     const data = editor.getData();

  //     // Verify the structure is maintained
  //     expect(data).toBe(
  //       '<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">Test Link</a></p>'
  //     );
  //   });
  // });
});