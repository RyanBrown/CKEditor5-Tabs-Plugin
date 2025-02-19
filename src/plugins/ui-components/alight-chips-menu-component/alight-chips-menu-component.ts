// src/plugins/ui-components/alight-chips-menu-component/alight-chips-menu-component.ts
import './styles/alight-chips-menu-component.scss';

export interface ChipItem {
  id: string;
  label: string;
  removable?: boolean;
}

export interface ChipsOptions {
  placeholder?: string;
  maxChips?: number;
  allowDuplicates?: boolean;
  disabled?: boolean;
}
export class CkAlightChipsMenu {
  private container!: HTMLElement;
  private input!: HTMLInputElement;
  private chipsList!: HTMLElement;
  private chips: ChipItem[] = [];
  private options: ChipsOptions;

  constructor(containerId: string, options: ChipsOptions = {}) {
    this.options = {
      placeholder: 'Enter text',
      maxChips: Infinity,
      allowDuplicates: false,
      disabled: false,
      ...options
    };

    this.initialize(containerId);
    this.setupEventListeners();
  }

  private initialize(containerId: string): void {
    // Get or create container
    const existingContainer = document.getElementById(containerId);
    if (!existingContainer) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    this.container = existingContainer;
    this.container.classList.add('cka-chips-container');

    // Create input wrapper
    const inputWrapper = document.createElement('div');
    inputWrapper.classList.add('cka-chips-input-wrapper');

    // Create chips list
    this.chipsList = document.createElement('div');
    this.chipsList.classList.add('cka-chips-list');

    // Create input
    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.classList.add('cka-chips-input');
    this.input.placeholder = this.options.placeholder || '';
    this.input.setAttribute('aria-label', 'Add chip');

    if (this.options.disabled) {
      this.disable();
    }

    // Append elements
    inputWrapper.appendChild(this.chipsList);
    inputWrapper.appendChild(this.input);
    this.container.appendChild(inputWrapper);
  }

  private setupEventListeners(): void {
    // Input events
    this.input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && this.input.value.trim()) {
        e.preventDefault();
        this.addChip(this.input.value.trim());
        this.input.value = '';
      } else if (e.key === 'Backspace' && !this.input.value && this.chips.length > 0) {
        this.removeChip(this.chips[this.chips.length - 1].id);
      }
    });

    // Focus management
    this.container.addEventListener('click', () => {
      if (!this.options.disabled) {
        this.input.focus();
      }
    });
  }

  public addChip(label: string): boolean {
    if (this.options.disabled) return false;
    if (this.chips.length >= (this.options.maxChips || Infinity)) return false;
    if (!this.options.allowDuplicates && this.chips.some(chip => chip.label === label)) return false;

    const chip: ChipItem = {
      id: `chip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label,
      removable: true
    };

    this.chips.push(chip);
    this.renderChip(chip);
    this.dispatchEvent('chipAdd', chip);
    return true;
  }

  public removeChip(chipId: string): boolean {
    const index = this.chips.findIndex(chip => chip.id === chipId);
    if (index === -1) return false;

    const chip = this.chips[index];
    this.chips.splice(index, 1);

    const chipElement = this.chipsList.querySelector(`[data-chip-id="${chipId}"]`);
    if (chipElement) {
      chipElement.remove();
    }

    this.dispatchEvent('chipRemove', chip);
    return true;
  }

  private renderChip(chip: ChipItem): void {
    const chipElement = document.createElement('div');
    chipElement.classList.add('cka-chip');
    chipElement.setAttribute('data-chip-id', chip.id);
    chipElement.setAttribute('role', 'button');
    chipElement.setAttribute('tabindex', '0');

    const labelElement = document.createElement('span');
    labelElement.textContent = chip.label;
    labelElement.classList.add('cka-chip-label');

    chipElement.appendChild(labelElement);

    if (chip.removable) {
      const removeButton = document.createElement('button');
      removeButton.classList.add('cka-chip-remove');
      removeButton.setAttribute('aria-label', `Remove ${chip.label}`);
      removeButton.innerHTML = '×';

      removeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeChip(chip.id);
      });

      chipElement.appendChild(removeButton);
    }

    this.chipsList.appendChild(chipElement);
  }

  private dispatchEvent(eventName: string, detail: any): void {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true
    });
    this.container.dispatchEvent(event);
  }

  public getChips(): ChipItem[] {
    return [...this.chips];
  }

  public clear(): void {
    this.chips = [];
    this.chipsList.innerHTML = '';
    this.dispatchEvent('clear', null);
  }

  public disable(): void {
    this.options.disabled = true;
    this.input.disabled = true;
    this.container.classList.add('cka-chips-disabled');
  }

  public enable(): void {
    this.options.disabled = false;
    this.input.disabled = false;
    this.container.classList.remove('cka-chips-disabled');
  }

  public destroy(): void {
    this.clear();
    this.container.innerHTML = '';
    // Remove event listeners
    this.input.removeEventListener('keydown', () => { });
    this.container.removeEventListener('click', () => { });
  }
}


// // usage-example.ts
// // Example of how to use the component
// const chipsComponent = new CkAlightChipsMenu('chips-container', {
//   placeholder: 'Add tags...',
//   maxChips: 5,
//   allowDuplicates: false
// });

// // Event listeners
// document.getElementById('chips-container')?.addEventListener('chipAdd', (e: CustomEvent) => {
//   console.log('Chip added:', e.detail);
// });

// document.getElementById('chips-container')?.addEventListener('chipRemove', (e: CustomEvent) => {
//   console.log('Chip removed:', e.detail);
// });