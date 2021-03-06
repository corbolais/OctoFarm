import Client from "./lib/octofarm.js";
import UI from "./lib/functions/ui.js";

//Add listeners to settings
document.getElementById("saveServerSettings").addEventListener("click", e => {
  //Validate Printer Form, then Add
  ServerSettings.update();
});
document.getElementById("saveSettings").addEventListener("click", e => {
  //Validate Printer Form, then Add
  ClientSettings.update();
});

class ClientSettings {
  static init() {
    if (
      !document.getElementById("systemDropDown").classList.contains("notyet")
    ) {
      Client.get("settings/client/get")
        .then(res => {
          return res.json();
        })
        .then(res => {
          //localStorage.setItem("clientSettings", JSON.stringify(res));
          if (res.settings.backgroundURL != null) {
            document.getElementById("clientBackground").value =
              res.settings.backgroundURL;

            document.body.style.backgroundImage =
              "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(" +
              res.settings.backgroundURL +
              ")";
          }
          document.getElementById("panelCurrentOpOn").checked =
            res.panelView.currentOp;
          document.getElementById("panelHideOffline").checked =
            res.panelView.hideOff;
          document.getElementById("panelHideClosed").checked =
            res.panelView.hideClosed;

          document.getElementById("cameraCurrentOpOn").checked =
            res.cameraView.currentOp;
          document.getElementById("selectCameraGrid").value =
            res.cameraView.cameraRows;
          document.getElementById("cameraHideClosed").checked =
            res.cameraView.hideClosed;

          document.getElementById("listCurrentOpOn").checked =
            res.listView.currentOp;
          document.getElementById("listHideOffline").checked =
            res.listView.hideOff;
          document.getElementById("listHideClosed").checked =
            res.listView.hideClosed;
        });
    }
  }
  static async update() {
    let bg = document.getElementById("clientBackground").value;
    let bgVal = null;
    if (bg != null && bg != "") {
      bgVal = bg;
    }
    let opts = {
      settings: {
        backgroundURL: bgVal
      },
      panelView: {
        currentOp: document.getElementById("panelCurrentOpOn").checked,
        hideOff: document.getElementById("panelHideOffline").checked,
        hideClosed: document.getElementById("panelHideClosed").checked
      },
      listView: {
        currentOp: document.getElementById("listCurrentOpOn").checked,
        hideOff: document.getElementById("listHideOffline").checked,
        hideClosed: document.getElementById("listHideClosed").checked
      },
      cameraView: {
        currentOp: document.getElementById("cameraCurrentOpOn").checked,
        cameraRows: document.getElementById("selectCameraGrid").value,
        hideClosed: document.getElementById("cameraHideClosed").checked
      }
    };

    let post = await Client.post("settings/client/update", opts);
    localStorage.setItem("clientSettings", JSON.stringify(opts));
    UI.createAlert("success", "Client settings updated", 3000, "clicked");
    location.reload();
  }
  static get() {
    //return JSON.parse(localStorage.getItem("clientSettings"));
  }
}
class ServerSettings {
  static init() {
    if (
      !document.getElementById("systemDropDown").classList.contains("notyet")
    ) {
      Client.get("settings/server/get")
        .then(res => {
          return res.json();
        })
        .then(res => {
          document.getElementById("onlinePollRate").value =
            res.onlinePolling.seconds;
        });
    }
  }
  static update() {
    let onlinePoll = document.getElementById("onlinePollRate").value;
    let onlinePolling = {
      seconds: onlinePoll
    };
    document.getElementById("overlay").style.display = "block";
    UI.createAlert(
      "success",
      "Settings updated, please wait whilst the server restarts...<br> This may take some time...<br> The page will automatically refresh when complete.... ",
      10000,
      "clicked"
    );
    Client.post("settings/server/update", { onlinePolling })
      .then(res => {
        return res.json();
      })
      .then(res => {
        location.reload();
      });
  }
}

//Initialise Settings
ServerSettings.init();
ClientSettings.init();
