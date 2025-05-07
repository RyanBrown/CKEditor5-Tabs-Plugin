// // src/plugins/ui-components/alight-ui-component-utils/tests/alight-position-manager.spec.ts
// import { AlightPositionManager, Positionable, PositionConfig } from './../alight-position-manager';

// describe('AlightPositionManager', () => {
//   let positionManager: AlightPositionManager;
//   let trigger: HTMLElement;
//   let element: HTMLElement;
//   let scrollX: number;
//   let scrollY: number;
//   let originalTimeout: number;
//   let requestAnimationFrameIds: Array<number> = [];
//   let clock: jasmine.Clock;

//   beforeEach(() => {
//     // Store original timeout and increase for this test suite
//     originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
//     jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

//     // Install fake timers - Only once per describe block
//     clock = jasmine.clock();
//     clock.install();

//     // Mock window properties and methods
//     scrollX = 0;
//     scrollY = 0;
//     Object.defineProperty(window, 'scrollX', { get: () => scrollX });
//     Object.defineProperty(window, 'scrollY', { get: () => scrollY });
//     Object.defineProperty(window, 'innerWidth', { get: () => 1024 });
//     Object.defineProperty(window, 'innerHeight', { get: () => 768 });

//     // Mock event listeners
//     const eventListeners: Record<string, Function[]> = {};

//     spyOn(window, 'addEventListener').and.callFake((event, handler) => {
//       if (!eventListeners[event]) {
//         eventListeners[event] = [];
//       }
//       eventListeners[event].push(handler as Function);
//     });

//     spyOn(window, 'removeEventListener').and.callFake((event, handler) => {
//       if (eventListeners[event]) {
//         eventListeners[event] = eventListeners[event].filter(h => h !== handler);
//       }
//     });

//     // Better requestAnimationFrame mock that uses timeouts
//     spyOn(window, 'requestAnimationFrame').and.callFake(cb => {
//       const timeoutId = setTimeout(() => cb(performance.now()), 0);
//       // Convert the timeout ID to a number to satisfy TypeScript
//       const numericId = Number(timeoutId);
//       requestAnimationFrameIds.push(numericId);
//       return numericId;
//     });

//     spyOn(window, 'cancelAnimationFrame').and.callFake(id => {
//       clearTimeout(id);
//       requestAnimationFrameIds = requestAnimationFrameIds.filter(i => i !== id);
//     });

//     // Reset the singleton instance before each test
//     (AlightPositionManager as any).instance = null;
//     positionManager = AlightPositionManager.getInstance();

//     // Setup DOM elements
//     trigger = document.createElement('div');
//     element = document.createElement('div') as any;
//     document.body.appendChild(trigger);
//     document.body.appendChild(element);

//     // Mock getBoundingClientRect
//     spyOn(trigger, 'getBoundingClientRect').and.returnValue({
//       top: 100,
//       right: 200,
//       bottom: 150,
//       left: 100,
//       width: 100,
//       height: 50,
//       x: 100,
//       y: 100
//     } as DOMRect);

//     spyOn(element, 'getBoundingClientRect').and.returnValue({
//       top: 0,
//       right: 100,
//       bottom: 100,
//       left: 0,
//       width: 100,
//       height: 100,
//       x: 0,
//       y: 0
//     } as DOMRect);

//     // Mock contains to prevent DOM-related errors
//     spyOn(document.body, 'contains').and.returnValue(true);
//   });

//   afterEach(() => {
//     // Clean up DOM elements - safely check if they're in the document
//     if (document.body.contains(trigger)) {
//       document.body.removeChild(trigger);
//     }
//     if (document.body.contains(element)) {
//       document.body.removeChild(element);
//     }

//     // Clear any remaining animation frame callbacks
//     requestAnimationFrameIds.forEach(id => {
//       clearTimeout(id);
//     });
//     requestAnimationFrameIds = [];

