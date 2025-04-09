// src/plugins/ui-components/alight-ui-component-utils/tests/alight-position-manager.spec.ts
import { AlightPositionManager, Positionable, PositionConfig } from './../alight-position-manager';

describe('AlightPositionManager', () => {
  let positionManager: AlightPositionManager;
  let trigger: HTMLElement;
  let element: HTMLElement;
  let scrollX: number;
  let scrollY: number;

  beforeEach(() => {
    jasmine.clock().install();

    // Mock window properties and methods
    scrollX = 0;
    scrollY = 0;
    Object.defineProperty(window, 'scrollX', { get: () => scrollX });
    Object.defineProperty(window, 'scrollY', { get: () => scrollY });
    Object.defineProperty(window, 'innerWidth', { get: () => 1024 });
    Object.defineProperty(window, 'innerHeight', { get: () => 768 });

    spyOn(window, 'addEventListener').and.callFake(() => { });
    spyOn(window, 'requestAnimationFrame').and.callFake(cb => {
      setTimeout(cb, 0);
      return 1;
    });
    spyOn(window, 'cancelAnimationFrame').and.callFake(() => { });

    // Reset the singleton instance
    (AlightPositionManager as any).instance = null;
    positionManager = AlightPositionManager.getInstance();

    // Setup DOM elements
    trigger = document.createElement('div');
    element = document.createElement('div');
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
  });

  afterEach(() => {
    document.body.removeChild(trigger);
    document.body.removeChild(element);
    jasmine.clock().uninstall();
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
    });
  });

  // describe('Component Registration', () => {
  //   it('should register a component with default config', () => {
  //     positionManager.register('test', element, trigger);
  //     jasmine.clock().tick(100);
  //     expect(element.style.position).toBe('absolute');
  //   });

  //   it('should handle followTrigger option', () => {
  //     positionManager.register('test', element, trigger, { followTrigger: true });
  //     jasmine.clock().tick(100);
  //     expect(window.requestAnimationFrame).toHaveBeenCalled();
  //   });

  //   it('should update z-index when registering', () => {
  //     const initialZIndex = positionManager.getNextZIndex();
  //     positionManager.register('test', element, trigger);
  //     expect(positionManager.getNextZIndex()).toBeGreaterThan(initialZIndex);
  //   });
  // });

  describe('Position Calculations', () => {
    const testPositions = ['top', 'bottom', 'left', 'right', 'center'] as const;

    testPositions.forEach(position => {
      it(`should calculate ${position} position correctly`, () => {
        positionManager.register('test', element, trigger, { position });
        jasmine.clock().tick(100);
        expect(element.style.position).toBe('absolute');
        expect(element.style.top).toMatch(/^\d+px$/);
        expect(element.style.left).toMatch(/^\d+px$/);
      });
    });

    // it('should handle autoFlip when not enough space', () => {
    //   // Mock element being too large for viewport
    //   spyOn(element, 'getBoundingClientRect').and.returnValue({
    //     width: 500,
    //     height: 500,
    //     top: 0,
    //     left: 0,
    //     right: 500,
    //     bottom: 500,
    //     x: 0,
    //     y: 0
    //   } as DOMRect);

    //   positionManager.register('test', element, trigger, {
    //     position: 'bottom',
    //     autoFlip: true
    //   });

    //   jasmine.clock().tick(100);
    //   expect(element.style.position).toBe('absolute');
    // });

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
  });

  //   describe('Configuration Updates', () => {
  //     it('should update component config', () => {
  //       positionManager.register('test', element, trigger);
  //       jasmine.clock().tick(100);

  //       const initialTop = element.style.top;
  //       positionManager.updateConfig('test', {
  //         position: 'top',
  //         offset: 10
  //       });

  //       jasmine.clock().tick(100);
  //       expect(element.style.top).not.toBe(initialTop);
  //     });

  //     it('should handle dimension updates', () => {
  //       positionManager.register('test', element, trigger, {
  //         width: '200px',
  //         height: '100px'
  //       });

  //       jasmine.clock().tick(100);

  //       positionManager.updateConfig('test', {
  //         width: '300px',
  //         height: '150px'
  //       });

  //       jasmine.clock().tick(100);
  //       expect(element.style.width).toBe('300px');
  //       expect(element.style.height).toBe('150px');
  //     });
  //   });

  //   describe('Component Cleanup', () => {
  //     it('should unregister components properly', () => {
  //       positionManager.register('test', element, trigger, { followTrigger: true });
  //       jasmine.clock().tick(100);

  //       positionManager.unregister('test');
  //       jasmine.clock().tick(100);

  //       expect(window.cancelAnimationFrame).toHaveBeenCalled();
  //     });

  //     it('should handle unregistering non-existent components', () => {
  //       expect(() => {
  //         positionManager.unregister('non-existent');
  //       }).not.toThrow();
  //     });
  //   });
  // });

  // describe('Positionable Decorator', () => {
  //   @Positionable({
  //     position: 'bottom',
  //     offset: 5
  //   })
  //   class TestComponent {
  //     public element: HTMLElement;
  //     public trigger: HTMLElement;

  //     constructor() {
  //       this.element = document.createElement('div');
  //       this.trigger = document.createElement('div');
  //     }

  //     show() { }
  //     hide() { }
  //     destroy() { }
  //   }

  //   let component: any;

  //   beforeEach(() => {
  //     // Mock requestAnimationFrame
  //     spyOn(window, 'requestAnimationFrame').and.callFake(cb => {
  //       setTimeout(cb, 0);
  //       return 1;
  //     });
  //     component = new TestComponent();
  //   });

  // it('should add position manager to decorated class', () => {
  //   expect(component.positionManager).toBeTruthy();
  //   expect(component.componentId).toBeTruthy();
  // });

  // it('should register component on show', () => {
  //   spyOn(component.positionManager, 'register');
  //   component.show();
  //   expect(component.positionManager.register).toHaveBeenCalled();
  // });

  // it('should unregister component on hide', () => {
  //   spyOn(component.positionManager, 'unregister');
  //   component.hide();
  //   expect(component.positionManager.unregister).toHaveBeenCalled();
  // });

  // it('should clean up on destroy', () => {
  //   spyOn(component.positionManager, 'unregister');
  //   component.destroy();
  //   expect(component.positionManager.unregister).toHaveBeenCalled();
  // });

  // it('should warn if element or trigger is not defined', () => {
  //   component.element = null;
  //   spyOn(console, 'warn');
  //   component.show();
  //   expect(console.warn).toHaveBeenCalled();
  // });
  // });
});
