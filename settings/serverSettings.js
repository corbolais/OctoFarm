const ServerSettingsDB = require("../models/serverSettings.js");

class ServerSettings {
  static init(){
      console.log("Initialising Server Settings")
      ServerSettingsDB.find({}).then(settings => {
        if(settings.length < 1){
          let onlinePolling = {
            seconds: 6000,
          }
          let offlinePolling = {
            on: true,
            seconds: 300000
          }
          let defaultSystemSettings = new ServerSettingsDB({
            onlinePolling,
            offlinePolling
          });
          defaultSystemSettings.save();
        }
      })
  }
  static check(){
    return ServerSettingsDB.find({})
  }
  static update(obj){
    ServerSettingsDB.find({}).then(checked => {
      checked[0] = obj;
      checked[0].save;
    })
  }
}

module.exports = {
  ServerSettings: ServerSettings
};