//     try {
//       // Advance clock to clear any pending timeouts
//       clock.tick(1000);
//       // Uninstall the clock
//       clock.uninstall();
//     } catch (e) {
//       console.error('Error during clock cleanup:', e);
//     }

//     // Reset the singleton instance
//     (AlightPositionManager as any).instance = null;

//     // Restore original timeout
//     jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
//   });

//   describe('Singleton Instance', () => {
//     it('should create only one instance', () => {
//       const instance1 = AlightPositionManager.getInstance();
//       const instance2 = AlightPositionManager.getInstance();
//       expect(instance1).toBe(instance2);
//     });

//     it('should initialize with window event listeners', () => {
//       AlightPositionManager.getInstance();
//       expect(window.addEventListener).toHaveBeenCalledWith('scroll', jasmine.any(Function), true);
//       expect(window.addEventListener).toHaveBeenCalledWith('resize', jasmine.any(Function));
//       expect(window.addEventListener).toHaveBeenCalledWith('focus', jasmine.any(Function));
//     });
//   });

//   describe('Component Registration', () => {
//     it('should register a component with default config', () => {
//       positionManager.register('test', element, trigger);
//       clock.tick(100);
//       expect(element.style.position).toBe('absolute');
//     });

//     it('should handle followTrigger option', () => {
//       positionManager.register('test', element, trigger, { followTrigger: true });
//       clock.tick(100);
//       expect(window.requestAnimationFrame).toHaveBeenCalled();
//     });

//     it('should update z-index when registering', () => {
//       const initialZIndex = positionManager.getNextZIndex();
//       positionManager.register('test', element, trigger);
//       expect(positionManager.getNextZIndex()).toBeGreaterThan(initialZIndex);
//     });

//     it('should handle appendTo body option', () => {
//       const originalParent = element.parentNode;

//       spyOn(document.body, 'appendChild').and.callThrough();
//       positionManager.register('test', element, trigger, { appendTo: 'body' });
//       clock.tick(100);

//       expect(document.body.appendChild).toHaveBeenCalledWith(element);

//       // Cleanup - manually restore to original parent to prevent errors
//       positionManager.unregister('test');
//     });

//     it('should handle appendTo target option', () => {
//       const originalParent = element.parentNode;

//       spyOn(trigger, 'appendChild').and.callThrough();
//       positionManager.register('test', element, trigger, { appendTo: 'target' });
//       clock.tick(100);

//       expect(trigger.appendChild).toHaveBeenCalledWith(element);

//       // Cleanup - manually restore to original parent
//       positionManager.unregister('test');
//     });

//     it('should handle appendTo HTMLElement option', () => {
//       const container = document.createElement('div');
//       document.body.appendChild(container);

//       const originalParent = element.parentNode;

//       spyOn(container, 'appendChild').and.callThrough();
//       positionManager.register('test', element, trigger, { appendTo: container });
//       clock.tick(100);

//       expect(container.appendChild).toHaveBeenCalledWith(element);

//       // Cleanup - manually restore to original parent
//       positionManager.unregister('test');

//       // Remove container
//       if (document.body.contains(container)) {
//         document.body.removeChild(container);
//       }
//     });

//     it('should handle reregistering a component', () => {
//       positionManager.register('test', element, trigger);

//       const newElement = document.createElement('div');
//       document.body.appendChild(newElement);

//       spyOn(positionManager, 'unregister').and.callThrough();
//       positionManager.register('test', newElement, trigger);
//       clock.tick(100);

//       expect(positionManager.unregister).toHaveBeenCalledWith('test');

//       // Cleanup
//       if (document.body.contains(newElement)) {
//         document.body.removeChild(newElement);
//       }
//     });
//   });

//   describe('Position Calculations', () => {
//     const testPositions = [
//       'top', 'bottom', 'left', 'right', 'center',
//       'top-left', 'top-right', 'bottom-left', 'bottom-right'
//     ] as const;

