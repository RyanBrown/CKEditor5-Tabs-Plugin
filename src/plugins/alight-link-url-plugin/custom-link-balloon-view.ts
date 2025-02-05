import { View } from '@ckeditor/ckeditor5-ui';
import { Locale } from '@ckeditor/ckeditor5-utils';

export class CustomLinkBalloonView extends View {
  declare public element: HTMLElement;
  public urlInputElement: HTMLInputElement;
  public orgNameInputElement: HTMLInputElement;

  constructor(locale: Locale) {
    super(locale);

    this.urlInputElement = document.createElement('input');
    this.orgNameInputElement = document.createElement('input');

    this.setTemplate({
      tag: 'div',
      attributes: {
        class: ['ck', 'ck-link-balloon']
      },
      children: [
        {
          tag: 'input',
          attributes: {
            type: 'text',
            class: ['ck', 'ck-link-input'],
            placeholder: 'Edit URL'
          }
        },
        {
          tag: 'input',
          attributes: {
            class: ['ck', 'ck-button', 'ck-button-save']
          }
        },
        {
          tag: 'button',
          attributes: {
            class: ['ck', 'ck-button', 'ck-button-save']
          },
          children: [{ text: 'Save' }]
        }
      ]
    });
  }

  public override render(): void {
    super.render();
    this.urlInputElement = this.element.querySelector('.ck-link-input') as HTMLInputElement;
    this.orgNameInputElement = this.element.querySelector('.ck-orgname-input') as HTMLInputElement;
  }
}

export default CustomLinkBalloonView; 