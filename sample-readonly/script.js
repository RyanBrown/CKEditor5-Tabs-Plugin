const watchdog = new CKSource.EditorWatchdog();

window.watchdog = watchdog;

watchdog.setCreator((element, config) => {
    return CKSource.Editor.create(element, config).then((editor) => {
        const toolbarElement = editor.ui.view.toolbar.element;
        const readOnlyToggle = document.getElementById('readOnlyToggle');

        readOnlyToggle.addEventListener('click', () => {
            if (editor.isReadOnly) {
                editor.disableReadOnlyMode('docs-sample');
                toolbarElement.style.display = 'flex';
            } else {
                editor.enableReadOnlyMode('docs-sample');
                toolbarElement.style.display = 'none';
            }
        });

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
