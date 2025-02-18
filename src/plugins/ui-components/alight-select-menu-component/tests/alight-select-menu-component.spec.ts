// src/plugins/ui-components/alight-select-menu-component/tests/alight-select-menu.spec.ts
import { CkAlightSelectMenu } from './../alight-select-menu-component';
import { AlightPositionManager } from './../../alight-ui-component-utils/alight-position-manager';

describe('CkAlightSelectMenu', () => {
  let selectMenu: CkAlightSelectMenu<any>;
  let container: HTMLDivElement;

  const mockOptions = [
    { label: 'Option 1', value: 1 },
    { label: 'Option 2', value: 2 },
    { label: 'Option 3', value: 3, disabled: true }
  ];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Mock AlightPositionManager
    spyOn(AlightPositionManager, 'getInstance').and.returnValue({
      register: jasmine.createSpy('register'),
      unregister: jasmine.createSpy('unregister')
    });
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
  });

  describe('Option Selection', () => {
    beforeEach(() => {
      selectMenu = new CkAlightSelectMenu({
        options: mockOptions
      });
      selectMenu.mount(container);
    });

    // it('should select a single option', () => {
    //   const onChangeSpy = jasmine.createSpy('onChange');
    //   selectMenu = new CkAlightSelectMenu({
    //     options: mockOptions,
    //     onChange: onChangeSpy
    //   });
    //   selectMenu.mount(container);
    //   // Open dropdown
    //   const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
    //   if (selectButton) {
    //     selectButton.click();
    //   }

    //   // Click first option
    //   const firstOption = document.querySelector<HTMLElement>('.cka-select-option');
    //   if (firstOption) {
    //     firstOption.click();
    //   }

    //   expect(onChangeSpy).toHaveBeenCalledWith(1);
    //   expect(selectMenu.getValue()).toBe(1);
    //   expect(container.querySelector('.cka-select-value')?.textContent).toBe('Option 1');
    // });

    // it('should handle multiple selection when multiple is true', () => {
    //   const onChangeSpy = jasmine.createSpy('onChange');
    //   selectMenu = new CkAlightSelectMenu({
    //     options: mockOptions,
    //     multiple: true,
    //     onChange: onChangeSpy
    //   });
    //   selectMenu.mount(container);
    //   // Open dropdown
    //   const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
    //   if (selectButton) {
    //     selectButton.click();
    //   }

    //   // Select multiple options
    //   const options = document.querySelectorAll<HTMLElement>('.cka-select-option');
    //   if (options[0]) {
    //     options[0].click();
    //   }
    //   options[1].click();

    //   expect(onChangeSpy).toHaveBeenCalledWith([1, 2]);
    //   expect(selectMenu.getValue()).toEqual([1, 2]);
    //   expect(container.querySelector('.cka-select-value')?.textContent).toBe('Option 1, Option 2');
    // });

    it('should not select disabled options', () => {
      const onChangeSpy = jasmine.createSpy('onChange');
      selectMenu = new CkAlightSelectMenu({
        options: mockOptions,
        onChange: onChangeSpy
      });
      selectMenu.mount(container);
      // Open dropdown
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }

      // Try to click disabled option
      const disabledOption = document.querySelectorAll<HTMLElement>('.cka-select-option')[2];
      if (disabledOption) {
        disabledOption.click();
      }

      expect(onChangeSpy).not.toHaveBeenCalled();
      expect(selectMenu.getValue()).toBeNull();
    });
  });

  // describe('Filter Functionality', () => {
  //   it('should filter options based on input', () => {
  //     selectMenu = new CkAlightSelectMenu({
  //       options: mockOptions,
  //       filter: true
  //     });
  //     selectMenu.mount(container);
  //     // Open dropdown
  //     const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
  //     if (selectButton) {
  //       selectButton.click();
  //     }

  //     const filterInput = document.querySelector('.cka-select-filter input') as HTMLInputElement;
  //     if (filterInput) {
  //       filterInput.value = 'Option 1';
  //       const event = new Event('input');
  //       filterInput.dispatchEvent(event);
  //     }

  //     const visibleOptions = document.querySelectorAll('.cka-select-option');
  //     expect(visibleOptions.length).toBe(1);
  //     expect(visibleOptions[0].textContent).toBe('Option 1');
  //   });
  // });

  describe('Public Methods', () => {
    it('should set value programmatically', () => {
      selectMenu = new CkAlightSelectMenu({
        options: mockOptions
      });
      selectMenu.mount(container);

      selectMenu.setValue(2);
      expect(selectMenu.getValue()).toBe(2);
      const selectValueElement = container.querySelector('.cka-select-value');
      if (selectValueElement) {
        expect(selectValueElement.textContent).toBe('Option 2');
      }
    });

    // it('should update options programmatically', () => {
    //   selectMenu = new CkAlightSelectMenu();
    //   selectMenu.mount(container);

    //   const newOptions = [
    //     { label: 'New Option 1', value: 'new1' },
    //     { label: 'New Option 2', value: 'new2' }
    //   ];
    //   selectMenu.setOptions(newOptions);
    //   const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
    //   if (selectButton) {
    //     selectButton.click();
    //   }

    //   const options = document.querySelectorAll('.cka-select-option');
    //   expect(options.length).toBe(2);
    //   expect(options[0].textContent).toBe('New Option 1');
    //   expect(options[1].textContent).toBe('New Option 2');
    // });

    it('should handle enable/disable state', () => {
      selectMenu = new CkAlightSelectMenu();
      selectMenu.mount(container);
      selectMenu.disable();
      const selectElement = container.querySelector('.cka-select');
      if (selectElement) {
        expect(selectElement.classList.contains('disabled')).toBeTruthy();
      }

      selectMenu.enable();
      if (selectElement) {
        expect(selectElement.classList.contains('disabled')).toBeFalsy();
      }
    });
  });

  describe('Dropdown Positioning', () => {
    // it('should register with position manager when opening dropdown', () => {
    //   selectMenu = new CkAlightSelectMenu();
    //   selectMenu.mount(container);

    //   const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
    //   if (selectButton) {
    //     selectButton.click();
    //   }

    //   expect(AlightPositionManager.getInstance().register).toHaveBeenCalled();
    // });

    it('should unregister with position manager when closing dropdown', () => {
      selectMenu = new CkAlightSelectMenu();
      selectMenu.mount(container);
      // Open and then close dropdown
      const selectButton = container.querySelector<HTMLElement>('.cka-select-button');
      if (selectButton) {
        selectButton.click();
      }
      document.body.click(); // Click outside to close

      expect(AlightPositionManager.getInstance().unregister).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup properly when destroyed', () => {
      selectMenu = new CkAlightSelectMenu();
      selectMenu.mount(container);

      selectMenu.destroy();

      expect(container.querySelector('.cka-select')).toBeNull();
      expect(document.querySelector('.cka-select-dropdown')).toBeNull();
      expect(AlightPositionManager.getInstance().unregister).toHaveBeenCalled();
    });
  });
});