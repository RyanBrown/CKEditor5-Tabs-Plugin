// src/plugins/alight-email-link-plugin/tests/linkactionsview.spec.ts
import LinkActionsView from './../ui/linkactionsview';
import { ButtonView } from 'ckeditor5/src/ui';
import { KeystrokeHandler } from 'ckeditor5/src/utils';

describe('LinkActionsView', () => {
  let view: LinkActionsView;
  let locale: any;

  beforeEach(() => {
    // Mock locale object with translate function
    locale = {
      t: (str: string) => str
    };

    view = new LinkActionsView(locale);
    view.render();
    document.body.appendChild(view.element);
  });

  afterEach(() => {
    view.element.remove();
    view.destroy();
  });

  describe('constructor()', () => {
    it('should create element from template', () => {
      expect(view.element.classList.contains('ck')).toBeTruthy();
      expect(view.element.classList.contains('ck-link-actions')).toBeTruthy();
      expect(view.element.classList.contains('ck-responsive-form')).toBeTruthy();
      expect(view.element.getAttribute('tabindex')).toBe('-1');
    });

    it('should create child views', () => {
      expect(view.previewButtonView).toBeInstanceOf(ButtonView);
      expect(view.editButtonView).toBeInstanceOf(ButtonView);
      expect(view.unlinkButtonView).toBeInstanceOf(ButtonView);
    });

    it('should create #previewButtonView', () => {
      const button = view.previewButtonView;

      expect(button).toBeInstanceOf(ButtonView);
      expect(button.withText).toBeTruthy();
      expect(button.tooltip).toBe('Open email link');

      // Should be link element
      expect(button.template.tag).toBe('a');

      // Should have proper CSS classes
      const element = button.element;
      expect(element.classList.contains('ck')).toBeTruthy();
      expect(element.classList.contains('ck-link-actions__preview')).toBeTruthy();

      // Initially disabled if no href
      expect(button.isEnabled).toBeFalsy();
    });

    it('should create #editButtonView', () => {
      const button = view.editButtonView;

      expect(button).toBeInstanceOf(ButtonView);
      expect(button.label).toBe('Edit link');
      expect(button.icon).toBeTruthy();
    });

    it('should create #unlinkButtonView', () => {
      const button = view.unlinkButtonView;

      expect(button).toBeInstanceOf(ButtonView);
      expect(button.label).toBe('Unlink');
      expect(button.icon).toBeTruthy();
    });

    it('should create #keystrokes instance', () => {
      expect(view.keystrokes).toBeInstanceOf(KeystrokeHandler);
    });
  });

  describe('render()', () => {
    // We can't directly test private _focusables, but we can test
    // that the button views are rendered in the element
    it('should render child views in the view', () => {
      const buttons = view.element.querySelectorAll('.ck-button');
      expect(buttons.length).toBe(3);
    });

    it('should register child views in #focusTracker', () => {
      expect(view.focusTracker.isFocused).toBeFalsy();

      // Test focus tracking with previewButtonView
      view.previewButtonView.element.dispatchEvent(new Event('focus'));
      expect(view.focusTracker.isFocused).toBeTruthy();
    });

    it('should start listening for #keystrokes coming from #element', () => {
      // Create a new view for this test
      const newView = new LinkActionsView(locale);

      // Spy on the new view's keystrokes
      spyOn(newView.keystrokes, 'listenTo');

      // Call render
      newView.render();

      // Verify the spy was called with the right element
      expect(newView.keystrokes.listenTo).toHaveBeenCalledWith(newView.element);

      // Clean up
      newView.destroy();
    });
  });

  describe('focus()', () => {
    it('should focus one of the buttons', () => {
      // Using Jasmine's spy approach
      const originalFocus = view.previewButtonView.element.focus;
      let focusCalled = false;

      // Create a spy for the focus method
      view.previewButtonView.element.focus = function () {
        focusCalled = true;
        // Call original if needed
        if (originalFocus) {
          originalFocus.call(this);
        }
      };

      // Call focus() which should eventually focus a button
      view.focus();

      // Check that focus was called (or will be in next tick)
      setTimeout(() => {
        expect(focusCalled).toBe(true);
        // Restore original function
        view.previewButtonView.element.focus = originalFocus;
      }, 10);
    });
  });

  describe('destroy()', () => {
    it('should destroy the #focusTracker instance', () => {
      // Using Jasmine spyOn
      spyOn(view.focusTracker, 'destroy');

      view.destroy();

      expect(view.focusTracker.destroy).toHaveBeenCalled();
    });

    it('should destroy the #keystrokes instance', () => {
      // Using Jasmine spyOn
      spyOn(view.keystrokes, 'destroy');

      view.destroy();

      expect(view.keystrokes.destroy).toHaveBeenCalled();
    });
  });

  describe('button delegates', () => {
    it('should delegate #editButtonView#execute to the view#edit event', () => {
      // Using Jasmine approach
      const spy = jasmine.createSpy('editHandler');
      view.on('edit', spy);

      view.editButtonView.fire('execute');

      expect(spy).toHaveBeenCalled();
    });

    it('should delegate #unlinkButtonView#execute to the view#unlink event', () => {
      // Using Jasmine approach
      const spy = jasmine.createSpy('unlinkHandler');
      view.on('unlink', spy);

      view.unlinkButtonView.fire('execute');

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('href and organization binding', () => {
    it('should update previewButtonView label when href changes (no organization)', () => {
      // Initially no URL message
      expect(view.previewButtonView.label).toBe('This link has no URL');

      view.set('href', 'mailto:test@example.com');

      expect(view.previewButtonView.label).toBe('test@example.com');
    });

    it('should update previewButtonView label when href changes (with organization)', () => {
      view.set({
        href: 'mailto:test@example.com',
        organization: 'Test Org'
      });

      expect(view.previewButtonView.label).toBe('test@example.com (Test Org)');
    });

    it('should update previewButtonView label when organization changes', () => {
      view.set({
        href: 'mailto:test@example.com'
      });

      expect(view.previewButtonView.label).toBe('test@example.com');

      view.set('organization', 'New Org');

      expect(view.previewButtonView.label).toBe('test@example.com (New Org)');
    });

    it('should update previewButtonView href attribute when href changes', () => {
      view.set('href', 'mailto:test@example.com');

      // We can't directly check the attribute as it's using bind.to
      // but we can verify the element href attribute
      expect(view.previewButtonView.element.getAttribute('href')).toBe('mailto:test@example.com');
    });

    it('should enable previewButtonView when href is set', () => {
      // Initially disabled
      expect(view.previewButtonView.isEnabled).toBeFalsy();

      view.set('href', 'mailto:test@example.com');

      expect(view.previewButtonView.isEnabled).toBeTruthy();
    });

    it('should disable previewButtonView when href is removed', () => {
      view.set('href', 'mailto:test@example.com');
      expect(view.previewButtonView.isEnabled).toBeTruthy();

      view.set('href', undefined);

      expect(view.previewButtonView.isEnabled).toBeFalsy();
    });

    it('should handle non-mailto href', () => {
      view.set('href', 'https://example.com');

      expect(view.previewButtonView.label).toBe('https://example.com');
    });
  });

  describe('URL safety', () => {
    it('should handle safe URLs', () => {
      view.set('href', 'mailto:test@example.com');

      expect(view.previewButtonView.element.getAttribute('href')).toBe('mailto:test@example.com');
    });

    it('should sanitize unsafe URLs', () => {
      view.set('href', 'javascript:alert(1)');

      // Should be converted to # by ensureSafeUrl
      expect(view.previewButtonView.element.getAttribute('href')).toBe('#');
    });
  });
});
