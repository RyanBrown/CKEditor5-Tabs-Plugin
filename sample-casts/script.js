const watchdog = new CKSource.EditorWatchdog();

window.watchdog = watchdog;

watchdog.setCreator((element, config) => {
    return CKSource.Editor.create(element, config).then((editor) => {
        attachEvents(editor);
        return editor;
    });
});

watchdog.setDestructor((editor) => {
    return editor.destroy();
});

watchdog.on('error', handleSampleError);

watchdog
    .create(document.querySelector('.editor'), {
        // Editor configuration.
    })
    .catch(handleSampleError);

function handleSampleError(error) {
    const issueUrl = 'https://github.com/ckeditor/ckeditor5/issues';

    const message = [
        'Oops, something went wrong!',
        `Please, report the following error on ${issueUrl} with the build id "8d10683l9mj7-aq8r9rg4xws6" and the error stack trace:`,
    ].join('\n');

    console.error(message);
    console.error(error);
}

function attachEvents(editor) {
    editor.model.document.on('change:data', () => {
        const upcast = editor.plugins.get('UpcastDispatcher');
        const editingDowncast = editor.plugins.get('EditingDowncastDispatcher');
        const dataDowncast = editor.plugins.get('DataDowncastDispatcher');

        document.getElementById('upcast').textContent = JSON.stringify(upcast, null, 2);
        document.getElementById('editingDowncast').textContent = JSON.stringify(editingDowncast, null, 2);
        document.getElementById('dataDowncast').textContent = JSON.stringify(dataDowncast, null, 2);
    });
}
