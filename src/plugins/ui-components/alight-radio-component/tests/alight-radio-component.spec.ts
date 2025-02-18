import { CkAlightRadioButton } from './../alight-radio-component';

describe('CkAlightRadioButton', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Initialization', () => {
    it('should create radio button with default attributes', () => {
      const radio = new CkAlightRadioButton();
      container.appendChild(radio);

      const radioWrapper = radio.querySelector('.cka-radio-button');
      const radioInput = radio.querySelector('input[type="radio"]');
      const radioIcon = radio.querySelector('.cka-radio-icon');
      const labelText = radio.querySelector('.label-text');

      expect(radioWrapper).toBeTruthy();
      expect(radioInput).toBeTruthy();
      expect(radioIcon).toBeTruthy();
      expect(labelText).toBeTruthy();
    });

    it('should initialize with provided attributes', () => {
      const radio = new CkAlightRadioButton();
      radio.setAttribute('name', 'test-group');
      radio.setAttribute('value', 'test-value');
      radio.setAttribute('label', 'Test Label');
      radio.setAttribute('checked', '');
      container.appendChild(radio);

      const input = radio.querySelector('input');
      const label = radio.querySelector('.label-text');

      expect(input instanceof HTMLInputElement).toBe(true);
      expect(label instanceof HTMLElement).toBe(true);
      if (input instanceof HTMLInputElement && label instanceof HTMLElement) {
        expect(input.name).toBe('test-group');
        expect(input.value).toBe('test-value');
        expect(label.textContent).toBe('Test Label');
        expect(input.checked).toBe(true);
      }
    });

    it('should initialize in disabled state when disabled attribute is set', () => {
      const radio = new CkAlightRadioButton();
      radio.setAttribute('disabled', '');
      container.appendChild(radio);

      const wrapper = radio.querySelector('.cka-radio-button');
      const input = radio.querySelector('input');

      expect(wrapper instanceof HTMLElement).toBe(true);
      expect(input instanceof HTMLInputElement).toBe(true);
      if (wrapper instanceof HTMLElement && input instanceof HTMLInputElement) {
        expect(wrapper.classList.contains('disabled')).toBe(true);
        expect(input.disabled).toBe(true);
      }
    });
  });

  describe('Attribute Changes', () => {
    let radio: CkAlightRadioButton;

    beforeEach(() => {
      radio = new CkAlightRadioButton();
      container.appendChild(radio);
    });

    it('should update name attribute', () => {
      radio.setAttribute('name', 'new-group');
      const input = radio.querySelector('input');
      expect(input instanceof HTMLInputElement).toBe(true);
      if (input instanceof HTMLInputElement) {
        expect(input.name).toBe('new-group');
      }
    });

    it('should update value attribute', () => {
      radio.setAttribute('value', 'new-value');
      const input = radio.querySelector('input');
      expect(input instanceof HTMLInputElement).toBe(true);
      if (input instanceof HTMLInputElement) {
        expect(input.value).toBe('new-value');
      }
    });

    it('should update label text', () => {
      radio.setAttribute('label', 'New Label');
      const label = radio.querySelector('.label-text');
      expect(label instanceof HTMLElement).toBe(true);
      if (label instanceof HTMLElement) {
        expect(label.textContent).toBe('New Label');
      }
    });

    it('should update checked state', () => {
      radio.setAttribute('checked', '');
      const input = radio.querySelector('input');
      expect(input instanceof HTMLInputElement).toBe(true);
      if (input instanceof HTMLInputElement) {
        expect(input.checked).toBe(true);
        radio.removeAttribute('checked');
        expect(input.checked).toBe(false);
      }
    });

    it('should update disabled state', () => {
      radio.setAttribute('disabled', '');
      const wrapper = radio.querySelector('.cka-radio-button');
      const input = radio.querySelector('input');

      expect(wrapper instanceof HTMLElement).toBe(true);
      expect(input instanceof HTMLInputElement).toBe(true);
      if (wrapper instanceof HTMLElement && input instanceof HTMLInputElement) {
        expect(wrapper.classList.contains('disabled')).toBe(true);
        expect(input.disabled).toBe(true);

        radio.removeAttribute('disabled');
        expect(wrapper.classList.contains('disabled')).toBe(false);
        expect(input.disabled).toBe(false);
      }
    });
  });

  describe('Radio Group Behavior', () => {
    let radioGroup: CkAlightRadioButton[];

    beforeEach(() => {
      radioGroup = [];
      for (let i = 0; i < 3; i++) {
        const radio = new CkAlightRadioButton();
        radio.setAttribute('name', 'test-group');
        radio.setAttribute('value', `value-${i}`);
        container.appendChild(radio);
        radioGroup.push(radio);
      }
    });

    it('should uncheck other radios in the same group when one is checked', () => {
      radioGroup[0].checked = true;
      expect(radioGroup[0].checked).toBe(true);
      expect(radioGroup[1].checked).toBe(false);
      expect(radioGroup[2].checked).toBe(false);

      radioGroup[1].checked = true;
      expect(radioGroup[0].checked).toBe(false);
      expect(radioGroup[1].checked).toBe(true);
      expect(radioGroup[2].checked).toBe(false);
    });

    it('should dispatch change event when radio is clicked', () => {
      const changeSpy = jasmine.createSpy('change');
      radioGroup[0].addEventListener('change', changeSpy);

      const input = radioGroup[0].querySelector('input');
      expect(input instanceof HTMLInputElement).toBe(true);
      if (input instanceof HTMLInputElement) {
        input.click();
        expect(changeSpy).toHaveBeenCalled();
      }
    });

    it('should not affect radios in different groups', () => {
      const differentGroupRadio = new CkAlightRadioButton();
      differentGroupRadio.setAttribute('name', 'different-group');
      differentGroupRadio.checked = true;
      container.appendChild(differentGroupRadio);

      radioGroup[0].checked = true;
      expect(differentGroupRadio.checked).toBe(true);
    });
  });

  describe('Properties and Methods', () => {
    let radio: CkAlightRadioButton;

    beforeEach(() => {
      radio = new CkAlightRadioButton();
      container.appendChild(radio);
    });

    it('should toggle checked state through property', () => {
      radio.checked = true;
      expect(radio.checked).toBe(true);
      expect(radio.hasAttribute('checked')).toBe(true);

      radio.checked = false;
      expect(radio.checked).toBe(false);
      expect(radio.hasAttribute('checked')).toBe(false);
    });

    it('should toggle disabled state through property', () => {
      radio.disabled = true;
      expect(radio.disabled).toBe(true);
      expect(radio.hasAttribute('disabled')).toBe(true);

      radio.disabled = false;
      expect(radio.disabled).toBe(false);
      expect(radio.hasAttribute('disabled')).toBe(false);
    });

    it('should focus the radio input when focus() is called', () => {
      const input = radio.querySelector('input');
      expect(input instanceof HTMLInputElement).toBe(true);
      if (input instanceof HTMLInputElement) {
        spyOn(input, 'focus');
        radio.focus();
        expect(input.focus).toHaveBeenCalled();
      }
    });
  });
});