// Track when a tab is created
browser.tabs.onCreated.addListener((tab) => {
    console.log("Tab created:", tab);
    browser.storage.local.set(tab);
    // Update your storage or external data source here
});

// Track when a tab is updated (URL changes, etc.)
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        console.log("Tab URL changed:", tab);
        // Update your storage or external data source here
    }
});

// Track when a tab is removed
browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
    browser.storage.local.remove(tabId);
    console.log("Tab closed:", tabId);
    // Update your storage or external data source here
});

// Track when a window is created
browser.windows.onCreated.addListener((window) => {
    browser.storage.local.set(window.id, tab)
    console.log("Window created:", window);
    // Update your storage or external data source here
});

// Track when a window is removed
browser.windows.onRemoved.addListener((windowId) => {
    browser.storage.local.remove(windowId)
    console.log("Window closed:", windowId);
    // Update your storage or external data source here
});