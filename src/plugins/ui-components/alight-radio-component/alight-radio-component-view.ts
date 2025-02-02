// src/plugins/ui-components/alight-radio-component/alight-radio-component-view.ts
import { View } from '@ckeditor/ckeditor5-ui';
import type { Locale } from '@ckeditor/ckeditor5-utils';
import type { TemplateDefinition } from '@ckeditor/ckeditor5-ui/src/template';
import type { BaseEvent } from '@ckeditor/ckeditor5-utils/src/emittermixin';
import { AlightUIBaseComponent } from '../alight-ui-base-component/alight-ui-base-component';

interface RadioButtonProperties {
  value: string;
  label: string;
  name: string;
  isSelected: boolean;
}

interface ChangeEvent extends BaseEvent {
  name: 'change';
  args: [BaseEvent, { value: string }];
  return: void;
}

export class RadioButtonView extends AlightUIBaseComponent implements RadioButtonProperties {
  declare public value: string;
  declare public label: string;
  declare public name: string;
  declare public isSelected: boolean;

  constructor(locale: Locale) {
    super(locale);

    const bind = this.bindTemplate;

    // Initialize observable properties
    this.set('value' as const, '');
    this.set('label' as const, '');
    this.set('name' as const, '');
    this.set('isSelected' as const, false);

    const template: TemplateDefinition = {
      tag: 'label',
      attributes: {
        class: [
          'cka',
          'cka-radio',
          bind.to('isSelected', (value: boolean) => value ? 'cka-selected' : ''),
          bind.to('isEnabled', (value: boolean) => value ? 'cka-enabled' : 'cka-disabled')
        ]
      },
      children: [
        {
          tag: 'input',
          attributes: {
            type: 'radio',
            class: ['cka-radio__input'],
            name: bind.to('name'),
            value: bind.to('value'),
            checked: bind.to('isSelected')
          },
          on: {
            change: bind.to(() => {
              if (this.isEnabled) {
                this.set('isSelected' as const, true);
                const event: BaseEvent = {
                  name: 'change',
                  args: []
                };
                this.fire<ChangeEvent>('change', event, { value: this.value });
              }
            })
          }
        },
        {
          tag: 'span',
          attributes: {
            class: ['cka-radio__checkmark']
          }
        },
        {
          tag: 'span',
          attributes: {
            class: ['cka-radio__label']
          },
          children: [
            {
              text: bind.to('label')
            }
          ]
        }
      ]
    };

    this.setTemplate(template);
  }

  // Focuses the radio button element.
  focus(): void {
    this.element?.querySelector('input')?.focus();
  }
}