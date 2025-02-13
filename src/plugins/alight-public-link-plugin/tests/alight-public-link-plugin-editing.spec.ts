// // src/plugins/alight-public-link-plugin/tests/alight-public-link-plugin-editing.spec.ts
// import ClassicEditor from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
// import { setData, getData } from '@ckeditor/ckeditor5-engine/src/dev-utils/model';
// import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
// import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
// import AlightPublicLinkEditing from '../alight-public-link-plugin-editing';
// import { LICENSE_KEY } from '../../../ckeditor';

// describe('AlightPublicLinkEditing', () => {
//   let editor: any;
//   let element: HTMLElement;

//   beforeEach(async () => {
//     element = document.createElement('div');
//     document.body.appendChild(element);

//     editor = await ClassicEditor.create(element, {
//       plugins: [Essentials, Paragraph, AlightPublicLinkEditing],
//       licenseKey: LICENSE_KEY
//     });
//   });

//   afterEach(async () => {
//     await editor?.destroy();
//     element?.remove();
//   });

//   it('should set up proper schema rules', () => {
//     expect(editor.model.schema.checkAttribute(['$text'], 'alightPublicLinkPlugin')).toBe(true);
//   });

//   describe('conversion', () => {
//     it('should convert model link to view link', () => {
//       const linkData = {
//         url: 'https://example.com',
//         orgName: 'Example Org'
//       };

//       setData(
//         editor.model,
//         `<paragraph><$text alightPublicLinkPlugin='${JSON.stringify(linkData)}'>foo</$text></paragraph>`
//       );

//       expect(editor.getData()).toBe(
//         '<p><a href="https://example.com" data-org-name="Example Org" target="_blank" rel="noopener noreferrer">foo</a></p>'
//       );
//     });

//     it('should convert view link to model link', () => {
//       editor.setData(
//         '<p><a href="https://example.com" data-org-name="Example Org">foo</a></p>'
//       );

//       const modelData = getData(editor.model);
//       expect(modelData).toContain('alightPublicLinkPlugin');
//       expect(modelData).toContain('https://example.com');
//     });

//     it('should not convert link without href attribute', () => {
//       editor.setData('<p><a>foo</a></p>');
//       expect(getData(editor.model)).toBe('<paragraph>foo</paragraph>');
//     });
//   });
// });