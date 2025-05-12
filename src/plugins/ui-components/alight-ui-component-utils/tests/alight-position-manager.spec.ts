import { AlightPositionManager, Positionable, PositionConfig } from '../alight-position-manager';

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

    it('should handle autoFlip for bottom to top', () => {
      Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: 200 });
      const config: PositionConfig = { position: 'bottom', autoFlip: true, offset: 10 };
      const { top } = positionManager['calculatePosition'](mockTrigger, mockElement, config);
      expect(top).toBe(100 - 100 - 10); // Flipped to top
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
  });

  describe('bringToFront', () => {
    it('should update z-index and mark as active', () => {
      positionManager.register('test-id', mockElement, mockTrigger, {});
      positionManager.bringToFront('test-id');
      expect(mockElement.style.zIndex).toBe('1001');
      expect(positionManager['activeComponents'].has('test-id')).toBe(true);
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

    let decorated: DecoratedComponent;

    beforeEach(() => {
      decorated = new DecoratedComponent();
      spyOn(decorated, 'show').and.callThrough();
      spyOn(decorated, 'hide').and.callThrough();
      spyOn(decorated, 'destroy').and.callThrough();
      spyOn(positionManager, 'register').and.callThrough();
      spyOn(positionManager, 'unregister').and.callThrough();
      spyOn(positionManager, 'bringToFront').and.callThrough();
    });

    it('should register on show', () => {
      decorated.show();
      expect(positionManager.register).toHaveBeenCalledWith(
        jasmine.any(String),
        mockElement,
        mockTrigger,
        jasmine.objectContaining({ position: 'bottom', zIndex: jasmine.any(Number) })
      );
      expect(positionManager.bringToFront).toHaveBeenCalled();
    });

    it('should unregister on hide', () => {
      decorated.hide();
      expect(positionManager.unregister).toHaveBeenCalledWith(jasmine.any(String));
    });

    it('should unregister on destroy', () => {
      decorated.destroy();
      expect(positionManager.unregister).toHaveBeenCalledWith(jasmine.any(String));
    });

    it('should warn if element or trigger is missing', () => {
      spyOn(console, 'warn');
      decorated.element = null as any;
      decorated.show();
      expect(console.warn).toHaveBeenCalledWith('Element or trigger is not defined on this component.');
    });
  });
});
