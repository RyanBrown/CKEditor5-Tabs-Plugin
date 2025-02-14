//  src/plugins/alight-link-trigger-plugin/alight-link-trigger-plugin-utils.ts
import type { Editor } from '@ckeditor/ckeditor5-core';

export interface LinkTriggerItem {
  id: string;
  label: string;
  trigger: (editor: Editor) => void;
}

export interface AlightLinkTriggerConfig {
  items: LinkTriggerItem[];
}

// // Example configuration in ckeditor.ts
// const editorConfig = {
//   plugins: [AlightLinkTriggerPlugin],
//   toolbar: {
//     items: [
//       // ... other items
//       'alightLinkTrigger'
//     ]
//   },
//   alightLinkTrigger: {
//     items: [
//       {
//         id: 'customLink1',
//         label: 'Custom Link 1',
//         trigger: (editor: Editor) => {
//           // Custom action for link type 1
//           console.log('Custom link 1 triggered');
//         }
//       },
//       {
//         id: 'customLink2',
//         label: 'Custom Link 2',
//         trigger: (editor: Editor) => {
//           // Custom action for link type 2
//           console.log('Custom link 2 triggered');
//         }
//       }
//     ]
//   }
// };
