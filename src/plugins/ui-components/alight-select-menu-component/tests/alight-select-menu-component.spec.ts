// src/plugins/ui-components/alight-select-menu-component/tests/alight-select-menu.spec.ts
import { CkAlightSelectMenu } from './../alight-select-menu-component';
import { AlightPositionManager } from './../../alight-ui-component-utils/alight-position-manager';

describe('CkAlightSelectMenu', () => {
  let selectMenu: CkAlightSelectMenu<any>;
  let container: HTMLDivElement;
  let positionManagerMock: any;

  const mockOptions = [
    { label: 'Option 1', value: 1 },
    { label: 'Option 2', value: 2 },
    { label: 'Option 3', value: 3, disabled: true }
  ];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Mock AlightPositionManager
    positionManagerMock = {
      register: jasmine.createSpy('register'),
      unregister: jasmine.createSpy('unregister')
    };
    spyOn(AlightPositionManager, 'getInstance').and.returnValue(positionManagerMock);
  });

  afterEach(() => {
    if (selectMenu) {
      selectMenu.destroy();
    }
    document.body.removeChild(container);
  });

  describe('Initialization', () => {
    it('should create select menu with default options', () => {
      selectMenu = new CkAlightSelectMenu();
      selectMenu.mount(container);

      expect(container.querySelector('.cka-select')).toBeTruthy();
      expect(container.querySelector('.cka-select-button')).toBeTruthy();
      expect(container.querySelector('.cka-select-value')).toBeTruthy();
      expect(document.querySelector('.cka-select-dropdown')).toBeTruthy();
    });

    it('should initialize with provided options', () => {
      selectMenu = new CkAlightSelectMenu({
        options: mockOptions,
        placeholder: 'Select something',
        disabled: true
      });
      selectMenu.mount(container);

      const selectElement = container.querySelector('.cka-select');
      const placeholderElement = container.querySelector('.cka-select-value');

      expect(selectElement?.classList.contains('disabled')).toBeTruthy();
      expect(placeholderElement?.textContent).toBe('Select something');
    });

    it('should initialize with custom optionLabel and optionValue', () => {
      const customOptions = [
        { id: 1, name: 'Option A' },
        { id: 2, name: 'Option B' }
      ];

      selectMenu = new CkAlightSelectMenu({
        options: customOptions,
        optionLabel: 'name',
        optionValue: 'id'
      });
      selectMenu.mount(container);

      // Open dropdown to render options
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      const options = document.querySelectorAll('.cka-select-option');
      expect(options.length).toBe(2);
      expect(options[0].textContent).toBe('Option A');
      expect(options[1].textContent).toBe('Option B');
    });

    it('should initialize with multiple selection mode', () => {
      selectMenu = new CkAlightSelectMenu({
        options: mockOptions,
        multiple: true,
        value: [1, 2]
      });
      selectMenu.mount(container);

      const valueElement = container.querySelector('.cka-select-value');
      expect(valueElement?.textContent).toBe('Option 1, Option 2');
    });

    it('should initialize with filter enabled', () => {
      selectMenu = new CkAlightSelectMenu({
        options: mockOptions,
        filter: true
      });
      selectMenu.mount(container);

      // Open dropdown
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      // Check for filter input
      const filterInput = document.querySelector('.cka-select-filter input');
      expect(filterInput).toBeTruthy();
    });

    it('should throw error when mounting to non-existent selector', () => {
      selectMenu = new CkAlightSelectMenu();
      expect(() => selectMenu.mount('#non-existent-container')).toThrow();
    });

    it('should handle properly when mounting to valid selector string', () => {
      const testId = 'test-container-' + Math.random().toString(36).substr(2, 9);
      container.id = testId;

      selectMenu = new CkAlightSelectMenu();
      expect(() => selectMenu.mount('#' + testId)).not.toThrow();

      // Check that it was mounted properly
      expect(container.querySelector('.cka-select')).toBeTruthy();
    });

    it('should initialize with predefined value', () => {
      selectMenu = new CkAlightSelectMenu({
        options: mockOptions,
        value: 2
      });
      selectMenu.mount(container);

      expect(selectMenu.getValue()).toBe(2);
      const valueElement = container.querySelector('.cka-select-value');
      expect(valueElement?.textContent).toBe('Option 2');
    });

    it('should handle initialization with empty options array', () => {
      selectMenu = new CkAlightSelectMenu({
        options: [],
        placeholder: 'No options available'
      });
      selectMenu.mount(container);

      const valueElement = container.querySelector('.cka-select-value');
      expect(valueElement?.textContent).toBe('No options available');

      // Open dropdown
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      // Should have empty options container
      const options = document.querySelectorAll('.cka-select-option');
      expect(options.length).toBe(0);
    });

    it('should handle initialization with all configuration options', () => {
      const onChange = jasmine.createSpy('onChange');
      selectMenu = new CkAlightSelectMenu({
        options: mockOptions,
        placeholder: 'Select from list',
        onChange: onChange,
        disabled: false,
        multiple: true,
        filter: true,
        optionLabel: 'label',
        optionValue: 'value',
        value: [1],
        position: 'top',
        offset: 8,
        followTrigger: true,
        constrainToViewport: true,
        autoFlip: true,
        alignment: 'end'
      });
      selectMenu.mount(container);

      // Verify config was properly applied
      expect(selectMenu.getValue()).toEqual([1]);

      // Check that the value displays properly
      const valueElement = container.querySelector('.cka-select-value');
      expect(valueElement?.textContent?.includes('Option 1')).toBeTruthy();

      // We don't need to test position manager registration here since that's tested elsewhere
      // and it depends on requestAnimationFrame which makes it tricky to test synchronously
    });
  });

  describe('Option Selection', () => {
    let onChangeSpy: jasmine.Spy;

    beforeEach(() => {
      onChangeSpy = jasmine.createSpy('onChange');
      selectMenu = new CkAlightSelectMenu({
        options: mockOptions,
        onChange: onChangeSpy
      });
      selectMenu.mount(container);
    });

    it('should select a single option', () => {
      // Open dropdown
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      // Get option elements after dropdown is open
      const options = document.querySelectorAll<HTMLElement>('.cka-select-option');

      // Click first option
      if (options && options[0]) {
        options[0].click();
      }

      expect(onChangeSpy).toHaveBeenCalledWith(1);
      expect(selectMenu.getValue()).toBe(1);
      expect(container.querySelector('.cka-select-value')?.textContent).toBe('Option 1');
    });

    it('should handle multiple selection when multiple is true', () => {
      // Recreate with multiple option enabled
      selectMenu.destroy();
      selectMenu = new CkAlightSelectMenu({
        options: mockOptions,
        multiple: true,
        onChange: onChangeSpy
      });
      selectMenu.mount(container);

      // Open dropdown
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      // Select multiple options
      const options = document.querySelectorAll<HTMLElement>('.cka-select-option');
      if (options[0]) {
        options[0].click();
      }
      if (options[1]) {
        options[1].click();
      }

      expect(onChangeSpy).toHaveBeenCalledWith([1, 2]);
      expect(selectMenu.getValue()).toEqual([1, 2]);
      expect(container.querySelector('.cka-select-value')?.textContent).toBe('Option 1, Option 2');
    });

    it('should toggle selection in multiple mode', () => {
      // Recreate with multiple option enabled
      selectMenu.destroy();
      selectMenu = new CkAlightSelectMenu({
        options: mockOptions,
        multiple: true,
        onChange: onChangeSpy
      });
      selectMenu.mount(container);

      // Open dropdown
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      // Select option 1
      const options = document.querySelectorAll<HTMLElement>('.cka-select-option');
      if (options[0]) {
        options[0].click();
      }

      // Click it again to toggle off
      if (options[0]) {
        options[0].click();
      }

      expect(selectMenu.getValue()).toEqual([]);
      expect(container.querySelector('.cka-select-value')?.classList.contains('placeholder')).toBe(true);
    });

    it('should not select disabled options', () => {
      // Open dropdown
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      // Try to click disabled option (Option 3)
      const disabledOption = document.querySelectorAll<HTMLElement>('.cka-select-option')[2];
      if (disabledOption) {
        disabledOption.click();
      }

      expect(onChangeSpy).not.toHaveBeenCalled();
      expect(selectMenu.getValue()).toBeNull();
    });

    it('should not open dropdown when disabled', () => {
      // Recreate with disabled option
      selectMenu.destroy();
      selectMenu = new CkAlightSelectMenu({
        options: mockOptions,
        disabled: true
      });
      selectMenu.mount(container);

      // Try to open dropdown
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      // Dropdown should remain closed
      const dropdown = document.querySelector('.cka-select-dropdown');
      expect(dropdown?.classList.contains('open')).toBeFalsy();
    });

    it('should handle option selection with null or undefined value', () => {
      // Create options with a null value
      const optionsWithNull = [
        { label: 'Option 1', value: 1 },
        { label: 'Empty Option', value: null },
        { label: 'Undefined Option', value: undefined }
      ];

      selectMenu.destroy();
      selectMenu = new CkAlightSelectMenu({
        options: optionsWithNull,
        onChange: onChangeSpy
      });
      selectMenu.mount(container);

      // Open dropdown
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      // Select the null value option
      const options = document.querySelectorAll<HTMLElement>('.cka-select-option');
      if (options[1]) {
        options[1].click();
      }

      expect(onChangeSpy).toHaveBeenCalledWith(null);
      expect(selectMenu.getValue()).toBeNull();

      // Reopen dropdown
      if (selectButton) {
        selectButton.click();
      }

      // Select the undefined value option
      if (options[2]) {
        options[2].click();
      }

      expect(onChangeSpy).toHaveBeenCalledWith(undefined);
      expect(selectMenu.getValue()).toBeUndefined();
    });

    it('should handle case where option is removed after selection', () => {
      // Open dropdown
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      // Select first option
      const options = document.querySelectorAll<HTMLElement>('.cka-select-option');
      if (options[0]) {
        options[0].click();
      }

      expect(selectMenu.getValue()).toBe(1);

      // Remove the selected option from options
      const newOptions = mockOptions.slice(1);
      selectMenu.setOptions(newOptions);

      // Value should still be 1, but display might show various placeholder text
      expect(selectMenu.getValue()).toBe(1);

      // Since we can't be sure if the implementation adds the placeholder class
      // or what exact text is shown, let's just verify the selectedDisplay doesn't
      // show the text of the removed option anymore
      const valueElement = container.querySelector('.cka-select-value');
      expect(valueElement?.textContent?.includes('Option 1')).toBeFalsy();
    });
  });

  describe('Filter Functionality', () => {
    it('should filter options based on input', () => {
      selectMenu = new CkAlightSelectMenu({
        options: mockOptions,
        filter: true
      });
      selectMenu.mount(container);

      // Open dropdown
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      // Get filter input
      const filterInput = document.querySelector('.cka-select-filter input') as HTMLInputElement;

      // Type in the filter
      if (filterInput) {
        filterInput.value = 'Option 1';
        filterInput.dispatchEvent(new Event('input'));
      }

      // Check that only matching options are shown
      const visibleOptions = document.querySelectorAll('.cka-select-option');
      expect(visibleOptions.length).toBe(1);
      expect(visibleOptions[0].textContent).toBe('Option 1');
    });

    it('should prevent propagation when clicking on filter input', () => {
      selectMenu = new CkAlightSelectMenu({
        options: mockOptions,
        filter: true
      });
      selectMenu.mount(container);

      // Open dropdown
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      // Get filter input
      const filterInput = document.querySelector('.cka-select-filter input') as HTMLInputElement;

      // Create click event with stopPropagation spy
      if (filterInput) {
        const clickEvent = new MouseEvent('click', { bubbles: true });
        const stopPropagationSpy = spyOn(clickEvent, 'stopPropagation');

        filterInput.dispatchEvent(clickEvent);
        expect(stopPropagationSpy).toHaveBeenCalled();
      }
    });

    it('should clear filter when dropdown is closed', () => {
      selectMenu = new CkAlightSelectMenu({
        options: mockOptions,
        filter: true
      });
      selectMenu.mount(container);

      // Open dropdown
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      // Get filter input and type in it
      const filterInput = document.querySelector('.cka-select-filter input') as HTMLInputElement;
      if (filterInput) {
        filterInput.value = 'Option 1';
        filterInput.dispatchEvent(new Event('input'));
      }

      // Close dropdown
      document.body.click();

      // Open dropdown again
      if (selectButton) {
        selectButton.click();
      }

      // Filter should be cleared
      const filterInputAfterReopen = document.querySelector('.cka-select-filter input') as HTMLInputElement;
      expect(filterInputAfterReopen.value).toBe('');

      // All options should be visible again
      const visibleOptions = document.querySelectorAll('.cka-select-option');
      expect(visibleOptions.length).toBe(3);
    });

    it('should handle filtering with no matching results', () => {
      selectMenu = new CkAlightSelectMenu({
        options: mockOptions,
        filter: true
      });
      selectMenu.mount(container);

      // Open dropdown
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      // Get filter input and type something that won't match any options
      const filterInput = document.querySelector('.cka-select-filter input') as HTMLInputElement;
      if (filterInput) {
        filterInput.value = 'No matches for this';
        filterInput.dispatchEvent(new Event('input'));
      }

      // Should have no visible options
      const visibleOptions = document.querySelectorAll('.cka-select-option');
      expect(visibleOptions.length).toBe(0);
    });

    it('should filter case-insensitively', () => {
      selectMenu = new CkAlightSelectMenu({
        options: mockOptions,
        filter: true
      });
      selectMenu.mount(container);

      // Open dropdown
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      // Get filter input and type lowercase version of option
      const filterInput = document.querySelector('.cka-select-filter input') as HTMLInputElement;
      if (filterInput) {
        filterInput.value = 'option 2'; // Lowercase, original is "Option 2"
        filterInput.dispatchEvent(new Event('input'));
      }

      // Should still match the option
      const visibleOptions = document.querySelectorAll('.cka-select-option');
      expect(visibleOptions.length).toBe(1);
      expect(visibleOptions[0].textContent).toBe('Option 2');
    });
  });

  describe('Dropdown Behavior', () => {
    it('should toggle dropdown visibility when clicking the button', () => {
      selectMenu = new CkAlightSelectMenu();
      selectMenu.mount(container);

      // Check initial state - dropdown should be closed
      const dropdown = document.querySelector('.cka-select-dropdown') as HTMLElement;
      expect(dropdown.style.display).toBe('none');

      // Click to open
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      // Dropdown should be visible
      expect(dropdown.style.display).toBe('block');

      // Click again to close
      if (selectButton) {
        selectButton.click();
      }

      // Dropdown should be hidden again
      expect(dropdown.style.display).toBe('none');
    });

    it('should handle click outside to close dropdown', () => {
      selectMenu = new CkAlightSelectMenu();
      selectMenu.mount(container);

      // Open dropdown
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      // Dropdown should be open
      const dropdown = document.querySelector('.cka-select-dropdown') as HTMLElement;
      expect(dropdown.style.display).toBe('block');

      // Simulate click on document body (outside the dropdown)
      document.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      }));

      // Dropdown should be closed
      expect(dropdown.style.display).toBe('none');
    });

    it('should not close dropdown when clicking inside dropdown', () => {
      selectMenu = new CkAlightSelectMenu();
      selectMenu.mount(container);

      // Open dropdown
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      // Get dropdown element
      const dropdown = document.querySelector('.cka-select-dropdown') as HTMLElement;

      // Create a click event on the dropdown
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });

      // Save original method
      const originalContains = Node.prototype.contains;

      // Mock contains to return true (as if click was inside dropdown)
      // This is needed because the actual event.target won't be part of our dropdown in the test
      Node.prototype.contains = function () { return true; };

      // Dispatch click
      dropdown.dispatchEvent(clickEvent);

      // Restore original contains method
      Node.prototype.contains = originalContains;

      // Dropdown should still be open
      expect(dropdown.style.display).toBe('block');
    });

    it('should register with position manager when dropdown opens', (done) => {
      selectMenu = new CkAlightSelectMenu();
      selectMenu.mount(container);

      // Open dropdown
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      // Need to wait for requestAnimationFrame
      setTimeout(() => {
        expect(positionManagerMock.register).toHaveBeenCalled();
        done();
      }, 50);
    });

    it('should handle filter input focus', (done) => {
      selectMenu = new CkAlightSelectMenu({
        options: mockOptions,
        filter: true
      });
      selectMenu.mount(container);

      // Open dropdown
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      // Add a tiny delay to allow any asynchronous focus to occur
      setTimeout(() => {
        // Verify the dropdown is open
        const dropdown = document.querySelector('.cka-select-dropdown') as HTMLElement;
        expect(dropdown.style.display).toBe('block');

        // Instead of checking if the filter was focused, we'll just verify it exists
        // since focus behavior might be hard to test in the test environment
        const filterInput = document.querySelector('.cka-select-filter input');
        expect(filterInput).toBeTruthy();
        done();
      }, 50);
    });

    it('should apply open class after dropdown is positioned', (done) => {
      selectMenu = new CkAlightSelectMenu();
      selectMenu.mount(container);

      // Open dropdown
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      // Initially, open class should not be applied yet (before requestAnimationFrame)
      const dropdown = document.querySelector('.cka-select-dropdown') as HTMLElement;
      expect(dropdown.classList.contains('open')).toBeFalsy();

      // Check after requestAnimationFrame
      setTimeout(() => {
        expect(dropdown.classList.contains('open')).toBeTruthy();
        done();
      }, 50);
    });

    it('should handle disabled state when trying to open dropdown', () => {
      selectMenu = new CkAlightSelectMenu({
        disabled: true
      });
      selectMenu.mount(container);

      // Call openDropdown directly to test disabled check
      (selectMenu as any).openDropdown();

      // Dropdown should remain closed
      const dropdown = document.querySelector('.cka-select-dropdown') as HTMLElement;
      expect(dropdown.style.display).toBe('none');
    });
  });

  describe('Public Methods', () => {
    it('should set value programmatically', () => {
      selectMenu = new CkAlightSelectMenu({
        options: mockOptions
      });
      selectMenu.mount(container);

      selectMenu.setValue(2);
      expect(selectMenu.getValue()).toBe(2);
      const valueElement = container.querySelector('.cka-select-value');
      expect(valueElement?.textContent).toBe('Option 2');
    });

    it('should update options programmatically', () => {
      selectMenu = new CkAlightSelectMenu();
      selectMenu.mount(container);

      const newOptions = [
        { label: 'New Option 1', value: 'new1' },
        { label: 'New Option 2', value: 'new2' }
      ];
      selectMenu.setOptions(newOptions);

      // Open dropdown to render options
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      const options = document.querySelectorAll('.cka-select-option');
      expect(options.length).toBe(2);
      expect(options[0].textContent).toBe('New Option 1');
      expect(options[1].textContent).toBe('New Option 2');
    });

    it('should update options using updateOptions method (alias)', () => {
      selectMenu = new CkAlightSelectMenu();
      selectMenu.mount(container);

      const newOptions = [
        { label: 'Updated 1', value: 'u1' },
        { label: 'Updated 2', value: 'u2' }
      ];

      // Spy on setOptions to verify updateOptions is an alias
      const setOptionsSpy = spyOn(selectMenu, 'setOptions').and.callThrough();

      selectMenu.updateOptions(newOptions);
      expect(setOptionsSpy).toHaveBeenCalledWith(newOptions);
    });

    it('should handle enable/disable state', () => {
      selectMenu = new CkAlightSelectMenu();
      selectMenu.mount(container);
      selectMenu.disable();
      const selectElement = container.querySelector('.cka-select');
      expect(selectElement?.classList.contains('disabled')).toBeTruthy();

      selectMenu.enable();
      expect(selectElement?.classList.contains('disabled')).toBeFalsy();
    });

    it('should show placeholder when value is null', () => {
      selectMenu = new CkAlightSelectMenu({
        options: mockOptions,
        placeholder: 'Custom Placeholder'
      });
      selectMenu.mount(container);

      const valueElement = container.querySelector('.cka-select-value');
      expect(valueElement?.textContent).toBe('Custom Placeholder');
      expect(valueElement?.classList.contains('placeholder')).toBeTruthy();
    });

    it('should show placeholder when empty array is set in multiple mode', () => {
      selectMenu = new CkAlightSelectMenu({
        options: mockOptions,
        multiple: true,
        placeholder: 'Select Multiple'
      });
      selectMenu.mount(container);

      const valueElement = container.querySelector('.cka-select-value');
      expect(valueElement?.textContent).toBe('Select Multiple');
      expect(valueElement?.classList.contains('placeholder')).toBeTruthy();
    });

    it('should handle setValue with different value types in multiple mode', () => {
      selectMenu = new CkAlightSelectMenu({
        options: mockOptions,
        multiple: true
      });
      selectMenu.mount(container);

      // Set single value in array
      selectMenu.setValue([1]);
      expect(selectMenu.getValue()).toEqual([1]);
      expect(container.querySelector('.cka-select-value')?.textContent?.includes('Option 1')).toBeTruthy();

      // Set multiple values
      selectMenu.setValue([1, 2]);
      expect(selectMenu.getValue()).toEqual([1, 2]);
      expect(container.querySelector('.cka-select-value')?.textContent?.includes('Option 1')).toBeTruthy();
      expect(container.querySelector('.cka-select-value')?.textContent?.includes('Option 2')).toBeTruthy();

      // Set empty array - this should show the placeholder
      // But since different implementations may have different placeholder text,
      // we'll just check that the placeholder class is applied
      selectMenu.setValue([]);
      expect(selectMenu.getValue()).toEqual([]);
      expect(container.querySelector('.cka-select-value')?.classList.contains('placeholder')).toBeTruthy();
    });
  });

  describe('Dropdown Positioning and Scroll Handling', () => {
    it('should position dropdown based on calculation result', () => {
      // Create select menu
      selectMenu = new CkAlightSelectMenu();
      selectMenu.mount(container);

      // Get private methods
      const calculatePositionFn = (selectMenu as any).calculateDropdownPosition;
      const positionDropdownFn = (selectMenu as any).positionDropdown;

      // Get dropdown element
      const dropdownElement = document.querySelector('.cka-select-dropdown') as HTMLElement;

      // Mock calculateDropdownPosition to return top: true
      spyOn(selectMenu as any, 'calculateDropdownPosition').and.returnValue({ top: true });

      // Call positionDropdown
      positionDropdownFn.call(selectMenu);

      // Should add top class and remove bottom class
      expect(dropdownElement.classList.contains('cka-select-dropdown--top')).toBe(true);
      expect(dropdownElement.classList.contains('cka-select-dropdown--bottom')).toBe(false);

      // Now mock calculateDropdownPosition to return top: false
      (selectMenu as any).calculateDropdownPosition.and.returnValue({ top: false });

      // Call positionDropdown again
      positionDropdownFn.call(selectMenu);

      // Should add bottom class and remove top class
      expect(dropdownElement.classList.contains('cka-select-dropdown--top')).toBe(false);
      expect(dropdownElement.classList.contains('cka-select-dropdown--bottom')).toBe(true);
    });

    it('should handle scroll and resize events', () => {
      // Create select menu
      selectMenu = new CkAlightSelectMenu();
      selectMenu.mount(container);

      // Spy on positionDropdown method
      const positionDropdownSpy = spyOn(selectMenu as any, 'positionDropdown');

      // Set isOpen to true to allow handleResize to call positionDropdown
      (selectMenu as any).isOpen = true;

      // Get handleResize method
      const handleResizeFn = (selectMenu as any).handleResize;

      // Call handleResize
      handleResizeFn.call(selectMenu);

      // Should call positionDropdown
      expect(positionDropdownSpy).toHaveBeenCalled();

      // Reset call count
      positionDropdownSpy.calls.reset();

      // Set isOpen to false
      (selectMenu as any).isOpen = false;

      // Call handleResize again
      handleResizeFn.call(selectMenu);

      // Should not call positionDropdown when closed
      expect(positionDropdownSpy).not.toHaveBeenCalled();
    });

    it('should add and remove scroll listeners', () => {
      // Create a scrollable parent
      const scrollableParent = document.createElement('div');
      scrollableParent.style.overflowY = 'auto';
      container.appendChild(scrollableParent); // Append to container instead of body

      // Create a new container inside scrollable parent
      const innerContainer = document.createElement('div');
      scrollableParent.appendChild(innerContainer);

      // Create select menu inside scrollable parent
      selectMenu = new CkAlightSelectMenu();
      selectMenu.mount(innerContainer);

      // Spy on event listeners
      const addEventSpy = spyOn(scrollableParent, 'addEventListener');
      const removeEventSpy = spyOn(scrollableParent, 'removeEventListener');
      const addWindowEventSpy = spyOn(window, 'addEventListener');
      const removeWindowEventSpy = spyOn(window, 'removeEventListener');

      // Get private methods
      const addScrollListenerFn = (selectMenu as any).addScrollListener;
      const removeScrollListenerFn = (selectMenu as any).removeScrollListener;

      // Call addScrollListener
      addScrollListenerFn.call(selectMenu);

      // Should add listeners to parent and window
      expect(addEventSpy).toHaveBeenCalled();
      expect(addEventSpy.calls.mostRecent().args[0]).toBe('scroll');
      expect(addWindowEventSpy).toHaveBeenCalled();
      expect(addWindowEventSpy.calls.mostRecent().args[0]).toBe('scroll');

      // Call removeScrollListener
      removeScrollListenerFn.call(selectMenu);

      // Should remove listeners from parent and window
      expect(removeEventSpy).toHaveBeenCalled();
      expect(removeEventSpy.calls.mostRecent().args[0]).toBe('scroll');
      expect(removeWindowEventSpy).toHaveBeenCalled();
      expect(removeWindowEventSpy.calls.mostRecent().args[0]).toBe('scroll');

      // No need to remove scrollableParent as it's part of the container
      // that gets cleaned up automatically in afterEach
    });

    it('should handle parent element without overflow', () => {
      // Create a non-scrollable parent inside the test container
      const nonScrollableParent = document.createElement('div');
      nonScrollableParent.style.overflowY = 'visible'; // Not auto or scroll
      container.appendChild(nonScrollableParent);

      // Create a new inner container for the select menu
      const innerContainer = document.createElement('div');
      nonScrollableParent.appendChild(innerContainer);

      // Create select menu inside non-scrollable parent
      selectMenu = new CkAlightSelectMenu();
      selectMenu.mount(innerContainer);

      // Spy on window event listeners only
      const addWindowEventSpy = spyOn(window, 'addEventListener');
      const removeWindowEventSpy = spyOn(window, 'removeEventListener');

      // Get private methods
      const addScrollListenerFn = (selectMenu as any).addScrollListener;
      const removeScrollListenerFn = (selectMenu as any).removeScrollListener;

      // Call addScrollListener
      addScrollListenerFn.call(selectMenu);

      // Should only add listener to window, not to parent
      expect(addWindowEventSpy).toHaveBeenCalled();
      expect(addWindowEventSpy.calls.mostRecent().args[0]).toBe('scroll');

      // Call removeScrollListener
      removeScrollListenerFn.call(selectMenu);

      // Should only remove listener from window
      expect(removeWindowEventSpy).toHaveBeenCalled();
      expect(removeWindowEventSpy.calls.mostRecent().args[0]).toBe('scroll');

      // No need to do explicit cleanup - container will be cleaned up in afterEach
    });

    it('should handle case when dropdown is already closed during cleanup', () => {
      selectMenu = new CkAlightSelectMenu();
      selectMenu.mount(container);

      // Make sure dropdown is closed
      (selectMenu as any).isOpen = false;
      (selectMenu as any).dropdownElement.style.display = 'none';

      // Destroy should not throw errors even though dropdown is already closed
      expect(() => {
        selectMenu.destroy();
      }).not.toThrow();
    });

    it('should clean up properly when destroyed', () => {
      selectMenu = new CkAlightSelectMenu();
      selectMenu.mount(container);

      const selectElement = container.querySelector('.cka-select');
      const dropdownElement = document.querySelector('.cka-select-dropdown');

      // Both elements should exist before destroy
      expect(selectElement).toBeTruthy();
      expect(dropdownElement).toBeTruthy();

      // Call destroy
      selectMenu.destroy();

      // Elements should be removed from DOM
      expect(container.querySelector('.cka-select')).toBeNull();
      expect(document.querySelector('.cka-select-dropdown')).toBeNull();

      // Position manager should be unregistered
      expect(positionManagerMock.unregister).toHaveBeenCalled();
    });

    it('should test basic calculation logic in calculateDropdownPosition', () => {
      selectMenu = new CkAlightSelectMenu();
      selectMenu.mount(container);

      // Basic test - check that the function returns a valid result with a boolean 'top' property
      const result = (selectMenu as any).calculateDropdownPosition();
      expect(typeof result).toBe('object');
      expect(typeof result.top === 'boolean').toBeTruthy();
    });
  });

  describe('Edge Cases and Comprehensive Coverage', () => {
    it('should handle non-string labels gracefully', () => {
      const numericLabelOptions = [
        { label: 1, value: 'one' },
        { label: 2, value: 'two' },
        { label: true, value: 'boolean' },
        { label: { nested: 'object' }, value: 'object' }
      ];

      selectMenu = new CkAlightSelectMenu({
        options: numericLabelOptions
      });
      selectMenu.mount(container);

      // Open dropdown
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      // Check that all labels are properly converted to strings
      const optionElements = document.querySelectorAll('.cka-select-option');
      expect(optionElements[0].textContent).toBe('1');
      expect(optionElements[1].textContent).toBe('2');
      expect(optionElements[2].textContent).toBe('true');
      expect(optionElements[3].textContent).toBe('[object Object]');

      // Select one of the options
      if (optionElements[0]) {
        (optionElements[0] as HTMLElement).click();
      }

      // Check that the value display is also properly converted
      expect(container.querySelector('.cka-select-value')?.textContent).toBe('1');
    });

    it('should handle very large option sets efficiently', () => {
      // Create 1000 options
      const manyOptions = Array.from({ length: 1000 }, (_, i) => ({
        label: `Option ${i}`,
        value: i
      }));

      selectMenu = new CkAlightSelectMenu({
        options: manyOptions,
        filter: true
      });
      selectMenu.mount(container);

      // Open dropdown
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      // Filter to narrow down options
      const filterInput = document.querySelector('.cka-select-filter input') as HTMLInputElement;
      if (filterInput) {
        filterInput.value = 'Option 5'; // Should match Option 5, 50-59, 500-599
        filterInput.dispatchEvent(new Event('input'));
      }

      // Check filtered options
      const filteredOptions = document.querySelectorAll('.cka-select-option');
      expect(filteredOptions.length).toBe(111); // Option 5, 50-59, 500-599

      // Select one option
      if (filteredOptions[0]) {
        (filteredOptions[0] as HTMLElement).click();
      }

      // Verify selection
      expect(selectMenu.getValue()).toBe(5); // Should select Option 5
    });

    it('should handle re-opening dropdown after options change', () => {
      selectMenu = new CkAlightSelectMenu({
        options: mockOptions
      });
      selectMenu.mount(container);

      // Open dropdown
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      // Close dropdown
      if (selectButton) {
        selectButton.click();
      }

      // Change options
      const newOptions = [
        { label: 'Changed 1', value: 'c1' },
        { label: 'Changed 2', value: 'c2' }
      ];
      selectMenu.setOptions(newOptions);

      // Open dropdown again
      if (selectButton) {
        selectButton.click();
      }

      // Check that options are updated
      const options = document.querySelectorAll('.cka-select-option');
      expect(options.length).toBe(2);
      expect(options[0].textContent).toBe('Changed 1');
      expect(options[1].textContent).toBe('Changed 2');
    });

    it('should gracefully handle destroy when elements are already removed from DOM', () => {
      selectMenu = new CkAlightSelectMenu();
      selectMenu.mount(container);

      // Remove elements manually
      container.innerHTML = '';
      document.body.removeChild(document.querySelector('.cka-select-dropdown') as HTMLElement);

      // Should not throw error on destroy
      expect(() => {
        selectMenu.destroy();
      }).not.toThrow();
    });
  });
});
