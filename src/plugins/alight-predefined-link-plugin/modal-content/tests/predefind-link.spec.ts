// // src/plugins/alight-predefined-link-plugin/modal-content/tests/public-website.spec.ts
// import { createPublicLinkModalContent, validateForm } from '../public-website';

// describe('Public Website Modal Content', () => {
//   let container: HTMLElement;
//   let form: HTMLFormElement;

//   beforeEach(() => {
//     document.body.innerHTML = '';
//   });

//   describe('createPublicLinkModalContent', () => {
//     it('should create a form with required elements', () => {
//       container = createPublicLinkModalContent();
//       form = container.querySelector('#predefined-link-form') as HTMLFormElement;

//       expect(form).toBeTruthy();
//       expect(form.classList.contains('ck-form')).toBe(true);

//       const urlInput = form.querySelector('#link-url') as HTMLInputElement;
//       expect(urlInput).toBeTruthy();
//       expect(urlInput.type).toBe('url');
//       expect(urlInput.required).toBe(true);

//       const orgNameInput = form.querySelector('#org-name') as HTMLInputElement;
//       expect(orgNameInput).toBeTruthy();
//       expect(orgNameInput.type).toBe('text');
//       expect(orgNameInput.required).toBe(false);

//       const errorElement = form.querySelector('#url-error');
//       expect(errorElement).toBeTruthy();
//       expect(errorElement?.style.display).toBe('none');
//     });

//     it('should initialize form with provided values', () => {
//       const initialUrl = 'https://example.com';
//       const initialOrgName = 'Test Org';

//       container = createPublicLinkModalContent(initialUrl, initialOrgName);
//       form = container.querySelector('#predefined-link-form') as HTMLFormElement;

//       const urlInput = form.querySelector('#link-url') as HTMLInputElement;
//       const orgNameInput = form.querySelector('#org-name') as HTMLInputElement;

//       expect(urlInput.value).toBe(initialUrl);
//       expect(orgNameInput.value).toBe(initialOrgName);
//     });

//     it('should handle undefined initial values', () => {
//       container = createPublicLinkModalContent(undefined, undefined);
//       form = container.querySelector('#predefined-link-form') as HTMLFormElement;

//       const urlInput = form.querySelector('#link-url') as HTMLInputElement;
//       const orgNameInput = form.querySelector('#org-name') as HTMLInputElement;

//       expect(urlInput.value).toBe('');
//       expect(orgNameInput.value).toBe('');
//     });

//     it('should escape HTML in initial values', () => {
//       const maliciousUrl = '<script>alert("xss")</script>';
//       const maliciousOrgName = '<img src="x" onerror="alert(1)">';

//       container = createPublicLinkModalContent(maliciousUrl, maliciousOrgName);

//       // Check that the values are properly escaped
//       const urlInput = container.querySelector('#link-url') as HTMLInputElement;
//       const orgNameInput = container.querySelector('#org-name') as HTMLInputElement;

//       expect(urlInput.value).toBe(maliciousUrl);
//       expect(orgNameInput.value).toBe(maliciousOrgName);
//       expect(urlInput.outerHTML).not.toContain('<script>alert');
//       expect(orgNameInput.outerHTML).not.toContain('onerror=');
//     });
//   });

//   describe('validateForm', () => {
//     beforeEach(() => {
//       container = createPublicLinkModalContent();
//       form = container.querySelector('#predefined-link-form') as HTMLFormElement;
//       document.body.appendChild(container);
//     });

//     it('should handle empty URL', () => {
//       const urlInput = form.querySelector('#link-url') as HTMLInputElement;
//       urlInput.value = '';

//       expect(validateForm(form)).toBe(false);

//       const errorElement = form.querySelector('#url-error') as HTMLElement;
//       expect(errorElement.style.display).toBe('block');
//       expect(errorElement.textContent).toContain('URL is required');
//     });

//     it('should handle whitespace-only URL', () => {
//       const urlInput = form.querySelector('#link-url') as HTMLInputElement;
//       urlInput.value = '   ';

//       expect(validateForm(form)).toBe(false);

//       const errorElement = form.querySelector('#url-error') as HTMLElement;
//       expect(errorElement.style.display).toBe('block');
//       expect(errorElement.textContent).toContain('URL is required');
//     });

//     it('should handle invalid URL format', () => {
//       const urlInput = form.querySelector('#link-url') as HTMLInputElement;
//       urlInput.value = 'not a url';

//       expect(validateForm(form)).toBe(false);

//       const errorElement = form.querySelector('#url-error') as HTMLElement;
//       expect(errorElement.style.display).toBe('block');
//       expect(errorElement.textContent).toContain('Please enter a valid URL');
//     });

//     it('should handle URL with invalid protocol', () => {
//       const urlInput = form.querySelector('#link-url') as HTMLInputElement;
//       urlInput.value = 'ftp://example.com';

//       expect(validateForm(form)).toBe(false);

//       const errorElement = form.querySelector('#url-error') as HTMLElement;
//       expect(errorElement.style.display).toBe('block');
//       expect(errorElement.textContent).toContain('Invalid URL format');
//     });

//     it('should clean partial protocols', () => {
//       const urlInput = form.querySelector('#link-url') as HTMLInputElement;
//       urlInput.value = '//example.com';

//       expect(validateForm(form)).toBe(false);

//       const errorElement = form.querySelector('#url-error') as HTMLElement;
//       expect(errorElement.style.display).toBe('block');
//     });

//     it('should handle multiple forward slashes', () => {
//       const urlInput = form.querySelector('#link-url') as HTMLInputElement;
//       urlInput.value = '////example.com';

//       expect(validateForm(form)).toBe(false);

//       const errorElement = form.querySelector('#url-error') as HTMLElement;
//       expect(errorElement.style.display).toBe('block');
//     });

//     it('should trim whitespace from URLs', () => {
//       const urlInput = form.querySelector('#link-url') as HTMLInputElement;
//       urlInput.value = '  example.com  ';

//       expect(validateForm(form)).toBe(false);

//       const errorElement = form.querySelector('#url-error') as HTMLElement;
//       expect(errorElement.style.display).toBe('block');
//     });
//   });
// });