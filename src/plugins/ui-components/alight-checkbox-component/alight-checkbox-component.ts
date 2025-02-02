// src/plugins/ui-components/alight-checkbox-component/alight-checkbox-component.ts

/**
 * ck-alight-checkbox.ts
 *
 * A custom checkbox element for CKEditor 5 that behaves like a PrimeNG checkbox.
 * This component follows Web Components standards and integrates with CKEditor 5's UI system.
 */

/// <reference lib="dom" />

// Import styles
import styles from './styles/alight-checkbox-component.scss';

// Define a template for the component's HTML
const template: HTMLTemplateElement = document.createElement('template');
template.innerHTML = `
  <div class="ck ck-alight-checkbox-container" tabindex="0" role="checkbox" aria-checked="false">
    <div class="ck-alight-checkbox-box">
      <span class="ck-alight-checkbox-check">✓</span>
    </div>
    <div class="ck-alight-checkbox-label">
      <slot></slot>
    </div>
  </div>
`;

export class CkAlightCheckbox extends HTMLElement {
  private _checked: boolean = false;
  private _disabled: boolean = false;
  protected _shadowRoot: ShadowRoot;

  /**
   * Creates an instance of CkAlightCheckbox.
   * This component can be used both as a standalone Web Component
   * and within CKEditor 5's UI system.
   */
  constructor() {
    super();

    // Attach a shadow root to the element.
    this._shadowRoot = this.attachShadow({ mode: 'open' });

    // Create and inject a <style> element with the imported styles.
    const style = document.createElement('style');
    style.textContent = styles;
    this._shadowRoot.appendChild(style);

    // Append the template content.
    this._shadowRoot.appendChild(template.content.cloneNode(true));

    // Bind event handlers to preserve context
    this._onClick = this._onClick.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
  }

  // List of attributes to observe for changes.
  static get observedAttributes(): string[] {
    return ['initialvalue', 'disabled'];
  }

  // Getter for checked state
  get checked(): boolean {
    return this._checked;
  }

  // Setter for checked state
  set checked(value: boolean) {
    const isChecked: boolean = Boolean(value);
    if (this._checked !== isChecked) {
      this._checked = isChecked;
      this._updateRendering();
      this.dispatchEvent(new CustomEvent<boolean>('change', {
        detail: this._checked,
        bubbles: true,
        composed: true
      }));
    }
  }

  // Getter for disabled state
  get disabled(): boolean {
    return this._disabled;
  }

  // Setter for disabled state
  set disabled(value: boolean) {
    const isDisabled: boolean = Boolean(value);
    if (this._disabled !== isDisabled) {
      this._disabled = isDisabled;
      this._updateRendering();
    }
  }

  // Lifecycle callback when element is connected to the DOM
  connectedCallback(): void {
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }

    if (this.hasAttribute('initialvalue')) {
      const attrVal: string | null = this.getAttribute('initialvalue');
      if (attrVal !== null) {
        this.checked = attrVal.toLowerCase() === 'true';
      }
    }

    if (this.hasAttribute('disabled')) {
      this.disabled = true;
    }

    const container = this._shadowRoot?.querySelector('.ck-alight-checkbox-container');
    container?.addEventListener('click', this._onClick);
    container?.addEventListener('keydown', (e: Event) => this._onKeyDown(e as KeyboardEvent));

    this._updateRendering();
  }

  // Lifecycle callback when element is disconnected from the DOM
  disconnectedCallback(): void {
    const container = this._shadowRoot?.querySelector('.ck-alight-checkbox-container');
    container?.removeEventListener('click', this._onClick);
    container?.removeEventListener('keydown', (e: Event) => this._onKeyDown(e as KeyboardEvent));
  }

  // Lifecycle callback for attribute changes
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === 'initialvalue' && oldValue !== newValue && newValue !== null) {
      this.checked = newValue.toLowerCase() === 'true';
    }
    if (name === 'disabled') {
      this.disabled = newValue !== null;
    }
  }

  // Handles click events on the checkbox
  private _onClick(event: Event): void {
    if (this.disabled) {
      return;
    }
    event.preventDefault();
    this.checked = !this.checked;
  }

  // Handles keyboard events on the checkbox
  private _onKeyDown(event: KeyboardEvent): void {
    if (this.disabled) {
      return;
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.checked = !this.checked;
    }
  }

  // Updates the visual representation of the checkbox
  private _updateRendering(): void {
    const container = this._shadowRoot?.querySelector('.ck-alight-checkbox-container');
    if (!container) {
      return;
    }

    if (this._checked) {
      this.setAttribute('checked', '');
      container.setAttribute('aria-checked', 'true');
      container.classList.add('ck-alight-checked');
    } else {
      this.removeAttribute('checked');
      container.setAttribute('aria-checked', 'false');
      container.classList.remove('ck-alight-checked');
    }

    if (this._disabled) {
      this.setAttribute('disabled', '');
      this.removeAttribute('tabindex');
      container.classList.add('ck-alight-disabled');
    } else {
      this.removeAttribute('disabled');
      if (!this.hasAttribute('tabindex')) {
        this.setAttribute('tabindex', '0');
      }
      container.classList.remove('ck-alight-disabled');
    }
  }
}

// Define the custom element
if (!customElements.get('ck-alight-checkbox')) {
  customElements.define('ck-alight-checkbox', CkAlightCheckbox);
}

export default CkAlightCheckbox;