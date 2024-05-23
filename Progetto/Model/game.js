const lerp = (start, end, speed) => start + (end - start) * speed

// classe utilizzata per tener conto della matrice di trasformazione di tutti gli oggetti
class Transform {
    transformMatrix;
    // una matrice m4 è così ordinata
    //  0 |  4 |  8 | 12
    // ------------------
    //  1 |  5 |  9 | 13
    // ------------------
    //  2 |  6 | 10 | 14
    // ------------------
    //  3 |  7 | 11 | 15

    constructor() {
        this.transformMatrix = m4.identity();
    }

    translate(xTransl, yTransl, zTransl) {
        m4.translate(this.transformMatrix, xTransl, yTransl, zTransl, this.transformMatrix);
    }

    rotate(xRotate, yRotate, zRotate) {
        m4.xRotate(this.transformMatrix, xRotate, this.transformMatrix);
        m4.yRotate(this.transformMatrix, yRotate, this.transformMatrix);
        m4.zRotate(this.transformMatrix, zRotate, this.transformMatrix);
    }

    scale(xScale, yScale, zScale) {
        m4.scale(this.transformMatrix, xScale, yScale, zScale, this.transformMatrix);
    }

    getPosition() {
        return { x: this.transformMatrix[12], y: this.transformMatrix[13], z: this.transformMatrix[14] }
    }

    test() {
    }
}

// classe utilizzata per tener conto della matrice di trasformazione del punto di vista del giocatore
class CametaTransform {
    xAngle;
    yAngle;
    position;

    constructor() {
        this.xAngle = 0;
        this.yAngle = 0;

        this.position = m4.identity();
    }

    // metodo utilizzato per traslare il giocatore 
    translate(x, z) {
        // prendo l'attuale rotazione del giocatore
        let temp = m4.multiply(this.position, this.getRotation());
        // partendo dalla rotazione attuale mi sposto di quanto indicano "x e z"
        m4.translate(temp, x, 0, z, temp);
        // mi segno la nuova posizione del giocatore (trascurando lo spostamento su y)
        this.position = m4.translation(temp[12], 0, temp[14]);
    }

    // metodo utilizzato per ruotare la visuale del giocatore
    rotate(x, y) {

        // aggiungo alle variabili in cui conservo la rotazione su "asse x" e "asse y" un certo angolo
        this.yAngle += y;

        // nel caso dell'asse x prima di aggiungere l'angolo controllo di non essere fuori dall'angolo massimo di rotazione
        if ((this.xAngle > 90 && x > 0) || (this.xAngle < -90 && x < 0))
            return;
        this.xAngle += x;
    }

    // calcolo la matrice di rotazione ottenuta dagli angoli conservati internamente
    // !ATTENZIONE! l'ordine in cui vengono effettuate le trasformazioni è molto importante
    getRotation() {
        let a = m4.xRotation(degToRad(this.xAngle));
        let b = m4.yRotation(degToRad(this.yAngle));
        let y = m4.zRotation(0);

        var matrix = m4.multiply(y, b);
        m4.multiply(matrix, a, matrix);

        return matrix;
    }

    // combino matrice di rotazione e traslazione e ritorno il risultato
    getMatrix() {
        return m4.multiply(this.position, this.getRotation())
    }
}

function degToRad(deg) {
    return deg * Math.PI / 180;
}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}

class Game {
    // le info sugli oggetti presenti nel gioco saranno espresse nel formato:
    //          - modelID:      che indica quale mash rappresenta l'oggetto
    //          - transform:    che indica le trasformazioni da applicargli


    // variabili utilizzate per tenero conto del movimento del player
    player;         // matrice trasformazione
    playerRunning;
    playerWalkSpeed = 10;
    playerRunSpeed = 2.5;
    playerStamina;
    playerStaminaMax = 100;

    // variabili utilizzate per tenere conto del comportamento delle entità
    entities = [];  // matrici trasformazione

    // variabili utilizzate per tenere contro delle "strutture in gioco"
    structures = [];     // matrici trasformazione
    treesDensity = 2;
    rockNumber = 6;

    // variabili utilizzate per tenere contro del "terreno di gioco"
    terrain = [];   // matrici trasformazione
    dimTerrainX = 10;
    dimTerrainY = 10;
    terrainTailOffset = 200;
    mapEnd;

