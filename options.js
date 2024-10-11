async function saveOptions(e) {
    e.preventDefault();
    await browser.storage.sync.set({
        colour: document.querySelector("#colour").value
    });
}

async function restoreOptions() {
    let res = await browser.storage.managed.get('colour');
    document.querySelector("#managed-colour").innerText = res.colour;

    res = await browser.storage.sync.get('colour');
    document.querySelector("#colour").value = res.colour || 'Firefox red';
}

function update(){
    browser.runtime.sendMessage("dQw4w9WgXcQ").then(r => {
        document.getElementById("name").innerHTML = r.name;
        document.getElementById("tabList").innerHTML = ""
        for (const tab of r.window.tabs) {
            document.getElementById("tabList").innerHTML += "<li>" + tab.title + "</li>";
        }
    })
}

function updated(){

}
document.addEventListener("click", update);
//document.addEventListener('DOMContentLoaded', restoreOptions);
//document.querySelector("form").addEventListener("submit", saveOptions);
update()

// browser.runtime.onMessage.addListener((message) =>{
//     console.log("message", message)
// })ff