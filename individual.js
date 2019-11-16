

class Gene {
    constructor(x, y) {
        this.x = x;
        this.y = y;
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
            let x = Math.random();
            let y = Math.random();

            newInd.dna.push(new Gene(x, y));
        }

        return newInd;

    }
 
    render(ctx, width, height) {

        for (var g = 0; g < this.dnaLength; g++) {

            let gene = this.dna[g];

            let X = gene.x * width, Y = gene.y * height;
            ctx.fillRect(X, Y, 3, 3);
        }
    }

}