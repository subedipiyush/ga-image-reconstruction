
class Util {
    
    static createTable(map, tableDOM) {
        tableDOM.innerHTML = null;  // clear the table first
        for (let key in map) {

            let row = tableDOM.insertRow();

            this.addToRow(row, key);
            this.addToRow(row, map[key]);
        }
    }

    static addToRow(row, value) {
        let cell = row.insertCell();
        let text = document.createTextNode(value);
        cell.appendChild(text);
    }

    static secondsToString(s) {
        var h = Math.floor(s / 3600);
        var m = Math.floor(s % 3600 / 60);

        s = Math.floor(s % 3600 % 60);

        return ((h > 0 ? h + ':' : '') +
            (m > 0 ? (h > 0 && m < 10 ? '0' : '') +
                m + ':' : '0:') + (s < 10 ? '0' : '') + s);
    }
}
    
class Statistics {

    constructor() {
        this._numberOfGenerations = 1;
        this._currentFitness = 0;
        this._startTime = undefined;
    }

    currentFitness(currentFitness) {
        this._currentFitness = currentFitness;
    }

    stats() {

        return {
            "Elapsed Time": this.elapsedTime(),
            "Number of Generations": this._numberOfGenerations,
            "Current Fitness": (this._currentFitness * 100).toFixed(2) + "%"
        };
    }

    begin() {
        this._startTime = new Date().getTime();
    }

    stop() {
        this._numberOfGenerations = 1;
        this._currentFitness = 0;
        this._startTime = undefined;
    }

    elapsedTime() {

        let elapsedTime = 0;
        if(this._startTime !== undefined) {
            elapsedTime = ((new Date().getTime() - this._startTime) / 1000);
        }

        return Util.secondsToString(Math.round(elapsedTime));
    }


    tick() {
        this._numberOfGenerations++;
        this.render();
    }

    render(element) {
        if(this._element === undefined) this._element = element;
        Util.createTable(this.stats(), this._element);
    }

}

class Configuration {

    constructor() {
        this._populationSize = undefined;
        this._crossoverRate = undefined;
        this._mutationRate = undefined;
        this._mutationAmount = undefined;
        this._tournamentSize = undefined;

        this._selectionStrategy = undefined;
        this._crossoverStrategy = undefined;
        this._mutationStrategy = undefined;
    }

    config() {

        return {
            "Population Size": this._populationSize,
            "Crossover Strategy": this._crossoverStrategy,
            "Crossover Rate": this._crossoverRate,
            "Mutation Strategy": this._mutationStrategy,
            "Mutation Rate": this._mutationRate,
            "Mutation Amount": this._mutationAmount,
            "Selection Strategy": this._selectionStrategy,
            "Tournamnet Size": this._tournamentSize
        };

    }

    render(element) {
        if(this._element === undefined) this._element = element;
        Util.createTable(this.config(), this._element);
    }

    populationSize(popSize) {
        this._populationSize = popSize;
        return this;
    }

    crossoverRate(rate) {
        this._crossoverRate = rate;
        return this;
    }

    mutationRate(rate) {
        this._mutationRate = rate;
        return this;
    }

    mutationAmount(amount) {
        this._mutationAmount = amount;
        return this;
    }

    selectionStrategy(strategy) {
        this._selectionStrategy = strategy;
        return this;
    }

    tournamentSize(size) {
        this._tournamentSize = size;
        return this;
    }

    crossoverStrategy(strategy) {
        this._crossoverStrategy = strategy;
        return this;
    }

    mutationStrategy(strategy) {
        this._mutationStrategy = strategy;
        return this;
    }
}

class Runner {

    constructor(config, stats) {
        this.config = config;
        this.stats = stats;
    }

    isSupported() {

        /* Perform a simple check to verify that getContext() and getImageData() are
         * supported:
         */
        return (this.inputCanvas.getContext &&
            this.inputCanvas.getContext('2d').getImageData);
    }

    width() {
        return this.workingSize;
    }

    height() {
        return this.workingSize;
    }

    convertToGrayScale(imageData, width, height) {
        var gray_img = new jsfeat.matrix_t(width, height, jsfeat.U8_t | jsfeat.C1_t);
        var code = jsfeat.COLOR_RGBA2GRAY;
        jsfeat.imgproc.grayscale(imageData.data, width, height, gray_img, code);

        // render result back to canvas
        var data_u32 = new Uint32Array(imageData.data.buffer);
        var alpha = (0xff << 24);
        var i = gray_img.cols * gray_img.rows, pix = 0;
        while (--i >= 0) {
            pix = gray_img.data[i];
            data_u32[i] = alpha | (pix << 16) | (pix << 8) | pix;
        }
    }

    findCorners(imageData, width, height) {

        var gray_img = new jsfeat.matrix_t(width, height, jsfeat.U8_t | jsfeat.C1_t);
        var code = jsfeat.COLOR_RGBA2GRAY;

        jsfeat.imgproc.grayscale(imageData.data, width, height, gray_img, code);
        // jsfeat.imgproc.gaussian_blur(gray_img, gray_img, 2);

        var threshold = 8;
        jsfeat.fast_corners.set_threshold(threshold);

        var corners = [], border = 1;

        // you should use preallocated keypoint_t array
        for (var i = 0; i < gray_img.cols * gray_img.rows; ++i) {
            corners[i] = new jsfeat.keypoint_t(0, 0, 0, 0);
        }

        // perform detection
        // returns the amount of detected corners
        return jsfeat.fast_corners.detect(gray_img, corners, border);

    }

