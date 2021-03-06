const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const session = require("express-session");
const passport = require("passport");
const { ensureAuthenticated } = require("./config/auth");
const serverConfig = require("./serverConfig/server");

//Server Port
const PORT = process.env.PORT || serverConfig.port;

const app = express();

//Passport Config
require("./config/passport.js")(passport);

//DB Config
const db = require("./config/db.js").MongoURI;

//JSON
app.use(express.json());

//EJS
app.use(expressLayouts);
app.set("view engine", "ejs");

//Bodyparser
app.use(express.urlencoded({ extended: false }));

// Express Session Middleware
app.use(
  session({
    secret: "supersecret",
    resave: true,
    saveUninitialized: true
  })
);

//Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Connect Flash Middleware
app.use(flash());

//Global Vars
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

//Routes
app.use(express.static(__dirname + "/views"));
if (db === "") {
  app.use("/", require("./routes/index", { page: "route" }));
} else {
  app.use("/", require("./routes/index", { page: "route" }));
  app.use("/users", require("./routes/users", { page: "route" }));
  app.use("/printers", require("./routes/printers", { page: "route" }));
  app.use("/settings", require("./routes/settings", { page: "route" }));
  app.use("/sse", require("./routes/SSE", { page: "route" }));
  app.use("/filament", require("./routes/filament", { page: "route" }));
  app.use("/history", require("./routes/history", { page: "route" }));
}

//Mongo Connect
mongoose
  .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => serverStart())
  .catch(err => console.log(err));

let serverStart = async function() {
  console.log("MongoDB Connected...");
  //Setup Settings
  const serverSettings = require("./settings/serverSettings.js");
  const ServerSettings = serverSettings.ServerSettings;
  console.log("Checking Server Settings...");
  let ss = await ServerSettings.init();
  console.log(ss);
  const clientSettings = require("./settings/clientSettings.js");
  const ClientSettings = clientSettings.ClientSettings;
  console.log("Checking Client Settings...");
  let cs = await ClientSettings.init();
  console.log(cs);
  //Start backend metrics gathering...
  console.log("Starting System Printers Runner...");
  const runner = require("./runners/state.js");
  const Runner = runner.Runner;
  let r = await Runner.init();
  console.log(r);
  console.log("Starting System Information Runner...");
  const system = require("./runners/systemInfo.js");
  const SystemRunner = system.SystemRunner;
  let sr = await SystemRunner.init();
  console.log(sr);
  app.listen(PORT, () => {
    console.log(`HTTP server started...`);
    console.log(`You can now access your server on port: ${PORT}`);
  });
};
