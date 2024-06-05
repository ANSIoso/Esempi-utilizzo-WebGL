// classe utilizzata per cambiare le impostazioni dell'engine
class EngineContoller {
    engine;

    constructor(engine) {
        this.engine = engine;
        this.setFunction();
    }

    setFunction() {
        // trovo all'interno dell'interfaccia le checkbox
        let SpecularChekbox = document.getElementById("Specular-set");
        let NormalMapsChekbox = document.getElementById("NormalMaps-set");
        let ShadowsChekbox = document.getElementById("Shadows-set");
        let ShadingChekbox = document.getElementById("Shading-set");

        let self = this;

        // assegno la funzione alle checkbox
        SpecularChekbox.addEventListener('change', function() {
            self.engine.enableSpecular = this.checked;
        });
        NormalMapsChekbox.addEventListener('change', function() {
            self.engine.enableNormalMaps = this.checked;
        });
        ShadowsChekbox.addEventListener('change', function() {
            self.engine.enableShadows = this.checked;
        });
        ShadingChekbox.addEventListener('change', function() {
            self.engine.enableShading = this.checked;
        });
    }
}