// src/plugins/ui-components/alight-radio-component/alight-radio-component.ts
import './styles/alight-radio-component.scss';

export class CKAlightRadioButton extends HTMLElement {
  private radioInput: HTMLInputElement;
  private wrapper: HTMLLabelElement;

  constructor() {
    super();

    // Create the label wrapper
    this.wrapper = document.createElement('label');
    this.wrapper.classList.add('cka-radio-button');

    // Handle 'disabled' attribute
    if (this.hasAttribute('disabled')) {
      this.wrapper.classList.add('disabled');
    }

    // Create the radio input
    this.radioInput = document.createElement('input');
    this.radioInput.type = 'radio';
    this.radioInput.name = this.getAttribute('name') || '';
    this.radioInput.value = this.getAttribute('value') || '';
    this.radioInput.id = `radio-${Math.random().toString(36).substr(2, 9)}`; // Unique ID for accessibility
    this.radioInput.classList.add('cka-radio-input');

    // Handle 'checked' attribute
    if (this.hasAttribute('checked')) {
      this.radioInput.checked = true;
    }

    // Handle 'disabled' attribute
    if (this.hasAttribute('disabled')) {
      this.radioInput.disabled = true;
    }

    // Create the custom radio icon
    const radioIcon = document.createElement('span');
    radioIcon.classList.add('cka-radio-icon');

    // Create the label text
    const labelText = document.createElement('span');
    labelText.classList.add('label-text');
    labelText.textContent = this.getAttribute('label') || '';

    // Associate label with input for accessibility
    this.wrapper.htmlFor = this.radioInput.id;

    // Append elements to the wrapper
    this.wrapper.appendChild(this.radioInput);
    this.wrapper.appendChild(radioIcon);
    this.wrapper.appendChild(labelText);
    this.appendChild(this.wrapper);

    // Event Listener for change events
    this.radioInput.addEventListener('change', () => {
      this.dispatchEvent(new Event('change', { bubbles: true }));

      // Handle radio group behavior manually
      if (this.radioInput.checked) {
        const name = this.radioInput.name;
        if (name) {
          // Find all other radios in the group and uncheck them
          document.querySelectorAll(`ck-alight-radio-button input[name="${name}"]`).forEach(input => {
            if (input !== this.radioInput && input instanceof HTMLInputElement) {
              input.checked = false;
              (input.closest('ck-alight-radio-button') as CKAlightRadioButton)?.removeAttribute('checked');
            }
          });
        }
      }
    });
  }

  static get observedAttributes() {
    return ['name', 'value', 'label', 'checked', 'disabled'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (!this.radioInput) return;

    switch (name) {
      case 'name':
        this.radioInput.name = newValue;
        break;
      case 'value':
        this.radioInput.value = newValue;
        break;
      case 'label':
        const label = this.wrapper.querySelector('.label-text') as HTMLElement;
        if (label) {
          label.textContent = newValue;
        }
        break;
      case 'checked':
        this.radioInput.checked = newValue !== null;
        break;
      case 'disabled':
        if (newValue !== null) {
          this.radioInput.disabled = true;
          this.wrapper.classList.add('disabled');
        } else {
          this.radioInput.disabled = false;
          this.wrapper.classList.remove('disabled');
        }
        break;
    }
  }

  // Getter and Setter for checked property
  get checked(): boolean {
    return this.radioInput.checked;
  }

  set checked(val: boolean) {
    this.radioInput.checked = val;
    if (val) {
      this.setAttribute('checked', '');
      // Uncheck other radios in the group
      const name = this.radioInput.name;
      if (name) {
        document.querySelectorAll(`ck-alight-radio-button input[name="${name}"]`).forEach(input => {
          if (input !== this.radioInput && input instanceof HTMLInputElement) {
            input.checked = false;
            (input.closest('ck-alight-radio-button') as CKAlightRadioButton)?.removeAttribute('checked');
          }
        });
      }
    } else {
      this.removeAttribute('checked');
    }
  }

  // Getter and Setter for disabled property
  get disabled(): boolean {
    return this.radioInput.disabled;
  }

  set disabled(val: boolean) {
    if (val) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  // Add focus method for consistency with native elements
  override focus() {
    this.radioInput.focus();
  }
}

// Define the custom element
customElements.define('ck-alight-radio-button', CKAlightRadioButton);
