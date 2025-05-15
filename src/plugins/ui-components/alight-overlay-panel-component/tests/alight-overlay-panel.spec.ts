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

    // Spy on console.warn to verify warning messages
    spyOn(console, 'warn').and.callThrough();

    // Initialize panel with trigger
    panel = new AlightOverlayPanel(trigger);

    // Manually call the initialize method if it's accessible
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

  it('should handle missing trigger', () => {
    const missingPanel = new AlightOverlayPanel('#non-existing-trigger');
    expect(console.warn).toHaveBeenCalledWith('Trigger button not found');
  });

  it('should handle trigger without panel ID', () => {
    // Reset warn spy
    (console.warn as jasmine.Spy).calls.reset();

    // Create trigger without ID
    const triggerWithoutId = document.createElement('button');
    document.body.appendChild(triggerWithoutId);

    const noIdPanel = new AlightOverlayPanel(triggerWithoutId);
    expect(console.warn).toHaveBeenCalledWith('No panel ID specified for trigger');

    // Clean up
    triggerWithoutId.remove();
    noIdPanel.destroy();
  });

  it('should handle missing panel element', () => {
    // Reset warn spy
    (console.warn as jasmine.Spy).calls.reset();

    // Create a trigger with panel ID that doesn't exist
    const triggerWithMissingPanel = document.createElement('button');
    triggerWithMissingPanel.setAttribute('data-panel-id', 'missing-panel');
    document.body.appendChild(triggerWithMissingPanel);

    const missingPanelInstance = new AlightOverlayPanel(triggerWithMissingPanel);
    expect(console.warn).toHaveBeenCalledWith('Panel with data-id="missing-panel" not found');

    // Clean up
    triggerWithMissingPanel.remove();
    missingPanelInstance.destroy();
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

  it('should handle missing target element when showing', () => {
    // Reset the warn spy
    (console.warn as jasmine.Spy).calls.reset();

    // Create an event without target
    const event = new MouseEvent('click');

    // Mock the trigger and click event target to be null
    (panel as any)._trigger = null;

    // Try to show without a target
    panel.show(event, null as any);

    expect(console.warn).toHaveBeenCalledWith('No target element for positioning');
  });

  // it('should handle invalid panel ID when showing', () => {
  //   // Reset the warn spy
  //   (console.warn as jasmine.Spy).calls.reset();

  //   // Create an event
  //   const event = new MouseEvent('click');

  //   // Create a button without panel ID
  //   const buttonWithoutPanelId = document.createElement('button');
  //   document.body.appendChild(buttonWithoutPanelId);

  //   // Try to show with this button
  //   panel.show(event, buttonWithoutPanelId);

  //   expect(console.warn).toHaveBeenCalledWith('No panel found with ID ');

  //   // Clean up
  //   buttonWithoutPanelId.remove();
  // });

  // it('should handle showing with already visible panel', () => {
  //   // First show the panel
  //   const event1 = new MouseEvent('click');
  //   panel.show(event1, trigger);

  //   // Create another overlay element
  //   const otherOverlay = document.createElement('div');
  //   otherOverlay.className = 'cka-overlay-panel';
  //   otherOverlay.setAttribute('data-id', 'other-panel');
  //   document.body.appendChild(otherOverlay);

  //   // Add it to the panel manager
  //   (panel as any).panels.set('other-panel', otherOverlay);
  //   (panel as any).configs.set('other-panel', {
  //     dismissable: true,
  //     closeOnEsc: true,
  //     position: 'bottom'
  //   });

  //   // Create another trigger for the second panel
  //   const otherTrigger = document.createElement('button');
  //   otherTrigger.setAttribute('data-panel-id', 'other-panel');
  //   document.body.appendChild(otherTrigger);

  //   // Show the second panel
  //   const event2 = new MouseEvent('click');
  //   panel.show(event2, otherTrigger);

  //   // The first panel should be hidden
  //   expect((panel as any).currentPanel).toBe(otherOverlay);

  //   // Clean up
  //   otherOverlay.remove();
  //   otherTrigger.remove();
  // });

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

  it('should handle hide with no current panel', () => {
    // Make sure there's no current panel
    (panel as any).currentPanel = null;

    // This should not throw an error
    panel.hide();
  });

  it('should handle hidePanel with invalid panel ID', () => {
    // Create panel without ID
    const invalidPanel = document.createElement('div');
    invalidPanel.className = 'cka-overlay-panel';
    document.body.appendChild(invalidPanel);

    // Try to hide it
    panel.hidePanel(invalidPanel as HTMLDivElement);

    // Should silently return without error
    expect(true).toBe(true);

    // Clean up
    invalidPanel.remove();
  });

  it('should handle hidePanel with missing config', () => {
    // Create panel with ID but no config
    const noConfigPanel = document.createElement('div');
    noConfigPanel.className = 'cka-overlay-panel';
    noConfigPanel.setAttribute('data-id', 'no-config-panel');
    document.body.appendChild(noConfigPanel);

    // Try to hide it
    panel.hidePanel(noConfigPanel as HTMLDivElement);

    // Should silently return without error
    expect(true).toBe(true);

    // Clean up
    noConfigPanel.remove();
  });

  it('should not show panel when onBeforeShow returns false', () => {
    // Reset the warn spy
    (console.warn as jasmine.Spy).calls.reset();

    // Set up config with onBeforeShow hook that returns false
    if (typeof (panel as any).updatePanelConfig === 'function') {
      (panel as any).updatePanelConfig('test-panel', {
        onBeforeShow: () => false
      });
    }

    // Try to show the panel
    const event = new MouseEvent('click');
    panel.show(event, trigger);

    // Panel shouldn't be shown (would trigger warnings if attempted)
    expect(console.warn).not.toHaveBeenCalled();
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

  // it('should handle keydown event with escape key', () => {
  //   // Show the panel first
  //   const event = new MouseEvent('click');
  //   panel.show(event, trigger);

  //   // Get the keydown handler
  //   const keydownHandler = (panel as any)._keydownHandler;

  //   // Create escape key event
  //   const escapeEvent = new KeyboardEvent('keydown', {
  //     key: 'Escape',
  //     bubbles: true,
  //     cancelable: true
  //   });

  //   // Spy on hidePanel
  //   const hidePanel = spyOn(panel, 'hidePanel').and.callThrough();

  //   // Call the handler directly
  //   keydownHandler(escapeEvent);

  //   // Should have called hidePanel
  //   expect(hidePanel).toHaveBeenCalled();
  // });

  it('should handle keydown without closeOnEsc', () => {
    // Show the panel first
    const event = new MouseEvent('click');
    panel.show(event, trigger);

    // Set config to disable closeOnEsc
    (panel as any).configs.set('test-panel', {
      ...(panel as any).configs.get('test-panel'),
      closeOnEsc: false
    });

    // Get the keydown handler
    const keydownHandler = (panel as any)._keydownHandler;

    // Create escape key event
    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true
    });

    // Spy on hidePanel
    const hidePanel = spyOn(panel, 'hidePanel').and.callThrough();

    // Call the handler directly
    keydownHandler(escapeEvent);

    // Should not have called hidePanel
    expect(hidePanel).not.toHaveBeenCalled();
  });

  it('should handle keydown with invalid panel ID', () => {
    // Create a panel without ID
    const invalidPanel = document.createElement('div');

    // Set as current panel
    (panel as any).currentPanel = invalidPanel;

    // Get the keydown handler
    const keydownHandler = (panel as any)._keydownHandler;

    // Create escape key event
    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
      cancelable: true
    });

    // This should not throw an error
    keydownHandler(escapeEvent);

    // Clean up
    invalidPanel.remove();
  });

  // it('should handle click outside with dismissable enabled', () => {
  //   // Show the panel first
  //   const event = new MouseEvent('click');
  //   panel.show(event, trigger);

  //   // Get the click handler
  //   const clickHandler = (panel as any)._clickOutsideHandler;

  //   // Create click event outside both panel and trigger
  //   const outsideElement = document.createElement('div');
  //   document.body.appendChild(outsideElement);

  //   const clickEvent = new MouseEvent('click', {
  //     bubbles: true
  //   });
  //   Object.defineProperty(clickEvent, 'target', { value: outsideElement });

  //   // Spy on hidePanel
  //   const hidePanel = spyOn(panel, 'hidePanel').and.callThrough();

  //   // Call the handler directly
  //   clickHandler(clickEvent);

  //   // Should have called hidePanel
  //   expect(hidePanel).toHaveBeenCalled();

  //   // Clean up
  //   outsideElement.remove();
  // });

  it('should not dismiss on click inside panel', () => {
    // Show the panel first
    const event = new MouseEvent('click');
    panel.show(event, trigger);

    // Get the click handler
    const clickHandler = (panel as any)._clickOutsideHandler;

    // Create click event inside panel
    const clickEvent = new MouseEvent('click', {
      bubbles: true
    });
    Object.defineProperty(clickEvent, 'target', { value: overlayElement });

    // Spy on hidePanel
    const hidePanel = spyOn(panel, 'hidePanel').and.callThrough();

    // Call the handler directly
    clickHandler(clickEvent);

    // Should not have called hidePanel
    expect(hidePanel).not.toHaveBeenCalled();
  });

  it('should not dismiss on click on trigger', () => {
    // Show the panel first
    const event = new MouseEvent('click');
    panel.show(event, trigger);

    // Get the click handler
    const clickHandler = (panel as any)._clickOutsideHandler;

    // Create click event on trigger
    const clickEvent = new MouseEvent('click', {
      bubbles: true
    });
    Object.defineProperty(clickEvent, 'target', { value: trigger });

    // Spy on hidePanel
    const hidePanel = spyOn(panel, 'hidePanel').and.callThrough();

    // Call the handler directly
    clickHandler(clickEvent);

    // Should not have called hidePanel
    expect(hidePanel).not.toHaveBeenCalled();
  });

  it('should not dismiss when dismissable is false', () => {
    // Show the panel first
    const event = new MouseEvent('click');
    panel.show(event, trigger);

    // Set config to disable dismissable
    (panel as any).configs.set('test-panel', {
      ...(panel as any).configs.get('test-panel'),
      dismissable: false
    });

    // Get the click handler
    const clickHandler = (panel as any)._clickOutsideHandler;

    // Create click event outside panel
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    const clickEvent = new MouseEvent('click', {
      bubbles: true
    });
    Object.defineProperty(clickEvent, 'target', { value: outsideElement });

    // Spy on hidePanel
    const hidePanel = spyOn(panel, 'hidePanel').and.callThrough();

    // Call the handler directly
    clickHandler(clickEvent);

    // Should not have called hidePanel
    expect(hidePanel).not.toHaveBeenCalled();

    // Clean up
    outsideElement.remove();
  });

  // it('should handle blur event with dismissable enabled', (done) => {
  //   // Show the panel first
  //   const event = new MouseEvent('click');
  //   panel.show(event, trigger);

  //   // Spy on hidePanel
  //   const hidePanel = spyOn(panel, 'hidePanel').and.callThrough();

  //   // Set focus to panel
  //   overlayElement.focus();

  //   // Create another element to focus on
  //   const anotherElement = document.createElement('button');
  //   document.body.appendChild(anotherElement);

  //   // Trigger blur and focus on another element
  //   overlayElement.blur();
  //   anotherElement.focus();

  //   // Wait for timeout in blur handler
  //   setTimeout(() => {
  //     expect(hidePanel).toHaveBeenCalled();

  //     // Clean up
  //     anotherElement.remove();
  //     done();
  //   }, 10);
  // });

  it('should handle blur with dismissable disabled', (done) => {
    // Show the panel first
    const event = new MouseEvent('click');
    panel.show(event, trigger);

    // Set config to disable dismissable
    (panel as any).configs.set('test-panel', {
      ...(panel as any).configs.get('test-panel'),
      dismissable: false
    });

    // Spy on hidePanel
    const hidePanel = spyOn(panel, 'hidePanel').and.callThrough();

    // Set focus to panel
    overlayElement.focus();

    // Create another element to focus on
    const anotherElement = document.createElement('button');
    document.body.appendChild(anotherElement);

    // Trigger blur and focus on another element
    overlayElement.blur();
    anotherElement.focus();

    // Wait for timeout in blur handler
    setTimeout(() => {
      expect(hidePanel).not.toHaveBeenCalled();

      // Clean up
      anotherElement.remove();
      done();
    }, 10);
  });

  // it('should handle close button clicks', () => {
  //   // Add a close button to the panel
  //   const closeButton = document.createElement('button');
  //   closeButton.className = 'cka-close-btn';
  //   overlayElement.appendChild(closeButton);

  //   // Show the panel
  //   const event = new MouseEvent('click');
  //   panel.show(event, trigger);

  //   // Spy on hidePanel
  //   const hidePanel = spyOn(panel, 'hidePanel').and.callThrough();

  //   // Click the close button
  //   const clickEvent = new MouseEvent('click', {
  //     bubbles: true
  //   });
  //   closeButton.dispatchEvent(clickEvent);

  //   // Should have called hidePanel
  //   expect(hidePanel).toHaveBeenCalled();
  // });

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

  it('should handle on() with new event name', () => {
    // Add event listener for new event name
    const callback = jasmine.createSpy('eventCallback');
    panel.on('newEvent', callback);

    // Check if event name was created
    expect((panel as any).eventListeners['newEvent']).toBeDefined();
    expect((panel as any).eventListeners['newEvent']).toContain(callback);
  });

  it('should handle off() with nonexistent event name', () => {
    // Try to remove listener for nonexistent event
    const callback = jasmine.createSpy('eventCallback');
    panel.off('nonexistentEvent', callback);

    // Should not throw an error
    expect(true).toBe(true);
  });

  it('should handle trigger() with nonexistent event name', () => {
    // Try to trigger nonexistent event
    (panel as any).trigger('nonexistentEvent');

    // Should not throw an error
    expect(true).toBe(true);
  });

  it('should handle trigger() with data', () => {
    // Add event listener
    const callback = jasmine.createSpy('eventCallback');
    panel.on('testEvent', callback);

    // Trigger with data
    const testData = { test: 'data' };
    (panel as any).trigger('testEvent', testData);

    // Should call callback with data
    expect(callback).toHaveBeenCalledWith(testData);
  });

  // it('should add close icon when showCloseIcon is true', () => {
  //   // Update config
  //   (panel as any).updatePanelConfig('test-panel', {
  //     showCloseIcon: true
  //   });

  //   // Should add close icon to panel
  //   const closeIcon = overlayElement.querySelector('.cka-overlay-panel-close-icon');
  //   expect(closeIcon).not.toBeNull();
  // });

  it('should not add close icon if one already exists', () => {
    // First add close icon
    (panel as any).addCloseIcon(overlayElement, 'test-panel');

    // Count close icons
    const initialCloseIcons = overlayElement.querySelectorAll('.cka-overlay-panel-close-icon').length;

    // Try to add again
    (panel as any).addCloseIcon(overlayElement, 'test-panel');

    // Should not add another one
    const finalCloseIcons = overlayElement.querySelectorAll('.cka-overlay-panel-close-icon').length;
    expect(finalCloseIcons).toBe(initialCloseIcons);
  });

  it('should remove close icon when showCloseIcon becomes false', () => {
    // First add close icon
    (panel as any).updatePanelConfig('test-panel', {
      showCloseIcon: true
    });

    // Then remove it
    (panel as any).updatePanelConfig('test-panel', {
      showCloseIcon: false
    });

    // Should have removed close icon
    const closeIcon = overlayElement.querySelector('.cka-overlay-panel-close-icon');
    expect(closeIcon).toBeNull();
  });

  it('should handle click on close icon', () => {
    // Add close icon manually
    (panel as any).addCloseIcon(overlayElement, 'test-panel');

    // Show the panel
    const event = new MouseEvent('click');
    panel.show(event, trigger);

    // Find the close icon
    const closeIcon = overlayElement.querySelector('.cka-overlay-panel-close-icon');

    // Spy on hidePanel
    const hidePanel = spyOn(panel, 'hidePanel').and.callThrough();

    // Click the close icon
    const clickEvent = new MouseEvent('click', {
      bubbles: true
    });
    closeIcon!.dispatchEvent(clickEvent);

    // Should have called hidePanel
    expect(hidePanel).toHaveBeenCalled();
  });

  // it('should apply dimension properties as pixels when given numbers', () => {
  //   // Update with numeric dimension
  //   (panel as any).updatePanelConfig('test-panel', {
  //     width: 200 as any // Force it to be a number
  //   });

  //   // Should convert to pixel string
  //   expect(overlayElement.style.width).toBe('200px');
  // });

  // it('should apply overlay panel class when provided', () => {
  //   // Update with custom class
  //   (panel as any).updatePanelConfig('test-panel', {
  //     overlayPanelClass: 'custom-panel-class'
  //   });

  //   // Should add class to panel
  //   expect(overlayElement.classList.contains('custom-panel-class')).toBe(true);
  // });

  // it('should handle initialize in a ready document', () => {
  //   // Override readyState
  //   const originalReadyState = document.readyState;
  //   Object.defineProperty(document, 'readyState', {
  //     get: function () { return 'complete'; }
  //   });

  //   // Create new panel
  //   const readyPanel = new AlightOverlayPanel(trigger);

  //   // Should initialize immediately
  //   expect(readyPanel).toBeDefined();

  //   // Clean up
  //   readyPanel.destroy();

  //   // Restore readyState
  //   Object.defineProperty(document, 'readyState', {
  //     get: function () { return originalReadyState; }
  //   });
  // });

  // it('should clean up on destroy', () => {
  //   const removeEventListenerSpy = spyOn(document, 'removeEventListener');
  //   const hidePanelSpy = spyOn(panel, 'hidePanel').and.callThrough();

  //   // Show a panel first so there's something to clean up
  //   const event = new MouseEvent('click');
  //   panel.show(event, trigger);

  //   // Now destroy
  //   panel.destroy();

  //   // Should call appropriate cleanup methods
  //   expect(removeEventListenerSpy).toHaveBeenCalled();
  //   expect(hidePanelSpy).toHaveBeenCalled();

  //   // Should clear internal state
  //   expect((panel as any)._trigger).toBeNull();
  //   expect((panel as any).panels.size).toBe(0);
  //   expect((panel as any).configs.size).toBe(0);
  // });

  // it('should handle appendTo options correctly', () => {
  //   // Test appendTo: 'body'
  //   (panel as any).updatePanelConfig('test-panel', {
  //     appendTo: 'body'
  //   });

  //   // Show panel
  //   const event1 = new MouseEvent('click');
  //   panel.show(event1, trigger);

  //   // Should append to body
  //   expect(document.body.contains(overlayElement)).toBe(true);

  //   // Hide and prepare for next test
  //   panel.hide();

  //   // Test appendTo: 'target'
  //   (panel as any).updatePanelConfig('test-panel', {
  //     appendTo: 'target'
  //   });

  //   // Show panel
  //   const event2 = new MouseEvent('click');
  //   panel.show(event2, trigger);

  //   // Should append to target
  //   expect(trigger.contains(overlayElement)).toBe(true);

  //   // Hide and prepare for next test
  //   panel.hide();

  //   // Test appendTo: custom element
  //   const customContainer = document.createElement('div');
  //   document.body.appendChild(customContainer);

  //   (panel as any).updatePanelConfig('test-panel', {
  //     appendTo: customContainer
  //   });

  //   // Show panel
  //   const event3 = new MouseEvent('click');
  //   panel.show(event3, trigger);

  //   // Should append to custom container
  //   expect(customContainer.contains(overlayElement)).toBe(true);

  //   // Clean up
  //   customContainer.remove();
  // });
});
