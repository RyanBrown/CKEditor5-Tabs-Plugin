// src/plugins/alight-email-link-plugin/tests/alight-email-link-plugin-utils.spec.ts
import { getSelectedLinkElement } from '../alight-email-link-plugin-plugin-utils';
import { Editor } from '@ckeditor/ckeditor5-core';
import { setData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import { LICENSE_KEY } from '../../../ckeditor';
import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Link from '@ckeditor/ckeditor5-link/src/link';
import AlightEmailLinkPlugin from '../alight-email-link-plugin';

describe('AlightEmailLinkPluginUtils', () => {
  let editor: any;
  let element: HTMLElement;

  beforeEach(async () => {
    element = document.createElement('div');
    document.body.appendChild(element);

    editor = await ClassicEditor.create(element, {
      plugins: [Essentials, Paragraph, Link, AlightEmailLinkPlugin],
      licenseKey: LICENSE_KEY
    });
  });

  afterEach(async () => {
    await editor?.destroy();
    element?.remove();
  });

  describe('getSelectedLinkElement', () => {
    it('should return null when no link is selected', () => {
      setData(editor.model, '<paragraph>foo[]bar</paragraph>');
      const element = getSelectedLinkElement(editor);
      expect(element).toBeNull();
    });

    it('should return link element when link is directly selected', () => {
      const linkData = {
        url: 'https://example.com',
        orgName: 'Example Org'
      };
      setData(
        editor.model,
        `<paragraph><$text alightEmailLinkPlugin='${JSON.stringify(linkData)}'>foo[]bar</$text></paragraph>`
      );
      const element = getSelectedLinkElement(editor);
      expect(element).toBeTruthy();
      expect(element?.is('element', 'a')).toBe(true);
    });

    it('should return link element when selection is inside link', () => {
      const linkData = {
        url: 'https://example.com',
        orgName: 'Example Org'
      };
      setData(
        editor.model,
        `<paragraph><$text alightEmailLinkPlugin='${JSON.stringify(linkData)}'>f[]oo</$text></paragraph>`
      );
      const element = getSelectedLinkElement(editor);
      expect(element).toBeTruthy();
      expect(element?.is('element', 'a')).toBe(true);
    });
  });
});