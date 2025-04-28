// src/plugins/ui-components/alight-ui-component-utils/tests/alight-position-manager.spec.ts
import { AlightPositionManager, Positionable, PositionConfig } from './../alight-position-manager';

describe('AlightPositionManager', () => {
  let positionManager: AlightPositionManager;
  let trigger: HTMLElement;
  let element: HTMLElement;
  let scrollX: number;
  let scrollY: number;
  let originalTimeout: number;
  let requestAnimationFrameIds: number[] = [];

  beforeEach(() => {
    // Store original timeout and increase for this test suite
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

    // Install fake timers
    jasmine.clock().install();

    // Mock window properties and methods
    scrollX = 0;
    scrollY = 0;
    Object.defineProperty(window, 'scrollX', { get: () => scrollX });
    Object.defineProperty(window, 'scrollY', { get: () => scrollY });
    Object.defineProperty(window, 'innerWidth', { get: () => 1024 });
    Object.defineProperty(window, 'innerHeight', { get: () => 768 });

    // Mock event listeners
    const originalAddEventListener = window.addEventListener;
    const originalRemoveEventListener = window.removeEventListener;
    const eventListeners: Record<string, Function[]> = {};

    spyOn(window, 'addEventListener').and.callFake((event, handler) => {
      if (!eventListeners[event]) {
        eventListeners[event] = [];
      }
      eventListeners[event].push(handler as Function);
    });

    spyOn(window, 'removeEventListener').and.callFake((event, handler) => {
      if (eventListeners[event]) {
        eventListeners[event] = eventListeners[event].filter(h => h !== handler);
      }
    });

    // Better requestAnimationFrame mock that uses timeouts
    spyOn(window, 'requestAnimationFrame').and.callFake(cb => {
      const id = setTimeout(() => cb(performance.now()), 0);
      requestAnimationFrameIds.push(id);
      return id;
    });

    spyOn(window, 'cancelAnimationFrame').and.callFake(id => {
      clearTimeout(id as any);
      requestAnimationFrameIds = requestAnimationFrameIds.filter(i => i !== id);
    });

    // Reset the singleton instance before each test
    (AlightPositionManager as any).instance = null;
    positionManager = AlightPositionManager.getInstance();

    // Setup DOM elements
    trigger = document.createElement('div');
    element = document.createElement('div') as any;
    document.body.appendChild(trigger);
    document.body.appendChild(element);

    // Mock getBoundingClientRect
    spyOn(trigger, 'getBoundingClientRect').and.returnValue({
      top: 100,
      right: 200,
      bottom: 150,
      left: 100,
      width: 100,
      height: 50,
      x: 100,
      y: 100
    } as DOMRect);

    spyOn(element, 'getBoundingClientRect').and.returnValue({
      top: 0,
      right: 100,
      bottom: 100,
      left: 0,
      width: 100,
      height: 100,
      x: 0,
      y: 0
    } as DOMRect);

    // Mock contains to prevent DOM-related errors
    spyOn(document.body, 'contains').and.returnValue(true);
  });

  afterEach(() => {
    // Clean up DOM elements
    if (document.body.contains(trigger)) {
      document.body.removeChild(trigger);
    }
    if (document.body.contains(element)) {
      document.body.removeChild(element);
    }

    // Clean up any other elements
    document.body.innerHTML = '';

    // Clear any pending timeouts
    jasmine.clock().tick(1000); // Advance clock to clear any pending timeouts
    jasmine.clock().uninstall();

    // Clear any remaining animation frame callbacks
    requestAnimationFrameIds.forEach(id => {
      clearTimeout(id as any);
    });
    requestAnimationFrameIds = [];

    // Reset the singleton instance
    (AlightPositionManager as any).instance = null;

    // Restore original timeout
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  describe('Singleton Instance', () => {
    it('should create only one instance', () => {
      const instance1 = AlightPositionManager.getInstance();
      const instance2 = AlightPositionManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize with window event listeners', () => {
      AlightPositionManager.getInstance();
      expect(window.addEventListener).toHaveBeenCalledWith('scroll', jasmine.any(Function), true);
      expect(window.addEventListener).toHaveBeenCalledWith('resize', jasmine.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('focus', jasmine.any(Function));
    });
  });

  describe('Component Registration', () => {
    it('should register a component with default config', () => {
      positionManager.register('test', element, trigger);
      jasmine.clock().tick(100);
      expect(element.style.position).toBe('absolute');
    });

    it('should handle followTrigger option', () => {
      positionManager.register('test', element, trigger, { followTrigger: true });
      jasmine.clock().tick(100);
      expect(window.requestAnimationFrame).toHaveBeenCalled();
    });

    it('should update z-index when registering', () => {
      const initialZIndex = positionManager.getNextZIndex();
      positionManager.register('test', element, trigger);
      expect(positionManager.getNextZIndex()).toBeGreaterThan(initialZIndex);
    });

    it('should handle appendTo body option', () => {
      spyOn(document.body, 'appendChild').and.callThrough();
      positionManager.register('test', element, trigger, { appendTo: 'body' });
      jasmine.clock().tick(100);
      expect(document.body.appendChild).toHaveBeenCalledWith(element);
    });

    it('should handle appendTo target option', () => {
      spyOn(trigger, 'appendChild').and.callThrough();
      positionManager.register('test', element, trigger, { appendTo: 'target' });
      jasmine.clock().tick(100);
      expect(trigger.appendChild).toHaveBeenCalledWith(element);
    });

    it('should handle appendTo HTMLElement option', () => {
      const container = document.createElement('div');
      spyOn(container, 'appendChild').and.callThrough();
      positionManager.register('test', element, trigger, { appendTo: container });
      jasmine.clock().tick(100);
      expect(container.appendChild).toHaveBeenCalledWith(element);
    });

    it('should handle reregistering a component', () => {
      positionManager.register('test', element, trigger);
      const newElement = document.createElement('div');
      spyOn(positionManager, 'unregister').and.callThrough();
      positionManager.register('test', newElement, trigger);
      jasmine.clock().tick(100);
      expect(positionManager.unregister).toHaveBeenCalledWith('test');
    });
  });

  describe('Position Calculations', () => {
    const testPositions = [
      'top', 'bottom', 'left', 'right', 'center',
      'top-left', 'top-right', 'bottom-left', 'bottom-right'
    ] as const;

    testPositions.forEach(position => {
      it(`should calculate ${position} position correctly`, () => {
        positionManager.register('test', element, trigger, { position });
        jasmine.clock().tick(100);
        expect(element.style.position).toBe('absolute');
        expect(element.style.top).toMatch(/^\d+px$/);
        expect(element.style.left).toMatch(/^\d+px$/);
      });
    });

    it('should handle autoFlip when not enough space below', () => {
      // Mock viewport to have limited space below the trigger
      Object.defineProperty(window, 'innerHeight', { get: () => 160 }); // Just enough to fit trigger at 100-150, not enough for element 

      positionManager.register('test', element, trigger, {
        position: 'bottom',
        autoFlip: true
      });

      jasmine.clock().tick(100);
      expect(element.getAttribute('data-flipped')).toBe('true');
      expect(element.getAttribute('data-flipped-to')).toBe('top');
    });

    it('should handle autoFlip when not enough space above', () => {
      // Move trigger to top of viewport
      (trigger.getBoundingClientRect as jasmine.Spy).and.returnValue({
        top: 10,
        right: 200,
        bottom: 60,
        left: 100,
        width: 100,
        height: 50,
        x: 100,
        y: 10
      } as DOMRect);

      positionManager.register('test', element, trigger, {
        position: 'top',
        autoFlip: true
      });

      jasmine.clock().tick(100);
      expect(element.getAttribute('data-flipped')).toBe('true');
      expect(element.getAttribute('data-flipped-to')).toBe('bottom');
    });

    it('should handle autoFlip when not enough space on right', () => {
      // Move trigger to right edge of viewport
      Object.defineProperty(window, 'innerWidth', { get: () => 210 }); // Just enough for trigger at 100-200, not enough for element

      positionManager.register('test', element, trigger, {
        position: 'right',
        autoFlip: true
      });

      jasmine.clock().tick(100);
      expect(element.getAttribute('data-flipped')).toBe('true');
      expect(element.getAttribute('data-flipped-to')).toBe('left');
    });

    it('should handle autoFlip when not enough space on left', () => {
      // Move trigger to left edge of viewport
      (trigger.getBoundingClientRect as jasmine.Spy).and.returnValue({
        top: 100,
        right: 110,
        bottom: 150,
        left: 10,
        width: 100,
        height: 50,
        x: 10,
        y: 100
      } as DOMRect);

      positionManager.register('test', element, trigger, {
        position: 'left',
        autoFlip: true
      });

      jasmine.clock().tick(100);
      expect(element.getAttribute('data-flipped')).toBe('true');
      expect(element.getAttribute('data-flipped-to')).toBe('right');
    });

    it('should handle top-right to top-left autoFlip', () => {
      Object.defineProperty(window, 'innerWidth', { get: () => 210 }); // Limited width

      positionManager.register('test', element, trigger, {
        position: 'top-right',
        autoFlip: true
      });

      jasmine.clock().tick(100);
      expect(element.getAttribute('data-flipped')).toBe('true');
      expect(element.getAttribute('data-flipped-to')).toBe('top-left');
    });

    it('should handle bottom-right to bottom-left autoFlip', () => {
      Object.defineProperty(window, 'innerWidth', { get: () => 210 }); // Limited width

      positionManager.register('test', element, trigger, {
        position: 'bottom-right',
        autoFlip: true
      });

      jasmine.clock().tick(100);
      expect(element.getAttribute('data-flipped')).toBe('true');
      expect(element.getAttribute('data-flipped-to')).toBe('bottom-left');
    });

    it('should handle top-left to top-right autoFlip', () => {
      // Move trigger to left edge of viewport
      (trigger.getBoundingClientRect as jasmine.Spy).and.returnValue({
        top: 100,
        right: 110,
        bottom: 150,
        left: 10,
        width: 100,
        height: 50,
        x: 10,
        y: 100
      } as DOMRect);

      positionManager.register('test', element, trigger, {
        position: 'top-left',
        autoFlip: true
      });

      jasmine.clock().tick(100);
      expect(element.getAttribute('data-flipped')).toBe('true');
      expect(element.getAttribute('data-flipped-to')).toBe('top-right');
    });

    it('should handle bottom-left to bottom-right autoFlip', () => {
      // Move trigger to left edge of viewport
      (trigger.getBoundingClientRect as jasmine.Spy).and.returnValue({
        top: 100,
        right: 110,
        bottom: 150,
        left: 10,
        width: 100,
        height: 50,
        x: 10,
        y: 100
      } as DOMRect);

      positionManager.register('test', element, trigger, {
        position: 'bottom-left',
        autoFlip: true
      });

      jasmine.clock().tick(100);
      expect(element.getAttribute('data-flipped')).toBe('true');
      expect(element.getAttribute('data-flipped-to')).toBe('bottom-right');
    });

    it('should remove data-flipped attributes when no flip is needed', () => {
      // First flip it
      Object.defineProperty(window, 'innerHeight', { get: () => 160 });
      positionManager.register('test', element, trigger, {
        position: 'bottom',
        autoFlip: true
      });
      jasmine.clock().tick(100);

      // Then restore space and update
      Object.defineProperty(window, 'innerHeight', { get: () => 768 });

      // Manually trigger updateAllPositions rather than rely on event handlers
      positionManager['updateAllPositions']();
      jasmine.clock().tick(100);

      expect(element.getAttribute('data-flipped')).toBe(null);
      expect(element.getAttribute('data-flipped-to')).toBe(null);
    });

    it('should constrain to viewport when enabled', () => {
      positionManager.register('test', element, trigger, {
        constrainToViewport: true
      });

      jasmine.clock().tick(100);
      expect(element.style.position).toBe('absolute');

      const top = parseInt(element.style.top);
      const left = parseInt(element.style.left);
      expect(top).toBeGreaterThanOrEqual(0);
      expect(left).toBeGreaterThanOrEqual(0);
      expect(top + 100).toBeLessThanOrEqual(window.innerHeight); // 100 is element height
      expect(left + 100).toBeLessThanOrEqual(window.innerWidth); // 100 is element width
    });

    it('should respect alignment setting with start value', () => {
      positionManager.register('test', element, trigger, {
        position: 'bottom',
        alignment: 'start'
      });
      jasmine.clock().tick(100);

      // Start alignment should align left edges for bottom position
      expect(parseInt(element.style.left)).toBe(100); // Same as trigger.left
    });

    it('should respect alignment setting with end value', () => {
      positionManager.register('test', element, trigger, {
        position: 'bottom',
        alignment: 'end'
      });
      jasmine.clock().tick(100);

      // End alignment should align right edges for bottom position
      expect(parseInt(element.style.left)).toBe(100); // trigger.left + (trigger.width - element.width) = 100 + (100 - 100) = 100
    });

    it('should respect alignment setting with center value', () => {
      positionManager.register('test', element, trigger, {
        position: 'bottom',
        alignment: 'center'
      });
      jasmine.clock().tick(100);

      // Center alignment should center element with trigger
      expect(parseInt(element.style.left)).toBe(100); // trigger.left + (trigger.width - element.width)/2 = 100 + (100 - 100)/2 = 100
    });

    it('should use center alignment by default', () => {
      positionManager.register('test', element, trigger, {
        position: 'bottom'
      });
      jasmine.clock().tick(100);

      // Default should be center aligned
      expect(parseInt(element.style.left)).toBe(100); // trigger.left + (trigger.width - element.width)/2 = 100 + (100 - 100)/2 = 100
    });

    it('should use the getScrollParent method correctly', () => {
      // Test with a scrollable parent
      const scrollableParent = document.createElement('div');
      Object.defineProperty(scrollableParent, 'scrollHeight', { value: 2000 });
      Object.defineProperty(scrollableParent, 'clientHeight', { value: 500 });

      // Mock getComputedStyle for the scrollable parent
      spyOn(window, 'getComputedStyle').and.returnValue({
        overflowY: 'auto',
        overflowX: 'hidden'
      } as CSSStyleDeclaration);

      // Set up parent-child relationship
      scrollableParent.appendChild(trigger);
      spyOn(trigger, 'parentElement').and.returnValue(scrollableParent);

      // Test the position calculation with a scrollable parent
      positionManager.register('test', element, trigger, {
        constrainToViewport: true
      });

      jasmine.clock().tick(100);
      expect(element.style.position).toBe('absolute');
    });

    it('should use document.body when no scrollable parent found', () => {
      // Mock getComputedStyle to return non-scrollable values
      spyOn(window, 'getComputedStyle').and.returnValue({
        overflowY: 'visible',
        overflowX: 'visible'
      } as CSSStyleDeclaration);

      // Set up parent-child relationship
      const nonScrollableParent = document.createElement('div');
      nonScrollableParent.appendChild(trigger);
      spyOn(trigger, 'parentElement').and.returnValue(nonScrollableParent);

      // Test the position calculation
      positionManager.register('test', element, trigger, {
        constrainToViewport: true
      });

      jasmine.clock().tick(100);
      expect(element.style.position).toBe('absolute');
    });
  });

  describe('Configuration Updates', () => {
    it('should update component config', () => {
      positionManager.register('test', element, trigger);
      jasmine.clock().tick(100);

      const initialTop = element.style.top;
      positionManager.updateConfig('test', {
        position: 'top',
        offset: 10
      });

      jasmine.clock().tick(100);
      expect(element.style.top).not.toBe(initialTop);
    });

    it('should handle dimension updates with pixel values', () => {
      positionManager.register('test', element, trigger, {
        width: '200px',
        height: '100px'
      });

      jasmine.clock().tick(100);

      positionManager.updateConfig('test', {
        width: '300px',
        height: '150px'
      });

      jasmine.clock().tick(100);
      expect(element.style.width).toBe('300px');
      expect(element.style.height).toBe('150px');
    });

    it('should handle dimension updates with numeric values', () => {
      positionManager.register('test', element, trigger, {
        width: 200,
        height: 100
      });

      jasmine.clock().tick(100);

      positionManager.updateConfig('test', {
        width: 300,
        height: 150
      });

      jasmine.clock().tick(100);
      expect(element.style.width).toBe('300px');
      expect(element.style.height).toBe('150px');
    });

    it('should update z-index correctly', () => {
      positionManager.register('test', element, trigger);
      jasmine.clock().tick(100);

      const newZIndex = 2000;
      positionManager.updateConfig('test', { zIndex: newZIndex });
      jasmine.clock().tick(100);

      expect(element.style.zIndex).toBe(newZIndex.toString());
    });
  });

  describe('Component Cleanup', () => {
    it('should unregister components properly', () => {
      positionManager.register('test', element, trigger, { followTrigger: true });
      jasmine.clock().tick(100);

      positionManager.unregister('test');
      jasmine.clock().tick(100);

      expect(window.cancelAnimationFrame).toHaveBeenCalled();
    });

    it('should handle unregistering non-existent components', () => {
      expect(() => {
        positionManager.unregister('non-existent');
      }).not.toThrow();
    });

    it('should restore element to original parent on unregister', () => {
      const originalParent = document.createElement('div');
      spyOn(originalParent, 'appendChild').and.callThrough();

      // Register component with appendTo: 'body'
      // Store original parent without direct assignment
      const components = (positionManager as any).components;
      positionManager.register('test', element, trigger, { appendTo: 'body' });
      jasmine.clock().tick(100);

      // Set the originalParent manually in the stored component data
      components.get('test').originalParent = originalParent;

      // Unregister should restore to original parent
      positionManager.unregister('test');
      jasmine.clock().tick(100);

      expect(originalParent.appendChild).toHaveBeenCalledWith(element);
    });

    it('should handle errors when restoring element to original parent', () => {
      const originalParent = document.createElement('div');
      spyOn(originalParent, 'appendChild').and.throwError('DOM Exception');

      // Register component with appendTo: 'body'
      // Store original parent without direct assignment
      const components = (positionManager as any).components;
      positionManager.register('test', element, trigger, { appendTo: 'body' });
      jasmine.clock().tick(100);

      // Set the originalParent manually in the stored component data
      components.get('test').originalParent = originalParent;

      // Unregister should not throw even if appendChild throws
      expect(() => {
        positionManager.unregister('test');
        jasmine.clock().tick(100);
      }).not.toThrow();
    });

    it('should clean up when elements are removed from DOM', () => {
      positionManager.register('test', element, trigger);
      jasmine.clock().tick(100);

      // Mock document.body.contains to simulate elements being removed
      (document.body.contains as jasmine.Spy).and.returnValue(false);

      spyOn(positionManager, 'unregister').and.callThrough();
      positionManager['updatePosition']('test');
      jasmine.clock().tick(100);

      expect(positionManager.unregister).toHaveBeenCalledWith('test');
    });
  });

  describe('Z-Index Management', () => {
    it('should increment z-index counter when getting next z-index', () => {
      const initialZIndex = positionManager.getNextZIndex();
      const nextZIndex = positionManager.getNextZIndex();
      expect(nextZIndex).toBe(initialZIndex + 1);
    });

    it('should bring component to front', () => {
      positionManager.register('test1', element, trigger);
      jasmine.clock().tick(100);

      const element2 = document.createElement('div');
      document.body.appendChild(element2);
      positionManager.register('test2', element2, trigger);
      jasmine.clock().tick(100);

      const initialZIndex = parseInt(element.style.zIndex);
      positionManager.bringToFront('test1');
      jasmine.clock().tick(100);

      expect(parseInt(element.style.zIndex)).toBeGreaterThan(initialZIndex);

      // Clean up
      document.body.removeChild(element2);
    });

    it('should handle bringing non-existent component to front', () => {
      expect(() => {
        positionManager.bringToFront('non-existent');
      }).not.toThrow();
    });
  });
});

describe('Positionable Decorator', () => {
  let positionManager: AlightPositionManager;
  let originalTimeout: number;

  // Define the decorator
  @Positionable({
    position: 'bottom',
    offset: 5
  })
  class TestComponent {
    public element: HTMLElement;
    public trigger: HTMLElement;
    public positionManager?: AlightPositionManager;
    public componentId?: string;

    constructor() {
      this.element = document.createElement('div');
      this.trigger = document.createElement('div');
    }

    show() { }
    hide() { }
    destroy() { }
  }

  let component: any;

  beforeEach(() => {
    // Store original timeout and increase for this test
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

    // Reset the singleton instance
    (AlightPositionManager as any).instance = null;
    positionManager = AlightPositionManager.getInstance();

    // Better requestAnimationFrame mock
    spyOn(window, 'requestAnimationFrame').and.callFake(cb => {
      return setTimeout(() => cb(performance.now()), 0);
    });

    component = new TestComponent();

    // Mock the position manager
    spyOn(positionManager, 'register').and.callThrough();
    spyOn(positionManager, 'unregister').and.callThrough();
    spyOn(positionManager, 'bringToFront').and.callThrough();

    // Initialize jasmine clock
    jasmine.clock().install();
  });

  afterEach(() => {
    // Clean up
    component = null;

    // Uninstall jasmine clock
    jasmine.clock().uninstall();

    // Reset the singleton instance
    (AlightPositionManager as any).instance = null;

    // Restore original timeout
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  it('should add position manager to decorated class', () => {
    expect(component.positionManager).toBeTruthy();
    expect(component.componentId).toBeTruthy();
  });

  it('should register component on show', () => {
    component.show();
    jasmine.clock().tick(100);

    expect(component.positionManager.register).toHaveBeenCalled();
    expect(component.positionManager.bringToFront).toHaveBeenCalled();
  });

  it('should unregister component on hide', () => {
    component.hide();
    jasmine.clock().tick(100);

    expect(component.positionManager.unregister).toHaveBeenCalled();
  });

  it('should clean up on destroy', () => {
    component.destroy();
    jasmine.clock().tick(100);

    expect(component.positionManager.unregister).toHaveBeenCalled();
  });

  it('should warn if element is not defined', () => {
    component.element = null;
    spyOn(console, 'warn').and.callThrough();
    component.show();
    jasmine.clock().tick(100);

    expect(console.warn).toHaveBeenCalled();
  });

  it('should warn if trigger is not defined', () => {
    component.trigger = null;
    spyOn(console, 'warn').and.callThrough();
    component.show();
    jasmine.clock().tick(100);

    expect(console.warn).toHaveBeenCalled();
  });

  it('should warn if position manager is not defined on hide', () => {
    component.positionManager = null;
    spyOn(console, 'warn').and.callThrough();
    component.hide();
    jasmine.clock().tick(100);

    expect(console.warn).toHaveBeenCalled();
  });

  it('should call super.show if exists', () => {
    class ChildComponent extends TestComponent {
      override show() {
        super.show();
      }
    }

    const decoratedClass = Positionable({})(ChildComponent);
    const childComponent = new decoratedClass();

    spyOn(TestComponent.prototype, 'show').and.callThrough();
    childComponent.show();
    jasmine.clock().tick(100);

    expect(TestComponent.prototype.show).toHaveBeenCalled();
  });

  it('should call super.hide if exists', () => {
    class ChildComponent extends TestComponent {
      override hide() {
        super.hide();
      }
    }

    const decoratedClass = Positionable({})(ChildComponent);
    const childComponent = new decoratedClass();

    spyOn(TestComponent.prototype, 'hide').and.callThrough();
    childComponent.hide();
    jasmine.clock().tick(100);

    expect(TestComponent.prototype.hide).toHaveBeenCalled();
  });

  it('should call super.destroy if exists', () => {
    class ChildComponent extends TestComponent {
      override destroy() {
        super.destroy();
      }
    }

    const decoratedClass = Positionable({})(ChildComponent);
    const childComponent = new decoratedClass();

    spyOn(TestComponent.prototype, 'destroy').and.callThrough();
    childComponent.destroy();
    jasmine.clock().tick(100);

    expect(TestComponent.prototype.destroy).toHaveBeenCalled();
  });
});
