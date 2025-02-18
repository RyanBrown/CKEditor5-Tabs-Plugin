// src/plugins/ui-components/alight-overlay-panel-component/tests/alight-overlay-panel.spec.ts
import { AlightOverlayPanel } from './../alight-overlay-panel';
import { AlightPositionManager } from './../../alight-ui-component-utils/alight-position-manager';

describe('AlightOverlayPanel', () => {
  let overlayPanel: AlightOverlayPanel;
  let trigger: HTMLButtonElement;
  let panel: HTMLDivElement;
  let positionManagerMock: jasmine.SpyObj<AlightPositionManager>;

  beforeEach(() => {
    // Setup DOM elements
    trigger = document.createElement('button');
    trigger.setAttribute('data-panel-id', 'test-panel');
    document.body.appendChild(trigger);

    panel = document.createElement('div');
    panel.className = 'cka-overlay-panel';
    panel.setAttribute('data-id', 'test-panel');
    document.body.appendChild(panel);

    // Create position manager mock
    positionManagerMock = jasmine.createSpyObj('AlightPositionManager', ['register', 'unregister', 'updateConfig']);
    spyOn(AlightPositionManager, 'getInstance').and.returnValue(positionManagerMock);

    // Initialize overlay panel
    overlayPanel = new AlightOverlayPanel(trigger, {
      position: 'bottom',
      offset: 4,
      closeOnEsc: true
    });
  });

  afterEach(() => {
    document.body.removeChild(trigger);
    document.body.removeChild(panel);
    overlayPanel.destroy();
  });

  describe('initialization', () => {
    it('should initialize with a trigger element', () => {
      expect(overlayPanel).toBeTruthy();
    });

    it('should initialize with a trigger selector', () => {
      trigger.id = 'test-trigger';
      const selectorPanel = new AlightOverlayPanel('#test-trigger');
      expect(selectorPanel).toBeTruthy();
    });

    it('should warn if trigger is not found', () => {
      spyOn(console, 'warn');
      new AlightOverlayPanel('#non-existent');
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('event handling', () => {
    it('should register event listeners', () => {
      const callback = jasmine.createSpy('callback');
      overlayPanel.on('open', callback);

      trigger.click();
      expect(callback).toHaveBeenCalled();
    });

    it('should remove event listeners', () => {
      const callback = jasmine.createSpy('callback');
      overlayPanel.on('open', callback);
      overlayPanel.off('open', callback);

      trigger.click();
      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle ESC key when closeOnEsc is true', () => {
      trigger.click();
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
      expect(panel.style.display).toBe('none');
    });

    it('should not handle ESC key when closeOnEsc is false', () => {
      overlayPanel.updatePanelConfig('test-panel', { closeOnEsc: false });
      trigger.click();
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
      expect(panel.style.display).not.toBe('none');
    });
  });

  describe('panel visibility', () => {
    it('should show panel on trigger click', () => {
      trigger.click();
      expect(panel.classList.contains('cka-active')).toBe(true);
      expect(panel.style.display).not.toBe('none');
    });

    it('should hide panel on close button click', () => {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'cka-close-btn';
      panel.appendChild(closeBtn);

      trigger.click();
      closeBtn.click();

      expect(panel.classList.contains('cka-active')).toBe(false);
      expect(panel.style.display).toBe('none');
    });

    it('should hide panel on outside click', () => {
      trigger.click();
      document.body.click();
      expect(panel.classList.contains('cka-active')).toBe(false);
    });

    it('should not hide panel when clicking inside', () => {
      trigger.click();
      panel.click();
      expect(panel.classList.contains('cka-active')).toBe(true);
    });
  });

  describe('configuration', () => {
    it('should apply initial configuration', () => {
      const config = {
        width: '200px',
        height: '300px',
        overlayPanelClass: 'custom-class'
      };

      overlayPanel.updatePanelConfig('test-panel', config);

      expect(panel.style.width).toBe('200px');
      expect(panel.style.height).toBe('300px');
      expect(panel.classList.contains('custom-class')).toBe(true);
    });

    it('should update configuration dynamically', () => {
      trigger.click();

      overlayPanel.updatePanelConfig('test-panel', {
        width: '400px',
        overlayPanelClass: 'new-class'
      });

      expect(panel.style.width).toBe('400px');
      expect(panel.classList.contains('new-class')).toBe(true);
      expect(positionManagerMock.updateConfig).toHaveBeenCalled();
    });

    it('should handle multiple custom classes', () => {
      overlayPanel.updatePanelConfig('test-panel', {
        overlayPanelClass: 'class1 class2'
      });

      expect(panel.classList.contains('class1')).toBe(true);
      expect(panel.classList.contains('class2')).toBe(true);
    });
  });

  describe('callbacks', () => {
    it('should call onOpen callback when panel opens', () => {
      const onOpen = jasmine.createSpy('onOpen');
      overlayPanel.updatePanelConfig('test-panel', { onOpen });

      trigger.click();
      expect(onOpen).toHaveBeenCalled();
    });

    it('should call onClose callback when panel closes', () => {
      const onClose = jasmine.createSpy('onClose');
      overlayPanel.updatePanelConfig('test-panel', { onClose });

      trigger.click();
      overlayPanel.close();
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should properly clean up resources on destroy', () => {
      const callback = jasmine.createSpy('callback');
      overlayPanel.on('open', callback);

      overlayPanel.destroy();
      trigger.click();

      expect(callback).not.toHaveBeenCalled();
      expect(positionManagerMock.unregister).toHaveBeenCalled();
    });
  });
});