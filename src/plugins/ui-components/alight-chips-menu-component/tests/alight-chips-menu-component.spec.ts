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
      expect(input.placeholder).toBe('Enter text');
      expect(container.classList.contains('cka-chips-container')).toBeTruthy();
    });

    it('should create component with custom options', () => {
      const options: ChipsOptions = {
        placeholder: 'Custom placeholder',
        maxChips: 3,
        allowDuplicates: true,
        disabled: true
      };

      component = new CkAlightChipsMenu('test-chips-container');

      const input = container.querySelector('.cka-chips-input') as HTMLInputElement;
      expect(input.placeholder).toBe('Custom placeholder');
      expect(input.disabled).toBeTruthy();
      expect(container.classList.contains('cka-chips-disabled')).toBeTruthy();
    });

    it('should throw error when container not found', () => {
      expect(() => {
        new CkAlightChipsMenu('non-existent-container');
      }).toThrow('Container with id "non-existent-container" not found');
    });

    it('should initialize with empty chips', () => {
      component = new CkAlightChipsMenu('test-chips-container');
      expect(component.getChips()).toEqual([]);
      expect(container.querySelector('.cka-chips-input')).toBeTruthy();
    });
  });

  describe('Adding Chips', () => {
    beforeEach(() => {
      component = new CkAlightChipsMenu('test-chips-container');
    });

    it('should add a chip successfully', () => {
      const result = component.addChip('Test Chip');
      const chips = component.getChips();

      expect(result).toBeTruthy();
      expect(chips.length).toBe(1);
      expect(chips[0]).toBe('Test Chip');
      expect(container.querySelector('.cka-chip')).toBeTruthy();
    });

    it('should not add duplicate chips by default', () => {
      component.addChip('Test Chip');
      const result = component.addChip('Test Chip');
      const chips = component.getChips();

      expect(result).toBeFalsy();
      expect(chips.length).toBe(1);
    });
    it('should allow duplicate chips when configured', () => {
      component = new CkAlightChipsMenu('test-chips-container');
      component.setConfig({ allowDuplicates: true });

      component.addChip('Test Chip');
      const result = component.addChip('Test Chip');
      const chips = component.getChips();

      expect(result).toBeTruthy();
      expect(chips.length).toBe(2);
    });

    it('should add chip on enter key', (done) => {
      const input = container.querySelector('.cka-chips-input') as HTMLInputElement;
      expect(input).toBeTruthy();

      container.addEventListener('chipAdd', ((e: CustomEvent) => {
        expect(e.detail).toBe('test-chip');
        expect(component.getChips().some(chip => chip === 'test-chip')).toBeTruthy();
        done();
      }) as EventListener);

      input.value = 'test-chip';
      input.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true
      }));
    });
  });

  describe('Removing Chips', () => {
    beforeEach(() => {
      component = new CkAlightChipsMenu('test-chips-container');
    });

    it('should remove a chip successfully', () => {
      component.addChip('Test Chip');
      const chips = component.getChips();
      const chipId = 0; // Assuming the chip ID is the index in the array

      const result = component['removeChip'](chipId);
      const updatedChips = component.getChips();

      expect(result).toBeTruthy();
      expect(updatedChips.length).toBe(0);
      expect(container.querySelector('.cka-chip')).toBeFalsy();
    });
    it('should return false when removing non-existent chip', () => {
      const result = component['removeChip']('non-existent-id' as unknown as number);
      expect(result).toBeFalsy();
    });

    it('should remove chip when clicking remove button', (done) => {
      const addedChip = component.addChip('test-chip');
      const chips = component.getChips();
      const chipId = chips[0];

      container.addEventListener('chipRemove', ((e: CustomEvent) => {
        expect(e.detail.label).toBe('test-chip');
        expect(e.detail.id).toBe(chipId);
        expect(component.getChips().length).toBe(0);
        done();
      }) as EventListener);

      const removeButton = container.querySelector('.cka-chip-remove') as HTMLButtonElement;
      removeButton.click();
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      component = new CkAlightChipsMenu('test-chips-container');
    });

    it('should emit chipAdd event when adding chip', (done) => {
      container.addEventListener('chipAdd', ((e: CustomEvent) => {
        expect(e.detail.label).toBe('Test Chip');
        expect(e.detail.removable).toBeTruthy();
        done();
      }) as EventListener);

      component.addChip('Test Chip');
    });

    it('should emit chipRemove event when removing chip', (done) => {
      component.addChip('Test Chip');
      const chips = component.getChips();
      const chipId = chips[0];

      container.addEventListener('chipRemove', ((e: CustomEvent) => {
        expect(e.detail.label).toBe('Test Chip');
        expect(e.detail.id).toBe(chipId);
        done();
      }) as EventListener);

      const removeButton = container.querySelector('.cka-chip-remove') as HTMLButtonElement;
      removeButton.click();
    });

    it('should emit clear event when clearing chips', (done) => {
      component.addChip('Test Chip');

      container.addEventListener('clear', ((e: CustomEvent) => {
        expect(component.getChips().length).toBe(0);
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

      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

      const chips = component.getChips();
      expect(chips.length).toBe(1);
      expect(chips[0]).toBe('Test Chip');
      expect(input.value).toBe('');
    });

    it('should remove last chip on Backspace when input is empty', () => {
      component.addChip('Chip 1');
      component.addChip('Chip 2');

      const input = container.querySelector('.cka-chips-input') as HTMLInputElement;
      input.value = '';

      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace' }));

      const chips = component.getChips();
      expect(chips.length).toBe(1);
      expect(chips[0]).toBe('Chip 1');
    });
  });

  describe('Utility Methods', () => {
    beforeEach(() => {
      component = new CkAlightChipsMenu('test-chips-container');
    });

    it('should clear all chips', () => {
      component.addChip('Chip 1');
      component.addChip('Chip 2');

      component.clear();
      const chips = component.getChips();

      expect(chips.length).toBe(0);
      expect(container.querySelectorAll('.cka-chip').length).toBe(0);
    });

    it('should disable and enable component', () => {
      component.disable();

      const input = container.querySelector('.cka-chips-input') as HTMLInputElement;
      expect(input.disabled).toBeTruthy();
      expect(container.classList.contains('cka-chips-disabled')).toBeTruthy();

      component.enable();
      expect(input.disabled).toBeFalsy();
      expect(container.classList.contains('cka-chips-disabled')).toBeFalsy();
    });

    it('should destroy component and clean up', () => {
      component.addChip('Test Chip');
      component.destroy();

      expect(container.innerHTML).toBe('');
      expect(component.getChips().length).toBe(0);
    });
  });
});