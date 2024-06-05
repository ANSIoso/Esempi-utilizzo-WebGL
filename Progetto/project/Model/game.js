class Game {
    // le info sugli oggetti presenti nel gioco saranno espresse nel formato:
    //          - modelID:      che indica quale mash rappresenta l'oggetto
    //          - transform:    che indica le trasformazioni da applicargli


    // variabili utilizzate per tenero conto del movimento del player
    player;             // matrice trasformazione
    playerRunning;
    playerWalkSpeed = 1;
    playerRunSpeed = 2.5;
    playerStamina;
    playerStaminaMax = 100;

    torchStatus;
    torchLight;
    torchMaxLight = 0.8;


    // variabili utilizzate per tenere conto del comportamento delle entità
    entities = [];      // matrici trasformazione
    entitiesPerceptionDistance = 300;
    entitiesNumber = 3;
    minEntityDistance;
    entityFollowingPlayer;

    // variabili utilizzate per tenere contro delle "strutture in gioco"
    structures = [];    // matrici trasformazione
    structureHeight = {
        "albero1": 70,
        "albero2": 70,
        "albero3": 50,
        "albero4": 25,
        "albero5": 25,
        "roccia1": 30,
        "roccia2": 15,
        "roccia3": -5,
        "roccia4": -5,
        "roccia5": -15,
        "roccia6": -15,
        "roccia7": -20,
    }
    structureColliderDim = {
        "albero1": 14,
        "albero2": 14,
        "albero3": 14,
        "albero4": 14,
        "albero5": 14,
        "roccia1": 75,
        "roccia2": 60,
        "roccia3": 40,
        "roccia4": 40,
        "roccia5": 14,
        "roccia6": 14,
        "roccia7": -1,
    }
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
        this.halfDimTerrain = this.dimTerrain / 2;
        this.mapStart = this.terrainTailOffset * -this.halfDimTerrain;
        this.mapEnd = this.terrainTailOffset * this.halfDimTerrain;

        // costruisco il terreno
        this.buildTerrain();

        // setto il giocatore
        // - la sua posizione iniziale
        // - il suo stato iniziale
        // - la sua stamina massima
        this.player = new CameraTransform();
        this.playerRunning = false;
        this.playerStamina = this.playerStaminaMax;

        // setto le informazioni per la torcia del giocatore
        this.torchStatus = false;
        this.torchLight = 0;
    }

    // ==== metodi per la costruzione della mappa ====

    // creazione del terreno
    buildTerrain() {
        this.positionRocks();
        this.spawnEnemis();

        // 
        for (let x = -(this.halfDimTerrain); x < this.halfDimTerrain; x++) {
            for (let z = -(this.halfDimTerrain); z < this.halfDimTerrain; z++) {


                let tileX = this.terrainTailOffset * x;
                let tileZ = this.terrainTailOffset * z;

                this.positionGrass(tileX, tileZ)

                if (x == 0 && z == 0) {
                    this.positionTotem(tileX, tileZ)
                    continue;
                }

                this.plantTrees(tileX, tileZ);
            }
        }
    }

    // aggiunta del pavimento
    positionGrass(posX, posZ) {
        var t = new Transform();
        t.translate(posX, -25, posZ);
        t.scale(10, 10, 10);

        this.terrain.push({
            transform: t,
            modelID: "terreno"
        })
    }

    // aggiunta del tomem di fine livello
    positionTotem(posX, posZ) {
        var t = new Transform();
        t.translate(posX, 0, posZ);
        t.rotate(0, degToRad(90), 0);
        t.scale(4, 4, 4);

        this.terrain.push({
            transform: t,
            modelID: "totem"
        })
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

            // l'altezza a cui l'albero è messo dipende dalla sua tipologia
            let treeYpos = this.structureHeight["albero" + treeType];

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

            // l'altezza a cui la roccia è messa dipende dalla sua tipologia
            let rockYpos = this.structureHeight["roccia" + rockType];

            var t = new Transform();
            t.translate(rndIntX, rockYpos, rndIntZ);
            t.scale(10, 10, 10);

            this.structures.push({
                transform: t,
                modelID: "roccia" + rockType
            })
        }
    }

    spawnEnemis() {
        for (let index = 0; index < this.entitiesNumber; index++) {

            // i memici vengono posizionati in una posizione casuale
            let rndIntX = randomIntFromInterval(this.mapStart, this.mapEnd);
            let rndIntZ = randomIntFromInterval(this.mapStart, this.mapEnd);

            var t = new Transform();
            t.translate(rndIntX, 5, rndIntZ);
            t.scale(5, 5, 5)
            t.rotate(0, degToRad(-90), 0);

            this.entities.push({
                transform: t,
                modelID: "fantasma"
            })
        }
    }

    // ==== metodi movimento giocatore ====
    // muovere il giocatore
    playerWalk(x, z) {
        let playerTopSpeed;

        // imposto la "velocità massima" che il giocatore può avere
        if (this.playerRunning && this.playerStamina > 0)
            playerTopSpeed = this.playerRunSpeed;
        else
            playerTopSpeed = this.playerWalkSpeed;

        // calcolo quale sarà lo spostamento del giocatore moltiplicando lo spostamento su un asse per la "velocità massima"
        let playerNextPos = this.player.translationPreview(x * playerTopSpeed, z * playerTopSpeed);

        // controllo tra tutte le entità se qualcuna si trova sulla "prossima posizione" del giocatore
        // - se ciò succede non applico lo spostamento
        // - se non succede la posizione del giocatore diventa quella che abbiamo precedente mente calcolato 
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

    // == metodi che definiscono comportamento entità ==
    
    // - evitare che l'entità esca dalla mappa
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

    // - far seguire all'entità il player (se abbastanza vicino)
    pointEntityToPlayer(entity_left, entityPos, entityNextPos) {
        // calcolo il vettore dal player all'entità
        let player_entity = {
            x: this.player.getPosition().x - entityPos.x,
            z: this.player.getPosition().z - entityPos.z
        }

        // se "entityNextPos" è più vicina al player di "entityPos" l'entità sta guardando il player
        if (pointsDistance(this.player.getPosition(), entityPos) > pointsDistance(this.player.getPosition(), entityNextPos)) {

            // trovo angolo compreso tra i vettori:
            // - "posizione entità => sua sinistra"
            //                       &
            // - "pos entità => pos player"
            let angle1 = radToDeg(vectorAngle([player_entity.x, player_entity.z], [entity_left.x, entity_left.z]));

            // se l'angolo non è attorno ai 90* (quindi l'entità non sta andando dritta verso il player)
            // favorisco la probabilità che l'entità giri in modo da tornare alla giusta angolazione con il player
            if (angle1 < 80) {
                return {
                    leftChange: 180,
                    rightChange: 181
                }
            }

            if (angle1 > 100) {
                return {
                    leftChange: -1,
                    rightChange: 0
                }
            }
        } else {
            // se l'entità non è girata verso il player essa girerà su se stessa
            return {
                leftChange: -1,
                rightChange: 0
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
        if (element.modelID in this.structureColliderDim)
            limitDistance = this.structureColliderDim[element.modelID]

        // se la distanza è "troppo piccola" viene considerata una collisione
        if (distance < limitDistance)
            return true;

        return false;
    }

    // - accendere e spegnere la torcia
    toggleTorch() {
        this.torchStatus = this.torchStatus ? false : true;
    }

    // - aggiornare lo stato della torcia
    updateTorch() {
        // se la torcia è spenta la luce emessa sarà zero
        if (!this.torchStatus) {
            this.torchLight = 0;
            return;
        }

        if (this.torchLight > this.torchMaxLight)
            return;
        
        // se è accesa ma non al massimo la luce si farà via via più intensa
        this.torchLight += 0.01;
    }

    // === metodi get ===
    getGameObjInfo() {
        var gameObjInfo = [];

        gameObjInfo.push(...this.terrain);
        gameObjInfo.push(...this.structures);
        gameObjInfo.push(...this.entities);

        return gameObjInfo;
    }

    // ==== LOOP ====
    updateStatus() {
        this.updateTorch();

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

        // imposto la distanza dall'entià più vicina alla dimensione della mappa
        this.minEntityDistance = Math.abs(this.mapEnd);
        this.entityFollowingPlayer = false;

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

            // calcolo la percezione dell'entità in base al fatto se la torcia del player è accesa o spenta
            let entityActualPerception = this.entitiesPerceptionDistance;
            if(!this.torchStatus)
                entityActualPerception /= 4;


            // calcolo la distanza dell'entità dal player e se è l'entità più vicina a esso
            let entityDistance = pointsDistance(this.player.getPosition(), entityPos);
            this.minEntityDistance = this.minEntityDistance > entityDistance ? entityDistance : this.minEntityDistance;

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

            if (entityDistance > entityActualPerception)
                changes = this.keepEntityInMap(entity_dir, entityPos, entityNextPos);
            else{
                changes = this.pointEntityToPlayer(entity_left, entityPos, entityNextPos);
                this.entityFollowingPlayer = true;
            }

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

        // se un'entità è abbastanza vicina al player e lo sta seguendo riproduco suono
        if (this.minEntityDistance < this.entitiesPerceptionDistance && this.entityFollowingPlayer)
            audioController.performDistortion(1 - this.minEntityDistance / this.entitiesPerceptionDistance);
        else
            audioController.performDistortion(0);
    }
}