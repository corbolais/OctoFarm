import OctoPrintClient from "./lib/octoprint.js";
import UI from "./lib/functions/ui.js";
import Calc from "./lib/functions/calc.js";
import currentOperations from "./lib/modules/currentOperations.js";
import PrinterManager from "./lib/modules/printerManager.js";

let printerInfo = "";
let elems = [];
//Connect to servers socket..webSocket
let url = window.location.hostname;
let port = window.location.port;
if (port != "") {
  port = ":" + port;
}
var source = new EventSource("/sse/printerInfo/");
source.onmessage = function(e) {
  if (e.data != null) {
    let res = JSON.parse(e.data);

    if (
      document.getElementById("printerManagerModal").classList.contains("show")
    ) {
      PrinterManager.init(res.printerInfo);
    } else {
      printerInfo = res.printerInfo;
      if (res.clientSettings.listView.currentOp) {
        currentOperations(res.currentOperations, res.currentOperationsCount);
      }
      updateState(res.printerInfo, res.clientSettings.listView);
    }
  }
};
source.onerror = function(e) {
  UI.createAlert(
    "error",
    "Communication with the server has been suddenly lost, we will automatically refresh in 10 seconds..."
  );
  setTimeout(function() {
    location.reload();
  }, 10000);
};
source.onclose = function(e) {
  UI.createAlert(
    "error",
    "Communication with the server has been suddenly lost, we will automatically refresh in 10 seconds..."
  );
  setTimeout(function() {
    location.reload();
  }, 10000);
};

//Setup page listeners...
let printerCard = document.querySelectorAll("[id^='printerButton-']");
printerCard.forEach(card => {
  let ca = card.id.split("-");
  card.addEventListener("click", e => {
    PrinterManager.updateIndex(parseInt(ca[1]));
    PrinterManager.init(printerInfo);
  });
  document.getElementById("listPlay-" + ca[1]).addEventListener("click", e => {
    e.target.disabled = true;
    let opts = {
      command: "start"
    };
    OctoPrintClient.jobAction(printerInfo[ca[1]], opts, e);
  });
  document
    .getElementById("listCancel-" + ca[1])
    .addEventListener("click", e => {
      bootbox.confirm({
        message: `${printerInfo[ca[1]].index}.  ${
          printerInfo[ca[1]].settingsAppearance.name
        }: <br>Are you sure you want to cancel the ongoing print?`,
        buttons: {
          cancel: {
            label: '<i class="fa fa-times"></i> Cancel'
          },
          confirm: {
            label: '<i class="fa fa-check"></i> Confirm'
          }
        },
        callback: function(result) {
          if (result) {
            e.target.disabled = true;
            let opts = {
              command: "cancel"
            };
            OctoPrintClient.jobAction(printerInfo[ca[1]], opts, e);
          }
        }
      });
    });
});

