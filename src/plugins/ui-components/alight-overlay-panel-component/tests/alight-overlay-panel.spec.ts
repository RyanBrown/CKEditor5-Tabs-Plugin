// import { AlightOverlayPanel } from "./alight-overlay-panel";

// describe("AlightOverlayPanel", () => {
//   let overlayPanel: AlightOverlayPanel;
//   let triggerButton: HTMLButtonElement;
//   let overlayElement: HTMLDivElement;
//   let closeButton: HTMLButtonElement;

//   beforeEach(() => {
//     // Create DOM elements dynamically
//     document.body.innerHTML = `
//       <button class="cka-triggerBtn" data-id="1">Open Panel</button>
//       <div class="cka-overlay-panel" data-id="1">
//         <header>
//           <span>Panel Title</span>
//           <button class="cka-closeBtn">Close</button>
//         </header>
//         <main>
//           <p>This is a dynamic overlay panel.</p>
//         </main>
//       </div>
//     `;

//     // Get references to dynamically created elements
//     triggerButton = document.querySelector(".cka-triggerBtn") as HTMLButtonElement;
//     overlayElement = document.querySelector(".cka-overlay-panel") as HTMLDivElement;
//     closeButton = document.querySelector(".cka-closeBtn") as HTMLButtonElement;

//     // Initialize the overlay panel instance
//     overlayPanel = new AlightOverlayPanel();
//   });

//   afterEach(() => {
//     // Clean up the DOM after each test
//     document.body.innerHTML = "";
//   });

//   it("should initialize without errors", () => {
//     expect(overlayPanel).toBeTruthy();
//   });

//   it("should open the overlay panel when the trigger button is clicked", () => {
//     triggerButton.click(); // Simulate button click
//     expect(overlayElement.classList.contains("cka-active")).toBeTrue();
//     expect(overlayElement.style.opacity).toBe("1");
//     expect(overlayElement.style.visibility).toBe("visible");
//   });

//   it("should close the overlay panel when the close button is clicked", () => {
//     triggerButton.click(); // Open the panel first
//     closeButton.click(); // Click close button
//     expect(overlayElement.classList.contains("cka-active")).toBeFalse();
//     expect(overlayElement.style.opacity).toBe("0");
//     expect(overlayElement.style.visibility).toBe("hidden");
//   });

//   it("should close the panel when clicking outside the panel", () => {
//     triggerButton.click(); // Open panel
//     document.body.click(); // Simulate clicking outside
//     expect(overlayElement.classList.contains("cka-active")).toBeFalse();
//     expect(overlayElement.style.opacity).toBe("0");
//     expect(overlayElement.style.visibility).toBe("hidden");
//   });

//   it("should not close the panel when clicking inside it", () => {
//     triggerButton.click(); // Open panel
//     overlayElement.click(); // Click inside panel
//     expect(overlayElement.classList.contains("cka-active")).toBeTrue();
//   });

//   it("should reposition the panel correctly on window resize", () => {
//     triggerButton.click(); // Open panel

//     spyOn(overlayPanel as any, "show").and.callThrough();
//     window.dispatchEvent(new Event("resize"));

//     expect((overlayPanel as any).show).toHaveBeenCalled();
//   });

//   it("should not throw an error if resizing without an active panel", () => {
//     spyOn(overlayPanel as any, "show").and.callThrough();
//     window.dispatchEvent(new Event("resize"));

//     expect((overlayPanel as any).show).not.toHaveBeenCalled();
//   });
// });
