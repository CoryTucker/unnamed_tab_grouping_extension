let tabList= [];
let windowList = [];
let storage = {
    tabs : [],
    windows: [],
    groups: []
};

browser.storage.local.get().then((result) => {
    //storage = result;
})

// get initial list of tabs and windows on extension start
browser.tabs.query({}).then(tabs => {
    for (let tab of tabs) {
        storage.tabs = tabs;
    }
    });
browser.windows.getAll({}).then(windows => {
    storage.windows = windows;
});

console.log(storage)
console.log(storage.groups.length)
if (storage.groups.length === 0) {
    browser.windows.getCurrent().then((window) => {
        console.log(storage)
        console.log(storage.groups.length)
        storage.groups.push(new tabGroup('steve', window.id));
    })
}

class tabGroup {
    id
    name
    mainTabID
    isSubGroupOf
    attachedWindowId
    attachedTabs
    status
    constructor(name, attachedWindowId) {
        this.id = 0;
        this.name = name;
        this.attachedWindowId = attachedWindowId;
        browser.tabs.create({
            url: browser.runtime.getURL('options.html'),
            pinned: true,
            windowId: this.attachedWindowId,
        }).then(tab =>{this.mainTabID = tab.id})
    }
    open(){}
    close(){}
    mergeWithWindow(){}
    splitFromWindow(){}
    splitSubGroup(){}
    mergeSubGroup(){}
}

function addToStorage(name, data){
    // Get the current data from storage
    storage[name] = data
    // browser.storage.local.get().then((result) => {
    //     // Initialize the list of entries if it doesn't exist
    //     let entries = result.entries || {};
    //     // Add the new item to the list
    //     entries[name] = data;
    //
    //     // Save the updated list back to storage
    //     browser.storage.local.set(entries).then(r => {});
    //     browser.storage.local.get().then((result) => {
    //         console.log(result);
    //     });
    // });
}

function getFromStorage(name, data){
    return storage[name];
}

// communication between open options tabs
browser.runtime.onMessage.addListener((e) =>{
    console.log("message", e)
})

browser.runtime.onSuspend.addListener((e) => {
    console.log("suspending");
    browser.storage.local.set(storage).then()
});
// Track when a tab is created
browser.tabs.onCreated.addListener((tab) => {
    // replace tab id with tab name to correctly store items in the storage
    let tabId = tab.id
    tabList.push(tabId);
    addToStorage("+" + tabId, tab);
    //console.log("Tab created:", tab);
});

// Track when a tab is updated (URL changes, etc.)
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    //console.log("Tab updated:", tabId, changeInfo, tab);
});

// Track when a tab is removed
browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
    browser.storage.local.remove("+" + tabId).then(r => {});
    //console.log("Tab closed:", tabId);
    // Update your storage or external data source here
});

// Track when a window is created
browser.windows.onCreated.addListener((window) => {
    let windowId = window.id
    windowList.push(window);
    //console.log("Window created:", window);
    addToStorage("+" + windowId, window);
});

// Track when a window is removed
browser.windows.onRemoved.addListener((windowId) => {
    browser.storage.local.remove("+" + windowId).then(r => {})
    //console.log("Window closed:", windowId);
    // Update your storage or external data source here
});