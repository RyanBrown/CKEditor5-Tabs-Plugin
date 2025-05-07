// src/plugins/ui-components/alight-checkbox-component/alight-checkbox-component-view.ts
import { View } from '@ckeditor/ckeditor5-ui';
import type { Locale } from '@ckeditor/ckeditor5-utils';
import type { TemplateDefinition } from '@ckeditor/ckeditor5-ui/src/template';
import { AlightUIBaseComponent } from '../alight-ui-base-component/alight-ui-base-component';

interface CheckboxViewProperties {
  isChecked: boolean;
  label: string;
  tabindex?: string;
}

export class CheckboxView extends AlightUIBaseComponent implements CheckboxViewProperties {
  declare public isChecked: boolean;
  declare public label: string;
  declare public tabindex: string;

  constructor(locale: Locale) {
    super(locale);

    const bind = this.bindTemplate;

    // Initialize observable properties with type assertions
    this.set('isChecked' as const, false);
    this.set('label' as const, '');
    this.set('tabindex' as const, '0');

    const template: TemplateDefinition = {
      tag: 'label',
      attributes: {
        class: [
          'ck',
          'ck-checkbox',
          bind.to('isChecked', (value: boolean) => value ? 'ck-checked' : ''),
          bind.if('isEnabled', (value: boolean) => value ? 'ck-enabled' : 'ck-disabled')
        ],
        tabindex: bind.to('tabindex')
      },
      children: [
        {
          tag: 'input',
          attributes: {
            type: 'checkbox',
            'aria-checked': bind.to('isChecked', (value: boolean) => String(value)),
            'aria-label': bind.to('label'),
            class: 'ck-input'
          }
        },
        {
          tag: 'span',
          attributes: {
            class: ['ck-checkbox__label']
          },
          children: [
            {
              text: bind.to('label')
            }
          ]
        }
      ],
      on: {
        click: bind.to(() => {
          if (this.isEnabled) {
            this.set('isChecked' as const, !this.isChecked);
            this.fire('execute');
          }
        })
      }
    };

    this.setTemplate(template);
  }

  // Focuses the checkbox element.
  focus(): void {
    this.element?.focus();
  }
}
