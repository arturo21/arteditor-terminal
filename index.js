const express = require('express');
const bodyParser = require("body-parser");
const electron = require('electron');
const remote = require('electron').remote;
const Menu = require('electron').Menu;
const MenuItem = require('electron').MenuItem;
const ipcMain = require('electron').ipcMain;
const url=require('url')
const path=require('path')
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const dialog = electron.dialog;
const srv = express();
const fs = require('fs');
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
srv.set('pages', __dirname + '/pages/');
srv.set('view engine', 'ejs');
srv.use(express.static(process.cwd() + '/pages'));
srv.use('/static', express.static(__dirname + '/public'));
srv.use('/submod', express.static(__dirname + '/pages'));
srv.use('/modules', express.static(__dirname + '/node_modules'));
//body-parser middle-ware.
srv.use(bodyParser.urlencoded({ extended: false }));
srv.use(bodyParser.json());
const pty = require("node-pty");
const os = require("os");
var shell = os.platform() === "win32" ? "powershell.exe" : "bash";
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 6060 });
console.log("Socket is up and running...");
let mainWindow;
srv.get('/', function(req, res) {
    res.render('index', {});
});
var ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    //   cwd: process.env.HOME,
    env: process.env,
});
wss.on('connection', ws => {
    console.log("new session")
    ws.on('message', command => {
        ptyProcess.write(command);
    })

    ptyProcess.on('data', function (data) {
        ws.send(data)
        console.log(data);

    });
})
function createWindow() {
    mainWindow = new BrowserWindow({
        height: 450,
        width: 800,
        webPreferences: {
          nodeIntegration: true,
          preload: `${__dirname}/renderer.js`,
          webviewTag: true
        }
    });
    mainWindow.loadURL(`http://localhost:1234/`);
    mainWindow.on("closed", function() {
        mainWindow = null;
    });

    ipcMain.on("terminal.keystroke", (event, key) => {
        ptyProcess.write(key);
    });
}
srv.listen(1234);
app.on("ready", createWindow);

app.on("window-all-closed", function() {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", function() {
    if (mainWindow === null) {
        createWindow();
    }
});