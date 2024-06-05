class Controller {
    KEY_CODES = {
        W: 87,
        A: 65,
        S: 83,
        D: 68,
        F: 70,
        SHIFT: 16,
        ESCAPE: 27
    };

    // player left stik movement
    xStik;
    yStik;

    // keys left stik
    wKey;
    sKey;
    aKey;
    dKey;

    // altri comandi
    shiftKey; // - corsa

    // variabili usate per interazione da telefono
    touch;
    previousTouch;


    // elementi influenzati dal controller
    game;
    canvas;
    uiCanvas;

    gameDiv;
    fullScreen;

    turningSensitivityMouse = 20;
    turningSensitivityTouch = 10;

    constructor(canvas, uiCanvas, gameDiv, game) {
        // salvo le aree di interazione
        this.canvas = canvas;
        this.uiCanvas = uiCanvas;
        this.gameDiv = gameDiv;

        // la logica del gioco
        this.game = game;


        this.fullScreen = false;

        // imposto il valore iniziale dei tasti
        this.xStik = 0;
        this.yStik = 0;

        this.wKey = false;
        this.sKey = false;
        this.aKey = false;
        this.dKey = false;

        this.shiftKey = false;

        // assegno le funzioni ai tasti
        this.setFuncion();
    }

    // funzione per attivare e disattivare la modalità full screen
    toggleFullScreen() {
        if (this.fullScreen) {
            document.exitFullscreen();
            this.fullScreen = false;
        } else {
            this.gameDiv.requestFullscreen();
            this.fullScreen = true;
        }
    }

    // tiene conto dell'inclinazione dello "stick virtuale"
    inclineStik(positive, negative, value) {
        if (positive || negative) {
            if (positive)
                value = lerp(value, 1, 0.1);
            else
                value = lerp(value, -1, 0.1);
        }
        else
            value = lerp(value, 0, 0.3);
        return value;
    }

    // arrotondo i valori presi dallo stick virtuale
    roundStick(value) {
        if (value >= 0.99)
            value = 1
        if (value <= 0.01 && value >= -0.01)
            value = 0
        if (value <= -0.99)
            value = -1

        return value;
    }

    // impostiamo l'effetto che i comandi hanno
    setFuncion() {
        this.setUpPCControls();
        this.setUpPhoneControls();
    }

    setUpPCControls() {
        let self = this;

        // === imposto comandi del mouse ===
        // - movimento "testa" del giocatore
        window.addEventListener('mousemove', function (e) {
            self.game.playerTurnHead(-e.movementX / self.turningSensitivityMouse, -e.movementY / self.turningSensitivityMouse)
        })

        // - impostare "focus mode" del mouse
        this.uiCanvas.addEventListener('click', () => {
            if (window.innerWidth < 1300)
                return;

            self.canvas.requestPointerLock();
        });

        // - accendere e spegnere la torcia
        this.canvas.addEventListener('mousedown', (e) => {
            self.game.toggleTorch();
            audioController.performSwitchAudio();
        })

        // ==== imposto comandi tastiera ====
        window.onkeyup = function (e) {
            switch (e.keyCode) {
                case self.KEY_CODES.W:
                    self.wKey = false;
                    break;
                case self.KEY_CODES.S:
                    self.sKey = false;
                    break;
                case self.KEY_CODES.A:
                    self.aKey = false;
                    break;
                case self.KEY_CODES.D:
                    self.dKey = false;
                    break;
                case self.KEY_CODES.SHIFT:
                    self.shiftKey = false;
                    break;
            }
        }

        window.onkeydown = function (e) {
            switch (e.keyCode) {
                case self.KEY_CODES.W:
                    self.wKey = true;
                    break;
                case self.KEY_CODES.S:
                    self.sKey = true;
                    break;
                case self.KEY_CODES.A:
                    self.aKey = true;
                    break;
                case self.KEY_CODES.D:
                    self.dKey = true;
                    break;
                case self.KEY_CODES.SHIFT:
                    self.shiftKey = true;
                    break;
                case self.KEY_CODES.F:
                    self.toggleFullScreen();
                    break;
            }
        };
    }

    setUpPhoneControls() {
        let self = this;

        // - definisco funzionamento trascinamento dita su schermo
        window.addEventListener('touchmove', function (e) {
            self.touch = e.touches[e.touches.length - 1];

            if (self.previousTouch) {
                e.movementX = self.touch.pageX - self.previousTouch.pageX;
                e.movementY = self.touch.pageY - self.previousTouch.pageY;

                self.game.playerTurnHead(e.movementX / self.turningSensitivityTouch, e.movementY / self.turningSensitivityTouch)
            };

            self.previousTouch = self.touch;
        })

        window.addEventListener("touchend", (e) => {
            self.previousTouch = null;
        });

        // === definisco funzionamento tasti a schermo su telefono ===

        // - tasti azione
        var runBtn = document.getElementById("run-btn");
        var lightBtn = document.getElementById("light-btn");

        runBtn.ontouchstart = function () {
            self.shiftKey = true;
        }
        runBtn.ontouchend = function () {
            self.shiftKey = false;
        }

        lightBtn.ontouchstart = function () {
            self.game.toggleTorch();
            audioController.performSwitchAudio();
        }

        // - tasti movimento
        var straightBtn = document.getElementById("straight-btn");
        var backBtn = document.getElementById("back-btn");
        var leftBtn = document.getElementById("left-btn");
        var rightBtn = document.getElementById("right-btn");

        // straightBtn
        straightBtn.ontouchstart = function () {
            self.wKey = true;
        }
        straightBtn.ontouchend = function () {
            self.wKey = false;
        }
        // backBtn
        backBtn.ontouchstart = function () {
            self.sKey = true;
        }
        backBtn.ontouchend = function () {
            self.sKey = false;
        }
        // leftBtn
        leftBtn.ontouchstart = function () {
            self.aKey = true;
        }
        leftBtn.ontouchend = function () {
            self.aKey = false;
        }
        // rightBtn
        rightBtn.ontouchstart = function () {
            self.dKey = true;
        }
        rightBtn.ontouchend = function () {
            self.dKey = false;
        }

        // - tasto fullScreen
        var fullScreenBtn = document.getElementById("fullScreen-btn");
        fullScreenBtn.addEventListener('click', () => {
            self.toggleFullScreen();
        });
    }

    // loop che viene eseguito a ogni tick
    loop() {
        // controllo inclinazione stick virtuale sull'asse y
        this.yStik = this.inclineStik(this.wKey, this.sKey, this.yStik);
        // controllo inclinazione stick virtuale sull'asse x
        this.xStik = this.inclineStik(this.dKey, this.aKey, this.xStik);

        // approssimo i valori degli stick virtuale in modo che stiano sempre tra -1 e 1
        this.yStik = this.roundStick(this.yStik);
        this.xStik = this.roundStick(this.xStik);

        // imprimo i comandi del controller nel game
        game.playerWalk(this.xStik, -this.yStik);
        // se il player si sta muovendo riproduto il rumore dei passi
        if(this.xStik != 0 || this.yStik != 0)
            audioController.performPlayerMovmentAudio(this.game.playerRunning && this.game.playerStamina > 0);
        else
            audioController.stopPlayerMovmentAudio();


        game.setPlayerRunning(this.shiftKey);
    }
}

const canvas = document.getElementById("canvas");
const uiCanvas = document.getElementById("uiCanvas");
const gameDiv = document.getElementById("gameDiv");

const game = new Game();

const engine = new Engine(canvas, uiCanvas, game);

const controller = new Controller(canvas, uiCanvas, gameDiv, game);
const engineContoller = new EngineContoller(engine);
const audioController = new AudioController();

engine.load();