//     testPositions.forEach(position => {
//       it(`should calculate ${position} position correctly`, () => {
//         positionManager.register('test', element, trigger, { position });
//         clock.tick(100);
//         expect(element.style.position).toBe('absolute');
//         expect(element.style.top).toMatch(/^\d+px$/);
//         expect(element.style.left).toMatch(/^\d+px$/);
//       });
//     });

//     it('should handle autoFlip when not enough space below', () => {
//       // Mock viewport to have limited space below the trigger
//       Object.defineProperty(window, 'innerHeight', { get: () => 160 }); // Just enough to fit trigger at 100-150, not enough for element 

//       positionManager.register('test', element, trigger, {
//         position: 'bottom',
//         autoFlip: true
//       });

//       clock.tick(100);
//       expect(element.getAttribute('data-flipped')).toBe('true');
//       expect(element.getAttribute('data-flipped-to')).toBe('top');
//     });

//     it('should handle autoFlip when not enough space above', () => {
//       // Move trigger to top of viewport
//       (trigger.getBoundingClientRect as jasmine.Spy).and.returnValue({
//         top: 10,
//         right: 200,
//         bottom: 60,
//         left: 100,
//         width: 100,
//         height: 50,
//         x: 100,
//         y: 10
//       } as DOMRect);

//       positionManager.register('test', element, trigger, {
//         position: 'top',
//         autoFlip: true
//       });

//       clock.tick(100);
//       expect(element.getAttribute('data-flipped')).toBe('true');
//       expect(element.getAttribute('data-flipped-to')).toBe('bottom');
//     });

//     it('should handle autoFlip when not enough space on right', () => {
//       // Move trigger to right edge of viewport
//       Object.defineProperty(window, 'innerWidth', { get: () => 210 }); // Just enough for trigger at 100-200, not enough for element

//       positionManager.register('test', element, trigger, {
//         position: 'right',
//         autoFlip: true
//       });

//       clock.tick(100);
//       expect(element.getAttribute('data-flipped')).toBe('true');
//       expect(element.getAttribute('data-flipped-to')).toBe('left');
//     });

//     it('should handle autoFlip when not enough space on left', () => {
//       // Move trigger to left edge of viewport
//       (trigger.getBoundingClientRect as jasmine.Spy).and.returnValue({
//         top: 100,
//         right: 110,
//         bottom: 150,
//         left: 10,
//         width: 100,
//         height: 50,
//         x: 10,
//         y: 100
//       } as DOMRect);

//       positionManager.register('test', element, trigger, {
//         position: 'left',
//         autoFlip: true
//       });

//       clock.tick(100);
//       expect(element.getAttribute('data-flipped')).toBe('true');
//       expect(element.getAttribute('data-flipped-to')).toBe('right');
//     });

//     it('should handle top-right to top-left autoFlip', () => {
//       Object.defineProperty(window, 'innerWidth', { get: () => 210 }); // Limited width

//       positionManager.register('test', element, trigger, {
//         position: 'top-right',
//         autoFlip: true
//       });

//       clock.tick(100);
//       expect(element.getAttribute('data-flipped')).toBe('true');
//       expect(element.getAttribute('data-flipped-to')).toBe('top-left');
//     });

//     it('should handle bottom-right to bottom-left autoFlip', () => {
//       Object.defineProperty(window, 'innerWidth', { get: () => 210 }); // Limited width

//       positionManager.register('test', element, trigger, {
//         position: 'bottom-right',
//         autoFlip: true
//       });

//       clock.tick(100);
//       expect(element.getAttribute('data-flipped')).toBe('true');
//       expect(element.getAttribute('data-flipped-to')).toBe('bottom-left');
//     });

//     it('should handle top-left to top-right autoFlip', () => {
//       // Move trigger to left edge of viewport
//       (trigger.getBoundingClientRect as jasmine.Spy).and.returnValue({
//         top: 100,
//         right: 110,
//         bottom: 150,
//         left: 10,
//         width: 100,
//         height: 50,
//         x: 10,
//         y: 100
//       } as DOMRect);

//       positionManager.register('test', element, trigger, {
//         position: 'top-left',
//         autoFlip: true
//       });

