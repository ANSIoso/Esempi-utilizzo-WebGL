// una serie di funzioni utili

// interpola due valori "start" e "end"
// per un fattore pari a "speed"
const lerp = (start, end, speed) => start + (end - start) * speed

// trasforma il valore in gradi di un angolo in radianti 
function degToRad(deg) {
    return deg * Math.PI / 180;
}

// trasforma il valore in radianti di un angolo in gradi
function radToDeg(rad) {
    return rad * (180 / Math.PI);
}

// trova l'angolo compreso tra due vettori
const vectorAngle = (x, y) =>
    Math.acos(
        x.reduce((acc, n, i) => acc + n * y[i], 0) /
        (Math.hypot(...x) * Math.hypot(...y))
    );

// trova la distanza tra due punti a due dimensioni
function pointsDistance(pointStart, pointEnd) {
    return Math.sqrt(Math.pow(pointStart.x - pointEnd.x, 2) + Math.pow(pointStart.z - pointEnd.z, 2))
}

// ritorna un valore randomico tra "min" e "max"
function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min);
}