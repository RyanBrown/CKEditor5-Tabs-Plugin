// src/plugins/ui-components/alight-card-component/alight-card-component-view.ts

import { View } from '@ckeditor/ckeditor5-ui';
import type { Locale } from '@ckeditor/ckeditor5-utils';
import type { TemplateDefinition } from '@ckeditor/ckeditor5-ui/src/template';
import { AlightUIBaseComponent } from '../alight-ui-base-component/alight-ui-base-component';

interface CardProperties {
  header?: string;
  hasCustomHeader: boolean;
  hasFooter: boolean;
}

export class CardView extends AlightUIBaseComponent implements CardProperties {
  declare public header?: string;
  declare public hasCustomHeader: boolean;
  declare public hasFooter: boolean;

  private headerView?: View;
  private contentView!: View;
  private footerView?: View;

  constructor(locale: Locale) {
    super(locale);

    const bind = this.bindTemplate;

    this.set('header' as const, undefined);
    this.set('hasCustomHeader' as const, false);
    this.set('hasFooter' as const, false);

    const template: TemplateDefinition = {
      tag: 'div',
      attributes: {
        class: [
          'cka',
          'cka-card',
          bind.to('isEnabled', value => value ? 'cka-enabled' : 'cka-disabled')
        ]
      },
      children: this.createChildren(bind)
    };

    this.setTemplate(template);
  }

  private createChildren(bind: any) {
    return [
      {
        tag: 'div',
        attributes: {
          class: ['cka-card-header']
        },
        children: [
          {
            tag: 'div',
            attributes: {
              class: ['cka-card-title']
            },
            children: [
              {
                text: bind.to('header')
              }
            ]
          }
        ],
        attributes_: {
          style: {
            display: bind.to('header', (header: string | undefined) => header ? 'block' : 'none')
          }
        }
      },
      {
        tag: 'div',
        attributes: {
          class: ['cka-card-content']
        }
      },
      {
        tag: 'div',
        attributes: {
          class: ['cka-card-footer']
        },
        attributes_: {
          style: {
            display: bind.to('hasFooter', (hasFooter: boolean) => hasFooter ? 'block' : 'none')
          }
        }
      }
    ];
  }

  override render(): void {
    super.render();

    if (this.element) {
      if (this.hasCustomHeader && this.headerView) {
        const headerSlot = this.element.querySelector('.cka-card-header');
        if (headerSlot) {
          headerSlot.appendChild(this.headerView.element!);
        }
      }

      if (this.hasFooter && this.footerView) {
        const footerSlot = this.element.querySelector('.cka-card-footer');
        if (footerSlot) {
          footerSlot.appendChild(this.footerView.element!);
        }
      }
    }
  }

  setHeaderView(view: View): void {
    this.headerView = view;
    this.hasCustomHeader = true;
  }

  setContentView(view: View): void {
    this.contentView = view;
  }

  setFooterView(view: View): void {
    this.footerView = view;
    this.hasFooter = true;
  }
}