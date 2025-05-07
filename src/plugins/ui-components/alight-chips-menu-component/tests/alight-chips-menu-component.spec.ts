import { CkAlightChipsMenu, ChipItem, ChipsOptions } from '../alight-chips-menu-component';

describe('CkAlightChipsMenu', () => {
  let component: CkAlightChipsMenu;
  let container: HTMLElement;
  const originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;

  beforeEach(() => {
    // Increase timeout interval for all tests
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

    // Create container element
    container = document.createElement('div');
    container.id = 'test-chips-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up
    if (component) {
      component.destroy();
      component = null;
    }

    // Clean up any DOM elements
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }

    // Reset state
    document.body.innerHTML = '';

    // Reset timeout to original value
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  describe('Initialization', () => {
    it('should create component with default options', () => {
      component = new CkAlightChipsMenu('test-chips-container');
      const input = container.querySelector('.cka-chips-input') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.placeholder).toBe('Type and press Enter...');
      expect(container.querySelector('.cka-chips-container')).toBeTruthy();
    });

    it('should throw error when container not found', () => {
      expect(() => {
        new CkAlightChipsMenu('non-existent-container');
      }).toThrowError(/Container with id "non-existent-container" not found/);
    });
  });

  describe('Adding Chips', () => {
    beforeEach(() => {
      component = new CkAlightChipsMenu('test-chips-container');
    });

    it('should add a chip successfully', () => {
      component.addChip('Test Chip');
      const chips = component.getChips();
      expect(chips.length).toBe(1);
      expect(chips[0]).toBe('Test Chip');
      expect(container.querySelector('.cka-chip')).toBeTruthy();
    });

    it('should not add duplicate chips', () => {
      component.addChip('Test Chip');
      component.addChip('Test Chip');
      const chips = component.getChips();
      expect(chips.length).toBe(1);
    });

    it('should handle paste event with multiple chips', (done) => {
      const input = container.querySelector('.cka-chips-input') as HTMLInputElement;
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer()
      });

      // Create a more reliable getData mock
      const originalGetData = pasteEvent.clipboardData.getData;
      pasteEvent.clipboardData.getData = function (format: string) {
        if (format === 'text/plain' || format === 'text') {
          return 'chip1, chip2, chip3';
        }
        return originalGetData.call(this, format);
      };

      // Listen for the paste event to complete
      container.addEventListener('add', () => {
        setTimeout(() => {
          const chips = component.getChips();
          expect(chips.length).toBe(3);
          expect(chips).toEqual(['chip1', 'chip2', 'chip3']);
          done();
        }, 0);
      }, { once: true });

      input.dispatchEvent(pasteEvent);
    });

    it('should handle empty paste event', () => {
      const input = container.querySelector('.cka-chips-input') as HTMLInputElement;
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer()
      });

      // More reliable getData mock
      const originalGetData = pasteEvent.clipboardData.getData;
      pasteEvent.clipboardData.getData = function (format: string) {
        if (format === 'text/plain' || format === 'text') {
          return '';
        }
        return originalGetData.call(this, format);
      };

      input.dispatchEvent(pasteEvent);

      const chips = component.getChips();
      expect(chips.length).toBe(0);
    });

    it('should handle paste event with duplicate chips', (done) => {
      component.addChip('chip1');

      const input = container.querySelector('.cka-chips-input') as HTMLInputElement;
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer()
      });

      // More reliable getData mock
      const originalGetData = pasteEvent.clipboardData.getData;
      pasteEvent.clipboardData.getData = function (format: string) {
        if (format === 'text/plain' || format === 'text') {
          return 'chip1, chip2';
        }
        return originalGetData.call(this, format);
      };

      // Listen for the paste event to complete
      container.addEventListener('add', () => {
        setTimeout(() => {
          const chips = component.getChips();
          expect(chips.length).toBe(2);
          expect(chips).toEqual(['chip1', 'chip2']);
          done();
        }, 0);
      }, { once: true });

      input.dispatchEvent(pasteEvent);
    });

    it('should handle paste event with null clipboardData', () => {
      const input = container.querySelector('.cka-chips-input') as HTMLInputElement;

      // Create a paste event with null clipboardData
      const pasteEvent = new Event('paste') as any;
      pasteEvent.clipboardData = null;

      input.dispatchEvent(pasteEvent);

      const chips = component.getChips();
      expect(chips.length).toBe(0);
    });
  });

  describe('Removing Chips', () => {
    beforeEach(() => {
      component = new CkAlightChipsMenu('test-chips-container');
    });

    it('should remove a chip successfully', (done) => {
      component.addChip('Test Chip');

      // Allow time for the DOM to update
      setTimeout(() => {
        const removeButton = container.querySelector('.cka-chip-remove') as HTMLButtonElement;
        expect(removeButton).toBeTruthy('Remove button should exist');

        // Listen for the remove event to complete
        container.addEventListener('remove', () => {
          setTimeout(() => {
            expect(component.getChips().length).toBe(0);
            done();
          }, 0);
        }, { once: true });

        removeButton.click();
      }, 0);
    });

    it('should handle removing chip at specific index', (done) => {
      component.addChip('Chip 1');
      component.addChip('Chip 2');
      component.addChip('Chip 3');

      // Allow time for the DOM to update
      setTimeout(() => {
        const removeButtons = container.querySelectorAll('.cka-chip-remove');
        expect(removeButtons.length).toBe(3, 'Should have 3 remove buttons');

        // Listen for the remove event to complete
        container.addEventListener('remove', () => {
          setTimeout(() => {
            const chips = component.getChips();
            expect(chips.length).toBe(2);
            expect(chips).toEqual(['Chip 1', 'Chip 3']);
            done();
          }, 0);
        }, { once: true });

        (removeButtons[1] as HTMLButtonElement).click();
      }, 0);
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      component = new CkAlightChipsMenu('test-chips-container');
    });

    it('should emit add event when adding chip', (done) => {
      container.addEventListener('add', ((e: CustomEvent) => {
        expect(e.detail).toBe('Test Chip');
        done();
      }) as EventListener, { once: true });

      component.addChip('Test Chip');
    });

    it('should emit remove event when removing chip', (done) => {
      component.addChip('Test Chip');

      // Allow time for the DOM to update
      setTimeout(() => {
        container.addEventListener('remove', ((e: CustomEvent) => {
          expect(e.detail).toBe('Test Chip');
          done();
        }) as EventListener, { once: true });

        const removeButton = container.querySelector('.cka-chip-remove') as HTMLButtonElement;
        expect(removeButton).toBeTruthy('Remove button should exist');
        removeButton.click();
      }, 0);
    });

    it('should emit clear event when clearing chips', (done) => {
      component.addChip('Test Chip');

      container.addEventListener('clear', ((e: CustomEvent) => {
        expect(e.detail).toEqual(['Test Chip']);
        done();
      }) as EventListener, { once: true });

      component.clear();
    });

    it('should not emit clear event when chips are already empty', () => {
      const clearSpy = jasmine.createSpy('clearSpy');
      container.addEventListener('clear', clearSpy, { once: true });
      component.clear();
      expect(clearSpy).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Interaction', () => {
    beforeEach(() => {
      component = new CkAlightChipsMenu('test-chips-container');
    });

    it('should add chip on Enter key', (done) => {
      const input = container.querySelector('.cka-chips-input') as HTMLInputElement;
      input.value = 'Test Chip';

      // Listen for the add event to complete
      container.addEventListener('add', () => {
        setTimeout(() => {
          expect(component.getChips()).toEqual(['Test Chip']);
          expect(input.value).toBe('');
          done();
        }, 0);
      }, { once: true });

      input.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true
      }));
    });

    it('should handle Enter key with empty input', () => {
      const input = container.querySelector('.cka-chips-input') as HTMLInputElement;
      input.value = '';

      input.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true
      }));

      expect(component.getChips().length).toBe(0);
    });

    it('should handle Enter key with multiple comma-separated values', (done) => {
      const input = container.querySelector('.cka-chips-input') as HTMLInputElement;
      input.value = 'chip1, chip2, chip3';

      // Listen for the add event to complete
      container.addEventListener('add', () => {
        setTimeout(() => {
          expect(component.getChips()).toEqual(['chip1', 'chip2', 'chip3']);
          expect(input.value).toBe('');
          done();
        }, 0);
      }, { once: true });

      input.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true
      }));
    });

    it('should not process input on keys other than Enter', () => {
      const input = container.querySelector('.cka-chips-input') as HTMLInputElement;
      input.value = 'Test Chip';

      input.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Space',
        bubbles: true
      }));

      expect(component.getChips().length).toBe(0);
      expect(input.value).toBe('Test Chip');
    });

    it('should handle keydown event when inputElement is null', () => {
      // Force inputElement to be null
      (component as any).inputElement = null;

      // This test just verifies no errors are thrown
      expect(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true
        }));
      }).not.toThrow();
    });
  });

  describe('Utility Methods', () => {
    beforeEach(() => {
      component = new CkAlightChipsMenu('test-chips-container');
    });

    it('should set chips successfully', () => {
      component.setChips(['Chip 1', 'Chip 2', 'Chip 3']);
      expect(component.getChips()).toEqual(['Chip 1', 'Chip 2', 'Chip 3']);
    });

    it('should set chips with duplicates removed', () => {
      component.setChips(['Chip 1', 'Chip 2', 'Chip 1', 'Chip 3']);
      expect(component.getChips()).toEqual(['Chip 1', 'Chip 2', 'Chip 3']);
    });

    it('should clear all chips', () => {
      component.setChips(['Chip 1', 'Chip 2']);
      component.clear();
      expect(component.getChips().length).toBe(0);
      expect(container.querySelectorAll('.cka-chip').length).toBe(0);
    });

    it('should provide clearChips as an alias for clear', () => {
      component.setChips(['Chip 1', 'Chip 2']);
      spyOn(component, 'clear');
      component.clearChips();
      expect(component.clear).toHaveBeenCalled();
    });

    it('should properly clean up on destroy', () => {
      const input = container.querySelector('.cka-chips-input') as HTMLInputElement;

      // Spy on event listener removal
      spyOn(input, 'removeEventListener').and.callThrough();

      component.addChip('Test Chip');
      component.destroy();

      expect(container.innerHTML).toBe('');
      expect(component.getChips().length).toBe(0);
      expect(input.removeEventListener).toHaveBeenCalledWith('keydown', jasmine.any(Function));
      expect(input.removeEventListener).toHaveBeenCalledWith('paste', jasmine.any(Function));
    });

    it('should handle case where chipsList is null during rendering', () => {
      // Force the container to not have the chips list element
      container.innerHTML = '<div class="cka-chips-container"><input type="text" class="cka-chips-input"></div>';
      (component as any).inputElement = container.querySelector('.cka-chips-input');

      // Add a chip and verify no errors are thrown during rendering
      expect(() => {
        component.addChip('Test Chip');
      }).not.toThrow();
    });
  });

  describe('Configuration', () => {
    beforeEach(() => {
      component = new CkAlightChipsMenu('test-chips-container');
    });

    it('should set configuration for allowDuplicates', () => {
      // Add duplicate chips
      (component as any).chips = ['chip1', 'chip1', 'chip2'];

      // Spy on renderChips
      spyOn(component as any, 'renderChips');

      // Set allowDuplicates to false
      component.setConfig({ allowDuplicates: false });

      // Check that duplicates were removed
      expect(component.getChips()).toEqual(['chip1', 'chip2']);
      expect((component as any).renderChips).toHaveBeenCalled();
    });

    it('should enable and disable the component', () => {
      component.disable();

      const input = container.querySelector('.cka-chips-input') as HTMLInputElement;
      expect(input.disabled).toBe(true);
      expect(container.classList.contains('cka-chips-disabled')).toBe(true);

      component.enable();

      expect(input.disabled).toBe(false);
      expect(container.classList.contains('cka-chips-disabled')).toBe(false);
    });

    it('should handle enable/disable when inputElement is null', () => {
      // Force inputElement to be null
      (component as any).inputElement = null;

      // These tests just verify no errors are thrown
      expect(() => {
        component.disable();
      }).not.toThrow();

      expect(() => {
        component.enable();
      }).not.toThrow();
    });
  });
});
