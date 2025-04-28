// // src/plugins/ui-components/alight-overlay-panel-component/tests/alight-overlay-panel-view.spec.ts
// import { OverlayPanelView, type PanelPosition } from '../alight-overlay-panel-view';
// import { global } from '@ckeditor/ckeditor5-utils';
// import { View } from '@ckeditor/ckeditor5-ui';

// describe('OverlayPanelView', () => {
//   let view: OverlayPanelView;
//   let locale: any;

//   // Mocks
//   let fireSpy: jasmine.Spy;

//   beforeEach(() => {
//     // Mock locale
//     locale = {
//       t: (str: string) => str,
//       uiLanguageDirection: 'ltr'
//     };

//     view = new OverlayPanelView(locale);
//     view.render();
//     document.body.appendChild(view.element!);

//     // Set up spies
//     fireSpy = spyOn(view, 'fire').and.callThrough();
//   });

//   afterEach(() => {
//     if (view.element && view.element.parentNode) {
//       view.element.remove();
//     }
//     view.destroy();
//   });

//   it('should create with default values', () => {
//     expect(view.isVisible).toBe(false);
//     expect(view.position).toBe('auto');
//     expect(view.dismissable).toBe(true);
//     expect(view.showHeader).toBe(false);
//     expect(view.autoZIndex).toBe(true);
//     expect(view.baseZIndex).toBe(0);
//     expect(view.showCloseIcon).toBe(false);
//     expect(view.styleClass).toBe('');
//   });

//   it('should show when calling show method', (done) => {
//     const targetElement = document.createElement('div');
//     document.body.appendChild(targetElement);

//     view.show({ targetElement });

//     expect(view.isVisible).toBe(true);
//     expect(fireSpy).toHaveBeenCalledWith('beforeShow', jasmine.any(Object));

//     // Use setTimeout instead of jest.advanceTimersByTime to wait for animation
//     setTimeout(() => {
//       expect(fireSpy).toHaveBeenCalledWith('show', jasmine.any(Object));
//       targetElement.remove();
//       done();
//     }, 200); // Slightly longer than animation time (150ms)
//   });

//   it('should hide when calling hide method', (done) => {
//     const targetElement = document.createElement('div');
//     document.body.appendChild(targetElement);

//     view.show({ targetElement });
//     expect(view.isVisible).toBe(true);

//     view.hide();

//     expect(fireSpy).toHaveBeenCalledWith('beforeHide', jasmine.any(Object));

//     // Use setTimeout instead of jest.advanceTimersByTime
//     setTimeout(() => {
//       expect(view.isVisible).toBe(false);
//       expect(fireSpy).toHaveBeenCalledWith('hide', jasmine.any(Object));
//       targetElement.remove();
//       done();
//     }, 200);
//   });

//   it('should toggle visibility', (done) => {
//     const targetElement = document.createElement('div');
//     document.body.appendChild(targetElement);

//     // Initially hidden
//     expect(view.isVisible).toBe(false);

//     // Toggle to show
//     view.toggle(targetElement);
//     expect(view.isVisible).toBe(true);

//     // Toggle to hide
//     view.toggle(targetElement);

//     // Wait for animation
//     setTimeout(() => {
//       expect(view.isVisible).toBe(false);
//       targetElement.remove();
//       done();
//     }, 200);
//   });

//   it('should update content', () => {
//     // Set up spy
//     const contentViewSpy = spyOn(view.contentView, 'setTemplate').and.callThrough();

//     view.setContent('Test content');

//     expect(contentViewSpy).toHaveBeenCalled();

//     const customView = new View(locale);
//     customView.setTemplate({
//       tag: 'span',
//       children: [{ text: 'Custom view' }]
//     });

//     view.setContent(customView);

//     expect(contentViewSpy.calls.count()).toBe(2);
//   });

//   it('should handle click outside', (done) => {
//     const targetElement = document.createElement('div');
//     document.body.appendChild(targetElement);

//     view.show({ targetElement });
//     expect(view.isVisible).toBe(true);

//     // Simulate click outside
//     const event = new MouseEvent('mousedown');
//     document.dispatchEvent(event);

//     // Wait for animation
//     setTimeout(() => {
//       expect(view.isVisible).toBe(false);
//       targetElement.remove();
//       done();
//     }, 200);
//   });

//   it('should handle escape key', (done) => {
//     const targetElement = document.createElement('div');
//     document.body.appendChild(targetElement);

//     view.show({ targetElement });
//     expect(view.isVisible).toBe(true);

//     // Simulate Escape key
//     const event = new KeyboardEvent('keydown', { key: 'Escape' });
//     document.dispatchEvent(event);

//     // Wait for animation
//     setTimeout(() => {
//       expect(view.isVisible).toBe(false);
//       targetElement.remove();
//       done();
//     }, 200);
//   });
// });
