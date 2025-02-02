// src/plugins/ui-components/alight-modal-dialog-component/alight-modal-dialog-component-view.ts
import { View } from '@ckeditor/ckeditor5-ui';
import type { Locale } from '@ckeditor/ckeditor5-utils';
import type { TemplateDefinition } from '@ckeditor/ckeditor5-ui/src/template';
import { FocusTracker, KeystrokeHandler } from '@ckeditor/ckeditor5-utils';
import { AlightUIBaseComponent } from '../alight-ui-base-component/alight-ui-base-component';

interface ModalViewProperties {
  title: string;
  isDraggable: boolean;
  isResizable: boolean;
}

export class ModalView extends AlightUIBaseComponent implements ModalViewProperties {
  declare public title: string;
  declare public isDraggable: boolean;
  declare public isResizable: boolean;

  public readonly focusTracker: FocusTracker;
  public readonly keystrokes: KeystrokeHandler;

  constructor(locale: Locale) {
    super(locale);

    this.focusTracker = new FocusTracker();
    this.keystrokes = new KeystrokeHandler();

    // Initialize observable properties with type assertions
    this.set('title' as const, '');
    this.set('isDraggable' as const, true);
    this.set('isResizable' as const, true);

    const bind = this.bindTemplate;

    const template: TemplateDefinition = {
      tag: 'div',
      attributes: {
        class: [
          'ck',
          'ck-modal',
          bind.to('isDraggable', (value: boolean) => value ? 'ck-modal--draggable' : ''),
          bind.to('isResizable', (value: boolean) => value ? 'ck-modal--resizable' : '')
        ],
        tabindex: '-1'
      },
      children: [
        {
          tag: 'div',
          attributes: {
            class: [
              'ck-modal__header'
            ]
          },
          children: [
            {
              tag: 'h2',
              attributes: {
                class: [
                  'ck-modal__title'
                ]
              },
              children: [
                {
                  text: bind.to('title')
                }
              ]
            },
            {
              tag: 'button',
              attributes: {
                class: [
                  'ck',
                  'ck-button',
                  'ck-modal__close-btn'
                ],
                'aria-label': 'Close'
              },
              children: [
                {
                  tag: 'svg',
                  attributes: {
                    class: ['ck', 'ck-icon']
                  }
                }
              ],
              on: {
                click: bind.to(() => {
                  this.fire('close');
                })
              }
            }
          ]
        },
        {
          tag: 'div',
          attributes: {
            class: [
              'ck-modal__body'
            ]
          }
        }
      ]
    };

    this.setTemplate(template);
  }

  // @inheritdoc
  override render(): void {
    super.render();

    if (this.isDraggable) {
      this._initializeDragging();
    }

    if (this.isResizable) {
      this._initializeResizing();
    }
  }

  // Focuses the modal element.
  focus(): void {
    this.element?.focus();
  }

  // Initializes dragging functionality.
  private _initializeDragging(): void {
    // Implementation for dragging functionality
  }

  // Initializes resizing functionality.
  private _initializeResizing(): void {
    // Implementation for resizing functionality
  }
}