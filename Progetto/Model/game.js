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

    constructor(matrixToCopy) {
        if (matrixToCopy === undefined)
            this.transformMatrix = m4.identity();
        else
            this.transformMatrix = m4.copy(matrixToCopy);
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
class CameraTransform {
    xAngle;
    yAngle;
    transformMatrix;

    constructor() {
        this.xAngle = 0;
        this.yAngle = 0;

        this.transformMatrix = m4.identity();
    }

    // metodo utilizzato per traslare il giocatore 
    translate(x, z) {
        // prendo l'attuale rotazione del giocatore
        let temp = m4.multiply(this.transformMatrix, this.getRotation());
        // partendo dalla rotazione attuale mi sposto di quanto indicano "x e z"
        m4.translate(temp, x, 0, z, temp);
        // mi segno la nuova posizione del giocatore (trascurando lo spostamento su y)
        return m4.translation(temp[12], 0, temp[14]);
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
        return m4.multiply(this.transformMatrix, this.getRotation())
    }

    getTransformMatrix() {
        return this.transformMatrix;
    }

    getP() {
        return { x: this.transformMatrix[12], y: this.transformMatrix[13], z: this.transformMatrix[14] }
    }
}

function degToRad(deg) {
    return deg * Math.PI / 180;
}

function radToDeg(rad) {
    return rad * (180 / Math.PI);
}

const vectorAngle = (x, y) =>
    Math.acos(
        x.reduce((acc, n, i) => acc + n * y[i], 0) /
        (Math.hypot(...x) * Math.hypot(...y))
    );

//d=√((x2 – x1)² + (y2 – y1)²)
function pointsDistance(pointStart, pointEnd) {
    return Math.sqrt(Math.pow(pointStart.x - pointEnd.x, 2) + Math.pow(pointStart.z - pointEnd.z, 2))
}

function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}

class Game {
    // le info sugli oggetti presenti nel gioco saranno espresse nel formato:
    //          - modelID:      che indica quale mash rappresenta l'oggetto
    //          - transform:    che indica le trasformazioni da applicargli


    // variabili utilizzate per tenero conto del movimento del player
    player;             // matrice trasformazione
    playerRunning;
    playerWalkSpeed = 10;
    playerRunSpeed = 2.5;
    playerStamina;
    playerStaminaMax = 100;

    // variabili utilizzate per tenere conto del comportamento delle entità
    entities = [];      // matrici trasformazione
    entitiesPerceptionDistance = 300;

    // variabili utilizzate per tenere contro delle "strutture in gioco"
    structures = [];    // matrici trasformazione
    treesDensity = 2;
    rockNumber = 6;

    // variabili utilizzate per tenere contro del "terreno di gioco"
    terrain = [];       // matrici trasformazione
    dimTerrain = 10;
    halfDimTerrain;
    terrainTailOffset = 200;
    mapStart;
    mapEnd;

    constructor() {
        // calcolo la dimensione totale del terreno su x e y (dato che la mappa è quadrata)
        this.mapStart = -(this.terrainTailOffset * (this.dimTerrain / 2));
        this.mapEnd = this.terrainTailOffset * (this.dimTerrain / 2);
        this.halfDimTerrain = this.dimTerrain / 2;

        // costruisco il terreno
        this.buildTerrain();

        // setto il giocatore
        // - la sua posizione iniziale
        // - il suo stato iniziale
        // - la sua stamina massima
        this.player = new CameraTransform();
        this.playerRunning = false;
        this.playerStamina = this.playerStaminaMax;


        var t = new Transform();
        t.translate(110, 5, 0);
        t.scale(5, 5, 5)
        t.rotate(0, degToRad(-90), 0);

        this.entities.push({
            transform: t,
            modelID: "fantasma"
        })
    }

    // ==== metodi settaggi iniziali ====

