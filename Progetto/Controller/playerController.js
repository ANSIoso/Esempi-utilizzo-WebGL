class Controller {
    KEY_CODES = {
        W: 87,
        A: 65,
        S: 83,
        D: 68,
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

    turningSensitivity = 20;

    constructor(canvas, game) {
        this.canvas = canvas;
        this.game = game;


        this.xStik = 0;
        this.yStik = 0;

        this.wKey = false;
        this.sKey = false;
        this.aKey = false;
        this.dKey = false;

        this.shiftKey = false;

        this.setFuncion();
    }

    // impostiamo l'effetto che i comandi hanno
    setFuncion() {

        let self = this;

        // ==== movimenti della testa del giocatore ====
        // - da computer con il mouse
        window.addEventListener('mousemove', function (e) {
            self.game.playerTurnHead(-e.movementX / self.turningSensitivity, -e.movementY / self.turningSensitivity)
        })

        // - da telefono con il touch
        window.addEventListener('touchmove', function (e) {
            self.touch = e.touches[0];

            if (self.previousTouch) {
                e.movementX = self.touch.pageX - self.previousTouch.pageX;
                e.movementY = self.touch.pageY - self.previousTouch.pageY;

                self.game.playerTurnHead(e.movementX / self.turningSensitivity, e.movementY / self.turningSensitivity)
            };

            self.previousTouch = self.touch;
        })

        canvas.addEventListener("touchend", (e) => {
            self.previousTouch = null;
        });

        // ==== movimento corpo del giocatore ====
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
            }
        };

        this.canvas.addEventListener('click', () => {
            self.canvas.requestPointerLock();
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
        game.setPlayerRunning(this.shiftKey);
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
}

const canvas = document.getElementById("canvas")

const game = new Game();

const engine = new Engine(canvas, game);

const controller = new Controller(canvas, game);

engine.load();