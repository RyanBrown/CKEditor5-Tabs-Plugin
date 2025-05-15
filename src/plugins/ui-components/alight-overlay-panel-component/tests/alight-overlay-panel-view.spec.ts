// src/plugins/ui-components/alight-overlay-panel-component/tests/alight-overlay-panel-view.spec.ts
import { OverlayPanelView } from '../alight-overlay-panel-view';
import { keyCodes } from '@ckeditor/ckeditor5-utils/src/keyboard';
import { View } from '@ckeditor/ckeditor5-ui';

describe('OverlayPanelView', () => {
  let view: OverlayPanelView;
  let locale: any;
  let target: HTMLElement;

  beforeEach(() => {
    locale = {
      t: (str: string) => str,
      uiLanguageDirection: 'ltr'
    };

    view = new OverlayPanelView(locale);
    view.showCloseIcon = true;
    view.render();
    document.body.appendChild(view.element!);

    target = document.createElement('div');
    target.id = 'target';
    document.body.appendChild(target);
  });

  afterEach(() => {
    if (view.element && view.element.parentNode) {
      view.element.parentNode.removeChild(view.element);
    }

    if (target.parentNode) {
      target.parentNode.removeChild(target);
    }

    try {
      view.destroy();
    } catch (e) {
      // Ignore destroy errors in cleanup
    }
  });

  it('initializes with default values', () => {
    expect(view.isVisible).toBe(false);
    expect(view.position).toBe('auto');
    expect(view.dismissable).toBe(true);
    expect(view.showHeader).toBe(false);
    expect(view.autoZIndex).toBe(true);
    expect(view.baseZIndex).toBe(0);
    expect(view.showCloseIcon).toBe(true);
    expect(view.styleClass).toBe('');
  });

  it('updates when properties change', () => {
    // Test changing position
    view.position = 'top';
    expect(view.position).toBe('top');

    // Test changing dismissable
    view.dismissable = false;
    expect(view.dismissable).toBe(false);

    // Test changing showHeader
    view.showHeader = true;
    expect(view.showHeader).toBe(true);

    // Test changing styleClass
    view.styleClass = 'custom-class';
    expect(view.styleClass).toBe('custom-class');
  });

  it('shows the panel and fires beforeShow/show events', (done) => {
    const spy = spyOn(view, 'fire').and.callThrough();
    view.show({ targetElement: target });

    expect(view.isVisible).toBe(true);
    expect(spy).toHaveBeenCalledWith('beforeShow', jasmine.any(Object));

    setTimeout(() => {
      expect(spy).toHaveBeenCalledWith('show', jasmine.any(Object));
      done();
    }, 200);
  });

  it('shows the panel with custom position and offset', () => {
    // Test with position and offset options
    view.show({
      targetElement: target,
      position: 'top',
      offset: { x: 10, y: 20 }
    });

    expect(view.position).toBe('top');
    expect(view.isVisible).toBe(true);
  });

  it('handles initial render with visible state', () => {
    const viewInstance = new OverlayPanelView(locale);

    // Set visible before render
    viewInstance.isVisible = true;
    (viewInstance as any)._targetElement = target;

    // Render should call updatePosition
    viewInstance.render();

    // Clean up
    viewInstance.destroy();
  });

  it('can set panel title', () => {
    view.setTitle('Test Panel Title');

    const titleEl = view.element!.querySelector('.cka-overlay-panel__title') as HTMLElement;
    expect(titleEl.textContent).toBe('Test Panel Title');
  });

  it('skips setting title if element not found', () => {
    // This should not throw an error
    const viewWithoutElement = new OverlayPanelView(locale);
    viewWithoutElement.setTitle('Test Panel Title');

    // Clean up
    viewWithoutElement.destroy();
  });

  it('skips setting title if title element not found', () => {
    // Create a view with element but without the expected structure
    const viewWithoutTitleEl = new OverlayPanelView(locale);
    const mockElement = document.createElement('div');
    (viewWithoutTitleEl as any).element = mockElement;

    // This should not throw an error
    viewWithoutTitleEl.setTitle('Test Panel Title');

    // Clean up
    viewWithoutTitleEl.destroy();
  });

  it('handles show with animation in progress', () => {
    // Set animating flag directly
    (view as any)._animating = true;

    const fireSpy = spyOn(view, 'fire');

    view.show({ targetElement: target });

    // Should not proceed with showing
    expect(fireSpy).not.toHaveBeenCalled();

    // Reset for cleanup
    (view as any)._animating = false;
  });

  it('hides the panel and fires hide event', (done) => {
    const fireSpy = spyOn(view, 'fire').and.callThrough();
    view.show({ targetElement: target });

    setTimeout(() => {
      view.hide();

      expect(fireSpy).toHaveBeenCalledWith('beforeHide', jasmine.any(Object));

      setTimeout(() => {
        expect(view.isVisible).toBe(false);
        expect(fireSpy).toHaveBeenCalledWith('hide', jasmine.any(Object));
        done();
      }, 200); // Wait for _animateOut (150ms + buffer)
    }, 160);
  });

  it('handles hide when not visible', () => {
    // Ensure panel is not visible
    view.set('isVisible', false);

    const fireSpy = spyOn(view, 'fire');

    view.hide();

    // Should not trigger events when already hidden
    expect(fireSpy).not.toHaveBeenCalled();
  });

  it('handles hide with animation in progress', () => {
    view.show({ targetElement: target });

    // Set animating flag directly
    (view as any)._animating = true;

    const fireSpy = spyOn(view, 'fire');

    view.hide();

    // Should not proceed with hiding
    expect(fireSpy).not.toHaveBeenCalled();

    // Reset for cleanup
    (view as any)._animating = false;
  });

  it('toggles panel visibility', () => {
    // Create a new view for this test
    const toggleView = new OverlayPanelView(locale);
    toggleView.render();
    document.body.appendChild(toggleView.element!);

    try {
      // Spy on hide
      const hideSpy = spyOn(toggleView, 'hide').and.callThrough();

      // First toggle should show
      toggleView.toggle(target);
      expect(toggleView.isVisible).toBe(true);

      // Second toggle with same target should hide
      toggleView.toggle(target);
      expect(hideSpy).toHaveBeenCalled();

      // Show again
      toggleView.show({ targetElement: target });
      hideSpy.calls.reset();

      // Create different target
      const newTarget = document.createElement('div');
      document.body.appendChild(newTarget);

      // Toggle with event parameter
      const event = new MouseEvent('click');
      toggleView.toggle(newTarget, event);

      // Should still be visible but with new target
      expect(toggleView.isVisible).toBe(true);

      // Clean up
      newTarget.remove();
    } finally {
      if (toggleView.element && toggleView.element.parentNode) {
        toggleView.element.parentNode.removeChild(toggleView.element);
      }
      toggleView.destroy();
    }
  });

  it('dismisses on outside click when dismissable is true', (done) => {
    const hideSpy = spyOn(view, 'hide').and.callThrough();
    view.show({ targetElement: target });

    setTimeout(() => {
      const outside = document.createElement('div');
      document.body.appendChild(outside);

      const event = new MouseEvent('mousedown', { bubbles: true });
      outside.dispatchEvent(event);

      setTimeout(() => {
        expect(hideSpy).toHaveBeenCalled();
        outside.remove();
        done();
      }, 50);
    }, 160);
  });

  it('does not dismiss on outside click when dismissable is false', () => {
    const hideSpy = spyOn(view, 'hide');
    view.dismissable = false;
    view.show({ targetElement: target });

    const outside = document.createElement('div');
    document.body.appendChild(outside);
    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(hideSpy).not.toHaveBeenCalled();
    outside.remove();
  });

  it('does not dismiss on outside click when animation is in progress', () => {
    const hideSpy = spyOn(view, 'hide');
    view.show({ targetElement: target });

    // Set animating flag directly
    (view as any)._animating = true;

    const outside = document.createElement('div');
    document.body.appendChild(outside);
    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(hideSpy).not.toHaveBeenCalled();
    outside.remove();

    // Reset for cleanup
    (view as any)._animating = false;
  });

  it('dismisses on escape key press', () => {
    const hideSpy = spyOn(view, 'hide');
    view.show({ targetElement: target });

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(event);

    expect(hideSpy).toHaveBeenCalled();
  });

  it('does not handle escape key when not visible', () => {
    const hideSpy = spyOn(view, 'hide');

    // Make sure panel is not visible
    view.set('isVisible', false);

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(event);

    expect(hideSpy).not.toHaveBeenCalled();
  });

  it('does not dismiss on escape when dismissable is false', () => {
    const hideSpy = spyOn(view, 'hide');
    view.show({ targetElement: target });

    // Set dismissable to false
    view.dismissable = false;

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(event);

    expect(hideSpy).not.toHaveBeenCalled();
  });

  it('handles window resize events', () => {
    // Create a new view for this test to avoid interference
    const resizeView = new OverlayPanelView(locale);
    resizeView.render();
    document.body.appendChild(resizeView.element!);

    try {
      // Show the panel
      resizeView.show({ targetElement: target });

      // We can't spy on the private method directly, so mock the set method
      const isVisibleSpy = spyOn(resizeView, 'set').and.callThrough();

      // Dispatch window resize event
      window.dispatchEvent(new Event('resize'));

      // The panel should still be visible after resize
      expect(resizeView.isVisible).toBe(true);
    } finally {
      // Clean up
      if (resizeView.element && resizeView.element.parentNode) {
        resizeView.element.parentNode.removeChild(resizeView.element);
      }
      resizeView.destroy();
    }
  });

  it('sets z-index when autoZIndex is true', () => {
    view.baseZIndex = 1000;
    view.autoZIndex = true;
    view.show({ targetElement: target });

    expect(+view.element!.style.zIndex!).toBeGreaterThanOrEqual(1000);
  });

  it('sets baseZIndex when provided', () => {
    view.baseZIndex = 1000;
    view.autoZIndex = false;
    view.show({ targetElement: target });

    // The element should have some z-index set
    expect(view.element!.style.zIndex).not.toBe('');
  });

  it('handles missing element during show', () => {
    // Create view without element
    const viewWithoutEl = new OverlayPanelView(locale);

    // This should not throw error
    viewWithoutEl.show({ targetElement: target });

    // Clean up
    viewWithoutEl.destroy();
  });

  it('handles missing element during updatePosition', () => {
    // Create view without element
    const viewWithoutEl = new OverlayPanelView(locale);
    (viewWithoutEl as any)._targetElement = target;

    // This should not throw error
    (viewWithoutEl as any)._updatePosition();

    // Clean up
    viewWithoutEl.destroy();
  });

  it('renders close icon when showCloseIcon is true', () => {
    const icon = view.element!.querySelector('.cka-overlay-panel__close-icon') as HTMLElement;
    expect(icon).toBeTruthy();
    expect(icon.style.display).not.toBe('none');
  });

  it('hides close icon when showCloseIcon is false', () => {
    view.showCloseIcon = false;

    const icon = view.element!.querySelector('.cka-overlay-panel__close-icon') as HTMLElement;
    expect(icon.style.display).toBe('none');
  });

  it('skips updating close icon if element not found', () => {
    // This should not throw an error
    const viewWithoutElement = new OverlayPanelView(locale);
    viewWithoutElement.showCloseIcon = false;

    // Clean up
    viewWithoutElement.destroy();
  });

  it('skips updating close icon if close icon not found', () => {
    // Create view with element but without close icon
    const viewWithoutCloseIcon = new OverlayPanelView(locale);
    const mockElement = document.createElement('div');
    (viewWithoutCloseIcon as any).element = mockElement;

    // This should not throw an error
    viewWithoutCloseIcon.showCloseIcon = false;

    // Clean up
    viewWithoutCloseIcon.destroy();
  });

  it('appends to specific container when appendTo is provided', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    view.show({
      targetElement: target,
      appendTo: container
    });

    expect(container.contains(view.element!)).toBe(true);

    container.remove();
  });

  it('appends to body when appendTo is "body"', () => {
    view.show({
      targetElement: target,
      appendTo: 'body'
    });

    expect(document.body.contains(view.element!)).toBe(true);
  });

  it('returns to original parent when hidden', (done) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const originalParent = view.element!.parentElement;

    view.show({
      targetElement: target,
      appendTo: container
    });

    expect(container.contains(view.element!)).toBe(true);

    view.hide();

    setTimeout(() => {
      expect(originalParent!.contains(view.element!)).toBe(true);
      container.remove();
      done();
    }, 160);
  });

  // it('handles error in animateOut when returning to parent', (done) => {
  //   view.show({ targetElement: target });

  //   // Set invalid parent to force error
  //   (view as any)._originalParent = document.createElement('div');

  //   // This should not throw error
  //   view.hide();

  //   // Wait for animation to complete
  //   setTimeout(() => {
  //     expect(view.isVisible).toBe(false);
  //     done();
  //   }, 200);
  // });

  it('handles destroy when panel is already removed', () => {
    // Create a separate view for this test
    const destroyView = new OverlayPanelView(locale);
    destroyView.render();

    // Remove the element before destroy
    if (destroyView.element) {
      destroyView.element.remove();
    }

    // This should not throw an error
    destroyView.destroy();
  });

  it('handles destroy when original parent no longer exists', () => {
    // Show the panel
    view.show({ targetElement: target });

    // Set an original parent that doesn't exist in the document
    const detachedParent = document.createElement('div');
    (view as any)._originalParent = detachedParent;

    // This should not throw an error and should fall back to removing
    view.destroy();
  });

  it('handles error during element removal in destroy', () => {
    // Show the panel
    view.show({ targetElement: target });

    // Make element.remove throw an error
    spyOn(view.element!, 'remove').and.throwError('Test error');

    // This should not propagate the error
    view.destroy();
  });
});
