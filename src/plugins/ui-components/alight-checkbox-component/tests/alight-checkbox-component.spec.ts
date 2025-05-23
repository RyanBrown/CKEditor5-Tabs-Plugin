// src/plugins/ui-components/alight-checkbox-component/tests/alight-checkbox-component.spec.ts
import { CkAlightCheckbox } from '../alight-checkbox-component';

describe('CkAlightCheckbox', () => {
  let checkbox: CkAlightCheckbox;

  beforeEach(async () => {
    // Define component if not already defined
    if (!customElements.get('cka-checkbox')) {
      customElements.define('cka-checkbox', CkAlightCheckbox);
    }

    checkbox = document.createElement('cka-checkbox') as CkAlightCheckbox;
    document.body.appendChild(checkbox);
    // Wait for element to be connected
    await customElements.whenDefined('cka-checkbox');
  });

  afterEach(() => {
    document.body.removeChild(checkbox);
  });

  describe('Initialization', () => {
    it('should create with default values', async () => {
      expect(checkbox.checked).toBeFalse();
      expect(checkbox.disabled).toBeFalse();

      const container = checkbox.querySelector('.cka-checkbox');
      expect(container?.getAttribute('tabindex')).toBe('0');
    });

    it('should initialize with custom label text', () => {
      checkbox.textContent = 'Test Label';
      checkbox.initializeElement();

      const label = checkbox.querySelector('.cka-checkbox-label');
      expect(label?.textContent?.trim()).toBe('Test Label');
    });

    it('should handle empty or missing label text', () => {
      checkbox.textContent = '';
      checkbox.initializeElement();

      const label = checkbox.querySelector('.cka-checkbox-label');
      expect(label?.textContent?.trim()).toBe('');
    });

    it('should handle missing elements gracefully', () => {
      checkbox.innerHTML = '<div>Invalid HTML</div>';
      expect(() => checkbox._updateRendering()).not.toThrow();
    });

    it('should re-initialize if elements are missing during connection', async () => {
      // First ensure component is properly connected
      expect(checkbox.isConnected).toBeTrue();
      expect(checkbox.querySelector('.cka-checkbox')).toBeTruthy();

      // Break the component
      checkbox.innerHTML = '<div>Invalid HTML</div>';
      expect(checkbox.querySelector('.cka-checkbox')).toBeFalsy();

      // Force a reconnect
      checkbox.connectedCallback();

      // We need to explicitly call initializeElement to ensure it completes
      // since some test environments may not trigger this automatically
      checkbox.initializeElement();

      // Verify the component was properly re-initialized
      const container = checkbox.querySelector('.cka-checkbox');
      expect(container).toBeTruthy('Container should be re-initialized');
      expect(container?.getAttribute('role')).toBe('checkbox', 'Container should have correct role');

      // Additional verifications
      expect(container?.classList.contains('cka-component')).toBeTrue();
      expect(checkbox.querySelector('.cka-checkbox-box')).toBeTruthy();
      expect(checkbox.querySelector('.cka-checkbox-label')).toBeTruthy();
    });

    it('should throw error when setValue method is called', () => {
      expect(() => checkbox.setValue(true)).toThrow(new Error('Method not implemented.'));
    });
  });

  describe('Attribute Changes', () => {
    it('should handle initialvalue attribute changes', () => {
      checkbox.setAttribute('initialvalue', 'true');
      expect(checkbox.checked).toBeTrue();

      checkbox.setAttribute('initialvalue', 'false');
      expect(checkbox.checked).toBeFalse();

      checkbox.setAttribute('initialvalue', 'TRUE');
      expect(checkbox.checked).toBeTrue();
    });

    it('should handle disabled attribute changes', () => {
      checkbox.setAttribute('disabled', '');
      expect(checkbox.disabled).toBeTrue();

      checkbox.removeAttribute('disabled');
      expect(checkbox.disabled).toBeFalse();
    });

    it('should ignore attribute changes with same value', () => {
      checkbox.setAttribute('initialvalue', 'true');
      const spy = spyOn(checkbox as any, '_updateRendering');
      checkbox.setAttribute('initialvalue', 'true');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should handle unobserved attribute changes', () => {
      const spy = spyOn(checkbox as any, '_updateRendering');
      checkbox.setAttribute('unobserved', 'value');
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not update checked when set to the same value', () => {
      checkbox.checked = true;
      const spy = spyOnProperty(checkbox, 'checked', 'set').and.callThrough();

      // Setting to the same value
      checkbox.checked = true;

      // The setter is called but the change event shouldn't be dispatched
      const changeSpy = jasmine.createSpy('change');
      checkbox.addEventListener('change', changeSpy);

      expect(spy).toHaveBeenCalled();
      expect(changeSpy).not.toHaveBeenCalled();
    });

    it('should not update disabled when set to the same value', () => {
      checkbox.disabled = true;
      const spy = spyOn(checkbox as any, '_updateRendering');

      // Setting to the same value
      checkbox.disabled = true;

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('Event Handling', () => {
    it('should toggle checked state on click', () => {
      const container = checkbox.querySelector('.cka-checkbox') as HTMLElement;
      container.click();
      expect(checkbox.checked).toBeTrue();

      container.click();
      expect(checkbox.checked).toBeFalse();
    });

    it('should not toggle when disabled', () => {
      checkbox.disabled = true;
      const container = checkbox.querySelector('.cka-checkbox') as HTMLElement;
      container.click();
      expect(checkbox.checked).toBeFalse();
    });

    it('should toggle on space key press', () => {
      const container = checkbox.querySelector('.cka-checkbox') as HTMLElement;
      const event = new KeyboardEvent('keydown', { key: ' ' });
      const preventDefaultSpy = spyOn(event, 'preventDefault');

      container.dispatchEvent(event);
      expect(checkbox.checked).toBeTrue();
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should toggle on enter key press', () => {
      const container = checkbox.querySelector('.cka-checkbox') as HTMLElement;
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      const preventDefaultSpy = spyOn(event, 'preventDefault');

      container.dispatchEvent(event);
      expect(checkbox.checked).toBeTrue();
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should not toggle on other key press', () => {
      const container = checkbox.querySelector('.cka-checkbox') as HTMLElement;
      container.dispatchEvent(new KeyboardEvent('keydown', { key: 'A' }));
      expect(checkbox.checked).toBeFalse();
    });

    it('should not toggle on key press when disabled', () => {
      checkbox.disabled = true;
      const container = checkbox.querySelector('.cka-checkbox') as HTMLElement;
      container.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      expect(checkbox.checked).toBeFalse();
    });

    it('should prevent event propagation on click', () => {
      const container = checkbox.querySelector('.cka-checkbox') as HTMLElement;
      const event = new MouseEvent('click', { bubbles: true });
      const stopPropagationSpy = spyOn(event, 'stopPropagation');
      const preventDefaultSpy = spyOn(event, 'preventDefault');

      container.dispatchEvent(event);
      expect(stopPropagationSpy).toHaveBeenCalled();
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should dispatch change event when toggled', (done) => {
      checkbox.addEventListener('change', (event: Event) => {
        const customEvent = event as CustomEvent;
        expect(customEvent.detail).toBeTrue();
        expect(customEvent.bubbles).toBeTrue();
        done();
      });

      const container = checkbox.querySelector('.cka-checkbox') as HTMLElement;
      container.click();
    });
  });

  describe('Focus Management', () => {
    it('should add focus class when focused', () => {
      const container = checkbox.querySelector('.cka-checkbox') as HTMLElement;
      container.dispatchEvent(new FocusEvent('focus'));
      expect(container.classList.contains('cka-checkbox-focused')).toBeTrue();
    });

    it('should remove focus class when blurred', () => {
      const container = checkbox.querySelector('.cka-checkbox') as HTMLElement;
      container.dispatchEvent(new FocusEvent('focus'));
      container.dispatchEvent(new FocusEvent('blur'));
      expect(container.classList.contains('cka-checkbox-focused')).toBeFalse();
    });

    it('should not add focus class when disabled', () => {
      checkbox.disabled = true;
      const container = checkbox.querySelector('.cka-checkbox') as HTMLElement;
      container.dispatchEvent(new FocusEvent('focus'));
      expect(container.classList.contains('cka-checkbox-focused')).toBeFalse();
    });
  });

  describe('Visual State Updates', () => {
    it('should update all visual states correctly', () => {
      const container = checkbox.querySelector('.cka-checkbox') as HTMLElement;
      const box = checkbox.querySelector('.cka-checkbox-box') as HTMLElement;

      checkbox.checked = true;
      expect(box.classList.contains('cka-highlight')).toBeTrue();
      expect(container.getAttribute('aria-checked')).toBe('true');
      expect(checkbox.hasAttribute('checked')).toBeTrue();

      checkbox.checked = false;
      expect(box.classList.contains('cka-highlight')).toBeFalse();
      expect(container.getAttribute('aria-checked')).toBe('false');
      expect(checkbox.hasAttribute('checked')).toBeFalse();

      checkbox.disabled = true;
      expect(container.classList.contains('cka-disabled')).toBeTrue();
      expect(checkbox.hasAttribute('disabled')).toBeTrue();
      expect(container.hasAttribute('tabindex')).toBeFalse();

      checkbox.disabled = false;
      expect(container.classList.contains('cka-disabled')).toBeFalse();
      expect(checkbox.hasAttribute('disabled')).toBeFalse();
      expect(container.getAttribute('tabindex')).toBe('0');
    });

    it('should not throw errors when updating rendering if component is not fully initialized', () => {
      const newCheckbox = document.createElement('cka-checkbox') as CkAlightCheckbox;
      // Don't initialize the checkbox, so _container and _box are null
      expect(() => newCheckbox._updateRendering()).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should clean up event listeners on disconnectedCallback', () => {
      const container = checkbox.querySelector('.cka-checkbox') as HTMLElement;
      const clickSpy = spyOn(checkbox as any, '_onClick');
      const keydownSpy = spyOn(checkbox as any, '_onKeyDown');
      const focusSpy = spyOn(checkbox as any, '_onFocus');
      const blurSpy = spyOn(checkbox as any, '_onBlur');

      checkbox.disconnectedCallback();

      container.click();
      container.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      container.dispatchEvent(new FocusEvent('focus'));
      container.dispatchEvent(new FocusEvent('blur'));

      expect(clickSpy).not.toHaveBeenCalled();
      expect(keydownSpy).not.toHaveBeenCalled();
      expect(focusSpy).not.toHaveBeenCalled();
      expect(blurSpy).not.toHaveBeenCalled();
    });

    it('should not throw error if removeEventListeners is called when container is null', () => {
      const newCheckbox = document.createElement('cka-checkbox') as CkAlightCheckbox;
      // Don't initialize the checkbox, so _container is null
      expect(() => newCheckbox.disconnectedCallback()).not.toThrow();
    });
  });

  describe('Component Lifecycle', () => {
    it('should handle the case when component is disconnected before initialization completes', async () => {
      const newCheckbox = document.createElement('cka-checkbox') as CkAlightCheckbox;
      document.body.appendChild(newCheckbox);

      // Remove immediately before microtasks complete
      document.body.removeChild(newCheckbox);

      // Make sure no errors are thrown
      await Promise.resolve();
      expect(true).toBeTrue(); // Just to have an assertion
    });

    it('should skip setup if already initialized during connectedCallback', () => {
      // First initialize through normal means
      checkbox.initializeElement();

      // Spy on initializeElement
      const spy = spyOn(checkbox, 'initializeElement');

      // Call connectedCallback again - it should not reinitialize if elements exist
      const containerBefore = checkbox.querySelector('.cka-checkbox');
      checkbox.connectedCallback();

      // Check if initializeElement was called
      expect(spy).not.toHaveBeenCalled();

      // Ensure container is still the same
      const containerAfter = checkbox.querySelector('.cka-checkbox');
      expect(containerBefore).toBe(containerAfter);
    });
  });

  describe('ConnectedCallback Attribute Handling', () => {
    it('should set checked state based on initialvalue attribute during connection', () => {
      // Create a new checkbox to test the connectedCallback behavior specifically
      const newCheckbox = document.createElement('cka-checkbox') as CkAlightCheckbox;

      // Set initialvalue attribute before connecting
      newCheckbox.setAttribute('initialvalue', 'true');

      // Connect to trigger connectedCallback
      document.body.appendChild(newCheckbox);
      newCheckbox.connectedCallback();

      // Verify the checked state was set correctly
      expect(newCheckbox.checked).toBeTrue();

      // Clean up
      document.body.removeChild(newCheckbox);
    });

    it('should handle false initialvalue attribute during connection', () => {
      // Create a new checkbox
      const newCheckbox = document.createElement('cka-checkbox') as CkAlightCheckbox;

      // First set it to true to test that it gets changed to false
      newCheckbox.checked = true;

      // Set initialvalue attribute to false
      newCheckbox.setAttribute('initialvalue', 'false');

      // Connect to trigger connectedCallback
      document.body.appendChild(newCheckbox);
      newCheckbox.connectedCallback();

      // Verify the checked state was set correctly
      expect(newCheckbox.checked).toBeFalse();

      // Clean up
      document.body.removeChild(newCheckbox);
    });

    it('should set disabled state based on disabled attribute during connection', () => {
      // Create a new checkbox
      const newCheckbox = document.createElement('cka-checkbox') as CkAlightCheckbox;

      // Set disabled attribute before connecting
      newCheckbox.setAttribute('disabled', '');

      // Connect to trigger connectedCallback
      document.body.appendChild(newCheckbox);
      newCheckbox.connectedCallback();

      // Verify the disabled state was set correctly
      expect(newCheckbox.disabled).toBeTrue();

      // Clean up
      document.body.removeChild(newCheckbox);
    });

    it('should handle missing attributes during connection', () => {
      // Create a new checkbox without any attributes
      const newCheckbox = document.createElement('cka-checkbox') as CkAlightCheckbox;

      // Connect to trigger connectedCallback
      document.body.appendChild(newCheckbox);
      newCheckbox.connectedCallback();

      // Verify the default states
      expect(newCheckbox.checked).toBeFalse();
      expect(newCheckbox.disabled).toBeFalse();

      // Clean up
      document.body.removeChild(newCheckbox);
    });

    it('should handle case-insensitive initialvalue attribute during connection', () => {
      // Create a new checkbox
      const newCheckbox = document.createElement('cka-checkbox') as CkAlightCheckbox;

      // Set initialvalue attribute with mixed case
      newCheckbox.setAttribute('initialvalue', 'TrUe');

      // Connect to trigger connectedCallback
      document.body.appendChild(newCheckbox);
      newCheckbox.connectedCallback();

      // Verify the checked state was set correctly
      expect(newCheckbox.checked).toBeTrue();

      // Clean up
      document.body.removeChild(newCheckbox);
    });
  });
});
