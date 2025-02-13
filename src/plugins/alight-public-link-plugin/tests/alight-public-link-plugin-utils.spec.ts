// src/plugins/alight-public-link-plugin/tests/alight-public-link-plugin-utils.spec.ts
import { getSelectedLinkElement, hasLinkAttribute, getLinkAttributeValue } from '../alight-public-link-plugin-utils';
import { Editor } from '@ckeditor/ckeditor5-core';
import { setData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import { LICENSE_KEY } from './../../../ckeditor';
import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Link from '@ckeditor/ckeditor5-link/src/link';
import AlightPublicLinkPlugin from '../alight-public-link-plugin';

describe('AlightPublicLinkPluginUtils', () => {
  let editor: any;
  let element: HTMLElement;

  beforeEach(async () => {
    element = document.createElement('div');
    document.body.appendChild(element);

    editor = await ClassicEditor.create(element, {
      plugins: [Essentials, Paragraph, Link, AlightPublicLinkPlugin],
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
        `<paragraph><$text alightPublicLinkPlugin='${JSON.stringify(linkData)}'>foo[]bar</$text></paragraph>`
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
        `<paragraph><$text alightPublicLinkPlugin='${JSON.stringify(linkData)}'>f[]oo</$text></paragraph>`
      );
      const element = getSelectedLinkElement(editor);
      expect(element).toBeTruthy();
      expect(element?.is('element', 'a')).toBe(true);
    });
  });

  describe('hasLinkAttribute', () => {
    it('should return false when selection has no link attribute', () => {
      setData(editor.model, '<paragraph>foo[]bar</paragraph>');
      const selection = editor.model.document.selection;
      expect(hasLinkAttribute(selection)).toBe(false);
    });

    it('should return true when selection has link attribute', () => {
      const linkData = {
        url: 'https://example.com',
        orgName: 'Example Org'
      };
      setData(
        editor.model,
        `<paragraph><$text alightPublicLinkPlugin='${JSON.stringify(linkData)}'>foo[]bar</$text></paragraph>`
      );
      const selection = editor.model.document.selection;
      expect(hasLinkAttribute(selection)).toBe(true);
    });
  });

  describe('getLinkAttributeValue', () => {
    it('should return undefined when no link attribute exists', () => {
      setData(editor.model, '<paragraph>foo[]bar</paragraph>');
      const selection = editor.model.document.selection;
      expect(getLinkAttributeValue(selection)).toBeUndefined();
    });

    it('should return link attributes when they exist', () => {
      const linkData = {
        url: 'https://example.com',
        orgName: 'Example Org'
      };
      setData(
        editor.model,
        `<paragraph><$text alightPublicLinkPlugin='${JSON.stringify(linkData)}'>foo[]bar</$text></paragraph>`
      );
      const selection = editor.model.document.selection;
      expect(getLinkAttributeValue(selection)).toEqual(linkData);
    });
  });
});