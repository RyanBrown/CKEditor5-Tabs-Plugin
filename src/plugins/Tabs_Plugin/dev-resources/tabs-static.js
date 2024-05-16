document.addEventListener('DOMContentLoaded', function () {
    const tabsContainer = document.querySelector('.tab-list');
    const addTabButton = document.querySelector('.add-tab-list-item');

    // Function to add a new tab
    // Function to add a new tab
    function addTab() {
        const newIndex = tabsContainer.querySelectorAll('.tab-list-item').length + 1;
        const newTab = document.createElement('li');
        newTab.className = 'tab-list-item';
        newTab.dataset.target = `#tab${newIndex}`;
        newTab.innerHTML = `
    <div class="tab-edit-bar">
      <button class="move-left-button" title="Move Tab Left"><span>Move Tab Left</span></button>
      <button class="move-right-button" title="Move Tab Right"><span>Move Tab Right</span></button>
      <div class="delete-tab-button" title="Delete Tab"><span>Delete Tab</span></div>
    </div>
    <div class="tab-title">Tab Name ${newIndex}</div>`;
        const newContent = document.createElement('div');
        newContent.id = `tab${newIndex}`;
        newContent.className = 'tab-nested-content';
        newContent.textContent = `Content ${newIndex}`;
        document.querySelector('.tab-content').appendChild(newContent);
        tabsContainer.insertBefore(newTab, addTabButton);
        updateTabVisibility();
    }

    // Update the visibility and availability of tab controls
    function updateTabVisibility() {
        const tabs = tabsContainer.querySelectorAll('.tab-list-item');
        tabs.forEach((tab, index) => {
            let [moveLeft, moveRight, deleteTab] = tab.querySelectorAll(
                '.move-left-button, .move-right-button, .delete-tab-button'
            );
            moveLeft.style.display = index === 0 ? 'none' : '';
            moveRight.style.display = index === tabs.length - 1 ? 'none' : '';
            deleteTab.style.display = tabs.length > 1 ? '' : 'none';
        });
    }

    // Move a tab left or right
    function moveTab(tab, direction) {
        const index = Array.from(tabsContainer.children).indexOf(tab);
        const targetIndex = index + direction;
        if (targetIndex >= 0 && targetIndex < tabsContainer.children.length - 1) {
            tabsContainer.removeChild(tab);
            tabsContainer.insertBefore(tab, tabsContainer.children[targetIndex]);
            updateTabVisibility();
        }
    }

    // Remove a tab and its content
    function deleteTab(tab) {
        const tabs = tabsContainer.querySelectorAll('.tab-list-item');
        if (tabs.length > 1) {
            const targetContent = document.querySelector(tab.dataset.target);
            tab.remove();
            targetContent.remove();
            if (!tabsContainer.querySelector('.tab-list-item.active')) {
                tabsContainer.querySelector('.tab-list-item').classList.add('active');
                document
                    .querySelector(tabsContainer.querySelector('.tab-list-item').dataset.target)
                    .classList.add('active');
            }
            updateTabVisibility();
        }
    }

    // Event delegation for handling all tab interactions
    tabsContainer.addEventListener('click', function (e) {
        const tab = e.target.closest('.tab-list-item');
        if (e.target.matches('.move-left-button')) {
            moveTab(tab, -1);
        } else if (e.target.matches('.move-right-button')) {
            moveTab(tab, 1);
        } else if (e.target.matches('.delete-tab-button')) {
            deleteTab(tab);
        } else if (tab) {
            setActiveTab(tab);
        }
    });

    // Set the clicked tab as active and show its content
    function setActiveTab(tab) {
        tabsContainer.querySelectorAll('.tab-list-item').forEach((t) => t.classList.remove('active'));
        document.querySelectorAll('.tab-nested-content').forEach((c) => c.classList.remove('active'));
        tab.classList.add('active');
        const target = document.querySelector(tab.dataset.target);
        if (target) target.classList.add('active');
    }

    addTabButton.addEventListener('click', addTab);
    updateTabVisibility(); // Initial update
});
