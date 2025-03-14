// src/plugins/ui-components/alight-ui-base-component/alight-ui-base-component.ts
import { View } from '@ckeditor/ckeditor5-ui';
import type { Locale } from '@ckeditor/ckeditor5-utils';
import type { BaseEvent } from '@ckeditor/ckeditor5-utils/src/emittermixin';
import type { Observable } from '@ckeditor/ckeditor5-utils/src/observablemixin';

interface ComponentProperties {
  readonly isEnabled: boolean;
  readonly isVisible: boolean;
}

interface PropertyChangeEvent extends BaseEvent {
  name: 'change:isVisible' | 'change:isEnabled';
  args: [evt: BaseEvent, propertyName: string, newValue: boolean];
  return: void;
}

export class AlightUIBaseComponent extends View {
  declare public readonly element: HTMLElement;
  declare public isEnabled: boolean;
  declare public isVisible: boolean;

  constructor(locale: Locale) {
    super(locale);

    // Initialize observable properties using the protected _observable property
    this.set({
      isEnabled: true,
      isVisible: true
    } as const);
  }

  /**
   * Base render method that all components should implement
   */
  override render(): void {
    super.render();

    if (!this.element) {
      throw new Error('Element not initialized in base render()');
    }

    this.element.classList.add('ck');

    // Update visibility based on isVisible property
    this.on<PropertyChangeEvent>('change:isVisible', (_evt, _propertyName, newValue) => {
      this.element.style.display = newValue ? '' : 'none';
    });

    // Update enabled state based on isEnabled property
    this.on<PropertyChangeEvent>('change:isEnabled', (_evt, _propertyName, newValue) => {
      this.element.classList.toggle('ck-disabled', !newValue);
    });
  }
}