//       clock.tick(100);
//       expect(element.getAttribute('data-flipped')).toBe('true');
//       expect(element.getAttribute('data-flipped-to')).toBe('top-right');
//     });

//     it('should handle bottom-left to bottom-right autoFlip', () => {
//       // Move trigger to left edge of viewport
//       (trigger.getBoundingClientRect as jasmine.Spy).and.returnValue({
//         top: 100,
//         right: 110,
//         bottom: 150,
//         left: 10,
//         width: 100,
//         height: 50,
//         x: 10,
//         y: 100
//       } as DOMRect);

//       positionManager.register('test', element, trigger, {
//         position: 'bottom-left',
//         autoFlip: true
//       });

//       clock.tick(100);
//       expect(element.getAttribute('data-flipped')).toBe('true');
//       expect(element.getAttribute('data-flipped-to')).toBe('bottom-right');
//     });

//     it('should remove data-flipped attributes when no flip is needed', () => {
//       // First flip it
//       Object.defineProperty(window, 'innerHeight', { get: () => 160 });
//       positionManager.register('test', element, trigger, {
//         position: 'bottom',
//         autoFlip: true
//       });
//       clock.tick(100);

//       // Then restore space and update
//       Object.defineProperty(window, 'innerHeight', { get: () => 768 });

//       // Manually trigger updateAllPositions rather than rely on event handlers
//       positionManager['updateAllPositions']();
//       clock.tick(100);

//       expect(element.getAttribute('data-flipped')).toBe(null);
//       expect(element.getAttribute('data-flipped-to')).toBe(null);
//     });

//     it('should constrain to viewport when enabled', () => {
//       positionManager.register('test', element, trigger, {
//         constrainToViewport: true
//       });

//       clock.tick(100);
//       expect(element.style.position).toBe('absolute');

//       const top = parseInt(element.style.top);
//       const left = parseInt(element.style.left);
//       expect(top).toBeGreaterThanOrEqual(0);
//       expect(left).toBeGreaterThanOrEqual(0);
//       expect(top + 100).toBeLessThanOrEqual(window.innerHeight); // 100 is element height
//       expect(left + 100).toBeLessThanOrEqual(window.innerWidth); // 100 is element width
//     });

//     it('should respect alignment setting with start value', () => {
//       positionManager.register('test', element, trigger, {
//         position: 'bottom',
//         alignment: 'start'
//       });
//       clock.tick(100);

//       // Start alignment should align left edges for bottom position
//       expect(parseInt(element.style.left)).toBe(100); // Same as trigger.left
//     });

//     it('should respect alignment setting with end value', () => {
//       positionManager.register('test', element, trigger, {
//         position: 'bottom',
//         alignment: 'end'
//       });
//       clock.tick(100);

//       // End alignment should align right edges for bottom position
//       expect(parseInt(element.style.left)).toBe(100); // trigger.left + (trigger.width - element.width) = 100 + (100 - 100) = 100
//     });

//     it('should respect alignment setting with center value', () => {
//       positionManager.register('test', element, trigger, {
//         position: 'bottom',
//         alignment: 'center'
//       });
//       clock.tick(100);

//       // Center alignment should center element with trigger
//       expect(parseInt(element.style.left)).toBe(100); // trigger.left + (trigger.width - element.width)/2 = 100 + (100 - 100)/2 = 100
//     });

//     it('should use center alignment by default', () => {
//       positionManager.register('test', element, trigger, {
//         position: 'bottom'
//       });
//       clock.tick(100);

//       // Default should be center aligned
//       expect(parseInt(element.style.left)).toBe(100); // trigger.left + (trigger.width - element.width)/2 = 100 + (100 - 100)/2 = 100
//     });

//     it('should use the getScrollParent method correctly', () => {
//       // Test with a scrollable parent
//       const scrollableParent = document.createElement('div');
//       Object.defineProperty(scrollableParent, 'scrollHeight', { value: 2000 });
//       Object.defineProperty(scrollableParent, 'clientHeight', { value: 500 });

