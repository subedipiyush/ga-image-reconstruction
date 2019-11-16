
class Runner {

    constructor() {
        // this.init();
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
        var i = gray_img.cols*gray_img.rows, pix = 0;
        while(--i >= 0) {
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
        for(var i = 0; i < gray_img.cols*gray_img.rows; ++i) {
            corners[i] = new jsfeat.keypoint_t(0,0,0,0);
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
        this.populationSize = 100;
        this.workingSize = 350;
    }

    fitnessEvaluator(individual) {

        this.clearCanvas(this.workingCtx);
        individual.render(this.workingCtx, this.width(), this.height());

        let imageData = this.workingCtx.getImageData(0, 0,
            this.width(),
            this.height()).data;
            
        let diff = 0;
        
        for (var p = 0; p < imageData.length; p ++) {
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

        this.registerListeners();
    }

    registerListeners() {
        let that = this;
        
        /*
        * Start button callback.
        */
        $('#start').click(function () {
            that.run();
        });

        $('#stop').click(function () {
            clearInterval(that.clock);
        });
    }

    /*
     * Run the simulation.
     */
    run() {
        let that = this;
        let population = new Population(this.populationSize, new Individual(this.inputImgCorners >> 1, this.fitnessEvaluator.bind(this)));

        let i=0;

        /* Each tick produces a new population and new fittest */
        function tick() {

            if(i >= 5000) {
                clearInterval(that.clock);
                alert("stopped");
            }


            /* Breed a new generation */
            population.iterate();
            
            let fittest = population.getFittest();

            // clear the output screen for redraw
            that.clearCanvas(that.outputCtx);

            /* Draw the best fit to output */
            fittest.render(that.outputCtx, that.width(), that.height());

            i++;
        }

        /* Begin the master clock */
        this.clock = setInterval(tick, 0);
        // tick();
    }

}

var runner = new Runner();
window.onload = () => { runner.init(); };