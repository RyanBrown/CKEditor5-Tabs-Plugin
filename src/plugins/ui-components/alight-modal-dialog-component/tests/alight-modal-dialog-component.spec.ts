// alight-modal-dialog-component.spec.ts

import { CkAlightModalDialog } from '../alight-modal-dialog-component';

describe('CkAlightModalDialog', () => {
  let modal: CkAlightModalDialog;

  beforeEach(() => {
    modal = new CkAlightModalDialog({
      title: 'Test Modal',
      modal: true
    });
  });

  afterEach(() => {
    if (modal) {
      // Manually cleanup any DOM elements that might have been created
      const container = document.querySelector('.cka-dialog-wrapper');
      if (container) container.remove();

      const overlay = document.querySelector('.cka-dialog-overlay');
      if (overlay) overlay.remove();

      modal.destroy();
    }
  });

  it('should create modal elements on initialization', () => {
    // Check the dialog was created
    expect(modal.getElement()).not.toBeNull();
  });

  it('should show the modal', (done) => {
    // Hide immediately completes the visibility test
    spyOn(modal, 'hide').and.callFake(() => {
      modal['visible'] = false;
    });

    modal.show();

    // Give time for the modal to be added to DOM and animations to start
    setTimeout(() => {
      expect(modal.isVisible()).toBeTrue();
      // Check if element exists in DOM
      const dialogEl = document.querySelector('.cka-dialog');
      expect(dialogEl).not.toBeNull();
      done();
    }, 50);
  });

  // it('should hide the modal', (done) => {
  //   // Modify visibility directly for testing
  //   modal['visible'] = true;

  //   // Skip animations for hide test
  //   spyOn(modal as any, '_unlockBodyScroll');

  //   modal.hide();

  //   // Use setTimeout to allow for any asynchronous operations
  //   setTimeout(() => {
  //     expect(modal.isVisible()).toBeFalse();
  //     done();
  //   }, 50);
  // });

  it('should destroy and remove elements from DOM', (done) => {
    modal.show();

    // Wait for the modal to be shown
    setTimeout(() => {
      modal.destroy();

      // Wait for destroy to complete
      setTimeout(() => {
        const dialogWrapper = document.querySelector('.cka-dialog-wrapper');
        expect(dialogWrapper).toBeNull();
        done();
      }, 200);
    }, 50);
  });

  // it('should trigger buttonClick event when buttons are clicked', (done) => {
  //   const clickSpy = jasmine.createSpy('buttonClickSpy');

  //   // Set up event listener
  //   modal.on('buttonClick', clickSpy);

  //   // Set up buttons
  //   modal.setProps({
  //     buttons: [
  //       {
  //         label: 'Submit',
  //         isPrimary: true
  //       }
  //     ]
  //   });

  //   // Show modal
  //   modal.show();

  //   // Wait for modal to be visible and added to DOM
  //   setTimeout(() => {
  //     // Use querySelector on document to ensure we find the button
  //     const primaryButton = document.querySelector('.cka-button-primary') as HTMLButtonElement;
  //     expect(primaryButton).not.toBeNull('Primary button should exist in DOM');

  //     if (primaryButton) {
  //       // Simulate click
  //       primaryButton.click();

  //       expect(clickSpy).toHaveBeenCalled();

  //       // Check that modal closes after button click (default behavior)
  //       setTimeout(() => {
  //         expect(modal.isVisible()).toBeFalse();
  //         done();
  //       }, 50);
  //     } else {
  //       // If we can't find the button, fail the test
  //       fail('Could not find primary button in the DOM');
  //       done();
  //     }
  //   }, 100);
  // });

  // it('should close modal when pressing Escape key', (done) => {
  //   // First show the modal
  //   modal.show();

  //   // Wait for modal to be visible
  //   setTimeout(() => {
  //     // Override visibility check for testing
  //     expect(modal.isVisible()).toBeTrue();

  //     // Dispatch Escape key event
  //     const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
  //     document.dispatchEvent(event);

  //     // Check visibility after a delay to allow event handlers to run
  //     setTimeout(() => {
  //       expect(modal.isVisible()).toBeFalse();
  //       done();
  //     }, 50);
  //   }, 50);
  // });

  it('should NOT close modal if closeOnEscape is false', (done) => {
    // Create a new modal with closeOnEscape disabled
    const noEscapeModal = new CkAlightModalDialog({
      title: 'No Escape Modal',
      closeOnEscape: false
    });

    // Show the modal
    noEscapeModal.show();

    // Wait for modal to be visible
    setTimeout(() => {
      // Dispatch Escape key event
      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(event);

      // Check visibility after a delay
      setTimeout(() => {
        expect(noEscapeModal.isVisible()).toBeTrue();

        // Clean up
        noEscapeModal.destroy();
        done();
      }, 50);
    }, 50);
  });

  it('should allow setting title, content, and footer', (done) => {
    // Show the modal first to ensure elements are in the DOM
    modal.show();

    setTimeout(() => {
      // Test setting title
      modal.setTitle('New Title');

      // Get the title element from the document
      const titleEl = document.querySelector('.cka-dialog-title');
      expect(titleEl).not.toBeNull();
      expect(titleEl?.textContent).toBe('New Title');

      // Test setting content
      const content = document.createElement('p');
      content.textContent = 'Test Content';
      modal.setContent(content);

      const contentEl = document.querySelector('.cka-dialog-content');
      expect(contentEl?.contains(content)).toBeTrue();

      // Test setting footer
      const footer = document.createElement('div');
      footer.textContent = 'Test Footer';
      modal.setFooter(footer);

      const footerEl = document.querySelector('.cka-dialog-footer');
      expect(footerEl?.textContent).toBe('Test Footer');

      done();
    }, 100);
  });

  it('should toggle maximize state correctly', (done) => {
    // Create a modal with maximize enabled
    modal = new CkAlightModalDialog({
      title: 'Test Modal',
      modal: true,
      maximizable: true
    });

    modal.show();

    setTimeout(() => {
      expect(modal.isMaximized()).toBeFalse();

      modal.toggleMaximize();
      expect(modal.isMaximized()).toBeTrue();

      modal.toggleMaximize();
      expect(modal.isMaximized()).toBeFalse();

      done();
    }, 50);
  });
});
