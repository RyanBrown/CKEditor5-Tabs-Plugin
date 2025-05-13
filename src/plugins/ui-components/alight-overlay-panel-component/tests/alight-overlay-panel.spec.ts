// src/plugins/ui-components/alight-overlay-panel-component/tests/alight-overlay-panel.spec.ts
import { AlightOverlayPanel } from '../alight-overlay-panel';
import { AlightPositionManager } from '../../alight-ui-component-utils/alight-position-manager';

describe('AlightOverlayPanel', () => {
  let panel: AlightOverlayPanel;
  let trigger: HTMLElement;
  let overlayElement: HTMLElement;
  let positionManager: AlightPositionManager;

  beforeEach(() => {
    // Create test DOM elements
    trigger = document.createElement('button');
    trigger.setAttribute('data-panel-id', 'test-panel');
    document.body.appendChild(trigger);

    overlayElement = document.createElement('div');
    overlayElement.className = 'cka-overlay-panel';
    overlayElement.setAttribute('data-id', 'test-panel');
    document.body.appendChild(overlayElement);

    positionManager = AlightPositionManager.getInstance();

    // Initialize panel with trigger
    panel = new AlightOverlayPanel(trigger);

    // Manually call the initialize method if it's accessible
    // If not accessible, we'll need to trigger the DOMContentLoaded event
    if (typeof (panel as any).initialize === 'function') {
      (panel as any).initialize({
        position: 'bottom',
        offset: 4,
        followTrigger: false,
        constrainToViewport: true,
        autoFlip: true,
        alignment: 'start',
        closeOnEsc: true,
        dismissable: true,
        appendTo: 'body',
        autoZIndex: true,
        baseZIndex: 0,
        keepInViewport: true,
        showTransitionDuration: 150,
        hideTransitionDuration: 150
      });
    } else {
      // Dispatch DOMContentLoaded event to initialize the panel
      const event = document.createEvent('Event');
      event.initEvent('DOMContentLoaded', true, true);
      document.dispatchEvent(event);
    }
  });

  afterEach(() => {
    // Clean up
    if (typeof panel.destroy === 'function') {
      panel.destroy();
    }

    if (trigger.parentNode) {
      trigger.remove();
    }

    if (overlayElement.parentNode) {
      overlayElement.remove();
    }
  });

  it('should initialize with a trigger element', () => {
    expect(panel).toBeDefined();
  });

  it('should initialize with a trigger selector', () => {
    trigger.id = 'trigger-by-id';
    const panelBySelector = new AlightOverlayPanel('#trigger-by-id');
    expect(panelBySelector).toBeDefined();

    if (typeof panelBySelector.destroy === 'function') {
      panelBySelector.destroy();
    }
  });

  it('should handle missing trigger or panel elements', () => {
    const consoleSpy = spyOn(console, 'warn');

    // Test with non-existing selector
    const missingPanel = new AlightOverlayPanel('#non-existing-trigger');

    // Test with trigger without panel ID
    const triggerWithoutId = document.createElement('button');
    document.body.appendChild(triggerWithoutId);
    const noIdPanel = new AlightOverlayPanel(triggerWithoutId);

    // Cleanup
    triggerWithoutId.remove();

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should toggle visibility on trigger click', (done) => {
    // Set up spy for toggle method
    const toggleSpy = spyOn(panel, 'toggle').and.callThrough();

    // Simulate trigger click
    trigger.click();

    expect(toggleSpy).toHaveBeenCalled();
    done();
  });

  it('should show the panel', (done) => {
    const event = new MouseEvent('click');

    // Add mock event listeners
    let showCalled = false;
    panel.on('show', () => {
      showCalled = true;
    });

    panel.show(event, trigger);

    const panelElement = document.querySelector('.cka-overlay-panel[data-id="test-panel"]');
    expect(panelElement).not.toBeNull();

    // Wait for animation to complete
    setTimeout(() => {
      expect(showCalled).toBe(true);
      done();
    }, 200);
  });

  it('should hide the panel', (done) => {
    // First show the panel
    const event = new MouseEvent('click');
    panel.show(event, trigger);

    // Add mock event listeners
    let hideCalled = false;
    panel.on('hide', () => {
      hideCalled = true;
    });

    // Now hide it
    setTimeout(() => {
      panel.hide();

      // Wait for animation to complete
      setTimeout(() => {
        expect(hideCalled).toBe(true);
        done();
      }, 200);
    }, 160);
  });

  it('should not show panel when onBeforeShow returns false', () => {
    // Set up config with onBeforeShow hook that returns false
    const showSpy = spyOn(document.body, 'appendChild');

    // Update panel config
    if (typeof (panel as any).updatePanelConfig === 'function') {
      (panel as any).updatePanelConfig('test-panel', {
        onBeforeShow: () => false
      });
    }

    // Try to show the panel
    const event = new MouseEvent('click');
    panel.show(event, trigger);

    // Panel shouldn't be shown
    expect(showSpy).not.toHaveBeenCalled();
  });

  it('should not hide panel when onBeforeHide returns false', (done) => {
    // Update panel config
    if (typeof (panel as any).updatePanelConfig === 'function') {
      (panel as any).updatePanelConfig('test-panel', {
        onBeforeHide: () => false
      });
    }

    // First show the panel
    const event = new MouseEvent('click');
    panel.show(event, trigger);

    setTimeout(() => {
      // Spy on style changes that would happen during hide
      const styleSpy = spyOn(overlayElement.style, 'opacity').and.callThrough();

      // Try to hide the panel
      panel.hide();

      // Panel shouldn't start hiding process
      expect(styleSpy).not.toHaveBeenCalled();
      done();
    }, 160);
  });

  it('should handle click outside to dismiss panel', (done) => {
    // Set up a spy before showing the panel
    const hideSpy = spyOn(panel, 'hide').and.callThrough();

    // First show the panel - use jQuery-style event for better browser compatibility
    const showEvent = document.createEvent('MouseEvents');
    showEvent.initEvent('click', true, true);
    panel.show(showEvent, trigger);

    // Make sure panel is fully visible before testing click outside
    setTimeout(() => {
      // Must get the current visible panel element
      const visiblePanel = document.querySelector('.cka-overlay-panel.cka-active');
      expect(visiblePanel).not.toBeNull();

      // Reset the spy to ensure we only catch the hide call from click outside
      hideSpy.calls.reset();

      // Create a document click event that's outside the panel
      // This needs to be a proper event that bubbles
      const clickEvent = document.createEvent('MouseEvents');
      clickEvent.initEvent('click', true, true);
      document.body.dispatchEvent(clickEvent);

      // Check if hide was called
      expect(hideSpy).toHaveBeenCalled();
      done();
    }, 200); // Ensure we wait long enough for panel to be fully shown
  });

  it('should handle escape key to dismiss panel', (done) => {
    // Set up a spy before showing the panel
    const hideSpy = spyOn(panel, 'hide').and.callThrough();

    // First show the panel
    const showEvent = document.createEvent('MouseEvents');
    showEvent.initEvent('click', true, true);
    panel.show(showEvent, trigger);

    // Make sure panel is fully visible before testing escape key
    setTimeout(() => {
      // Must get the current visible panel element
      const visiblePanel = document.querySelector('.cka-overlay-panel.cka-active');
      expect(visiblePanel).not.toBeNull();

      // Reset the spy to ensure we only catch the hide call from escape key
      hideSpy.calls.reset();

      // Create an escape key event that bubbles
      const keyEvent = document.createEvent('KeyboardEvent') as any;

      // Different initialization for KeyboardEvent in different browsers
      if (typeof keyEvent.initKeyboardEvent !== 'undefined') {
        keyEvent.initKeyboardEvent('keydown', true, true, window, 'Escape', 0, '', false, '');
      } else {
        keyEvent.initKeyEvent('keydown', true, true, window, false, false, false, false, 27, 0);
      }

      // Manually set key property for modern browsers
      Object.defineProperty(keyEvent, 'key', { value: 'Escape' });

      // Dispatch the event
      document.dispatchEvent(keyEvent);

      // Check if hide was called
      expect(hideSpy).toHaveBeenCalled();
      done();
    }, 200); // Ensure we wait long enough for panel to be fully shown
  });

  it('should not dismiss on escape when closeOnEsc is false', (done) => {
    const hideSpy = spyOn(panel, 'hide');

    // Update panel config
    if (typeof (panel as any).updatePanelConfig === 'function') {
      (panel as any).updatePanelConfig('test-panel', {
        closeOnEsc: false
      });
    }

    // Show the panel
    const showEvent = new MouseEvent('click');
    panel.show(showEvent, trigger);

    setTimeout(() => {
      // Simulate escape key
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      });
      document.dispatchEvent(keyEvent);

      // Panel should not hide
      expect(hideSpy).not.toHaveBeenCalled();
      done();
    }, 160);
  });

  it('should update panel config', (done) => {
    // Update panel config if method is available
    if (typeof (panel as any).updatePanelConfig === 'function') {
      const registerSpy = spyOn(positionManager, 'updateConfig');

      // First show the panel
      const event = new MouseEvent('click');
      panel.show(event, trigger);

      setTimeout(() => {
        (panel as any).updatePanelConfig('test-panel', {
          width: '300px',
          showCloseIcon: true,
          overlayPanelClass: 'custom-class'
        });

        // Check if panel element style was updated
        expect(overlayElement.style.width).toBe('300px');
        expect(overlayElement.classList.contains('custom-class')).toBe(true);

        // Check position manager was updated
        expect(registerSpy).toHaveBeenCalled();
        done();
      }, 160);
    } else {
      // Skip if method not available
      pending('updatePanelConfig method not available');
      done();
    }
  });

  it('should remove event listeners with off()', () => {
    const callback = jasmine.createSpy('eventCallback');

    // Add event listener
    panel.on('show', callback);

    // Check if registered
    expect((panel as any).eventListeners['show']).toContain(callback);

    // Remove event listener
    panel.off('show', callback);

    // Check if removed
    expect((panel as any).eventListeners['show']).not.toContain(callback);
  });

  it('should add close icon when showCloseIcon is true', () => {
    // Update panel config
    if (typeof (panel as any).updatePanelConfig === 'function') {
      (panel as any).updatePanelConfig('test-panel', {
        showCloseIcon: true
      });
    }

    // Check if close icon was added
    const closeIcon = overlayElement.querySelector('.cka-overlay-panel-close-icon');
    expect(closeIcon).not.toBeNull();
  });

  it('should remove close icon when showCloseIcon is false', () => {
    // First add close icon
    if (typeof (panel as any).updatePanelConfig === 'function') {
      (panel as any).updatePanelConfig('test-panel', {
        showCloseIcon: true
      });

      // Then remove it
      (panel as any).updatePanelConfig('test-panel', {
        showCloseIcon: false
      });
    }

    // Check if close icon was removed
    const closeIcon = overlayElement.querySelector('.cka-overlay-panel-close-icon');
    expect(closeIcon).toBeNull();
  });

  it('should clean up on destroy', () => {
    const removeEventListenerSpy = spyOn(document, 'removeEventListener');

    panel.destroy();

    expect(removeEventListenerSpy).toHaveBeenCalled();
    expect((panel as any)._trigger).toBeNull();
    expect((panel as any).panels.size).toBe(0);
    expect((panel as any).configs.size).toBe(0);
  });

  it('should append panel to different targets', () => {
    // Create a custom appendTo element
    const customAppendTo = document.createElement('div');
    document.body.appendChild(customAppendTo);

    // Update panel config
    if (typeof (panel as any).updatePanelConfig === 'function') {
      (panel as any).updatePanelConfig('test-panel', {
        appendTo: customAppendTo
      });
    }

    // Show panel
    const event = new MouseEvent('click');
    panel.show(event, trigger);

    // Check if panel was appended to custom element
    expect(customAppendTo.contains(overlayElement)).toBe(true);

    customAppendTo.remove();
  });

  it('should support appendTo: "target" option', () => {
    // Update panel config
    if (typeof (panel as any).updatePanelConfig === 'function') {
      (panel as any).updatePanelConfig('test-panel', {
        appendTo: 'target'
      });
    }

    // Show panel
    const event = new MouseEvent('click');
    panel.show(event, trigger);

    // Check if panel was appended to target
    expect(trigger.contains(overlayElement)).toBe(true);
  });
});
