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

        // Render tabs in the content-display div
        // renderTabs(document.getElementById('content-display'));
    }
}

// Function to render tabs
// function renderTabs(container) {
//     const tabsPluginElement = container.querySelector('.tabs-plugin');
//     if (!tabsPluginElement) return;

//     const tabList = tabsPluginElement.querySelector('.tab-list');
//     const tabContent = tabsPluginElement.querySelector('.tab-content');

//     if (tabList && tabContent) {
//         // Activate the first tab and its content by default
//         const firstTab = tabList.querySelector('.tab-list-item');
//         if (firstTab) {
//             firstTab.classList.add('active');
//             const firstTabContentId = firstTab.getAttribute('data-target').slice(1);
//             const firstTabContent = tabContent.querySelector(`#${firstTabContentId}`);
//             if (firstTabContent) {
//                 firstTabContent.classList.add('active');
//             }
//         }

//         // Add event listeners to tabs
//         tabList.querySelectorAll('.tab-list-item').forEach((tab) => {
//             tab.addEventListener('click', (event) => {
//                 // Remove active class from all tabs and content
//                 tabList.querySelectorAll('.tab-list-item').forEach((item) => item.classList.remove('active'));
//                 tabContent
//                     .querySelectorAll('.tab-nested-content')
//                     .forEach((content) => content.classList.remove('active'));

//                 // Add active class to clicked tab and corresponding content
//                 tab.classList.add('active');
//                 const tabContentId = tab.getAttribute('data-target').slice(1);
//                 const tabContentElement = tabContent.querySelector(`#${tabContentId}`);
//                 if (tabContentElement) {
//                     tabContentElement.classList.add('active');
//                 }
//             });
//         });
//     }
// }

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
