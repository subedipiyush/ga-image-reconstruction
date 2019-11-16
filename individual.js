

class Gene {

    constructor(x, y, slope) {
        this.alleles = [x, y, slope];
    }

    x() {
        return this.alleles[0];
    }

    y() {
        return this.alleles[1];
    }

    slope() {
        return this.alleles[2];
    }

    clone() {
        return new Gene(this.x(), this.y(), this.slope());
    }

    getAlleleAt(index) {
        return this.alleles[index];
    }

    setAlleleAt(index, value) {
        return this.alleles[index] = value;
    }

    length() {
        return this.alleles.length;
    }
}

class Individual {

    constructor(numberOfGenesPerDna, fitnessEvaluator) {
        this.dnaLength = numberOfGenesPerDna;
        this.dna = [];
        this.fitnessEvaluator = fitnessEvaluator;
        this._fitness = undefined;
    }

    /* function works as both setter and getter for individual's fitness */
    fitness() {
        if (!this._fitness) {
            this._fitness = this.fitnessEvaluator(this);
        }

        return this._fitness;
    }

    isFitterThan(other) {
        return this.fitness() < other.fitness();
    }
    
    /*
    * Generates a random individual:
    */
    newInstance(dna) {

        let newInd = new Individual(this.dnaLength, this.fitnessEvaluator);

        if (dna) {
            newInd.dna = [...dna];
            return newInd;
        }

        for (var g = 0; g < newInd.dnaLength; g++) {

            /* Generate XY positional values */
            let x1 = Math.random();
            let y1 = Math.random();
            let slope = Math.random();

            newInd.dna.push(new Gene(x1, y1, slope));
        }

        return newInd;

    }

    
    magnitude() {
        return 15;
    }
 
    render(ctx, width, height) {

        for (var g = 0; g < this.dnaLength; g++) {

            let gene = this.dna[g];

            let x1 = gene.x() * width, y1 = gene.y() * height;
            let slope = (gene.slope() * 360) >> 0;          
            let x2 = x1 + this.magnitude() * Math.cos(slope);
            let y2 = y1 + this.magnitude() * Math.sin(slope);

            x2 = x2 < 0 ? 0 : (x2 > width ? width : x2);
            y2 = y2 < 0 ? 0 : (y2 > height ? height : y2);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.closePath();


            ctx.lineWidth = 1;
            ctx.stroke();

        }
    }

}