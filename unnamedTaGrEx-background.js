let tabs = [];
let windows = [];
let groups = [];

void setup()
async function setup() {
// set up the autosave alarm
    browser.alarms.create("autosave", {periodInMinutes: 1})

// grab storage from the browser
    let browser_storage = await browser.storage.local.get()
// validate format of storage from browser
// check if each of the required values exist
    if (Object.values(browser_storage).indexOf("tabs") > -1)
        tabs = browser_storage.tabs;
    if (Object.values(browser_storage).indexOf("windows") > -1)
        windows = browser_storage.windows;
    if (Object.values(browser_storage).indexOf("groups") > -1)
        groups = browser_storage.groups;

// get initial list of tabs and windows on extension start
    browser.tabs.query({}).then(foundTabs => {
        // sort foundTabs by ID
        foundTabs = foundTabs.sort((a, b) => a.id - (b.id));
        //merge found tabs with existing tabs in storage
        // let storedTabsI = 0
        // let foundTabsI = 0
        // while (true) {
        //     if(foundTabsI.id === storedTabsI.id){
        //         // todo check this works as intended on browser start
        //         tabs[storedTabsI] = foundTabs[foundTabsI];
        //     }else if(foundTabsI.id === storedTabsI.id){
        //
        //     }
        // }

        // https://stackoverflow.com/questions/1584370/how-to-merge-two-arrays-in-javascript-and-de-duplicate-items
        const merge = (a, b, predicate = (a, b) => a === b) => {
            const c = [...a]; // copy to avoid side effects
            // add all items from B to copy C if they're not already present
            b.forEach((bItem) => (c.some((cItem) => predicate(bItem, cItem)) ? null : c.push(bItem)))
            return c;
        }
        for (let tab of foundTabs) {
            // todo - verify that tabs keep their ids across browser restarts
            tabs = foundTabs;
        }
    });
    browser.windows.getAll({}).then(foundWindows => {
        windows = foundWindows;
    });
    // temp - create initial test group
    if (groups.length === 0) {
        browser.windows.getCurrent({populate: true}).then((window) => {
            groups.push(new tabGroup('steve', window));
        })
    }
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
function getFromStorage(name){
    return storage[name];
}
// communication between open options tabs
// browser.runtime.onMessage.addListener((e) =>{
//     console.log("message", e)
// })

class tabGroup {
    id
    name
    mainTabID
    isSubGroupOf
    attachedWindowId
    attachedTabs
    status
    constructor(name, window) {
        this.id = 0;
        this.name = name;
        this.attachedWindowId = window.id;
        void this.constructorContinued()
    }
    async constructorContinued(){
        let tab = await browser.tabs.create({
            url: browser.runtime.getURL('options.html'),
            pinned: true,
            windowId: this.attachedWindowId,
        })
        this.mainTabID = tab.id;

        // when we receive a message from the newly created tab, respond with data about the group
        browser.runtime.onMessage.addListener(async (message, sender) => {
            if (sender.tab.id === this.mainTabID) {
                let window = await browser.windows.get(this.attachedWindowId, {populate: true})
                return Promise.resolve({
                    name: this.name,
                    window: window
                })
            }
            return false
        })
    }
    async updateTab(message, sender){
        return false
    }
    open(){}
    close(){}
    mergeWithWindow(){}
    splitFromWindow(){}
    splitSubGroup(){}
    mergeSubGroup(){}
}

// add various listeners
browser.alarms.onAlarm.addListener(alarmInfo => {
    if (alarmInfo.name === "autosave"){
        void browser.storage.local.set({
            "tabs": tabs,
            "windows": windows,
            "groups": groups,
        })
    }
    return false
})

// no worky :(
browser.runtime.onSuspend.addListener((e) => {
    console.log("suspending");
    void browser.storage.local.set(storage)
});

// Track when a tab is created
browser.tabs.onCreated.addListener((tab) => {
    // replace tab id with tab name to correctly store items in the storage
    let tabId = tab.id
    // todo tabList.push(tabId);
    addToStorage("+" + tabId, tab);
    //console.log("Tab created:", tab);
});

// Track when a tab is updated (URL changes, etc.)
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    //console.log("Tab updated:", tabId, changeInfo, tab);
});

// Track when a tab is removed
browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
    void browser.storage.local.remove("+" + tabId);
    //console.log("Tab closed:", tabId);
});

// Track when a window is created
browser.windows.onCreated.addListener((window) => {
    let windowId = window.id
    // todo windowList.push(window);
    //console.log("Window created:", window);
    addToStorage("+" + windowId, window);
});

// Track when a window is removed
browser.windows.onRemoved.addListener((windowId) => {
    void browser.storage.local.remove("+" + windowId)
    //console.log("Window closed:", windowId);
});