    constructor() {
        this.mapEnd = this.terrainTailOffset * (this.dimTerrainX - 1);
        
        this.buildTerrain();


        this.player = new CametaTransform();
        this.playerRunning = false;
        this.playerStamina = this.playerStaminaMax;


        var t = new Transform();
        t.translate(this.mapEnd, -2, this.mapEnd);
        t.rotate(degToRad(-90), 0, 0);

        this.entities.push({
            transform: t,
            modelID: "gatto"
        })
    }

    // ==== metodi settaggi iniziali ====

    // creazione del terreno
    buildTerrain() {
        this.positionRocks();

        for (let x = 0; x < this.dimTerrainX; x++) {
            for (let y = 0; y < this.dimTerrainY; y++) {

                let tileX = this.terrainTailOffset * x;
                let tileY = this.terrainTailOffset * y;

                var t = new Transform();
                t.translate(tileX, -25, tileY);
                // t.rotate(degToRad(-90), 0, 0);
                t.scale(10, 10, 10);

                this.terrain.push({
                    transform: t,
                    modelID: "terreno"
                })

                this.plantTrees(tileX, tileY)
            }
        }
    }

    plantTrees(tileX, tileY) {
        let tileStartX = tileX - this.terrainTailOffset / 2;
        let tileStartY = tileY - this.terrainTailOffset / 2;

        for (let index = 0; index < this.treesDensity; index++) {
            let rndIntX = randomIntFromInterval(tileStartX, tileStartX + this.terrainTailOffset);
            let rndIntZ = randomIntFromInterval(tileStartY, tileStartY + this.terrainTailOffset);
            let treeType = randomIntFromInterval(1, 5);
            let treeYpos = 0;

            switch (treeType) {
                case 1:
                    treeYpos = 70;
                    break;
                case 2:
                    treeYpos = 70;
                    break;
                case 3:
                    treeYpos = 50;
                    break;
                case 4:
                    treeYpos = 25;
                    break;
                case 5:
                    treeYpos = 25;
                    break;

                default:
                    break;
            }


            var t = new Transform();
            t.translate(rndIntX, treeYpos, rndIntZ);


            t.scale(15, 15, 15);

            this.structures.push({
                transform: t,
                modelID: "albero" + treeType
            })
        }
    }

    positionRocks() {
        for (let index = 0; index < this.rockNumber; index++) {
            let rndIntX = randomIntFromInterval(0, this.mapEnd);
            let rndIntZ = randomIntFromInterval(0, this.mapEnd);
            let rockType = randomIntFromInterval(1, 7);
            let rockYpos = 0;

            switch (rockType) {
                case 1:
                    rockYpos = 30;
                    break;
                case 2:
                    rockYpos = 15;
                    break;
                case 3:
                    rockYpos = -5;
                    break;
                case 4:
                    rockYpos = -5;
                    break;
                case 5:
                    rockYpos = -15;
                    break;
                case 6:
                    rockYpos = -15;
                    break;
                case 7:
                    rockYpos = -20;
                    break;

                default:
                    break;
            }


            var t = new Transform();
            t.translate(rndIntX, rockYpos, rndIntZ);


            t.scale(10, 10, 10);

            this.structures.push({
                transform: t,
                modelID: "roccia" + rockType
            })
        }
    }

    // ==== metodi movimento giocatore ====
    // muovere il giocatore
    playerWalk(x, z) {
        let playerTopSpeed;

        if (this.playerRunning && this.playerStamina > 0)
            playerTopSpeed = this.playerRunSpeed;
        else
            playerTopSpeed = this.playerWalkSpeed;

        this.player.translate(x * playerTopSpeed, z * playerTopSpeed);
    }

    // rutotare punto di vista del giocatore
    playerTurnHead(x, y) {
        this.player.rotate(y, x);
    }

    // impostare lo stato del giocatore come "correndo"
    setPlayerRunning(isRunning) {
        this.playerRunning = isRunning;
    }


    updateStatus() {
        if (this.playerRunning) {
            if (this.playerStamina <= 0)
                this.playerStamina = 0;
            else
                this.playerStamina -= 0.5;
        } else {
            if (this.playerStamina >= this.playerStaminaMax)
                this.playerStamina = this.playerStaminaMax;
            else
                this.playerStamina += 0.1;
        }


        console.log(this.playerStamina);
    }

    // metodi get
    getGameObjInfo() {
        var gameObjInfo = [];

        gameObjInfo.push(...this.terrain);
        gameObjInfo.push(...this.structures);
        gameObjInfo.push(...this.entities);

        return gameObjInfo;
    }
}