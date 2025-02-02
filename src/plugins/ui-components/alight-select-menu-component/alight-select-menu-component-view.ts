// src/plugins/ui-components/views/select-menu-view.ts
import { View, ViewCollection } from '@ckeditor/ckeditor5-ui';
import type { Locale } from '@ckeditor/ckeditor5-utils';
import type { TemplateDefinition } from '@ckeditor/ckeditor5-ui/src/template';
import type { BaseEvent } from '@ckeditor/ckeditor5-utils/src/emittermixin';
import { AlightUIBaseComponent } from '../alight-ui-base-component/alight-ui-base-component';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

interface SelectMenuProperties {
  options: SelectOption[];
  value: any;
  isExpanded: boolean;
  placeholder: string;
  multiple: boolean;
}

interface ChangeEvent extends BaseEvent {
  name: 'change';
  args: [evt: BaseEvent, name: string, path: string, value: { value: string | number }];
  return: void;
}

export class SelectMenuView extends AlightUIBaseComponent implements SelectMenuProperties {
  declare public options: SelectOption[];
  declare public value: any;
  declare public isExpanded: boolean;
  declare public placeholder: string;
  declare public multiple: boolean;
  public readonly optionsView: ViewCollection<View>;

  constructor(locale: Locale) {
    super(locale);

    // Initialize observable properties
    this.set('options' as const, []);
    this.set('value' as const, null);
    this.set('isExpanded' as const, false);
    this.set('placeholder' as const, 'Select...');
    this.set('multiple' as const, false);

    this.optionsView = new ViewCollection();

    this._createTemplate();
    this.on<BaseEvent>('change:options', () => this._updateOptions());
  }

  // Creates the view template
  private _createTemplate(): void {
    const bind = this.bindTemplate;

    const template: TemplateDefinition = {
      tag: 'div',
      attributes: {
        class: [
          'ck',
          'ck-alight-select',
          bind.to('isExpanded', (value: boolean) => value ? 'ck-alight-select--expanded' : ''),
          bind.to('isEnabled', (value: boolean) => value ? 'ck-enabled' : 'ck-disabled')
        ],
        'aria-expanded': bind.to('isExpanded', String)
      },
      children: [
        {
          tag: 'div',
          attributes: {
            class: ['ck-alight-select__trigger']
          },
          children: [
            {
              tag: 'span',
              attributes: {
                class: ['ck-alight-select__label']
              },
              children: [
                {
                  text: bind.to('value', (value: any) => {
                    if (!value) return this.placeholder;
                    const option = this.options.find(opt => opt.value === value);
                    return option ? option.label : this.placeholder;
                  })
                }
              ]
            },
            {
              tag: 'span',
              attributes: {
                class: ['ck-alight-select__arrow']
              }
            }
          ],
          on: {
            click: bind.to(() => {
              if (this.isEnabled) {
                this.set('isExpanded' as const, !this.isExpanded);
              }
            })
          }
        },
        {
          tag: 'div',
          attributes: {
            class: ['ck-alight-select__dropdown']
          },
          children: this.optionsView
        }
      ]
    };

    this.setTemplate(template);
  }

  // Updates the options in the dropdown
  private _updateOptions(): void {
    this.optionsView.clear();

    for (const option of this.options) {
      const optionView = new View(this.locale);
      const optionBind = optionView.bindTemplate;

      optionView.setTemplate({
        tag: 'div',
        attributes: {
          class: [
            'ck-alight-select__option',
            option.disabled ? 'ck-disabled' : '',
            this.value === option.value ? 'ck-selected' : ''
          ]
        },
        children: [
          {
            text: option.label
          }
        ],
        on: {
          click: optionBind.to(() => {
            if (!option.disabled && this.isEnabled) {
              this.set('value' as const, option.value);
              this.set('isExpanded' as const, false);
              const event: BaseEvent = {
                name: 'change',
                args: []
              };
              this.fire<ChangeEvent>('change', event, 'value', 'value', { value: option.value });
            }
          })
        }
      });
      this.optionsView.add(optionView);
    }
  }

  // Focuses the select element
  focus(): void {
    this.element?.focus();
  }
}