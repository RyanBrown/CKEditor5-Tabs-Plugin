const apiUrl = 'https://my.api.mockaroo.com/predefined_link.json?key=b3c0df80';
const apiKey = 'b3c0df80';

async function fetchPredefinedLinks() {
	try {
		const response = await fetch(apiUrl, {
			method: 'GET',
			headers: {
				'X-API-Key': apiKey,
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`API request failed with status ${response.status}: ${errorText}`);
		}

		const data = await response.json();
		console.log('Fetched data:', data);
		return data;
	} catch (error) {
		console.error('Error fetching from Mockaroo:', error);
		return null;
	}
}

// Initialize the editor with predefined links
async function initializeEditor() {
	try {
		// Fetch predefined links data
		const predefinedLinks = await fetchPredefinedLinks();
		console.log('Fetched predefined links:', predefinedLinks);

		// Store data in sessionStorage
		sessionStorage.setItem('predefinedLinks', JSON.stringify(predefinedLinks));

		// Initialize the editor with the configuration
		const editor = await AlightEditor.create(document.querySelector('.editor'), {
			// Editor config
			alightPredefinedLinkPlugin: {
				links: predefinedLinks
			},
			// Add any other config options you need
		});

		window.editor = editor;

		// Store API information in sessionStorage
		sessionStorage.setItem('apiUrl', apiUrl);
		sessionStorage.setItem('dummyColleagueSessionToken', apiKey);
		sessionStorage.setItem('dummyRequestHeader', apiKey);

		// Add event listeners or additional setup as needed

	} catch (error) {
		handleSampleError(error);
	}
}

function handleSampleError(error) {
	const issueUrl = 'https://github.com/ckeditor/ckeditor5/issues';

	const message = [
		'Oops, something went wrong!',
		`Please, report the following error on ${issueUrl} with the build id "8d10683l9mj7-aq8r9rg4xws6" and the error stack trace:`
	].join('\n');

	console.error(message);
	console.error(error);
}

// Initialize the editor when the DOM is ready
document.addEventListener('DOMContentLoaded', initializeEditor);

// const watchdog = new CKSource.EditorWatchdog();

// window.watchdog = watchdog;

// watchdog.setCreator( ( element, config ) => {
// 	return CKSource.Editor
// 		.create( element, config )
// 		.then( editor => {
// 			return editor;
// 		} );
// } );

// watchdog.setDestructor( editor => {
// 	return editor.destroy();
// } );

// watchdog.on( 'error', handleSampleError );

// watchdog
// 	.create( document.querySelector( '.editor' ), {
// 		// Editor configuration.
// 	} )
// 	.catch( handleSampleError );

// function handleSampleError( error ) {
// 	const issueUrl = 'https://github.com/ckeditor/ckeditor5/issues';

// 	const message = [
// 		'Oops, something went wrong!',
// 		`Please, report the following error on ${ issueUrl } with the build id "8d10683l9mj7-aq8r9rg4xws6" and the error stack trace:`
// 	].join( '\n' );

// 	console.error( message );
// 	console.error( error );
// }