    setCanvasSize(canvas, width, height) {
        canvas.width = width;
        canvas.height = height;
    }


    prepareImage() {

        /* FIXME: add support for images of size other than 350x350. This requires
         * scaling the image and cropping as needed */

        this.setCanvasSize(this.inputCanvas, this.width(), this.height());
        this.setCanvasSize(this.outputCanvas, this.width(), this.height());
        this.setCanvasSize(this.workingCanvas, this.width(), this.height());

        this.inputCtx.drawImage(this.inputImage, 0, 0, this.width(), this.height());

        let imageData = this.inputCtx.getImageData(0, 0,
            this.width(),
            this.height());

        // find corners based on standard technique
        // the number of corners returned by the standard technique
        // will be the number used by the GA to find corners on it's own
        this.inputImgCorners = this.findCorners(imageData, this.width(), this.height());

        this.convertToGrayScale(imageData, this.width(), this.height());

        this.workingData = [];
        for (let i = 0; i < imageData.data.length; i++) {
            this.workingData[i] = imageData.data[i];
        }

    }

    setConfiguration() {
        this.workingSize = 350;
    }

    fitnessEvaluator(individual) {

        this.clearCanvas(this.workingCtx);
        individual.render(this.workingCtx, this.width(), this.height());

        let imageData = this.workingCtx.getImageData(0, 0,
            this.width(),
            this.height()).data;

        let diff = 0;

        for (var p = 0; p < imageData.length; p++) {
            var dp = imageData[p] - this.workingData[p];
            diff += dp * dp;
        }

        return (1 - diff / (this.width() * this.height() * 256 * 256 * 4));

    }

    clearCanvas(ctx) {
        ctx.clearRect(0, 0, this.width(), this.height());

        var styleString = 'rgba(233,233,233,255)';  // grayscale bg color

        ctx.fillStyle = styleString;
        ctx.fillRect(0, 0, this.width(), this.height());

        ctx.fillStyle = "rgba(0,0,0,255)";  // black
    }

    init() {

        this.inputImage = $('#inputImage')[0];

        /* get canvas variables */

        this.inputCanvas = $('#inputCanvas')[0];
        this.inputCtx = this.inputCanvas.getContext('2d');

        this.workingCanvas = $('#workingCanvas')[0];
        this.workingCtx = this.workingCanvas.getContext('2d');

        this.outputCanvas = $('#outputCanvas')[0];
        this.outputCtx = this.outputCanvas.getContext('2d');


        /* Check that we can run the program */
        if (!this.isSupported()) {
            alert('Unable to run genetics program!'); /* FIXME: better alert */
            return;
        }

        this.setConfiguration();
        this.prepareImage();

        this.config.render($("#config")[0]);
        this.stats.render($("#stats")[0]);

        this.registerListeners();
    }

    
    registerListeners() {
        let that = this;

        /*
        * Start button callback.
        */
        $('#start').click(function () {
            that.stats.begin();
            that.run();
        });

        $('#stop').click(function () {
            //that.stats.stop();
            clearInterval(that.clock);
        });

        // image picker listener
        let imgPicker = $("#imgPicker")[0];
        imgPicker.onchange = function() {
            var file = imgPicker.files[0];
            var reader  = new FileReader();

            reader.addEventListener("load", function () {
                that.inputImage.onload = that.prepareImage.bind(that);
                that.inputImage.src = reader.result;
            }, false);
            
            if (file) {
                reader.readAsDataURL(file);
            }
        }
    }

    /*
     * Run the simulation.
     */
    run() {
        let that = this;
        let population = new Population(this.config, new Individual(this.inputImgCorners >> 1, this.fitnessEvaluator.bind(this)));

        /* Each tick produces a new population and new fittest */
        function tick() {

            /* Breed a new generation */
            population.iterate();

            let fittest = population.getFittest();

            // clear the output screen for redraw
            that.clearCanvas(that.outputCtx);

            /* Draw the best fit to output */
            fittest.render(that.outputCtx, that.width(), that.height());

            that.stats.currentFitness(fittest.fitness());
            that.stats.tick();
        }

        /* Begin the master clock */
        this.clock = setInterval(tick, 0);
    }

}


var config = new Configuration();
config
    .populationSize(60)
    .crossoverRate(1.0)
    .mutationRate(0.01)
    .mutationAmount(0.1)
    .selectionStrategy("Tournament Selection")
    .tournamentSize(5)
    .crossoverStrategy("Uniform Crossover")
    .mutationStrategy("Creep mutation");

var stats = new Statistics();

var runner = new Runner(config, stats);
window.onload = () => {
    runner.init();

    $("#clear").click(() => {
        runner = new Runner(config, new Statistics());
        runner.init();
    });
};