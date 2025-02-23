// // src/plugins/alight-email-link-plugin/alight-email-link-plugin-ui.ts
// import { Plugin } from '@ckeditor/ckeditor5-core';
// import { ButtonView, ContextualBalloon, View } from '@ckeditor/ckeditor5-ui';
// import { ClickObserver } from '@ckeditor/ckeditor5-engine';
// import type ViewElement from '@ckeditor/ckeditor5-engine/src/view/element';
// import { CkAlightModalDialog } from '../ui-components/alight-modal-dialog-component/alight-modal-dialog-component';
// import { ContentManager, validateForm } from './modal-content/alight-email-link-plugin-modal-ContentManager';
// import LinkUI from '@ckeditor/ckeditor5-link/src/linkui';
// import toolBarIcon from './assets/icon-link.svg';
// import './styles/alight-email-link-plugin.scss';

// export default class AlightEmailLinkPluginUI extends Plugin {
//   private _modalDialog?: CkAlightModalDialog;
//   private _balloon!: ContextualBalloon;

//   public static get requires() {
//     return [LinkUI] as const;
//   }

//   public static get pluginName() {
//     return 'AlightEmailLinkPluginUI' as const;
//   }

//   public init(): void {
//     const editor = this.editor;
//     this._balloon = editor.plugins.get(ContextualBalloon);

//     editor.editing.view.addObserver(ClickObserver);

//     this._setupToolbarButton();

//     this._balloon.on('change:visibleView', () => {
//       this._extendDefaultActionsView();
//     });

//     const linkUI: any = editor.plugins.get('LinkUI');
//     if (linkUI) {
//       const originalShowActions = linkUI.showActions?.bind(linkUI);
//       if (originalShowActions) {
//         linkUI.showActions = (...args: any[]) => {
//           originalShowActions(...args);
//           this._extendDefaultActionsView();
//         };
//       }

//       const originalCreateActionsView = linkUI._createActionsView?.bind(linkUI);
//       if (originalCreateActionsView) {
//         linkUI._createActionsView = () => {
//           const actionsView = originalCreateActionsView();

//           actionsView.previewButtonView.unbind('label');
//           actionsView.previewButtonView.unbind('tooltip');

//           actionsView.previewButtonView.bind('label').to(actionsView, 'href', (href: string) => {
//             if (!href) {
//               return editor.t('This link has no URL');
//             }
//             return href.toLowerCase().startsWith('mailto:') ?
//               href.substring(7) : href;
//           });

//           actionsView.previewButtonView.bind('tooltip').to(actionsView, 'href', (href: string) => {
//             if (href && href.toLowerCase().startsWith('mailto:')) {
//               return editor.t('Open email in client');
//             }
//             return editor.t('Open link in new tab');
//           });

//           return actionsView;
//         };
//       }
//     }
//   }

//   private _setupToolbarButton(): void {
//     const editor = this.editor;
//     const t = editor.t;

//     editor.ui.componentFactory.add('alightEmailLinkPlugin', locale => {
//       const button = new ButtonView(locale);

//       const linkCommand = editor.commands.get('link');
//       if (!linkCommand) {
//         console.warn('[AlightEmailLinkPluginUI] The built-in "link" command is unavailable.');
//         return button;
//       }

//       button.set({
//         label: t('Email Link'),
//         icon: toolBarIcon,
//         tooltip: true,
//         withText: true
//       });

//       button.bind('isEnabled').to(linkCommand);
//       button.bind('isOn').to(linkCommand, 'value', value => !!value);

//       button.on('execute', () => {
//         this._showModal();
//       });

//       return button;
//     });
//   }

//   private _extendDefaultActionsView(): void {
//     const editor = this.editor;
//     const linkUI: any = editor.plugins.get('LinkUI');
//     if (!linkUI || !linkUI.actionsView) {
//       console.log('no linkUI or actionsView');
//       return;
//     }

//     const actionsView: any = linkUI.actionsView;
//     const linkCommand = editor.commands.get('link');

//     if (!linkCommand || typeof linkCommand.value !== 'string') {
//       return;
//     }

//     let linkValue = linkCommand.value.trim().toLowerCase();

//     if (!linkValue.startsWith('mailto:')) {
//       if (actionsView.editButtonView) {
//         actionsView.editButtonView.off('execute');
//         actionsView.off('edit');
//       }
//       return;
//     }

//     if (actionsView.editButtonView) {
//       actionsView.editButtonView.off('execute');
//       actionsView.off('edit');

//       actionsView.editButtonView.on('execute', (evt: { stop: () => void }) => {
//         evt.stop();

//         let email = '';
//         if (linkCommand && typeof linkCommand.value === 'string') {
//           email = linkCommand.value.replace(/^mailto:/i, '');
//         }

//         this._showModal({ email });
//       }, { priority: 'highest' });

//       actionsView.on('edit', (evt: { stop: () => void }) => {
//         evt.stop();
//       }, { priority: 'highest' });
//     }
//   }

//   private _showModal(initialValue?: { email?: string; orgName?: string }): void {
//     const editor = this.editor;

//     const linkCommand = editor.commands.get('link');
//     if (!linkCommand) {
//       console.warn('[AlightEmailLinkPluginUI] The built-in "link" command is unavailable.');
//       return;
//     }

//     const initialEmail = initialValue?.email || '';
//     const initialOrgName = initialValue?.orgName || '';

//     if (!this._modalDialog) {
//       this._modalDialog = new CkAlightModalDialog({
//         title: 'Create an Email Link',
//         modal: true,
//         width: '500px',
//         height: 'auto',
//         contentClass: 'email-link-content',
//         buttons: [
//           { label: 'Cancel', variant: 'outlined', shape: 'round', disabled: false },
//           { label: 'Continue', variant: 'default', isPrimary: true, shape: 'round', closeOnClick: false, disabled: false }
//         ]
//       });

//       this._modalDialog.on('buttonClick', (label: string) => {
//         if (label === 'Cancel') {
//           this._modalDialog?.hide();
//           return;
//         }

//         if (label === 'Continue') {
//           const form = this._modalDialog?.element?.querySelector('#email-link-form') as HTMLFormElement;
//           const isValid = validateForm(form);
//           if (isValid) {
//             const emailInput = form.querySelector('#link-email') as HTMLInputElement;
//             const emailVal = emailInput.value.trim();

//             editor.model.change(() => {
//               editor.execute('link', 'mailto:' + emailVal);
//             });

//             this._modalDialog?.hide();
//           }
//         }
//       });
//     }

//     const content = ContentManager(initialEmail, initialOrgName);
//     this._modalDialog.setContent(content);
//     this._modalDialog.show();
//   }

//   public override destroy(): void {
//     super.destroy();
//     this._modalDialog?.destroy();
//   }
// }