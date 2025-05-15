import { AlightPositionManager, Positionable, PositionConfig } from '../alight-position-manager';

// Helper to create a new spy-free test environment for autoFlip tests
function createTestEnvironment() {
  // Create new DOM elements
  const element = document.createElement('div');
  const trigger = document.createElement('div');
  document.body.appendChild(trigger);
  document.body.appendChild(element);

  // Create basic mocks once
  const triggerRect = {
    top: 100,
    left: 100,
    bottom: 150,
    right: 150,
    width: 50,
    height: 50
  } as DOMRect;

  const elementRect = {
    width: 100,
    height: 100,
    top: 0,
    left: 0,
    bottom: 100,
    right: 100
  } as DOMRect;

  return { element, trigger, triggerRect, elementRect };
}

describe('AlightPositionManager', () => {
  let positionManager: AlightPositionManager;
  let mockElement: HTMLElement;
  let mockTrigger: HTMLElement;
  let mockParent: HTMLElement;
  let mockScrollParent: HTMLElement;
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  beforeEach(() => {
    // Store original window properties
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;

    // Mock window.innerWidth and innerHeight using Object.defineProperty
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: 1000
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: 1000
    });

    // Reset singleton instance
    (AlightPositionManager as any).instance = null;
    positionManager = AlightPositionManager.getInstance();

    // Create mock DOM elements
    mockElement = document.createElement('div');
    mockTrigger = document.createElement('div');
    mockParent = document.createElement('div');
    mockScrollParent = document.createElement('div');

    // Append to DOM for realistic testing
    document.body.appendChild(mockParent);
    document.body.appendChild(mockTrigger);
    mockParent.appendChild(mockElement);

    // Mock getBoundingClientRect
    spyOn(mockTrigger, 'getBoundingClientRect').and.returnValue({
      top: 100,
      left: 100,
      bottom: 150,
      right: 150,
      width: 50,
      height: 50
    } as DOMRect);

    spyOn(mockElement, 'getBoundingClientRect').and.returnValue({
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      bottom: 100,
      right: 100
    } as DOMRect);

    spyOn(mockScrollParent, 'getBoundingClientRect').and.returnValue({
      top: 0,
      left: 0,
      bottom: 500,
      right: 500,
      width: 500,
      height: 500
    } as DOMRect);

    // Mock other window properties
    spyOnProperty(window, 'scrollX', 'get').and.returnValue(0);
    spyOnProperty(window, 'scrollY', 'get').and.returnValue(0);

    // Mock computed styles for scroll parent
    spyOn(window, 'getComputedStyle').and.callFake((el: HTMLElement) => {
      if (el === mockScrollParent) {
        return { overflowY: 'auto', overflowX: 'auto' } as CSSStyleDeclaration;
      }
      return { overflowY: 'visible', overflowX: 'visible' } as CSSStyleDeclaration;
    });

    // Mock scroll parent properties
    spyOnProperty(mockScrollParent, 'scrollHeight', 'get').and.returnValue(600);
    spyOnProperty(mockScrollParent, 'clientHeight', 'get').and.returnValue(500);
  });

  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
    // Clean up event listeners
    positionManager['components'].clear();
    positionManager['activeComponents'].clear();
    // Reset zIndexCounter
    positionManager['zIndexCounter'] = 1000;
    // Restore original window properties
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: originalInnerWidth
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      writable: true,
      value: originalInnerHeight
    });
  });

  describe('getInstance', () => {
    it('should return the same instance (singleton)', () => {
      const instance1 = AlightPositionManager.getInstance();
      const instance2 = AlightPositionManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize event listeners', () => {
      spyOn(window, 'addEventListener').and.callThrough();
      (AlightPositionManager as any).instance = null;
      AlightPositionManager.getInstance();
      expect(window.addEventListener).toHaveBeenCalledWith('scroll', jasmine.any(Function), true);
      expect(window.addEventListener).toHaveBeenCalledWith('resize', jasmine.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('focus', jasmine.any(Function));
    });
  });

  describe('getScrollParent', () => {
    it('should return document.body if no scrollable parent', () => {
      const result = positionManager['getScrollParent'](mockElement);
      expect(result).toBe(document.body);
    });

    it('should return scrollable parent', () => {
      mockParent.appendChild(mockElement);
      mockScrollParent.appendChild(mockParent);
      document.body.appendChild(mockScrollParent);
      const result = positionManager['getScrollParent'](mockElement);
      expect(result).toBe(mockScrollParent);
    });

    it('should handle null element', () => {
      const result = positionManager['getScrollParent'](null as any);
      expect(result).toBe(document.body);
    });
  });

  describe('calculatePosition', () => {
    const positions: PositionConfig['position'][] = [
      'top', 'bottom', 'left', 'right', 'center',
      'top-left', 'top-right', 'bottom-left', 'bottom-right'
    ];

    positions.forEach(position => {
      it(`should calculate position for ${position}`, () => {
        const config: PositionConfig = { position, offset: 10 };
        const { top, left } = positionManager['calculatePosition'](mockTrigger, mockElement, config);

        switch (position) {
          case 'top':
            expect(top).toBe(100 - 100 - 10); // trigger.top - element.height - offset
            expect(left).toBe(100 - (100 - 50) / 2); // aligned center
            break;
          case 'bottom':
            expect(top).toBe(150 + 10); // trigger.bottom + offset
            expect(left).toBe(100 - (100 - 50) / 2);
            break;
          case 'left':
            expect(top).toBe(100 - (100 - 50) / 2);
            expect(left).toBe(100 - 100 - 10); // trigger.left - element.width - offset
            break;
          case 'right':
            expect(top).toBe(100 - (100 - 50) / 2);
            expect(left).toBe(150 + 10); // trigger.right + offset
            break;
          case 'center':
            expect(top).toBe((1000 - 100) / 2); // (window.innerHeight - element.height) / 2
            expect(left).toBe((1000 - 100) / 2);
            break;
          case 'top-left':
            expect(top).toBe(100 - 100 - 10);
            expect(left).toBe(100);
            break;
          case 'top-right':
            expect(top).toBe(100 - 100 - 10);
            expect(left).toBe(150 - 100);
            break;
          case 'bottom-left':
            expect(top).toBe(150 + 10);
            expect(left).toBe(100);
            break;
          case 'bottom-right':
            expect(top).toBe(150 + 10);
            expect(left).toBe(150 - 100);
            break;
        }
      });
    });

    it('should apply alignment settings', () => {
      const config: PositionConfig = { position: 'bottom', alignment: 'start', offset: 10 };
      const { left } = positionManager['calculatePosition'](mockTrigger, mockElement, config);
      expect(left).toBe(100); // Aligned to start
    });

    it('should apply end alignment settings', () => {
      const config: PositionConfig = { position: 'bottom', alignment: 'end', offset: 10 };
      const { left } = positionManager['calculatePosition'](mockTrigger, mockElement, config);
      expect(left).toBe(100 + 50 - 100); // trigger.left + trigger.width - element.width
    });

    it('should not apply data-flipped attributes when no flip occurs', () => {
      // Enough space everywhere
      const config: PositionConfig = { position: 'bottom', autoFlip: true, offset: 10 };
      positionManager['calculatePosition'](mockTrigger, mockElement, config);
      expect(mockElement.getAttribute('data-flipped')).toBe(null);
      expect(mockElement.getAttribute('data-flipped-to')).toBe(null);
    });

    it('should constrain to viewport', () => {
      Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: 200 });
      const config: PositionConfig = { position: 'bottom', constrainToViewport: true, offset: 10 };
      const { top } = positionManager['calculatePosition'](mockTrigger, mockElement, config);
      expect(top).toBeLessThanOrEqual(200 - 100); // Constrained to viewport
    });

    it('should constrain to scroll parent', () => {
      mockScrollParent.appendChild(mockTrigger);
      const config: PositionConfig = { position: 'bottom', constrainToViewport: true, offset: 10 };
      const { top, left } = positionManager['calculatePosition'](mockTrigger, mockElement, config);
      expect(top).toBeLessThanOrEqual(500 - 100); // Constrained to scroll parent
      expect(left).toBeLessThanOrEqual(500 - 100);
    });

    it('should handle null scroll parent when constraining', () => {
      // Force getScrollParent to return null for this test
      spyOn(positionManager as any, 'getScrollParent').and.returnValue(null);
      const config: PositionConfig = { position: 'bottom', constrainToViewport: true, offset: 10 };
      const { top, left } = positionManager['calculatePosition'](mockTrigger, mockElement, config);
      // Should use viewport dimensions instead
      expect(top).toBeLessThanOrEqual(1000 - 100);
      expect(left).toBeLessThanOrEqual(1000 - 100);
    });
  });

  // Tests for autoFlip - using alternatives to spy on window properties
  describe('autoFlip', () => {
    it('should handle autoFlip for bottom to top', () => {
      // Create a modified instance with a custom viewport height
      Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: 200 });

      const config: PositionConfig = { position: 'bottom', autoFlip: true, offset: 10 };
      const { top } = positionManager['calculatePosition'](mockTrigger, mockElement, config);
      expect(top).toBe(100 - 100 - 10); // Flipped to top: trigger.top - element.height - offset
      expect(mockElement.getAttribute('data-flipped')).toBe('true');
      expect(mockElement.getAttribute('data-flipped-to')).toBe('top');
    });

    it('should handle autoFlip for right to left', () => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 200 });
      const config: PositionConfig = { position: 'right', autoFlip: true, offset: 10 };
      const { left } = positionManager['calculatePosition'](mockTrigger, mockElement, config);
      expect(left).toBe(100 - 100 - 10); // Flipped to left
      expect(mockElement.getAttribute('data-flipped')).toBe('true');
      expect(mockElement.getAttribute('data-flipped-to')).toBe('left');
    });
  });

  // Test other auto-flip scenarios without spying on window properties
  describe('autoFlip scenarios', () => {
    let testFixture: ReturnType<typeof createTestEnvironment>;

    beforeEach(() => {
      testFixture = createTestEnvironment();
    });

    afterEach(() => {
      // Clean up
      testFixture.element.remove();
      testFixture.trigger.remove();
    });

    // Test flipping bottom-right to top-right with mocks directly on calculatePosition
    it('should flip bottom-right to top-right when not enough space below', () => {
      // Create a custom mock for testing this scenario without spies
      const spy1 = jasmine.createSpy('getBoundingClientRect1').and.returnValue(testFixture.triggerRect);
      const spy2 = jasmine.createSpy('getBoundingClientRect2').and.returnValue(testFixture.elementRect);

      testFixture.trigger.getBoundingClientRect = spy1;
      testFixture.element.getBoundingClientRect = spy2;

      // Explicitly set innerHeight for this test
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        writable: true,
        value: 200 // Not enough space below
      });

      const config: PositionConfig = { position: 'bottom-right', autoFlip: true, offset: 10 };

      // Call calculatePosition directly
      const result = positionManager['calculatePosition'](testFixture.trigger, testFixture.element, config);

      // Verify the element was flipped
      expect(testFixture.element.getAttribute('data-flipped')).toBe('true');
      expect(testFixture.element.getAttribute('data-flipped-to')).toBe('top-right');
      expect(result.top).toBe(100 - 100 - 10); // trigger.top - element.height - offset
    });

    // Test flipping bottom-left to top-left
    it('should flip bottom-left to top-left when not enough space below', () => {
      // Create custom mocks
      const spy1 = jasmine.createSpy('getBoundingClientRect1').and.returnValue(testFixture.triggerRect);
      const spy2 = jasmine.createSpy('getBoundingClientRect2').and.returnValue(testFixture.elementRect);

      testFixture.trigger.getBoundingClientRect = spy1;
      testFixture.element.getBoundingClientRect = spy2;

      // Explicitly set innerHeight
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        writable: true,
        value: 200 // Not enough space below
      });

      const config: PositionConfig = { position: 'bottom-left', autoFlip: true, offset: 10 };

      // Call calculatePosition directly
      const result = positionManager['calculatePosition'](testFixture.trigger, testFixture.element, config);

      // Verify the element was flipped
      expect(testFixture.element.getAttribute('data-flipped')).toBe('true');
      expect(testFixture.element.getAttribute('data-flipped-to')).toBe('top-left');
      expect(result.top).toBe(100 - 100 - 10); // trigger.top - element.height - offset
    });

    // Test flipping top-right to bottom-right
    it('should flip top-right to bottom-right when not enough space above', () => {
      // Create custom mocks
      const spy1 = jasmine.createSpy('getBoundingClientRect1').and.returnValue(testFixture.triggerRect);
      const spy2 = jasmine.createSpy('getBoundingClientRect2').and.returnValue(testFixture.elementRect);

      testFixture.trigger.getBoundingClientRect = spy1;
      testFixture.element.getBoundingClientRect = spy2;

      // Override return value of scrollY for this test only
      const scrollY = 50; // Not enough space above
      const originalCalculatePosition = positionManager['calculatePosition'];

      spyOn(positionManager as any, 'calculatePosition').and.callFake((trigger, element, config) => {
        // Create a custom environment just for this test
        const customScrollY = scrollY;
        const windowScrollY = window.scrollY;

        try {
          // Temporarily override scrollY just for this function call
          Object.defineProperty(window, 'scrollY', { get: () => customScrollY });
          return originalCalculatePosition.call(positionManager, trigger, element, config);
        } finally {
          // Restore original scrollY
          Object.defineProperty(window, 'scrollY', { get: () => windowScrollY });
        }
      });

      const config: PositionConfig = { position: 'top-right', autoFlip: true, offset: 10 };

      // Call calculatePosition which will call our spy
      const result = positionManager['calculatePosition'](testFixture.trigger, testFixture.element, config);

      // Verify properties set by calculatePosition
      expect(testFixture.element.getAttribute('data-flipped')).toBe('true');
      expect(testFixture.element.getAttribute('data-flipped-to')).toBe('bottom-right');
    });

    // Test flipping top-left to bottom-left
    it('should flip top-left to bottom-left when not enough space above', () => {
      // Create custom mocks
      const spy1 = jasmine.createSpy('getBoundingClientRect1').and.returnValue(testFixture.triggerRect);
      const spy2 = jasmine.createSpy('getBoundingClientRect2').and.returnValue(testFixture.elementRect);

      testFixture.trigger.getBoundingClientRect = spy1;
      testFixture.element.getBoundingClientRect = spy2;

      // For this test, we'll patch scrollY without spyOnProperty
      const originalScrollY = Object.getOwnPropertyDescriptor(window, 'scrollY');
      Object.defineProperty(window, 'scrollY', {
        configurable: true,
        get: () => 50 // Not enough space above
      });

      const config: PositionConfig = { position: 'top-left', autoFlip: true, offset: 10 };

      try {
        // Call calculatePosition directly
        const result = positionManager['calculatePosition'](testFixture.trigger, testFixture.element, config);

        // Verify the element was flipped
        expect(testFixture.element.getAttribute('data-flipped')).toBe('true');
        expect(testFixture.element.getAttribute('data-flipped-to')).toBe('bottom-left');
      } finally {
        // Restore original scrollY
        if (originalScrollY) {
          Object.defineProperty(window, 'scrollY', originalScrollY);
        }
      }
    });

    // Test horizontal flipping with scrollX offset
    it('should handle scrollX offset when flipping left to right', () => {
      // Create custom mocks
      const spy1 = jasmine.createSpy('getBoundingClientRect1').and.returnValue(testFixture.triggerRect);
      const spy2 = jasmine.createSpy('getBoundingClientRect2').and.returnValue(testFixture.elementRect);

      testFixture.trigger.getBoundingClientRect = spy1;
      testFixture.element.getBoundingClientRect = spy2;

      // For this test, we'll patch scrollX without using spyOnProperty
      const originalScrollX = Object.getOwnPropertyDescriptor(window, 'scrollX');
      Object.defineProperty(window, 'scrollX', {
        configurable: true,
        get: () => 110 // Element would go off left edge
      });

      const config: PositionConfig = { position: 'left', autoFlip: true, offset: 10 };

      try {
        // Call calculatePosition directly
        const result = positionManager['calculatePosition'](testFixture.trigger, testFixture.element, config);

        // Verify the element was flipped
        expect(testFixture.element.getAttribute('data-flipped')).toBe('true');
        expect(testFixture.element.getAttribute('data-flipped-to')).toBe('right');
        expect(result.left).toBe(150 + 10 + 110); // trigger.right + offset + scrollX
      } finally {
        // Restore original scrollX
        if (originalScrollX) {
          Object.defineProperty(window, 'scrollX', originalScrollX);
        }
      }
    });
  });

  describe('updatePosition', () => {
    it('should update element position styles', () => {
      positionManager.register('test-id', mockElement, mockTrigger, { position: 'bottom' });
      expect(mockElement.style.position).toBe('absolute');
      expect(mockElement.style.top).toBeDefined();
      expect(mockElement.style.left).toBeDefined();
    });

    it('should do nothing if component not found', () => {
      spyOn(positionManager as any, 'calculatePosition');
      positionManager['updatePosition']('non-existent-id');
      expect(positionManager['calculatePosition']).not.toHaveBeenCalled();
    });

    it('should unregister if elements no longer in DOM', () => {
      positionManager.register('test-id', mockElement, mockTrigger);
      spyOn(document.body, 'contains').and.returnValue(false);
      spyOn(positionManager, 'unregister');
      positionManager['updatePosition']('test-id');
      expect(positionManager.unregister).toHaveBeenCalledWith('test-id');
    });

    it('should not apply z-index if component is not active', () => {
      positionManager.register('test-id', mockElement, mockTrigger);
      positionManager['activeComponents'].delete('test-id');
      mockElement.style.zIndex = '';
      positionManager['updatePosition']('test-id');
      expect(mockElement.style.zIndex).toBe('');
    });
  });

  describe('register', () => {
    it('should register a component and apply position', () => {
      spyOn(mockElement.style, 'top').and.callThrough();
      positionManager.register('test-id', mockElement, mockTrigger, { position: 'bottom' });
      expect(mockElement.style.position).toBe('absolute');
      expect(mockElement.style.top).toBeDefined();
      expect(mockElement.style.zIndex).toBe('1000');
    });

    it('should handle appendTo body', () => {
      positionManager.register('test-id', mockElement, mockTrigger, { appendTo: 'body' });
      expect(mockElement.parentElement).toBe(document.body);
    });

    it('should handle appendTo target', () => {
      positionManager.register('test-id', mockElement, mockTrigger, { appendTo: 'target' });
      expect(mockElement.parentElement).toBe(mockTrigger);
    });

    it('should handle appendTo custom element', () => {
      const customParent = document.createElement('div');
      document.body.appendChild(customParent);
      positionManager.register('test-id', mockElement, mockTrigger, { appendTo: customParent });
      expect(mockElement.parentElement).toBe(customParent);
    });

    it('should not append to target if trigger is missing', () => {
      const originalParent = mockElement.parentElement;
      positionManager.register('test-id', mockElement, null as any, { appendTo: 'target' });
      expect(mockElement.parentElement).toBe(originalParent);
    });

    it('should start animation loop for followTrigger', () => {
      let rafCallback: FrameRequestCallback | null = null;
      spyOn(window, 'requestAnimationFrame').and.callFake((cb) => {
        rafCallback = cb;
        return 1;
      });
      positionManager.register('test-id', mockElement, mockTrigger, { followTrigger: true });
      expect(window.requestAnimationFrame).toHaveBeenCalled();
      // Simulate one frame to verify position update without infinite loop
      if (rafCallback) {
        rafCallback(0);
        expect(mockElement.style.top).toBeDefined();
      }
    });

    it('should manage z-index for multiple components', () => {
      const element2 = document.createElement('div');
      document.body.appendChild(element2);
      positionManager.register('id1', mockElement, mockTrigger, {});
      positionManager.register('id2', element2, mockTrigger, {});
      expect(mockElement.style.zIndex).toBe('999'); // Decremented when id2 is registered
      expect(element2.style.zIndex).toBe('1001'); // New component gets incremented z-index
    });
  });

  describe('unregister', () => {
    it('should unregister and clean up', () => {
      positionManager.register('test-id', mockElement, mockTrigger, {});
      positionManager.unregister('test-id');
      expect(positionManager['components'].has('test-id')).toBe(false);
      expect(positionManager['activeComponents'].has('test-id')).toBe(false);
      expect(mockElement.parentElement).toBe(mockParent); // Restored to original parent
    });

    it('should cancel animation loop for followTrigger', () => {
      spyOn(window, 'cancelAnimationFrame').and.callThrough();
      positionManager.register('test-id', mockElement, mockTrigger, { followTrigger: true });
      positionManager.unregister('test-id');
      expect(window.cancelAnimationFrame).toHaveBeenCalled();
    });

    it('should handle elements not in DOM', () => {
      positionManager.register('test-id', mockElement, mockTrigger, {});
      mockElement.remove();
      positionManager['updateAllPositions']();
      expect(positionManager['components'].has('test-id')).toBe(false);
    });

    it('should handle case when component does not exist', () => {
      // Should not throw error
      positionManager.unregister('non-existent-id');
    });

    it('should handle case when original parent is not in DOM', () => {
      positionManager.register('test-id', mockElement, mockTrigger, { appendTo: 'body' });
      mockParent.remove(); // Remove original parent from DOM
      positionManager.unregister('test-id');
      // Should not try to append to removed parent
      expect(mockElement.parentElement).toBe(document.body);
    });

    it('should handle errors when restoring to original parent', () => {
      positionManager.register('test-id', mockElement, mockTrigger, { appendTo: 'body' });
      const mockError = new Error('Mock appendChild error');
      spyOn(mockParent, 'appendChild').and.throwError(mockError);
      // Should not throw error
      positionManager.unregister('test-id');
    });
  });

  describe('updateConfig', () => {
    it('should update configuration and reposition', () => {
      positionManager.register('test-id', mockElement, mockTrigger, { position: 'bottom', offset: 10 });
      const initialTop = mockElement.style.top;
      positionManager.updateConfig('test-id', { position: 'top', offset: 10 });
      expect(positionManager['components'].get('test-id')!.config.position).toBe('top');
      expect(mockElement.style.top).not.toBe(initialTop);
      expect(mockElement.style.top).toBe(`${100 - 100 - 10}px`); // trigger.top - element.height - offset
    });

    it('should update z-index counter', () => {
      positionManager.register('test-id', mockElement, mockTrigger, {});
      positionManager.updateConfig('test-id', { zIndex: 2000 });
      expect(positionManager['zIndexCounter']).toBe(2001);
      expect(mockElement.style.zIndex).toBe('2000');
    });

    it('should do nothing if component not found', () => {
      spyOn(positionManager as any, 'updatePosition');
      positionManager.updateConfig('non-existent-id', { position: 'top' });
      expect(positionManager['updatePosition']).not.toHaveBeenCalled();
    });

    it('should not update z-index counter if component not active', () => {
      positionManager.register('test-id', mockElement, mockTrigger, {});
      positionManager['activeComponents'].delete('test-id');
      const initialCounter = positionManager['zIndexCounter'];
      positionManager.updateConfig('test-id', { zIndex: 2000 });
      expect(positionManager['zIndexCounter']).toBe(initialCounter);
    });
  });

  describe('bringToFront', () => {
    it('should update z-index and mark as active', () => {
      positionManager.register('test-id', mockElement, mockTrigger, {});
      positionManager.bringToFront('test-id');
      expect(mockElement.style.zIndex).toBe('1001');
      expect(positionManager['activeComponents'].has('test-id')).toBe(true);
    });

    it('should do nothing if component not found', () => {
      spyOn(positionManager, 'getNextZIndex');
      positionManager.bringToFront('non-existent-id');
      expect(positionManager.getNextZIndex).not.toHaveBeenCalled();
    });

    it('should do nothing if element is null', () => {
      positionManager.register('test-id', mockElement, mockTrigger, {});
      const component = positionManager['components'].get('test-id')!;
      component.element = null as any;
      spyOn(positionManager, 'getNextZIndex');
      positionManager.bringToFront('test-id');
      expect(positionManager.getNextZIndex).not.toHaveBeenCalled();
    });
  });

  describe('Positionable decorator', () => {
    class TestComponent {
      element: HTMLElement = mockElement;
      trigger: HTMLElement = mockTrigger;
      show() { }
      hide() { }
      destroy() { }
    }

    @Positionable({ position: 'bottom' })
    class DecoratedComponent extends TestComponent { }

    it('should register on show', () => {
      const decorated = new DecoratedComponent();
      spyOn(positionManager, 'register');
      spyOn(positionManager, 'bringToFront');

      decorated.show();
      expect(positionManager.register).toHaveBeenCalledWith(
        jasmine.any(String),
        mockElement,
        mockTrigger,
        jasmine.objectContaining({ position: 'bottom' })
      );
      expect(positionManager.bringToFront).toHaveBeenCalled();
    });

    it('should unregister on hide', () => {
      const decorated = new DecoratedComponent();
      spyOn(positionManager, 'unregister');

      decorated.hide();
      expect(positionManager.unregister).toHaveBeenCalled();
    });

    it('should unregister on destroy', () => {
      const decorated = new DecoratedComponent();
      spyOn(positionManager, 'unregister');

      decorated.destroy();
      expect(positionManager.unregister).toHaveBeenCalled();
    });

    it('should warn if element or trigger is missing', () => {
      const decorated = new DecoratedComponent();
      spyOn(console, 'warn');
      decorated.element = null as any;

      decorated.show();
      expect(console.warn).toHaveBeenCalledWith('Element or trigger is not defined on this component.');
    });

    it('should warn if position manager is missing on hide', () => {
      const decorated = new DecoratedComponent();
      spyOn(console, 'warn');
      (decorated as any).positionManager = null;

      decorated.hide();
      expect(console.warn).toHaveBeenCalledWith('Position manager is not defined on this component.');
    });
  });

  // Test super method handling in a separate describe block
  describe('Positionable decorator super method handling', () => {
    it('should handle missing super methods', () => {
      // Create a new decorated class without super methods
      const TestClassWithoutMethods = function () {
        this.element = mockElement;
        this.trigger = mockTrigger;
      };

      const DecoratedTestClass = Positionable({ position: 'bottom' })(TestClassWithoutMethods as any);
      const instance = new DecoratedTestClass();

      // Register spies here to avoid conflicts
      spyOn(positionManager, 'register');
      spyOn(positionManager, 'unregister');
      spyOn(positionManager, 'bringToFront');

      // Test show without super.show
      instance.show();
      expect(positionManager.register).toHaveBeenCalled();

      // Test hide without super.hide
      instance.hide();
      expect(positionManager.unregister).toHaveBeenCalled();

      // Test destroy without super.destroy
      instance.destroy();
      expect(positionManager.unregister).toHaveBeenCalled();
    });

    it('should handle missing positionManager on destroy', () => {
      // Create a new class with destroy method but we'll remove positionManager
      class TestClass {
        element = mockElement;
        trigger = mockTrigger;
        destroy() { }
      }

      const DecoratedTestClass = Positionable({ position: 'bottom' })(TestClass);
      const instance = new DecoratedTestClass();

      // Spy on the destroy method
      spyOn(instance, 'destroy').and.callThrough();

      // Remove positionManager
      (instance as any).positionManager = null;

      // Should not throw an error
      instance.destroy();
      expect(instance.destroy).toHaveBeenCalled();
    });
  });
});