//       // Mock getComputedStyle for the scrollable parent
//       spyOn(window, 'getComputedStyle').and.returnValue({
//         overflowY: 'auto',
//         overflowX: 'hidden'
//       } as CSSStyleDeclaration);

//       // Set up parent-child relationship
//       scrollableParent.appendChild(trigger);
//       spyOn(trigger, 'parentElement').and.returnValue(scrollableParent);

//       // Test the position calculation with a scrollable parent
//       positionManager.register('test', element, trigger, {
//         constrainToViewport: true
//       });

//       clock.tick(100);
//       expect(element.style.position).toBe('absolute');
//     });

//     it('should use document.body when no scrollable parent found', () => {
//       // Mock getComputedStyle to return non-scrollable values
//       spyOn(window, 'getComputedStyle').and.returnValue({
//         overflowY: 'visible',
//         overflowX: 'visible'
//       } as CSSStyleDeclaration);

//       // Set up parent-child relationship
//       const nonScrollableParent = document.createElement('div');
//       nonScrollableParent.appendChild(trigger);
//       spyOn(trigger, 'parentElement').and.returnValue(nonScrollableParent);

//       // Test the position calculation
//       positionManager.register('test', element, trigger, {
//         constrainToViewport: true
//       });

//       clock.tick(100);
//       expect(element.style.position).toBe('absolute');
//     });
//   });

//   describe('Configuration Updates', () => {
//     it('should update component config', () => {
//       positionManager.register('test', element, trigger);
//       clock.tick(100);

//       const initialTop = element.style.top;
//       positionManager.updateConfig('test', {
//         position: 'top',
//         offset: 10
//       });

//       clock.tick(100);
//       expect(element.style.top).not.toBe(initialTop);
//     });

//     it('should handle dimension updates with pixel values', () => {
//       positionManager.register('test', element, trigger, {
//         width: '200px',
//         height: '100px'
//       });

//       clock.tick(100);

//       positionManager.updateConfig('test', {
//         width: '300px',
//         height: '150px'
//       });

//       clock.tick(100);
//       expect(element.style.width).toBe('300px');
//       expect(element.style.height).toBe('150px');
//     });

//     it('should handle dimension updates with numeric values', () => {
//       positionManager.register('test', element, trigger, {
//         width: 200,
//         height: 100
//       });

//       clock.tick(100);

//       positionManager.updateConfig('test', {
//         width: 300,
//         height: 150
//       });

//       clock.tick(100);
//       expect(element.style.width).toBe('300px');
//       expect(element.style.height).toBe('150px');
//     });

//     it('should update z-index correctly', () => {
//       positionManager.register('test', element, trigger);
//       clock.tick(100);

//       const newZIndex = 2000;
//       positionManager.updateConfig('test', { zIndex: newZIndex });
//       clock.tick(100);

//       expect(element.style.zIndex).toBe(newZIndex.toString());
//     });
//   });

//   describe('Component Cleanup', () => {
//     it('should unregister components properly', () => {
//       positionManager.register('test', element, trigger, { followTrigger: true });
//       clock.tick(100);

//       const cancelSpy = spyOn(window, 'cancelAnimationFrame').and.callThrough();
//       positionManager.unregister('test');
//       clock.tick(100);

//       expect(cancelSpy).toHaveBeenCalled();
//     });

//     it('should handle unregistering non-existent components', () => {
//       expect(() => {
//         positionManager.unregister('non-existent');
//       }).not.toThrow();
//     });

//     it('should restore element to original parent on unregister', () => {
//       // Create a realistic parent-child scenario
//       const originalParent = document.createElement('div');
//       document.body.appendChild(originalParent);

//       // Add element to original parent
//       originalParent.appendChild(element);

//       // Save a spy for appendChild
//       const appendChildSpy = spyOn(originalParent, 'appendChild').and.callThrough();

//       // Register with appendTo: 'body'
//       positionManager.register('test', element, trigger, { appendTo: 'body' });
//       clock.tick(100);