    // creazione del terreno
    buildTerrain() {
        this.positionRocks();

        for (let x = -(this.halfDimTerrain); x < this.halfDimTerrain; x++) {
            for (let y = -(this.halfDimTerrain); y < this.halfDimTerrain; y++) {

                let tileX = this.terrainTailOffset * x;
                let tileY = this.terrainTailOffset * y;

                var t = new Transform();
                t.translate(tileX, -25, tileY);
                t.scale(10, 10, 10);

                this.terrain.push({
                    transform: t,
                    modelID: "terreno"
                })

                this.plantTrees(tileX, tileY);
            }
        }
    }

    // posizionamento degli alberi
    plantTrees(tileX, tileY) {
        let tileStartX = tileX - this.terrainTailOffset / 2;
        let tileStartY = tileY - this.terrainTailOffset / 2;

        for (let index = 0; index < this.treesDensity; index++) {
            // vengono posizionati un certo numero di alberi per ogni tile di terreno, in una posizione randomica dello stesso
            let rndIntX = randomIntFromInterval(tileStartX, tileStartX + this.terrainTailOffset);
            let rndIntZ = randomIntFromInterval(tileStartY, tileStartY + this.terrainTailOffset);
            let treeType = randomIntFromInterval(1, 5);
            let treeYpos = 0;

            // l'altezza a cui l'albero è messo dipende dalla sua tipologia
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

    // posizionamento delle rocce
    positionRocks() {
        for (let index = 0; index < this.rockNumber; index++) {

            // le rocce vengono messe in una posizione randomica della mappa
            let rndIntX = randomIntFromInterval(this.mapStart, this.mapEnd);
            let rndIntZ = randomIntFromInterval(this.mapStart, this.mapEnd);
            let rockType = randomIntFromInterval(1, 7);
            let rockYpos = 0;

            // l'altezza a cui la roccia è messa dipende dalla sua tipologia
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


        let playerNextPos = this.player.translate(x * playerTopSpeed, z * playerTopSpeed);

        for (let index = 0; index < this.structures.length; index++) {
            const element = this.structures[index]

            if (this.isPlayerColliding(element, playerNextPos))
                return;
        }

        this.player.transformMatrix = playerNextPos;
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
        // aggiorno lo stato del giocatore
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

        // aggiorno lo stato dei nemici
        this.entities.forEach(element => {
            // l'entità si muove sempre in avanti
            element.transform.translate(0.1, 0, 0);

            // controllo la posizione attiale dell'entità:
            let entityPos = element.transform.getPosition();
            
            // calcolo vettore "Front" dell'entità
            let entityNextTrasform = m4.translate(element.transform.transformMatrix, 0.01, 0, 0);
            // calcolo il vettore direzione dell'entità
            // posizione entità => prossima posizione entità
            let entity_dir = {
                x: entityPos.x - entityNextTrasform[12],
                z: entityPos.z - entityNextTrasform[14]
            }            

            // calcolo posizione futura dell'entità
            let entityNextPos = { x: entityNextTrasform[12], z: entityNextTrasform[14] };
            
            // calcolo vettore "Left" dell'entità
            let entityLeftTrasform = m4.translate(element.transform.transformMatrix, 0, 0, 0.01);
            let entity_left = {
                x: entityPos.x - entityLeftTrasform[12],
                z: entityPos.z - entityLeftTrasform[14]
            }

            // genero una possibile rotazione che l'entità andrà a subire
            // di base:
            // - [45  < x] => girerà a sinistra
            // - [135 > x] => girerà a destra
            // - [45 < x < 135] => continuerà dritta
            let action = randomIntFromInterval(0, 180);
            let rot = 0, leftChange = 45, rightChange = 135;

            // i possibili CAMBI da applicare a "leftChange" e "rightChange" sono contenuti in "changes"
            // tali CAMBI possono essere causati da:
            // - necessità di riportare l'entità nella mappa (se si sta allontanando troppo dal centro)
            // - seguire il giocatore se l'entità è abbastanza vicina
            let changes;

            if(pointsDistance(this.player.getP(), entityPos) > this.entitiesPerceptionDistance)
                changes = this.keepEntityInMap(entity_dir, entityPos, entityNextPos);
            else
                changes = this.pointEntityToPlayer(entity_left, entityPos, entityNextPos);

            // se non ci sono cambi si manterranno le probabilità iniziali
            if (changes != undefined) {
                leftChange = changes.leftChange;
                rightChange = changes.rightChange;
            }

            // scelgo la rotazione che applicherò all'entità basandomi su i limiti impostati
            if (action < leftChange)
                rot = 0.1
            if (action > rightChange)
                rot = -0.1


            element.transform.rotate(0, rot, 0);
        });
    }

    keepEntityInMap(entity_dir, entityPos, entityNextPos) {
        let xPoint = [entityPos.x, 0]; // proiezione pos entità su x
        let zPoint = [0, entityPos.z]; // proiezione pos entità su z
        // pos entità su x => pos entità su y
        let plane = {
            x: xPoint[0] - zPoint[0],
            z: xPoint[1] - zPoint[1]
        }

        // trovo angolo compreso tra i vettori:
        // - "posizione entità => prossima posizione entità"
        //                       &
        // - " pos entità su x => pos entità su y "
        let angle = radToDeg(vectorAngle([entity_dir.x, entity_dir.z], [plane.x, plane.z]));

        // calcolo la distanza dall'origine di
        let nextDistance = pointsDistance({ x: 0, z: 0 }, entityNextPos); // prossima posizione che l'entità occuperà
        let distance = pointsDistance({ x: 0, z: 0 }, entityPos); // posizione che l'entità sta occupando

        // se mi sto ancora allontanando dall'orichine (nextDistance > distance) e 
        // la mia distanza attuale è maggiore delle dimensioni della mappa dall'origine

        if (nextDistance > distance && distance > (this.halfDimTerrain * this.terrainTailOffset - 100)) {

            // do priorità alla direzione che mi riporta nella mappa
            if (angle > 90) {
                return {
                    leftChange: angle,
                    rightChange: 180 - angle
                }
            }
            else {
                return {
                    leftChange: 180 - angle,
                    rightChange: angle
                }
            }
        }
    }

    pointEntityToPlayer(entity_left, entityPos, entityNextPos) {
        // calcolo il vettore dal player all'entità
        let player_entity = {
            x: this.player.getP().x - entityPos.x,
            z: this.player.getP().z - entityPos.z
        }
        // commenta

        if (pointsDistance(this.player.getP(), entityPos) > pointsDistance(this.player.getP(), entityNextPos)) {

            let angle1 = radToDeg(vectorAngle([player_entity.x, player_entity.z], [entity_left.x, entity_left.z]));

            if (angle1 < 80) {
                return {
                    leftChange : 180,
                    rightChange : 181
                }
            }

            if (angle1 > 100) {
                return {
                    leftChange : -1,
                    rightChange : 0
                }
            }
        } else {
            return {
                leftChange : -1,
                rightChange : 0
            }
        }
    }

    // ==== metodi per le azioni del giocatore ====
    isPlayerColliding(element, playerPos) {
        // estraggo la posizione dell'elemento di gioco che sto considerando
        let elementTrasform = element.transform.getPosition();

        // considero solo la posizione su x e su y rispetto al giocatore
        var a = elementTrasform.x - playerPos[12];
        var c = elementTrasform.z - playerPos[14];

        let distance = Math.sqrt(a * a + c * c);
        let limitDistance = 14;

        // la distanza limite che indica una collisione dipende dall'elemento con cui si sta interagendo
        switch (element.modelID) {
            case "roccia7":
                limitDistance = -1
                break;
            case "roccia1":
                limitDistance = 75;
                break
            case "roccia2":
                limitDistance = 60;
                break;
            case "roccia3":
            case "roccia4":
                limitDistance = 40;
                break;

            default:
                break;
        }

        // se la distanza è "troppo piccola" viene considerata una collisione
        if (distance < limitDistance)
            return true;

        return false;
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