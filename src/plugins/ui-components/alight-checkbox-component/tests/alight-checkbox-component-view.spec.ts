// src/plugins/ui-components/alight-checkbox-component/tests/alight-checkbox-component-view.spec.ts
import view from '@ckeditor/ckeditor5-ui/src/view';
import locale from '@ckeditor/ckeditor5-utils/src/locale';
import { CheckboxView } from '../alight-checkbox-component-view';
import { Locale } from '@ckeditor/ckeditor5-utils';

describe('CheckboxView', () => {
  let locale: Locale;
  let view: CheckboxView;

  beforeEach(() => {
    locale = new Locale();
    view = new CheckboxView(locale);
    view.render();
    document.body.appendChild(view.element!);
  });

  afterEach(() => {
    view.element?.remove();
    view.destroy();
  });

  describe('constructor()', () => {
    it('should create instance with default values', () => {
      expect(view.isChecked).toBeFalse();
      expect(view.isEnabled).toBeTrue();
      expect(view.label).toBe('');
      expect(view.tabindex).toBe('0');
    });

    it('should create with proper template structure', () => {
      expect(view.element?.tagName.toLowerCase()).toBe('label');
      expect(view.element?.classList.contains('ck')).toBeTrue();
      expect(view.element?.classList.contains('ck-checkbox')).toBeTrue();

      const input = view.element?.querySelector('input');
      expect(input?.type).toBe('checkbox');
      expect(input?.classList.contains('ck-input')).toBeTrue();

      const label = view.element?.querySelector('.ck-checkbox__label');
      expect(label).toBeTruthy();
    });
  });

  describe('render()', () => {
    it('should set up proper DOM bindings', (done) => {
      const input = view.element?.querySelector('input');

      // Test isChecked binding
      view.set('isChecked', true);

      setTimeout(() => {
        expect(input?.getAttribute('aria-checked')).toBe('true');
        expect(view.element?.classList.contains('ck-checked')).toBeTrue();

        view.set('isChecked', false);
        expect(input?.getAttribute('aria-checked')).toBe('false');
        expect(view.element?.classList.contains('ck-checked')).toBeFalse();

        // Test label binding
        const testLabel = 'Test Label';
        view.set('label', testLabel);
        expect(input?.getAttribute('aria-label')).toBe(testLabel);
        expect(view.element?.querySelector('.ck-checkbox__label')?.textContent).toBe(testLabel);

        // Test isEnabled binding
        view.set('isEnabled', false);
        expect(view.element?.classList.contains('ck-disabled')).toBeTrue();

        view.set('isEnabled', true);
        expect(view.element?.classList.contains('ck-enabled')).toBeTrue();

        done();
      }, 0);
    });
  });

  describe('execute event', () => {
    ew.on('execute', executeSpy);

    view.set('isEnabled', true);
    view.element?.click();

    expect(executeSpy).toHaveBeenCalled();
    expect(view.isChecked).toBeTrue();
  });

  it('should not fire execute or toggle isChecked when disabled', () => {
    const executeSpy = jasmine.createSpy('execute');
    view.on('execute', executeSpy);

    view.set('isEnabled', false);
    view.element?.click();

    expect(executeSpy).not.toHaveBeenCalled();
    expect(view.isChecked).toBeFalse();
  });
});

describe('focus()', () => {
  it('should focus view element', () => {
    view.focus();
    expect(document.activeElement).toBe(view.element);
  });

  it('should handle null element gracefully', () => {
    const viewWithoutElement = new CheckboxView(locale);
    expect(() => viewWithoutElement.focus()).not.toThrow();
  });

  it('should maintain focus after label change', () => {
    view.focus();
    view.set('label', 'New Label');
    expect(document.activeElement).toBe(view.element);
  });
});

describe('template bindings', () => {
  it('should update tabindex', () => {
    const newTabIndex = '1';
    view.set('tabindex', newTabIndex);
    expect(view.element?.getAttribute('tabindex')).toBe(newTabIndex);
  });

  it('should handle all observable property changes', () => {
    // Test all observable properties
    view.set({
      isChecked: true,
      label: 'New Label',
      tabindex: '2',
      isEnabled: false
    });

    expect(view.isChecked).toBeTrue();
    expect(view.label).toBe('New Label');
    expect(view.tabindex).toBe('2');
    expect(view.isEnabled).toBeFalse();

    const input = view.element?.querySelector('input');
    expect(input?.getAttribute('aria-checked')).toBe('true');
    expect(input?.getAttribute('aria-label')).toBe('New Label');
    expect(view.element?.getAttribute('tabindex')).toBe('2');
    expect(view.element?.classList.contains('ck-disabled')).toBeTrue();
  });
});

describe('destroy()', () => {
  it('should not throw when destroying unrendered view', () => {
    const newView = new CheckboxView(locale);
    expect(() => newView.destroy()).not.toThrow();
  });

  it('should clean up properly', () => {
    const element = view.element!;
    const parent = element.parentNode;
    view.destroy();
    expect(parent?.contains(element)).toBeFalse();
  });
});