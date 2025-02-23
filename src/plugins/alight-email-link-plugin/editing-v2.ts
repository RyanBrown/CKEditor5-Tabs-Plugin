// // src/plugins/alight-email-link-plugin/alight-email-link-plugin-editing.ts
// import { Plugin } from '@ckeditor/ckeditor5-core';
// import { Link } from '@ckeditor/ckeditor5-link';

// export default class AlightEmailLinkPluginEditing extends Plugin {
//   public static get pluginName() {
//     return 'AlightEmailLinkPluginEditing' as const;
//   }

//   public static get requires() {
//     return [Link] as const;
//   }

//   public init(): void {
//     const editor = this.editor;
//     const conversion = editor.conversion;

//     conversion.for('downcast').attributeToElement({
//       model: 'linkHref', // The built-in Link plugin uses this attribute name.
//       view: (href: string, { writer }) => {
//         if (!href) {
//           return;
//         }

//         const attributes: Record<string, string> = {
//           href
//         };

//         if (href.toLowerCase().startsWith('mailto:')) {
//           attributes.class = 'email-link';
//         }

//         return writer.createAttributeElement('a', attributes, { priority: 5 });
//       }
//     });

//     conversion.for('upcast').elementToAttribute({
//       view: {
//         name: 'a',
//         attributes: {
//           href: /^mailto:/i
//         }
//       },
//       model: {
//         key: 'linkHref',
//         value: (viewElement: Element) => {
//           const hrefVal = viewElement.getAttribute('href');
//           return hrefVal || '';
//         }
//       }
//     });
//   }
// }
