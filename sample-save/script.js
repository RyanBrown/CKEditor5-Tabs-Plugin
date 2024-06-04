const watchdog = new CKSource.EditorWatchdog();

window.watchdog = watchdog;

watchdog.setCreator((element, config) => {
    return CKSource.Editor.create(element, config).then((editor) => {
        window.editor = editor;
        return editor;
    });
});

watchdog.setDestructor((editor) => {
    return editor.destroy();
});

watchdog.on('error', handleSampleError);

watchdog
    .create(document.querySelector('#editor'), {
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

function saveContent() {
    const content = window.editor.getData();
    localStorage.setItem('ckeditorContent', content);
    displayContent();
}

function resetContent() {
    localStorage.removeItem('ckeditorContent');
    window.editor.setData('');
    if (window.readonlyEditor) {
        window.readonlyEditor.setData('');
    }
    document.getElementById('content-display').innerHTML = '';
}

function displayContent() {
    const savedContent = localStorage.getItem('ckeditorContent');
    if (savedContent) {
        if (window.readonlyEditor) {
            window.readonlyEditor.setData(savedContent);
        }
        document.getElementById('content-display').innerHTML = savedContent;
    }
}

// Load content on page load and initialize the readonly editor
document.addEventListener('DOMContentLoaded', () => {
    displayContent();

    CKSource.Editor.create(document.querySelector('#readonly-editor'), {
        toolbar: [],
        isReadOnly: true,
    })
        .then((editor) => {
            window.readonlyEditor = editor;
            const savedContent = localStorage.getItem('ckeditorContent');
            if (savedContent) {
                editor.setData(savedContent);
            }
        })
        .catch((error) => {
            console.error('There was a problem initializing the read-only editor:', error);
        });
});
