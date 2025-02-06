// src/plugins/ui-components/alight-select-menu-component/alight-select-menu-component.ts
import './styles/alight-select-menu.scss';
import { AlightPositionManager, PositionConfig } from '../alight-ui-component-utils/alight-position-manager';

interface SelectOption {
  [key: string]: any;
  disabled?: boolean;
}

interface SelectConfig<T> extends PositionConfig {
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
  [x: string]: any;
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
  private positionManager: AlightPositionManager;
  private readonly menuId: string;
  private config: PositionConfig;

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

    this.positionManager = AlightPositionManager.getInstance();
    this.menuId = `select-menu-${Math.random().toString(36).substr(2, 9)}`;

    // Add position-related defaults
    this.config = {
      position: 'bottom',
      offset: 4,
      followTrigger: false,
      constrainToViewport: true,
      autoFlip: true,
      alignment: 'start',
      ...config
    };

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

    selectButton.appendChild(this.selectedDisplay);
    selectButton.appendChild(arrow);

    // Create dropdown panel with absolute positioning
    this.dropdownElement = document.createElement('div');
    this.dropdownElement.className = 'cka-select-dropdown';
    this.dropdownElement.style.position = 'fixed';
    this.dropdownElement.style.display = 'none';

    // Add dropdown content wrapper
    const dropdownContent = document.createElement('div');
    dropdownContent.className = 'cka-select-dropdown-content';

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
      dropdownContent.appendChild(filterContainer);
    }

    // Create options container
    this.optionsContainer = document.createElement('div');
    this.optionsContainer.className = 'cka-select-options';

    dropdownContent.appendChild(this.optionsContainer);
    this.dropdownElement.appendChild(dropdownContent);

    // Append elements to main container
    this.element.appendChild(selectButton);
    document.body.appendChild(this.dropdownElement);

    // Force a layout recalculation
    this.dropdownElement.getBoundingClientRect();

    this.renderOptions();

    // Add click outside listener
    document.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as Node;
      if (!this.element.contains(target) && !this.dropdownElement.contains(target)) {
        this.closeDropdown();
      }
    });
  }

  private calculateDropdownPosition(): { top: boolean } {
    if (!this.dropdownElement) return { top: false };

    const triggerRect = this.element.getBoundingClientRect();
    const dropdownRect = this.dropdownElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Check if there's space below
    const spaceBelow = viewportHeight - triggerRect.bottom;
    // Check if there's space above
    const spaceAbove = triggerRect.top;

    // Get closest scrollable parent
    let parent = this.element.parentElement;
    let scrollParent: HTMLElement | null = null;
    while (parent) {
      const overflowY = window.getComputedStyle(parent).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') {
        scrollParent = parent;
        break;
      }
      parent = parent.parentElement;
    }

    // If no scrollable parent found, use viewport dimensions
    const parentRect = scrollParent
      ? scrollParent.getBoundingClientRect()
      : { top: 0, bottom: window.innerHeight };

    // Check if dropdown would overflow the parent container
    const wouldOverflowParentBottom = triggerRect.bottom + dropdownRect.height > parentRect.bottom;
    const wouldOverflowParentTop = triggerRect.top - dropdownRect.height < parentRect.top;

    // Determine if dropdown should open upward
    const shouldOpenUpward = (spaceBelow < dropdownRect.height && spaceAbove >= dropdownRect.height) ||
      (wouldOverflowParentBottom && !wouldOverflowParentTop);

    return { top: shouldOpenUpward };
  }

  private positionDropdown(): void {
    const { top } = this.calculateDropdownPosition();

    // Remove existing positioning classes
    this.dropdownElement.classList.remove('cka-select-dropdown--top');
    this.dropdownElement.classList.remove('cka-select-dropdown--bottom');

    // Add appropriate positioning class
    this.dropdownElement.classList.add(top ? 'cka-select-dropdown--top' : 'cka-select-dropdown--bottom');
  }

  private renderOptions(): void {
    this.optionsContainer.innerHTML = '';

    const filteredOptions = this.filter && this.filterValue
      ? this.options.filter(option =>
        String(option[this.optionLabel]).toLowerCase().includes(this.filterValue.toLowerCase())
      )
      : this.options;

    filteredOptions.forEach(option => {
      const optionElement = document.createElement('div');
      optionElement.className = 'cka-select-option';

      if (this.isSelected(option[this.optionValue])) {
        optionElement.classList.add('selected');
      }

      if (option.disabled) {
        optionElement.classList.add('disabled');
      }

      optionElement.textContent = String(option[this.optionLabel]);

      if (!option.disabled) {
        optionElement.addEventListener('click', () => this.handleOptionClick(option));
      }

      this.optionsContainer.appendChild(optionElement);
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
    if (this.disabled) return;

    this.isOpen = true;

    // Set display block before registering with position manager
    this.dropdownElement.style.display = 'block';

    // Force a layout recalculation
    this.dropdownElement.getBoundingClientRect();

    // Register with position manager with a slight delay to ensure proper positioning
    requestAnimationFrame(() => {
      this.positionManager.register(
        this.menuId,
        this.dropdownElement,
        this.element,
        {
          ...this.config,
          position: 'bottom',
          offset: 4,
          constrainToViewport: true,
          autoFlip: true,
          alignment: 'start',
          width: this.element.offsetWidth + 'px'
        }
      );

      // Add open class for animation after positioning
      this.dropdownElement.classList.add('open');
    });

    if (this.filter) {
      const filterInput = this.dropdownElement.querySelector('input');
      if (filterInput) {
        filterInput.focus();
      }
    }
  }

  private handleResize = (): void => {
    if (this.isOpen) {
      this.positionDropdown();
    }
  };

  private addScrollListener(): void {
    // Find scrollable parent
    let parent = this.element.parentElement;
    while (parent) {
      const overflowY = window.getComputedStyle(parent).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') {
        parent.addEventListener('scroll', this.handleResize);
        break;
      }
      parent = parent.parentElement;
    }

    // Also listen to window scroll
    window.addEventListener('scroll', this.handleResize);
  }

  private removeScrollListener(): void {
    let parent = this.element.parentElement;
    while (parent) {
      const overflowY = window.getComputedStyle(parent).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') {
        parent.removeEventListener('scroll', this.handleResize);
        break;
      }
      parent = parent.parentElement;
    }
    window.removeEventListener('scroll', this.handleResize);
  }

  private closeDropdown(): void {
    this.isOpen = false;
    this.dropdownElement.classList.remove('open');
    this.dropdownElement.style.display = 'none';

    // Unregister from position manager
    this.positionManager.unregister(this.menuId);

    if (this.filter) {
      const filterInput = this.dropdownElement.querySelector('input') as HTMLInputElement;
      if (filterInput) {
        filterInput.value = '';
        this.filterValue = '';
        this.renderOptions();
      }
    }
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

    // Force a layout recalculation after mounting
    requestAnimationFrame(() => {
      this.element.getBoundingClientRect();
      this.dropdownElement.getBoundingClientRect();
    });
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
    this.positionManager.unregister(this.menuId);

    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    if (this.dropdownElement && this.dropdownElement.parentNode) {
      this.dropdownElement.parentNode.removeChild(this.dropdownElement);
    }
  }
}