//       // Verify element was moved to body
//       expect(element.parentNode).toBe(document.body);

//       // Reset spy count
//       appendChildSpy.calls.reset();

//       // Unregister should restore to original parent
//       positionManager.unregister('test');
//       clock.tick(100);

//       expect(appendChildSpy).toHaveBeenCalledWith(element);

//       // Clean up
//       if (document.body.contains(originalParent)) {
//         // Make sure element is removed from original parent to avoid DOM errors
//         if (originalParent.contains(element)) {
//           originalParent.removeChild(element);
//         }
//         document.body.removeChild(originalParent);
//       }
//     });

//     it('should handle errors when restoring element to original parent', () => {
//       // Create a realistic parent-child scenario
//       const originalParent = document.createElement('div');
//       document.body.appendChild(originalParent);

//       // Add element to original parent
//       originalParent.appendChild(element);

//       // Make appendChild throw an error
//       spyOn(originalParent, 'appendChild').and.throwError('DOM Exception');

//       // Register with appendTo: 'body'
//       positionManager.register('test', element, trigger, { appendTo: 'body' });
//       clock.tick(100);

//       // Unregister should not throw even if appendChild throws
//       expect(() => {
//         positionManager.unregister('test');
//         clock.tick(100);
//       }).not.toThrow();

//       // Clean up
//       if (document.body.contains(originalParent)) {
//         document.body.removeChild(originalParent);
//       }
//     });

//     it('should clean up when elements are removed from DOM', () => {
//       positionManager.register('test', element, trigger);
//       clock.tick(100);

//       // Mock document.body.contains to simulate elements being removed
//       (document.body.contains as jasmine.Spy).and.returnValue(false);

//       const unregisterSpy = spyOn(positionManager, 'unregister').and.callThrough();
//       positionManager['updatePosition']('test');
//       clock.tick(100);

//       expect(unregisterSpy).toHaveBeenCalledWith('test');
//     });
//   });

//   describe('Z-Index Management', () => {
//     it('should increment z-index counter when getting next z-index', () => {
//       const initialZIndex = positionManager.getNextZIndex();
//       const nextZIndex = positionManager.getNextZIndex();
//       expect(nextZIndex).toBe(initialZIndex + 1);
//     });

//     it('should bring component to front', () => {
//       positionManager.register('test1', element, trigger);
//       clock.tick(100);

//       const element2 = document.createElement('div');
//       document.body.appendChild(element2);
//       positionManager.register('test2', element2, trigger);
//       clock.tick(100);

//       const initialZIndex = parseInt(element.style.zIndex);
//       positionManager.bringToFront('test1');
//       clock.tick(100);

//       expect(parseInt(element.style.zIndex)).toBeGreaterThan(initialZIndex);

//       // Clean up
//       if (document.body.contains(element2)) {
//         document.body.removeChild(element2);
//       }
//     });

//     it('should handle bringing non-existent component to front', () => {
//       expect(() => {
//         positionManager.bringToFront('non-existent');
//       }).not.toThrow();
//     });
//   });
// });

// describe('Positionable Decorator', () => {
//   let positionManager: AlightPositionManager;
//   let originalTimeout: number;

//   // Define the decorator
//   @Positionable({
//     position: 'bottom',
//     offset: 5
//   })
//   class TestComponent {
//     public element: HTMLElement;
//     public trigger: HTMLElement;
//     public positionManager?: AlightPositionManager;
//     public componentId?: string;

//     constructor() {
//       this.element = document.createElement('div');
//       this.trigger = document.createElement('div');
//     }

//     show() { }
//     hide() { }
//     destroy() { }
//   }

//   let component: any;
//   let clock: jasmine.Clock;

//   beforeEach(() => {
//     // Store original timeout and increase for this test
//     originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
//     jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

//     // Reset the singleton instance
//     (AlightPositionManager as any).instance = null;
//     positionManager = AlightPositionManager.getInstance();

