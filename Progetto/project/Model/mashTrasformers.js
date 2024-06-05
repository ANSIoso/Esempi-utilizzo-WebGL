// classi utilizzate per controllare le matrici di trasformazione

// una matrici di trasformazione è così ordinata
//  0 |  4 |  8 | 12
// ------------------
//  1 |  5 |  9 | 13
// ------------------
//  2 |  6 | 10 | 14
// ------------------
//  3 |  7 | 11 | 15

// le seguenti celle contengono rispettivamente le info della posizione sugli assi 
//    X    Y    Z
// | 12 | 13 | 14 |
// ----------------

// gestione delle matrice di trasformazione di tutti gli oggetti
class Transform {
    transformMatrix;

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

        this.transformMatrix = m4.translation(0, 0, 40);
    }

    // metodo utilizzato per traslare il giocatore (la trasformazione non è direttamente applicata dovra successivamente essere impostata)
    translationPreview(x, z) {
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

    getPosition() {
        return { x: this.transformMatrix[12], y: this.transformMatrix[13], z: this.transformMatrix[14] }
    }
}