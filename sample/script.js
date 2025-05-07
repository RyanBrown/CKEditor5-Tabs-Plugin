// sample/script.js

// Simple JavaScript version - put this in /build/script.js
document.addEventListener('DOMContentLoaded', async () => {
  // Set up necessary session storage variables
  sessionStorage.setItem('apiUrl', 'https://api.mockaroo.com');
  sessionStorage.setItem('dummyColleagueSessionToken', 'b3c0df80'); // Mockaroo API key
  sessionStorage.setItem('dummyRequestHeader', JSON.stringify({
    clientId: 'test-client',
    'X-API-Key': 'b3c0df80'
  }));

  try {
    // Initialize SessionService
    if (typeof SessionService !== 'undefined') {
      SessionService.create(sessionStorage);
      console.log('SessionService initialized');

      // Initialize links services
      try {
        if (typeof LinksLoadService !== 'undefined') {
          const linksLoadService = new LinksLoadService();

          // Preload data with better error handling
          console.log('Preloading links data...');

          // Handle each API call separately with try/catch for better resilience
          try {
            const predefinedLinks = await linksLoadService.loadPredefinedLinks();
            console.log('Predefined links loaded:', predefinedLinks.length);
          } catch (err) {
            console.warn('Error loading predefined links:', err);
          }

          try {
            const documentLinks = await linksLoadService.loadDocumentLinks();
            console.log('Document links loaded:', documentLinks.length);
          } catch (err) {
            console.warn('Error loading document links:', err);
          }

          try {
            const categories = await linksLoadService.loadCategories();
            console.log('Categories loaded:', categories.length);
          } catch (err) {
            console.warn('Error loading categories:', err);
          }
        } else {
          console.warn('LinksLoadService not available');
        }
      } catch (linksError) {
        console.warn('Error preloading links data:', linksError);
      }
    } else {
      console.warn('SessionService not available');
    }

    // Initialize the editor
    const editor = await AlightEditor.create(document.querySelector('.editor'), {
      // Editor configuration can be added here
    });

    // Store editor instance globally
    window.editor = editor;

    // Initialize CKEditor Inspector if available
    if (window.CKEditorInspector) {
      window.CKEditorInspector.attach(editor);
    }
  } catch (error) {
    handleSampleError(error);
  }
});

/**
 * Handles and displays errors in a user-friendly way
 * @param error - The error that occurred
 */
function handleSampleError(error) {
  const issueUrl = 'https://github.com/ckeditor/ckeditor5/issues';

  const message = [
    'Oops, something went wrong!',
    `Please, report the following error on ${issueUrl} with the build id "8d10683l9mj7-aq8r9rg4xws6" and the error stack trace:`
  ].join('\n');

  console.error(message);
  console.error(error);
}

// AlightEditor
//   .create(document.querySelector('.editor'), {
//     // Editor.configuration.
//   })
//   .then(editor => {
//     window.editor = editor;
//     CKEditorInspector.attach(editor);

//     sessionStorage.setItem('apiUrl', 'https://test.com');
//     sessionStorage.setItem('dummyColleagueSessionToken', '1234');
//     sessionStorage.setItem('dummyRequestHeader', '{}');
//   }).catch(handleSampleError);


// function handleSampleError(error) {
//   const issueUrl = 'https://github.com/ckeditor/ckeditor5/issues';

//   const message = [
//     'Oops, something went wrong!',
//     `Please, report the following error on ${issueUrl} with the build id "8d10683l9mj7-aq8r9rg4xws6" and the error stack trace:`
//   ].join('\n');

//   console.error(message);
//   console.error(error);
// }
