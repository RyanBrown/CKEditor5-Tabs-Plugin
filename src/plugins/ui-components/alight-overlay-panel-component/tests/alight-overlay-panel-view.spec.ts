// src/plugins/ui-components/alight-overlay-panel-component/tests/alight-overlay-panel-view.spec.ts
import { OverlayPanelView } from '../alight-overlay-panel-view';
import { keyCodes } from '@ckeditor/ckeditor5-utils/src/keyboard';

describe('OverlayPanelView', () => {
  let view: OverlayPanelView;
  let locale: any;
  let target: HTMLElement;

  beforeEach(() => {
    locale = {
      t: (str: string) => str,
      uiLanguageDirection: 'ltr'
    };

    view = new OverlayPanelView(locale);
    view.showCloseIcon = true;
    view.render();
    document.body.appendChild(view.element!);

    target = document.createElement('div');
    target.id = 'target';
    document.body.appendChild(target);
  });

  afterEach(() => {
    view.destroy();
    target.remove();
  });

  it('initializes with default values', () => {
    expect(view.isVisible).toBe(false);
    expect(view.position).toBe('auto');
    expect(view.dismissable).toBe(true);
    expect(view.showHeader).toBe(false);
    expect(view.autoZIndex).toBe(true);
    expect(view.baseZIndex).toBe(0);
    expect(view.showCloseIcon).toBe(true);
  });

  it('shows the panel and fires beforeShow/show events', (done) => {
    const spy = spyOn(view, 'fire').and.callThrough();
    view.show({ targetElement: target });

    expect(view.isVisible).toBe(true);
    expect(spy).toHaveBeenCalledWith('beforeShow', jasmine.any(Object));

    setTimeout(() => {
      expect(spy).toHaveBeenCalledWith('show', jasmine.any(Object));
      done();
    }, 200);
  });

  // it('hides the panel and fires hide event', (done) => {
  //   const fireSpy = spyOn(view, 'fire').and.callThrough();
  //   view.show({ targetElement: target });

  //   setTimeout(() => {
  //     view.hide();

  //     setTimeout(() => {
  //       expect(view.isVisible).toBe(false);
  //       expect(fireSpy).toHaveBeenCalledWith('hide', jasmine.any(Object));
  //       done();
  //     }, 200); // Wait for _animateOut (150ms + buffer)
  //   }, 0);
  // });

  // it('dismisses on outside click when dismissable is true', (done) => {
  //   const hideSpy = spyOn(view, 'hide');
  //   view.show({ targetElement: target });

  //   setTimeout(() => {
  //     const outside = document.createElement('div');
  //     document.body.appendChild(outside);

  //     const event = new MouseEvent('mousedown', { bubbles: true });
  //     outside.dispatchEvent(event);

  //     setTimeout(() => {
  //       expect(hideSpy).toHaveBeenCalled();
  //       outside.remove();
  //       done();
  //     }, 50);
  //   }, 0);
  // });

  it('does not dismiss on outside click when dismissable is false', () => {
    const hideSpy = spyOn(view, 'hide');
    view.dismissable = false;
    view.show({ targetElement: target });

    const outside = document.createElement('div');
    document.body.appendChild(outside);
    outside.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(hideSpy).not.toHaveBeenCalled();
    outside.remove();
  });

  it('dismisses on escape key press', () => {
    const hideSpy = spyOn(view, 'hide');
    view.show({ targetElement: target });

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(event);

    expect(hideSpy).toHaveBeenCalled();
  });

  it('sets z-index when autoZIndex is true', () => {
    view.baseZIndex = 1000;
    view.autoZIndex = true;
    view.show({ targetElement: target });

    expect(+view.element!.style.zIndex!).toBeGreaterThanOrEqual(1000);
  });

  // it('does not override z-index if autoZIndex is false', () => {
  //   view.baseZIndex = 1000;
  //   view.autoZIndex = false;
  //   view.show({ targetElement: target });

  //   expect(view.element!.style.zIndex!).toBe('1000');
  // });

  it('renders close icon when showCloseIcon is true', () => {
    const icon = view.element!.querySelector('.cka-overlay-panel__close-icon') as HTMLElement;
    expect(icon).toBeTruthy();
    expect(icon.style.display).not.toBe('none');
  });

  it('cleans up on destroy', () => {
    const removeSpy = spyOn(view.element!, 'remove').and.callThrough();
    view.destroy();

    expect(removeSpy).toHaveBeenCalled();
  });
});
