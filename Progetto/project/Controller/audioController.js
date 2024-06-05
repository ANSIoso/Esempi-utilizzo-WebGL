class AudioController {
    audioList;
    audioOn;

    constructor() {
        this.audioOn = false;
        this.audioList = {};

        this.loadAudios();
        this.setFunction();
    }

    // metodo che imposta la funzione per l'attivazione dell'audio in gioco
    setFunction() {
        let AudioChekbox = document.getElementById("Audio-set");

        let self = this;

        AudioChekbox.addEventListener('change', function () {
            if (this.checked) {
                // se la checkbox è "attiva" allora 
                // - faccio partire l'audio di sottofondo 
                // - "attivo" i suoni
                self.audioOn = true;
                self.playSound("ambientAudio");
            } else {
                // altrimenti
                // - disattivo i suoni
                // - resetto e metto in pausa l'audio di sottofondo
                self.audioOn = false;
                self.pauseSound("ambientAudio");
                self.audioList["ambientAudio"] = 0;
            }
        });

        // se l'audio di sottofondo termina lo faccio ripartire
        this.audioList["ambientAudio"].addEventListener('ended', function () {
            this.currentTime = 0;
            self.playSound("ambientAudio");
        }, false);
    }

    // funzione utilizzata per caricare tutti i suoni di gioco
    loadAudios() {
        this.audioList["ambientAudio"] = new Audio('./assets/audio/night-environment.mp3');
        this.audioList["distortionAudio"] = new Audio('./assets/audio/distortion.mp3');
        this.audioList["switchAudio"] = new Audio('./assets/audio/standard-switch-sound.mp3');
        this.audioList["switchAudio"].volume = 0.2;
        this.audioList["walkingAudio"] = new Audio('./assets/audio/walking.mp3');
        this.audioList["walkingAudio"].volume = 0.9;
        this.audioList["runningAudio"] = new Audio('./assets/audio/running.mp3');
        this.audioList["runningAudio"].volume = 0.8;
    }

    // fuznione per riprodurre suono torcia
    performSwitchAudio() {
        this.playSound("switchAudio");
        this.audioList["switchAudio"].currentTime = 0;
    }

    // funzione per riprodurre rumore movimento player
    performPlayerMovmentAudio(running) {

        // viene passata una variabile per comprendere se il movimento è "in corsa"
        // a seconda di essa il gisto suono parte e l'altro si ferma
        
        if (running && !this.audioList["walkingAudio"].paused)
            this.pauseSound("walkingAudio");

        if (!running && !this.audioList["runningAudio"].paused)
            this.pauseSound("runningAudio");

        if (running)
            this.playSound("runningAudio");
        else
            this.playSound("walkingAudio");
    }

    stopPlayerMovmentAudio() {
        this.pauseSound("walkingAudio");
        this.pauseSound("runningAudio");
    }

    // funzione per riprodurre rumore distorsione
    // è possibile specificare in essa l'intensità del suono
    performDistortion(intensity) {
        this.audioList["distortionAudio"].volume = intensity;
        this.playSound("distortionAudio");
    }

    // funzione generale per riprodurre i suoni 
    // prima di riprodurre un suono controlla se l'audio di gioco è attivo
    playSound(audioName) {
        if (!this.audioOn)
            return;

        this.audioList[audioName].play();
    }

    // funzione generale per mettere in pausa i suoni
    pauseSound(audioName) {
        this.audioList[audioName].pause();
    }
}