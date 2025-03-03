AlightEditor
	.create(document.querySelector('.editor'), {
		// Editor config
	}).then(editor => {
		window.editor = editor;
		CKEditorInspector.attach(editor);

		sessionStorage.setItem('apiUrl', '1234567890');
		sessionStorage.setItem('dummyColleagueSessionToken', '1234567890');
		sessionStorage.setItem('dummyRequestHeader', '1234567890');

	}).catch(handleSampleError);

function handleSampleError(error) {
	const issueUrl = 'https://github.com/ckeditor/ckeditor5/issues';

	const message = [
		'Oops, something went wrong!',
		`Please, report the following error on ${issueUrl} with the build id "8d10683l9mj7-aq8r9rg4xws6" and the error stack trace:`
	].join('\n');

	console.error(message);
	console.error(error);
}

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
