const Terminal  =  require('xterm').Terminal;
const FitAddon = require('xterm-addon-fit').FitAddon;
const ipcRenderer = require('electron').ipcRenderer;
const socket = new WebSocket("ws://localhost:6060");
var command;

// Open the terminal in #terminal
const term = new Terminal({
    fontFamily: 'Fira Code, Iosevka, monospace',
    fontSize: 12,
    experimentalCharAtlas: 'dynamic',
    cursorBlink: true
});

document.addEventListener('DOMContentLoaded',pageLoaded);

function pageLoaded(){
    console.log('The page is loaded');
    ipcRenderer.send('Am_I_Ready',"Im ready");
    const terminalElem = document.getElementById('terminal');

    term.open(terminalElem);

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    function init() {
        if (term._initialized) {
            return;
        }

        term._initialized = true;

        term.prompt = () => {
            term.write('\r\n$ ');
        };
        prompt(term);

        term.onData(e => {
            switch (e) {
                case '\u0003': // Ctrl+C
                    term.write('^C');
                    prompt(term);
                    break;
                case '\r': // Enter
                    runCommand(term, command);
                    command = '';
                    break;
                case '\u007F': // Backspace (DEL)
                    // Do not delete the prompt
                    if (term._core.buffer.x > 2) {
                        term.write('\b \b');
                        if (command.length > 0) {
                            command = command.substr(0, command.length - 1);
                        }
                    }
                    break;
                case '\u0009':
                    console.log('tabbed', output, ["dd", "ls"]);
                    break;
                default:
                    if (e >= String.fromCharCode(0x20) && e <= String.fromCharCode(0x7E) || e >= '\u00a0') {
                        command += e;
                        term.write(e);
                    }
            }
        });
    }

    function clearInput(command) {
        var inputLengh = command.length;
        for (var i = 0; i < inputLengh; i++) {
            term.write('\b \b');
        }
    }
    function prompt(term) {
        command = '';
        term.write('\r\n$ ');
    }
    socket.onmessage = (event) => {
        term.write(event.data);
    }

    function runCommand(term, command) {
        if (command.length > 0) {
            clearInput(command);
            socket.send(command + '\n');
            return;
        }
    }
    init();

    // Make the terminal's size and geometry fit the size of #terminal-container
    fitAddon.fit();
}