// src/plugins/ui-components/alight-tabs-component/alight-tabs-component.ts
import './styles/alight-select-menu.scss';

interface SelectOption {
  [key: string]: any;
  disabled?: boolean;
}

interface SelectConfig<T> {
  options?: T[];
  placeholder?: string;
  onChange?: (value: T | T[] | null) => void;
  disabled?: boolean;
  multiple?: boolean;
  filter?: boolean;
  optionLabel?: keyof T;
  optionValue?: keyof T;
  value?: T[keyof T] | T[keyof T][] | null;
}

export class CKALightSelectMenu<T extends SelectOption> {
  private element: HTMLDivElement = document.createElement('div');
  private dropdownElement: HTMLDivElement = document.createElement('div');
  private selectedDisplay: HTMLDivElement = document.createElement('div');
  private optionsContainer: HTMLDivElement = document.createElement('div');
  private options: T[];
  private placeholder: string;
  private onChange: (value: T[keyof T] | T[keyof T][] | null) => void;
  private disabled: boolean;
  private multiple: boolean;
  private filter: boolean;
  private optionLabel: keyof T;
  private optionValue: keyof T;
  private value: T[keyof T] | T[keyof T][] | null;
  private isOpen: boolean = false;
  private filterValue: string = '';

  constructor(config: SelectConfig<T> = {}) {
    this.options = config.options || [];
    this.placeholder = config.placeholder || 'Select an option';
    this.onChange = config.onChange || (() => { });
    this.disabled = config.disabled || false;
    this.multiple = config.multiple || false;
    this.filter = config.filter || false;
    this.optionLabel = config.optionLabel || 'label' as keyof T;
    this.optionValue = config.optionValue || 'value' as keyof T;
    this.value = config.value || (this.multiple ? [] : null);

    this.init();
  }

