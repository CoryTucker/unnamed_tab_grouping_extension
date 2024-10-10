const tabList= [];
const windowList = [];

function addToStorage(name, data){
    // Get the current data from storage
    browser.storage.local.get().then((result) => {
        // Initialize the list of entries if it doesn't exist
        let entries = result.entries || {};
        // Add the new item to the list
        entries[name] = data;

        // Save the updated list back to storage
        browser.storage.local.set(entries).then(r => {});
        browser.storage.local.get().then((result) => {console.log(result);});
    });
}

// Track when a tab is created
browser.tabs.onCreated.addListener((tab) => {
    // replace tab id with tab name to correctly store items in the storage
    let tabId = tab.id
    tabList.push(tabId);
    addToStorage("+" + tabId, tab);
    console.log("Tab created:", tab);
});

// Track when a tab is updated (URL changes, etc.)
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log("Tab updated:", tabId, changeInfo, tab);
});

// Track when a tab is removed
browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
    browser.storage.local.remove("+" + tabId).then(r => {});
    console.log("Tab closed:", tabId);
    // Update your storage or external data source here
});

// Track when a window is created
browser.windows.onCreated.addListener((window) => {
    let windowId = window.id
    windowList.push(window);
    console.log("Window created:", window);
    addToStorage("+" + windowId, window);
});

// Track when a window is removed
browser.windows.onRemoved.addListener((windowId) => {
    browser.storage.local.remove("+" + windowId).then(r => {})
    console.log("Window closed:", windowId);
    // Update your storage or external data source here
});