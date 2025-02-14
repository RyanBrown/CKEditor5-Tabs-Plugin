// src/plugins/alight-public-link-plugin/tests/alight-public-link-plugin-editing.spec.ts
import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import { setData, getData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Link from '@ckeditor/ckeditor5-link/src/link';
import AlightPublicLinkPluginEditing from '../alight-public-link-plugin-editing';
import { LICENSE_KEY } from '../../../ckeditor';

describe('AlightPublicLinkPluginEditing', () => {
  let editor: any;
  let element: HTMLElement;

  beforeEach(async () => {
    element = document.createElement('div');
    document.body.appendChild(element);

    editor = await ClassicEditor.create(element, {
      plugins: [Essentials, Paragraph, Link, AlightPublicLinkPluginEditing],
      licenseKey: LICENSE_KEY
    });
  });

  afterEach(async () => {
    await editor?.destroy();
    element?.remove();
  });

  it('should set up proper schema rules', () => {
    // Check if the schema allows alightPublicLinkPlugin attribute on text
    expect(editor.model.schema.checkAttribute(['$text'], 'alightPublicLinkPlugin')).toBe(true);
  });

  describe('conversion', () => {
    it('should convert model link to view link', () => {
      const linkData = {
        url: 'https://example.com',
        orgName: 'Example Org'
      };

      // Set model data with the link
      setData(
        editor.model,
        `<paragraph><$text alightPublicLinkPlugin='${JSON.stringify(linkData)}'>foo</$text></paragraph>`
      );

      // Get the raw HTML output
      const viewData = editor.getData();

      // Verify all attributes are present
      expect(viewData).toContain('href="https://example.com"');
      expect(viewData).toContain('data-org-name="Example Org"');
      expect(viewData).toContain('target="_blank"');
      expect(viewData).toContain('rel="noopener noreferrer"');
      expect(viewData).toContain('>foo</a>');
    });

    // it('should convert view link to model link', () => {
    //   // Set editor data with an HTML link
    //   editor.setData(
    //     '<p><a href="https://example.com" data-org-name="Example Org" target="_blank" rel="noopener noreferrer">foo</a></p>'
    //   );

    //   // Get the model data
    //   const modelData = getData(editor.model);

    //   // Parse the alightPublicLinkPlugin attribute value
    //   const match = modelData.match(/alightPublicLinkPlugin='([^']+)'/);
    //   expect(match).toBeTruthy();

    //   if (match) {
    //     const linkData = JSON.parse(match[1]);
    //     expect(linkData.url).toBe('https://example.com');
    //     expect(linkData.orgName).toBe('Example Org');
    //   }
    // });

    it('should not convert link without href attribute', () => {
      editor.setData('<p><a>foo</a></p>');

      // Need to normalize the whitespace and remove selection markers
      const modelData = getData(editor.model)
        .replace(/\[|\]/g, '')  // Remove selection markers
        .trim();                // Remove extra whitespace

      expect(modelData).toBe('<paragraph>foo</paragraph>');
    });

    it('should handle link without org-name', () => {
      const linkData = {
        url: 'https://example.com'
      };

      setData(
        editor.model,
        `<paragraph><$text alightPublicLinkPlugin='${JSON.stringify(linkData)}'>foo</$text></paragraph>`
      );

      const viewData = editor.getData();
      expect(viewData).not.toContain('data-org-name');
      expect(viewData).toContain('href="https://example.com"');
    });
  });
});