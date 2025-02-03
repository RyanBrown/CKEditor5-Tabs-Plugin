// src/plugins/ui-components/alight-checkbox-component/alight-checkbox-component.ts
import './styles/alight-checkbox-component.scss';

export class CkAlightCheckbox extends HTMLElement {
  private _checked: boolean = false;
  private _disabled: boolean = false;
  private _focused: boolean = false;
  private _container: HTMLElement | null = null;
  private _box: HTMLElement | null = null;

  constructor() {
    super();
    this.innerHTML = `
      <label class="cka-checkbox cka-component" tabindex="0" role="checkbox" aria-checked="false">
        <div class="cka-checkbox-box">
          <svg class="cka-checkbox-icon" viewBox="0 0 14 14" width="14px" height="14px">
            <path d="M4.86 7.52L3.25 5.91l-.99.99 2.6 2.6 5.49-5.49-.99-.99z"></path>
          </svg>
        </div>
        <span class="cka-checkbox-label">
          ${this.textContent || ''}
        </span>
      </label>
    `;

    // Cache elements
    this._container = this.querySelector('.cka-checkbox');
    this._box = this.querySelector('.cka-checkbox-box');

    // Bind methods
    this._onClick = this._onClick.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onFocus = this._onFocus.bind(this);
    this._onBlur = this._onBlur.bind(this);
  }

  static get observedAttributes(): string[] {
    return ['initialvalue', 'disabled'];
  }

  get checked(): boolean {
    return this._checked;
  }

  set checked(value: boolean) {
    if (this._checked !== value) {
      this._checked = value;
      this._updateRendering();
      this.dispatchEvent(new CustomEvent('change', {
        detail: this._checked,
        bubbles: true
      }));
    }
  }

  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(value: boolean) {
    if (this._disabled !== value) {
      this._disabled = value;
      this._updateRendering();
    }
  }

  connectedCallback(): void {
    if (!this.hasAttribute('tabindex')) {
      this.setAttribute('tabindex', '0');
    }

    if (this.hasAttribute('initialvalue')) {
      this.checked = this.getAttribute('initialvalue')?.toLowerCase() === 'true';
    }

    if (this.hasAttribute('disabled')) {
      this.disabled = true;
    }

    if (this._container) {
      this._container.addEventListener('click', this._onClick);
      this._container.addEventListener('keydown', this._onKeyDown);
      this._container.addEventListener('focus', this._onFocus);
      this._container.addEventListener('blur', this._onBlur);
    }

    this._updateRendering();
  }

  disconnectedCallback(): void {
    if (this._container) {
      this._container.removeEventListener('click', this._onClick);
      this._container.removeEventListener('keydown', this._onKeyDown);
      this._container.removeEventListener('focus', this._onFocus);
      this._container.removeEventListener('blur', this._onBlur);
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === 'initialvalue' && oldValue !== newValue && newValue !== null) {
      this.checked = newValue.toLowerCase() === 'true';
    }
    if (name === 'disabled') {
      this.disabled = newValue !== null;
    }
  }

  private _onClick(event: Event): void {
    if (!this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      this.checked = !this.checked;
      this._container?.focus();
    }
  }

  private _onKeyDown(event: KeyboardEvent): void {
    if (!this.disabled && (event.key === ' ' || event.key === 'Enter')) {
      event.preventDefault();
      this.checked = !this.checked;
    }
  }

  private _onFocus(): void {
    if (!this.disabled) {
      this._focused = true;
      this._updateRendering();
    }
  }

  private _onBlur(): void {
    this._focused = false;
    this._updateRendering();
  }

  private _updateRendering(): void {
    if (!this._container || !this._box) return;

    // Update container
    this._container.classList.toggle('cka-checkbox-focused', this._focused);
    this._container.classList.toggle('cka-disabled', this._disabled);
    this._container.setAttribute('aria-checked', String(this._checked));

    // Update checkbox box
    this._box.classList.toggle('cka-highlight', this._checked);

    // Update attributes
    if (this._checked) {
      this.setAttribute('checked', '');
    } else {
      this.removeAttribute('checked');
    }

    if (this._disabled) {
      this.setAttribute('disabled', '');
      this.removeAttribute('tabindex');
    } else {
      this.removeAttribute('disabled');
      if (!this.hasAttribute('tabindex')) {
        this.setAttribute('tabindex', '0');
      }
    }
  }
}

if (!customElements.get('cka-checkbox')) {
  customElements.define('cka-checkbox', CkAlightCheckbox);
}

export default CkAlightCheckbox;