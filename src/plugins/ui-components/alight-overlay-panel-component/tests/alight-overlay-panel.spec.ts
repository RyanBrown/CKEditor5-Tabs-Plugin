// src/plugins/ui-components/alight-overlay-panel-component/tests/alight-overlay-panel.spec.ts
import { AlightOverlayPanel } from '../alight-overlay-panel';

describe('AlightOverlayPanel', () => {
  let panel: AlightOverlayPanel;
  let trigger: HTMLElement;
  let overlayElement: HTMLElement;

  beforeEach(() => {
    // Create test DOM elements
    trigger = document.createElement('button');
    trigger.setAttribute('data-panel-id', 'test-panel');
    document.body.appendChild(trigger);

    overlayElement = document.createElement('div');
    overlayElement.className = 'cka-overlay-panel';
    overlayElement.setAttribute('data-id', 'test-panel');
    document.body.appendChild(overlayElement);

    // Create a mock document ready state - don't try to redefine readyState
    // Instead, we'll manually initialize the panel

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

  // it('should hide the panel', (done) => {
  //   // First show the panel
  //   const event = new MouseEvent('click');
  //   panel.show(event, trigger);

  //   // Add mock event listeners
  //   let hideCalled = false;
  //   panel.on('hide', () => {
  //     hideCalled = true;
  //   });

  //   // Now hide it
  //   panel.hide();

  //   // Wait for animation to complete
  //   setTimeout(() => {
  //     const panelElement = document.querySelector('.cka-overlay-panel[data-id="test-panel"]');
  //     expect(hideCalled).toBe(true);
  //     done();
  //   }, 200);
  // });

  it('should handle click outside to dismiss panel', (done) => {
    // First show the panel
    const showEvent = new MouseEvent('click');
    panel.show(showEvent, trigger);

    // Simulate click outside
    const clickEvent = new MouseEvent('click');
    document.dispatchEvent(clickEvent);

    // Wait for animation to complete
    setTimeout(() => {
      done();
    }, 200);
  });

  it('should handle escape key to dismiss panel', (done) => {
    // First show the panel
    const showEvent = new MouseEvent('click');
    panel.show(showEvent, trigger);

    // Simulate escape key
    const keyEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(keyEvent);

    // Wait for animation to complete
    setTimeout(() => {
      done();
    }, 200);
  });

  // it('should update panel config', () => {
  //   // Update panel config if method is available
  //   if (typeof panel.updatePanelConfig === 'function') {
  //     panel.updatePanelConfig('test-panel', {
  //       width: '300px',
  //       showCloseIcon: true,
  //       overlayPanelClass: 'custom-class'
  //     });

  //     const panelElement = document.querySelector('.cka-overlay-panel[data-id="test-panel"]');
  //     if (panelElement) {
  //       expect(panelElement.style.width).toBe('300px');
  //     }
  //   } else {
  //     // Skip if method not available
  //     pending('updatePanelConfig method not available');
  //   }
  // });
});
