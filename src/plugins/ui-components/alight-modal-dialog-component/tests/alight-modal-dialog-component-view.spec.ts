// alight-modal-dialog-component-view.spec.ts

import { ModalView } from '../alight-modal-dialog-component-view';

describe('ModalView', () => {
  let view: ModalView;
  let locale: any;

  beforeEach(() => {
    // Create a proper mock locale object that matches what the component expects
    locale = {
      t: (str: string) => str,
      uiLanguageDirection: 'ltr'
    };

    view = new ModalView(locale);
    view.render();

    // Manually add to DOM for testing (but don't display)
    if (view.element) {
      view.element.style.display = 'none';
      document.body.appendChild(view.element);
    }
  });

  afterEach(() => {
    // Clean up DOM elements
    if (view.element && view.element.parentNode) {
      view.element.remove();
    }

    // Clean up modal mask if it exists
    const mask = document.querySelector('.ck-modal-mask');
    if (mask) {
      mask.remove();
    }

    view.destroy();
  });

  it('should create DOM elements on initialization', () => {
    expect(view.element).not.toBeNull();
    expect(view.element?.classList.contains('ck-modal')).toBeTrue();
  });

  it('should set initial properties correctly', () => {
    expect(view.title).toBe('');
    expect(view.isDraggable).toBeTrue();
    expect(view.isResizable).toBeTrue();
    expect(view.isVisible).toBeFalse();
    expect(view.isModal).toBeTrue();
    expect(view.maximized).toBeFalse();
    expect(view.position).toBe('center');
  });

  it('should update visibility when shown', (done) => {
    // Spy on methods to prevent actual animations
    spyOn(view as any, '_disableBodyScroll');
    spyOn(view as any, '_createModalMask');

    // Initial state
    expect(view.isVisible).toBeFalse();

    // Show the modal
    view.show();

    // Check immediate property change
    expect(view.isVisible).toBeTrue();

    // Allow time for any async operations
    setTimeout(() => {
      expect(view.isVisible).toBeTrue();
      done();
    }, 50);
  });

  it('should hide the modal correctly', (done) => {
    // First show the modal
    spyOn(view as any, '_disableBodyScroll');
    spyOn(view as any, '_createModalMask');

    view.show();
    expect(view.isVisible).toBeTrue();

    // Spy on methods to prevent actual animations during hide
    spyOn(view as any, '_restoreBodyScroll');

    // Now hide it
    view.hide();

    // Check after animation would be complete
    setTimeout(() => {
      expect(view.isVisible).toBeFalse();
      done();
    }, 200);
  });

  it('should toggle maximized state', (done) => {
    // Show the modal first
    spyOn(view as any, '_disableBodyScroll');
    spyOn(view as any, '_createModalMask');

    view.show();

    expect(view.maximized).toBeFalse();

    // Wait for show to complete
    setTimeout(() => {
      view.toggleMaximize();

      expect(view.maximized).toBeTrue();

      view.toggleMaximize();

      expect(view.maximized).toBeFalse();

      done();
    }, 50);
  });

  it('should set content correctly', () => {
    const content = document.createElement('div');
    content.textContent = 'Test Content';

    view.setContent(content);

    const body = view.element?.querySelector('.ck-modal__body');
    expect(body).not.toBeNull();
    expect(body?.firstChild).toBe(content);
  });

  it('should set footer content correctly', () => {
    const footer = document.createElement('div');
    footer.textContent = 'Test Footer';

    view.setFooter(footer);

    const footerEl = view.element?.querySelector('.ck-modal__footer');
    expect(footerEl).not.toBeNull();
    expect(footerEl?.firstChild).toBe(footer);
  });

  it('should fire events on show and hide', (done) => {
    // Spy on the fire method
    const fireSpy = spyOn(view, 'fire').and.callThrough();

    // Prevent actual DOM operations
    spyOn(view as any, '_disableBodyScroll');
    spyOn(view as any, '_createModalMask');

    // Show the modal
    view.show();

    // Wait for animations
    setTimeout(() => {
      expect(fireSpy).toHaveBeenCalledWith('show');

      // Prevent DOM operations during hide
      spyOn(view as any, '_restoreBodyScroll');

      // Hide the modal
      view.hide();

      // Wait for hide animation
      setTimeout(() => {
        expect(fireSpy).toHaveBeenCalledWith('hide');
        done();
      }, 200);
    }, 200);
  });

  it('should focus the modal element when shown', (done) => {
    // Spy on the focus method
    const focusSpy = spyOn(view, 'focus');

    // Prevent actual DOM operations
    spyOn(view as any, '_disableBodyScroll');
    spyOn(view as any, '_createModalMask');

    // Show the modal
    view.show();

    // Wait for animation completion
    setTimeout(() => {
      expect(focusSpy).toHaveBeenCalled();
      done();
    }, 200);
  });
});
