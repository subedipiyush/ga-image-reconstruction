
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

    findCorners(imageData, width, height) {
        // tracking.Fast.THRESHOLD = 10;
        // var blur = tracking.Image.blur(imageData.data, width, height, 3);
        // var gray = tracking.Image.grayscale(blur, width, height);
        // var corners = tracking.Fast.findCorners(gray, width, height);
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
        let count = jsfeat.fast_corners.detect(gray_img, corners, border);

        return corners.slice(0, count);
    }

    prepareImage() {
        
        /* FIXME: add support for images of size other than 350x350. This requires
         * scaling the image and cropping as needed */


        this.inputCanvas.width = this.workingSize;
        this.inputCanvas.height = this.workingSize;

        this.outputCanvas.width = this.workingSize;
        this.outputCanvas.height = this.workingSize;

        this.referenceCanvas.width = this.workingSize;
        this.referenceCanvas.height = this.workingSize;

        this.workingCanvas.width = this.workingSize;
        this.workingCanvas.height = this.workingSize;

        this.inputCtx.drawImage(this.inputImage, 0, 0);

        let imageData = this.inputCtx.getImageData(0, 0,
            this.workingSize,
            this.workingSize);
            
            
        this.inputImgCorners = this.findCorners(imageData, this.workingSize, this.workingSize);
        
        for(let i=0; i < this.inputImgCorners.length; i ++) {
            this.referenceCtx.fillRect(this.inputImgCorners[i].x, this.inputImgCorners[i].y, 3, 3);
        }
            
        var gray_img = new jsfeat.matrix_t(this.workingSize, this.workingSize, jsfeat.U8_t | jsfeat.C1_t);
        var code = jsfeat.COLOR_RGBA2GRAY;
        jsfeat.imgproc.grayscale(imageData.data, this.workingSize, this.workingSize, gray_img, code);


        // render result back to canvas
        var data_u32 = new Uint32Array(imageData.data.buffer);
        var alpha = (0xff << 24);
        var i = gray_img.cols*gray_img.rows, pix = 0;
        while(--i >= 0) {
            pix = gray_img.data[i];
            data_u32[i] = alpha | (pix << 16) | (pix << 8) | pix;
        }

        this.inputCtx.putImageData(imageData, 0, 0);

        // imageData = this.inputCtx.getImageData(0, 0,
        //     this.workingSize,
        //     this.workingSize);

        this.workingData = [];

        for (let i = 0; i < imageData.data.length; i++) {
            this.workingData[i] = imageData.data[i];
        }

    }


    setConfiguration() {
        this.populationSize = 50;
        this.workingSize = 350;
    }

    fitnessEvaluator(individual) {

        this.clearCanvas(this.workingCtx);
        individual.render(this.workingCtx, this.workingSize, this.workingSize);

        let imageData = this.workingCtx.getImageData(0, 0,
            this.workingSize,
            this.workingSize).data;
        let diff = 0;
        
        
        for (var p = 0; p < imageData.length; p ++) {
            var dp = imageData[p] - this.workingData[p];
            diff += dp * dp;
        }
        
        return (1 - diff / (this.workingSize * this.workingSize * 256 * 256 * 4));

    }

    clearCanvas(ctx) {
        ctx.clearRect(0, 0, this.workingSize, this.workingSize);
        
        var styleString = 'rgba(233,233,233,255)';

        ctx.fillStyle = styleString;
        // this.outputCtx.fillStyle = styleString;
        ctx.fillRect(0, 0, this.workingSize, this.workingSize);

        ctx.fillStyle = "rgba(0,0,0,255)";
    }

    setBg(ctx, color) {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, this.workingSize, this.workingSize);
        ctx.fillStyle = "black";
    }

    init() {

        this.inputImage = $('#inputImage')[0];

        /* get canvas variables */
        
        this.inputCanvas = $('#inputCanvas')[0];
        this.inputCtx = this.inputCanvas.getContext('2d');
        
        this.referenceCanvas = $("#referenceCanvas")[0];
        this.referenceCtx = this.referenceCanvas.getContext('2d');
        
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
        let population = new Population(this.populationSize, new Individual(this.inputImgCorners.length, this.fitnessEvaluator.bind(this)));

        let i=0;

        let temp = undefined;

        /* Each tick produces a new population and new fittest */
        function tick() {

            if(i >= 5000)
                clearInterval(that.clock);


            /* Breed a new generation */
            population.iterate();
            
            let fittest = population.getFittest();

            if(temp != fittest) {

                // clear the output screen for redraw
                that.clearCanvas(that.outputCtx);
    
                /* Draw the best fit to output */
                fittest.render(that.outputCtx, that.workingSize, that.workingSize);

                temp = fittest;
            }

            i++;
        }

        /* Begin the master clock */
        this.clock = setInterval(tick, 0);
        // tick();
    }

}

var runner = new Runner();
window.onload = () => { runner.init(); };