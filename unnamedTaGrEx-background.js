let tabs = [];
let windows = [];
let groups = [];

void setup()
async function setup() {
    console.log("starting extension")
// set up the autosave alarm
    browser.alarms.create("autosave", {periodInMinutes: 1})

// grab storage from the browser
    let browser_storage = await browser.storage.local.get()
// validate format of storage from browser
// check if each of the required values exist
    if (Object.keys(browser_storage).indexOf("tabs") > -1) tabs = browser_storage.tabs;
    // if (Object.keys(browser_storage).indexOf("windows") > -1) windows = browser_storage.windows;
    if (Object.keys(browser_storage).indexOf("groups") > -1){
        for (const foundGroup of browser_storage.groups) {
            groups.push(tabGroup.fromJson(foundGroup));
        }
    }
    // get initial list of tabs and windows on extension start
    let foundTabs = await browser.tabs.query({})
    let foundWindows= await browser.windows.getAll({})
    console.log(foundWindows)
    // tabs
    // merge found tabs with existing tabs in storage
    // todo - verify that tabs keep their ids across browser restarts
    tabs = merge(tabs, foundTabs, (a,b) => a.id === b.id);
    // sort tabs by id
    tabs = tabs.sort((a, b) => a.id - (b.id));

    // windows
    // merge found tabs with existing tabs in storage
    // todo - verify that windows keep their ids across browser restarts
    windows = merge(windows, foundWindows, (a,b) => a.id === b.id);
    windows.sort((a, b) => a.id - (b.id));

    // temp - create initial test group
    if (groups.length === 0) {
        let window = await browser.windows.getCurrent({populate: true})
        groups.push(new tabGroup('steve', window));
        console.log('created group because current groups length is zero');
    }
    console.log(groups)

    // check if all windows have a group by matching each item in the list
    // there is almost certainly a much better way of doing this, but I bet in the backend they do the same thing.
    let groupsCounter = 0
    let windowsCounter = 0
    let breakNextLoop = false

    // temp until I stop the while loop from breaking shit
    let emergencyCounter = 0;
    while (true) {
        emergencyCounter += 1;
        //console.log(windowsCounter, groupsCounter)
        let windowID = null
        try { windowID = windows[windowsCounter].id; }
        catch(e) {if (e.name !== "TypeError") throw e}
        let groupsID = null
        try { groupsID = groups[groupsCounter].attachedWindowId; }
        catch(e) {if (e.name !== "TypeError") throw e}
        //console.log(windowID, groupsID)
        // if we match a window and group, initialise the group
        if (windowID === groupsID) {
            console.log('Matched')
            // console.log(groups)
            // console.log(groupsCounter)
            // console.log(groups[groupsCounter])
            // todo init group
            groups[groupsCounter].initialize()
            groupsCounter += 1;
            windowsCounter += 1;
        }
        // if there is a missing group, create it
        else if (windowID < groupsID || groupsID === -1) {
            console.log('Missing Group')
            // todo complete initialisation
            groups.splice(groupsCounter, 0, new tabGroup('unnamedGroup', windows[windowsCounter], true));
            //console.log(e)
            windowsCounter += 1;
            groupsCounter += 1;
        }
        // if there is an extra group, initialise it as inactive
        else if (groupsID < windowID){
            console.log('Extra Group')
            groupsCounter += 1;
        }

        // if we're at the end of both lists break
        // (we want to be able to go off the end of either list but not both)
        // however, since one of these values will have incremented in the last loop, we still want to loop one more
        // time.
        if (breakNextLoop) break
        if (windowsCounter >= windows.length - 1 && groupsCounter >= groups.length - 1) {
            breakNextLoop = true
        }
        if (emergencyCounter > 100) {
            console.log('emergency broken')
            break
        }
    }
    saveStorage()
}
// extension based functions

// called whenever we need to save to persistent browser storage so we don't lose data when something crashes
function saveStorage(){
    void browser.storage.local.set({
        "tabs": tabs,
        "windows": windows,
        "groups": groups,
    })
}

// random functions
// https://stackoverflow.com/questions/1584370/how-to-merge-two-arrays-in-javascript-and-de-duplicate-items
const merge = (a, b, predicate = (a, b) => a === b) => {
    const c = [...a]; // copy to avoid side effects
    // add all items from B to copy C if they're not already present
    b.forEach((bItem) => (c.some((cItem) => predicate(bItem, cItem)) ? null : c.push(bItem)))
    return c;
}

class tabGroup {
    id
    name
    mainTabID
    isSubGroupOf
    attachedWindowId
    attachedTabs
    active
    constructor(name, window, initialize) {
        this.id = 0;
        this.name = name;
        if (window !== null) {
            this.attachedWindowId = window.id;
            void this.constructorContinued()
            if(initialize){void this.initialize()}
        }
    }
    async constructorContinued(){
    }
    // initialise group when group created from blank window or on browser start
    async initialize(){
        // look for existing options tab
        // create options tab
        let tab = await browser.tabs.create({
            url: browser.runtime.getURL('options.html'),
            pinned: true,
            index: 0,
            windowId: this.attachedWindowId,
        })
        this.mainTabID = tab.id;
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

    static fromJson(JSONGroup) {
        //console.log(JSONGroup)
        let result = new tabGroup(JSONGroup.name, null, false);
        result.id = JSONGroup.id;
        result.mainTabID = JSONGroup.mainTabID;
        result.attachedWindowId = JSONGroup.attachedWindowId;
        result.attachedTabsId = JSONGroup.attachedWindowId;
        // todo finish or improve
        return result;
    }
}

// add various listeners
browser.alarms.onAlarm.addListener(alarmInfo => {
    console.log("alarm", alarmInfo);
    if (alarmInfo.name === "autosave"){
        console.log("alarm", alarmInfo);
        saveStorage();
        return Promise.resolve()
    }
    return false
})

// when we receive a message from a newly created group control tab, respond with data about the group
browser.runtime.onMessage.addListener(async (message, sender) => {
    // find appropriate group
    for (const group of groups) {
        if (sender.tab.id === group.mainTabID) {
            let window = await browser.windows.get(group.attachedWindowId, {populate: true})
            return Promise.resolve({
                name: group.name,
                window: window
            })
        }
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
    //addToStorage("+" + tabId, tab);
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