//     // Better requestAnimationFrame mock
//     spyOn(window, 'requestAnimationFrame').and.callFake(cb => {
//       const timeoutId = setTimeout(() => cb(performance.now()), 0);
//       return Number(timeoutId);
//     });

//     component = new TestComponent();

//     // Mock the position manager
//     spyOn(positionManager, 'register').and.callThrough();
//     spyOn(positionManager, 'unregister').and.callThrough();
//     spyOn(positionManager, 'bringToFront').and.callThrough();

//     // Initialize jasmine clock for this describe block
//     clock = jasmine.clock();
//     clock.install();
//   });

//   afterEach(() => {
//     // Clean up
//     component = null;

//     try {
//       // Advance clock to clear any pending timeouts
//       clock.tick(1000);
//       // Uninstall jasmine clock
//       clock.uninstall();
//     } catch (e) {
//       console.error('Error during clock cleanup:', e);
//     }

//     // Reset the singleton instance
//     (AlightPositionManager as any).instance = null;

//     // Restore original timeout
//     jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
//   });

//   it('should add position manager to decorated class', () => {
//     expect(component.positionManager).toBeTruthy();
//     expect(component.componentId).toBeTruthy();
//   });

//   it('should register component on show', () => {
//     component.show();
//     clock.tick(100);

//     expect(component.positionManager.register).toHaveBeenCalled();
//     expect(component.positionManager.bringToFront).toHaveBeenCalled();
//   });

//   it('should unregister component on hide', () => {
//     component.hide();
//     clock.tick(100);

//     expect(component.positionManager.unregister).toHaveBeenCalled();
//   });

//   it('should clean up on destroy', () => {
//     component.destroy();
//     clock.tick(100);

//     expect(component.positionManager.unregister).toHaveBeenCalled();
//   });

//   it('should warn if element is not defined', () => {
//     component.element = null;
//     const warnSpy = spyOn(console, 'warn').and.callThrough();
//     component.show();
//     clock.tick(100);

//     expect(warnSpy).toHaveBeenCalled();
//   });

//   it('should warn if trigger is not defined', () => {
//     component.trigger = null;
//     const warnSpy = spyOn(console, 'warn').and.callThrough();
//     component.show();
//     clock.tick(100);

//     expect(warnSpy).toHaveBeenCalled();
//   });

//   it('should warn if position manager is not defined on hide', () => {
//     component.positionManager = null;
//     const warnSpy = spyOn(console, 'warn').and.callThrough();
//     component.hide();
//     clock.tick(100);

//     expect(warnSpy).toHaveBeenCalled();
//   });

//   it('should call super.show if exists', () => {
//     class ChildComponent extends TestComponent {
//       override show() {
//         super.show();
//       }
//     }

//     const decoratedClass = Positionable({})(ChildComponent);
//     const childComponent = new decoratedClass();

//     const showSpy = spyOn(TestComponent.prototype, 'show').and.callThrough();
//     childComponent.show();
//     clock.tick(100);

//     expect(showSpy).toHaveBeenCalled();
//   });

//   it('should call super.hide if exists', () => {
//     class ChildComponent extends TestComponent {
//       override hide() {
//         super.hide();
//       }
//     }

//     const decoratedClass = Positionable({})(ChildComponent);
//     const childComponent = new decoratedClass();

//     const hideSpy = spyOn(TestComponent.prototype, 'hide').and.callThrough();
//     childComponent.hide();
//     clock.tick(100);

//     expect(hideSpy).toHaveBeenCalled();
//   });

//   it('should call super.destroy if exists', () => {
//     class ChildComponent extends TestComponent {
//       override destroy() {
//         super.destroy();
//       }
//     }

//     const decoratedClass = Positionable({})(ChildComponent);
//     const childComponent = new decoratedClass();

//     const destroySpy = spyOn(TestComponent.prototype, 'destroy').and.callThrough();
//     childComponent.destroy();
//     clock.tick(100);

//     expect(destroySpy).toHaveBeenCalled();
//   });
// });
