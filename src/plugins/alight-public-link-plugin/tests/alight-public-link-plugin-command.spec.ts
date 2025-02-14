// src/plugins/alight-public-link-plugin/tests/alight-public-link-plugin-command.spec.ts
import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import { Editor } from '@ckeditor/ckeditor5-core';
import { setData, getData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import { Link } from '@ckeditor/ckeditor5-link';
import AlightPublicLinkPlugin from '../alight-public-link-plugin';
import { LICENSE_KEY } from '../../../ckeditor';
import AlightPublicLinkPluginCommand from '../alight-public-link-plugin-command';

describe('AlightPublicLinkPluginCommand', () => {
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

  describe('isEnabled', () => {
    it('should be enabled when selection is in text', () => {
      setData(editor.model, '<paragraph>foo[]bar</paragraph>');
      const command = editor.commands.get('alightPublicLinkPlugin');
      expect(command.isEnabled).toBe(true);
    });

    it('should be disabled when selection is on restricted element', () => {
      editor.model.schema.register('restricted', {
        isLimit: true,
        allowIn: '$root'
      });
      editor.conversion.elementToElement({ model: 'restricted', view: 'restricted' });

      setData(editor.model, '<restricted>[]</restricted>');
      const command = editor.commands.get('alightPublicLinkPlugin');
      expect(command.isEnabled).toBe(false);
    });
  });

  describe('value', () => {
    it('should be undefined when selection has no link', () => {
      setData(editor.model, '<paragraph>foo[]bar</paragraph>');
      const command = editor.commands.get('alightPublicLinkPlugin');
      expect(command.value).toBeUndefined();
    });

    it('should be set to link attributes when selection has link', () => {
      const linkData = {
        url: 'https://example.com',
        orgName: 'Example Org'
      };
      setData(
        editor.model,
        `<paragraph><$text alightPublicLinkPlugin='${JSON.stringify(linkData)}'>foo[]bar</$text></paragraph>`
      );
      const command = editor.commands.get('alightPublicLinkPlugin');
      expect(command.value).toEqual(linkData);
    });
  });

  // describe('execute()', () => {
  //   it('should create new link on selected text', () => {
  //     const linkData = {
  //       url: 'https://example.com',
  //       orgName: 'Example Org'
  //     };

  //     editor.model.change((writer: any) => {
  //       const root = editor.model.document.getRoot();
  //       const text = writer.createText('foobarbaz');
  //       writer.insert(text, root.getChild(0), 0);

  //       // Set selection on "bar"
  //       const start = writer.createPositionAt(root.getChild(0), 3);
  //       const end = writer.createPositionAt(root.getChild(0), 6);
  //       writer.setSelection(writer.createRange(start, end));
  //     });

  //     const command = editor.commands.get('alightPublicLinkPlugin');
  //     command.execute(linkData);

  //     expect(getData(editor.model)).toBe(
  //       '<paragraph>foo[<$text alightPublicLinkPlugin=\'{"url":"https://example.com","orgName":"Example Org"}\'>bar</$text>]baz</paragraph>'
  //     );
  //   });

  //   it('should remove link when no linkData provided', () => {
  //     const linkData = {
  //       url: 'https://example.com',
  //       orgName: 'Example Org'
  //     };

  //     editor.model.change((writer: any) => {
  //       const root = editor.model.document.getRoot();
  //       const text = writer.createText('foobarbaz');
  //       writer.insert(text, root.getChild(0), 0);

  //       // Set attribute on "bar"
  //       const start = writer.createPositionAt(root.getChild(0), 3);
  //       const end = writer.createPositionAt(root.getChild(0), 6);
  //       const range = writer.createRange(start, end);
  //       writer.setSelection(range);
  //       writer.setAttribute('alightPublicLinkPlugin', linkData, range);
  //     });

  //     const command = editor.commands.get('alightPublicLinkPlugin');
  //     command.execute();

  //     expect(getData(editor.model)).toBe('<paragraph>foo[bar]baz</paragraph>');
  //   });

  //   it('should update existing link with new attributes', () => {
  //     const oldLinkData = {
  //       url: 'https://example.com',
  //       orgName: 'Example Org'
  //     };
  //     const newLinkData = {
  //       url: 'https://new-example.com',
  //       orgName: 'New Org'
  //     };

  //     setData(
  //       editor.model,
  //       `<paragraph>foo[<$text alightPublicLinkPlugin='${JSON.stringify(oldLinkData)}'>bar</$text>]baz</paragraph>`
  //     );
  //     const command = editor.commands.get('alightPublicLinkPlugin');
  //     command.execute(newLinkData);

  //     expect(getData(editor.model)).toBe(
  //       `<paragraph>foo[<$text alightPublicLinkPlugin='${JSON.stringify(newLinkData)}'>bar</$text>]baz</paragraph>`
  //     );
  //   });

  //   it('should handle collapsed selection by finding link range', () => {
  //     const linkData = {
  //       url: 'https://example.com',
  //       orgName: 'Example Org'
  //     };
  //     setData(
  //       editor.model,
  //       `<paragraph>foo<$text alightPublicLinkPlugin='${JSON.stringify(linkData)}'>b[]ar</$text>baz</paragraph>`
  //     );
  //     const newLinkData = {
  //       url: 'https://new-example.com',
  //       orgName: 'New Org'
  //     };
  //     const command = editor.commands.get('alightPublicLinkPlugin');
  //     command.execute(newLinkData);

  //     expect(getData(editor.model)).toBe(
  //       `<paragraph>foo<$text alightPublicLinkPlugin='${JSON.stringify(newLinkData)}'>b[]ar</$text>baz</paragraph>`
  //     );
  //   });

  //   it('should append organization name when provided', () => {
  //     const linkData = {
  //       url: 'https://example.com',
  //       orgName: 'Example Org'
  //     };
  //     setData(editor.model, '<paragraph>foo[bar]baz</paragraph>');
  //     const command = editor.commands.get('alightPublicLinkPlugin');
  //     command.execute(linkData);

  //     expect(getData(editor.model)).toContain('bar (Example Org)');
  //   });

  //   it('should remove organization name when unlinking', () => {
  //     const linkData = {
  //       url: 'https://example.com',
  //       orgName: 'Example Org'
  //     };
  //     setData(
  //       editor.model,
  //       `<paragraph>foo[<$text alightPublicLinkPlugin='${JSON.stringify(linkData)}'>bar (Example Org)</$text>]baz</paragraph>`
  //     );
  //     const command = editor.commands.get('alightPublicLinkPlugin');
  //     command.execute();

  //     expect(getData(editor.model)).toBe('<paragraph>foo[bar]baz</paragraph>');
  //   });
  // });
});