  private init(): void {
    // Create main container
    this.element = document.createElement('div');
    this.element.className = 'cka-select';
    if (this.disabled) {
      this.element.classList.add('disabled');
    }

    // Create select button
    const selectButton = document.createElement('div');
    selectButton.className = 'cka-select-button';
    selectButton.addEventListener('click', () => this.toggleDropdown());

    // Create selected value display
    this.selectedDisplay = document.createElement('div');
    this.selectedDisplay.className = 'cka-select-value';
    this.updateSelectedDisplay();

    // Create dropdown arrow
    const arrow = document.createElement('span');
    arrow.className = 'cka-select-arrow';
    arrow.innerHTML = '▼';

    selectButton.appendChild(this.selectedDisplay);
    selectButton.appendChild(arrow);

    // Create dropdown panel
    this.dropdownElement = document.createElement('div');
    this.dropdownElement.className = 'cka-select-dropdown';

    // Create filter input if enabled
    if (this.filter) {
      const filterContainer = document.createElement('div');
      filterContainer.className = 'cka-select-filter';

      const filterInput = document.createElement('input');
      filterInput.type = 'text';
      filterInput.placeholder = 'Search...';
      filterInput.addEventListener('input', (e) => this.handleFilter(e));
      filterInput.addEventListener('click', (e) => e.stopPropagation());

      filterContainer.appendChild(filterInput);
      this.dropdownElement.appendChild(filterContainer);
    }

    // Create options container
    this.optionsContainer = document.createElement('div');
    this.optionsContainer.className = 'cka-select-options';

    this.renderOptions();

    this.dropdownElement.appendChild(this.optionsContainer);

    // Append elements to main container
    this.element.appendChild(selectButton);
    this.element.appendChild(this.dropdownElement);

    // Add click outside listener
    document.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as Node;
      if (!this.element.contains(target)) {
        this.closeDropdown();
      }
    });
  }


  private renderOptions(): void {
    this.optionsContainer.innerHTML = '';
    const filteredOptions = this.filterOptions();

    filteredOptions.forEach(option => {
      const optionElement = document.createElement('div');
      optionElement.className = 'cka-select-option';

      const optionValue = option[this.optionValue];
      const optionLabel = option[this.optionLabel];

      if (this.isSelected(optionValue)) {
        optionElement.classList.add('selected');
      }

      if (option.disabled) {
        optionElement.classList.add('disabled');
      }

      optionElement.textContent = String(optionLabel);
      optionElement.addEventListener('click', () => this.handleOptionClick(option));

      this.optionsContainer.appendChild(optionElement);
    });
  }

  private filterOptions(): T[] {
    if (!this.filter || !this.filterValue) {
      return this.options;
    }

    return this.options.filter(option => {
      const label = String(option[this.optionLabel]).toLowerCase();
      return label.includes(this.filterValue.toLowerCase());
    });
  }

  private handleFilter(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.filterValue = target.value;
    this.renderOptions();
  }

  private handleOptionClick(option: T): void {
    if (option.disabled) {
      return;
    }

    const value = option[this.optionValue];

    if (this.multiple) {
      const currentValue = this.value as T[keyof T][];
      const index = currentValue.indexOf(value);
      if (index === -1) {
        currentValue.push(value);
      } else {
        currentValue.splice(index, 1);
      }
    } else {
      this.value = value;
      this.closeDropdown();
    }

    this.updateSelectedDisplay();
    this.renderOptions();
    this.onChange(this.value);
  }

  private isSelected(value: T[keyof T]): boolean {
    if (this.multiple) {
      return (this.value as T[keyof T][]).includes(value);
    }
    return this.value === value;
  }

  private updateSelectedDisplay(): void {
    if (!this.value || (Array.isArray(this.value) && !this.value.length)) {
      this.selectedDisplay.textContent = this.placeholder;
      this.selectedDisplay.classList.add('placeholder');
      return;
    }

    this.selectedDisplay.classList.remove('placeholder');

    if (this.multiple) {
      const selectedLabels = (this.value as T[keyof T][]).map(v => {
        const option = this.options.find(opt => opt[this.optionValue] === v);
        return option ? String(option[this.optionLabel]) : '';
      }).filter(Boolean);

      this.selectedDisplay.textContent = selectedLabels.join(', ');
    } else {
      const selectedOption = this.options.find(opt => opt[this.optionValue] === this.value);
      this.selectedDisplay.textContent = selectedOption ? String(selectedOption[this.optionLabel]) : '';
    }
  }

  private toggleDropdown(): void {
    if (this.disabled) {
      return;
    }

    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  private openDropdown(): void {
    this.isOpen = true;
    this.dropdownElement.classList.add('open');
    if (this.filter) {
      const filterInput = this.dropdownElement.querySelector('input');
      if (filterInput) {
        filterInput.focus();
      }
    }
  }

  private closeDropdown(): void {
    this.isOpen = false;
    this.dropdownElement.classList.remove('open');
    this.filterValue = '';
    if (this.filter) {
      const filterInput = this.dropdownElement.querySelector('input');
      if (filterInput) {
        (filterInput as HTMLInputElement).value = '';
      }
    }
    this.renderOptions();
  }

  public mount(container: string | HTMLElement): void {
    if (typeof container === 'string') {
      const element = document.querySelector(container);
      if (!element) {
        throw new Error(`Container element "${container}" not found`);
      }
      element.appendChild(this.element);
    } else {
      container.appendChild(this.element);
    }
  }

  public setValue(value: T[keyof T] | T[keyof T][] | null): void {
    this.value = value;
    this.updateSelectedDisplay();
    this.renderOptions();
  }

  public getValue(): T[keyof T] | T[keyof T][] | null {
    return this.value;
  }

  public setOptions(options: T[]): void {
    this.options = options;
    this.renderOptions();
    this.updateSelectedDisplay();
  }

  public disable(): void {
    this.disabled = true;
    this.element.classList.add('disabled');
  }

  public enable(): void {
    this.disabled = false;
    this.element.classList.remove('disabled');
  }

  public destroy(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
  }
}

// Example usage with TypeScript
interface ExampleOption {
  label: string;
  value: number;
  disabled?: boolean;
}

const select = new CKALightSelectMenu<ExampleOption>({
  options: [
    { label: 'Option 1', value: 1 },
    { label: 'Option 2', value: 2, disabled: true },
    { label: 'Option 3', value: 3 }
  ],
  placeholder: 'Select an option',
  onChange: (value) => console.log('Selected value:', value),
  multiple: true,
  filter: true
});