import { CkAlightChipsMenu, ChipItem, ChipsOptions } from '../alight-chips-menu-component';

describe('CkAlightChipsMenu', () => {
  let component: CkAlightChipsMenu;
  let container: HTMLElement;

  beforeEach(() => {
    // Create container element
    container = document.createElement('div');
    container.id = 'test-chips-container';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up
    if (component) {
      component.destroy();
    }
    document.body.removeChild(container);
  });

  describe('Initialization', () => {
    it('should create component with default options', () => {
      component = new CkAlightChipsMenu('test-chips-container');
      const input = container.querySelector('.cka-chips-input') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.placeholder).toBe('Type and press Enter...');
      expect(container.querySelector('.cka-chips-container')).toBeTruthy();
    });

    // it('should throw error when container not found', () => {
    //   expect(() => {
    //     new CkAlightChipsMenu('non-existent-container');
    //   }).toThrow('Container with id "non-existent-container" not found');
    // });
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

    it('should handle paste event with multiple chips', () => {
      const input = container.querySelector('.cka-chips-input') as HTMLInputElement;
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer()
      });
      Object.defineProperty(pasteEvent.clipboardData, 'getData', {
        value: () => 'chip1, chip2, chip3'
      });

      input.dispatchEvent(pasteEvent);

      const chips = component.getChips();
      expect(chips.length).toBe(3);
      expect(chips).toEqual(['chip1', 'chip2', 'chip3']);
    });

    it('should handle empty paste event', () => {
      const input = container.querySelector('.cka-chips-input') as HTMLInputElement;
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer()
      });
      Object.defineProperty(pasteEvent.clipboardData, 'getData', {
        value: () => ''
      });

      input.dispatchEvent(pasteEvent);

      const chips = component.getChips();
      expect(chips.length).toBe(0);
    });

    it('should handle paste event with duplicate chips', () => {
      component.addChip('chip1');

      const input = container.querySelector('.cka-chips-input') as HTMLInputElement;
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer()
      });
      Object.defineProperty(pasteEvent.clipboardData, 'getData', {
        value: () => 'chip1, chip2'
      });

      input.dispatchEvent(pasteEvent);

      const chips = component.getChips();
      expect(chips.length).toBe(2);
      expect(chips).toEqual(['chip1', 'chip2']);
    });
  });

  describe('Removing Chips', () => {
    beforeEach(() => {
      component = new CkAlightChipsMenu('test-chips-container');
    });

    it('should remove a chip successfully', () => {
      component.addChip('Test Chip');
      const removeButton = container.querySelector('.cka-chip-remove') as HTMLButtonElement;
      removeButton.click();
      expect(component.getChips().length).toBe(0);
    });

    it('should handle removing chip at specific index', () => {
      component.addChip('Chip 1');
      component.addChip('Chip 2');
      component.addChip('Chip 3');

      const removeButtons = container.querySelectorAll('.cka-chip-remove');
      (removeButtons[1] as HTMLButtonElement).click();

      const chips = component.getChips();
      expect(chips.length).toBe(2);
      expect(chips).toEqual(['Chip 1', 'Chip 3']);
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
      }) as EventListener);

      component.addChip('Test Chip');
    });

    it('should emit remove event when removing chip', (done) => {
      component.addChip('Test Chip');

      container.addEventListener('remove', ((e: CustomEvent) => {
        expect(e.detail).toBe('Test Chip');
        done();
      }) as EventListener);

      const removeButton = container.querySelector('.cka-chip-remove') as HTMLButtonElement;
      removeButton.click();
    });

    it('should emit clear event when clearing chips', (done) => {
      component.addChip('Test Chip');

      container.addEventListener('clear', ((e: CustomEvent) => {
        expect(e.detail).toEqual(['Test Chip']);
        done();
      }) as EventListener);

      component.clear();
    });

    it('should not emit clear event when chips are already empty', () => {
      const clearSpy = jasmine.createSpy('clearSpy');
      container.addEventListener('clear', clearSpy);
      component.clear();
      expect(clearSpy).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Interaction', () => {
    beforeEach(() => {
      component = new CkAlightChipsMenu('test-chips-container');
    });

    it('should add chip on Enter key', () => {
      const input = container.querySelector('.cka-chips-input') as HTMLInputElement;
      input.value = 'Test Chip';

      input.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true
      }));

      expect(component.getChips()).toEqual(['Test Chip']);
      expect(input.value).toBe('');
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

    it('should handle Enter key with multiple comma-separated values', () => {
      const input = container.querySelector('.cka-chips-input') as HTMLInputElement;
      input.value = 'chip1, chip2, chip3';

      input.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true
      }));

      expect(component.getChips()).toEqual(['chip1', 'chip2', 'chip3']);
      expect(input.value).toBe('');
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

    // it('should properly clean up on destroy', () => {
    //   const input = container.querySelector('.cka-chips-input') as HTMLInputElement;
    //   const originalKeydownListener = input.onkeydown;
    //   const originalPasteListener = input.onpaste;

    //   component.addChip('Test Chip');
    //   component.destroy();

    //   expect(container.innerHTML).toBe('');
    //   expect(component.getChips().length).toBe(0);
    //   expect(input.onkeydown).not.toBe(originalKeydownListener);
    //   expect(input.onpaste).not.toBe(originalPasteListener);
    // });
  });
});
