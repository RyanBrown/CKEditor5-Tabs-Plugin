/**
 * This script handles the functionality of a tabbed interface.
 * It allows users to add new tabs, remove tabs, move tabs left or right,
 * and switch between tab contents.
 */

document.addEventListener("DOMContentLoaded", function () {
  const tabsContainer = document.querySelector(".tab-list");
  const addTabButton = document.querySelector(".add-tab-button");

  function updateTabVisibility() {
    const tabs = document.querySelectorAll(".tab-list-item");
    tabs.forEach((tab, index) => {
      const moveLeftButton = tab.querySelector(".move-left-button");
      const moveRightButton = tab.querySelector(".move-right-button");
      moveLeftButton.style.display = index === 0 ? "none" : "block";
      moveRightButton.style.display =
        index === tabs.length - 1 ? "none" : "block";
    });
  }

  function addTab() {
    const newTabIndex = tabsContainer.children.length;
    const newTab = document.createElement("li");
    newTab.className = "tab-list-item";
    newTab.innerHTML = `
          <div class="tab-edit-bar">
              <button class="move-left-button" title="move tab left"></button>
              <button class="move-right-button" title="move tab right"></button>
          </div>
          <div class="title-edit-bar">
              <div class="tab-title">Tab Name ${newTabIndex}</div>
              <button class="remove-tab-button" title="remove tab"></button>
          </div>`;
    newTab.dataset.target = `#tab${newTabIndex}`;
    const newContent = document.createElement("div");
    newContent.id = `tab${newTabIndex}`;
    newContent.className = "tab-nested-content";
    newContent.textContent = `Content ${newTabIndex}`;
    document.querySelector(".tab-content").appendChild(newContent);
    tabsContainer.insertBefore(newTab, addTabButton);
    attachEventListeners(newTab);
    updateTabVisibility();
  }

  function attachEventListeners(tab) {
    const moveLeftButton = tab.querySelector(".move-left-button");
    const moveRightButton = tab.querySelector(".move-right-button");
    const removeTabButton = tab.querySelector(".remove-tab-button");

    moveLeftButton.addEventListener("click", () => moveTab(-1, tab));
    moveRightButton.addEventListener("click", () => moveTab(1, tab));
    removeTabButton.addEventListener("click", () => removeTab(tab));
  }

  function moveTab(direction, tab) {
    const currentPosition = Array.from(tabsContainer.children).indexOf(tab);
    const newPosition = currentPosition + direction;
    if (newPosition >= 0 && newPosition < tabsContainer.children.length - 1) {
      tabsContainer.removeChild(tab);
      tabsContainer.insertBefore(tab, tabsContainer.children[newPosition]);
      updateTabVisibility();
    }
  }

  function removeTab(tab) {
    const targetContent = document.querySelector(tab.dataset.target);
    tab.remove();
    targetContent.remove();
    updateTabVisibility();
  }

  addTabButton.addEventListener("click", addTab);
  document.querySelectorAll(".tab-list-item").forEach(attachEventListeners);
  updateTabVisibility();
});