function grabElements(printer) {
  if (typeof elems[printer.index] != "undefined") {
    return elems[printer.index];
  } else {
    let printerElemens = {
      row: document.getElementById("listRow-" + printer.index),
      index: document.getElementById("listIndex-" + printer.index),
      name: document.getElementById("listName-" + printer.index),
      control: document.getElementById("printerButton-" + printer.index),
      start: document.getElementById("listPlay-" + printer.index),
      stop: document.getElementById("listCancel-" + printer.index),
      pause: document.getElementById("listCancel-" + printer.index),
      restart: document.getElementById("listCancel-" + printer.index),
      resume: document.getElementById("listCancel-" + printer.index),
      currentFile: document.getElementById("listFile-" + printer.index),
      filament: document.getElementById("listFilament-" + printer.index),
      state: document.getElementById("listState-" + printer.index),
      printTime: document.getElementById("listPrintTime-" + printer.index),
      tool0: document.getElementById("listE0Temp-" + printer.index),
      bed: document.getElementById("listBedTemp-" + printer.index),
      iconBedT: document.getElementById("bedT-" + printer.index),
      iconBedA: document.getElementById("bedA-" + printer.index),
      iconTool0A: document.getElementById("tool0A-" + printer.index),
      iconTool0T: document.getElementById("tool0T-" + printer.index)
    };
    elems[printer.index] = printerElemens;
    return elems[printer.index];
  }
}
function updateState(printers, clientSettings) {
  printers.forEach(printer => {
    let elements = grabElements(printer);
    //Set the data
    elements.index.innerHTML = printer.index;

    if (typeof printer.settingsApperance != "undefined") {
      elements.name.innerHTML = printer.settingsApperance.name;
    }

    if (typeof printer.job != "undefined" && printer.job.file.name != null) {
      elements.currentFile.innerHTML =
        '<i class="fas fa-file-code"></i> ' + printer.job.file.name;
    } else {
      elements.currentFile.innerHTML =
        '<i class="fas fa-file-code"></i> ' + "No File Selected";
    }
    if (
      typeof printer.selectedFilament != "undefined" &&
      printer.selectedFilament != null &&
      printer.selectedFilament.name != null
    ) {
      elements.filament.innerHTML =
        printer.selectedFilament.name +
        " " +
        "[" +
        printer.selectedFilament.colour +
        " / " +
        printer.selectedFilament.type[1] +
        "]";
    }
    elements.state.innerHTML = printer.state;
    if (typeof printer.progress != "undefined") {
      elements.printTime.innerHTML = Calc.generateTime(
        printer.progress.printTimeLeft
      );
    }
    let tool0A = 0;
    let tool0T = 0;
    let bedA = 0;
    let bedT = 0;
    if (typeof printer.temps != "undefined") {
      if (typeof printer.temps[0].tool0 != "undefined") {
        tool0A = printer.temps[0].tool0.actual;
        tool0T = printer.temps[0].tool0.target;
        bedA = printer.temps[0].bed.actual;
        bedT = printer.temps[0].bed.target;
      } else {
        tool0A = 0;
        tool0T = 0;
        bedA = 0;
        bedT = 0;
      }
    }
    let hideClosed = "";
    let hideOffline = "";

    if (clientSettings.hideOff) {
      hideOffline = "hidden";
    }
    if (clientSettings.hideClosed) {
      hideClosed = "hidden";
    }
    if (printer.stateColour.category === "Active") {
      //Set the state
      elements.row.className = printer.stateColour.category;
      elements.control.disabled = false;
      elements.start.disabled = true;
      elements.stop.disabled = false;
      if (tool0A > tool0T - 0.5 && tool0A < tool0T + 0.5) {
        elements.tool0.innerHTML =
          '<i id="tool0A-' +
          printer.index +
          '" class="far fa-circle toolOn"></i> ' +
          tool0A +
          "°C" +
          " " +
          '<i id="tool0T-' +
          printer.index +
          '" class="fas fa-bullseye toolOn"></i> ' +
          tool0T +
          "°C";
      } else if (tool0A < 35) {
        elements.tool0.innerHTML =
          '<i id="tool0A-' +
          printer.index +
          '" class="far fa-circle"></i> ' +
          tool0A +
          "°C" +
          " " +
          '<i id="tool0T-' +
          printer.index +
          '" class="fas fa-bullseye"></i> ' +
          tool0T +
          "°C";
      } else {
        elements.tool0.innerHTML =
          '<i id="tool0A-' +
          printer.index +
          '" class="far fa-circle toolOut"></i> ' +
          tool0A +
          "°C" +
          '<i id="tool0T-' +
          printer.index +
          '" class="fas fa-bullseye toolOut"></i> ' +
          tool0T +
          "°C";
      }
      if (bedA > bedT - 0.5 && bedA < bedT + 0.5) {
        elements.bed.innerHTML =
          '<i id="bedA-' +
          printer.index +
          '" class="far fa-circle toolOn"></i> ' +
          bedA +
          "°C" +
          " " +
          '<i id="bedT-' +
          printer.index +
          '" class="fas fa-bullseye toolOn"></i> ' +
          bedT +
          "°C";
      } else if (bedA < 35) {
        elements.bed.innerHTML =
          '<i id="bedA-' +
          printer.index +
          '" class="far fa-circle"></i> ' +
          bedA +
          "°C" +
          " " +
          '<i id="bedT-' +
          printer.index +
          '" class="fas fa-bullseye"></i> ' +
          bedT +
          "°C";
      } else {
        elements.bed.innerHTML =
          '<i id="bedA-' +
          printer.index +
          '" class="far fa-circle toolOut"></i> ' +
          bedA +
          "°C" +
          '<i id="bedT-' +
          printer.index +
          '" class="fas fa-bullseye toolOut"></i> ' +
          bedT +
          "°C";
      }
    } else if (
      printer.stateColour.category === "Idle" ||
      printer.stateColour.category === "Complete"
    ) {
      elements.row.className = printer.stateColour.category;
      elements.control.disabled = false;
      if (typeof printer.job != "undefined" && printer.job.file.name != null) {
        elements.start.disabled = false;
        elements.stop.disabled = true;
      } else {
        elements.start.disabled = true;
        elements.stop.disabled = true;
      }
    } else if (printer.state === "Closed") {
      elements.row.className = printer.stateColour.category + " " + hideClosed;
      elements.control.disabled = false;
      elements.start.disabled = true;
      elements.stop.disabled = true;
    } else if (printer.stateColour.category === "Offline") {
      elements.row.className = printer.stateColour.category + " " + hideOffline;
      elements.control.disabled = true;
      elements.start.disabled = true;
      elements.stop.disabled = true;
    }
  });
}
