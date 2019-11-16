

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

    newInstance2(mother, father) {

        let newInd = new Individual(this.dnaLength, this.fitnessEvaluator);

        if (mother && father) {

            /*
             * Breed from mother and father:
             */

            /* Used in random inheritance */
            var inheritSplit = (Math.random() * this.dnaLength) >> 0;
            let randomInheritance = false;
            let mutateAmount = 0.1;
            let mutationChance = 0.01;
            for (var i = 0; i < this.dnaLength; i++) {

                /* The parent's gene which will be inherited */
                var inheritedGene;

                if (randomInheritance) {
                    /* Randomly inherit genes from parents in an uneven manner */
                    inheritedGene = (i < inheritSplit) ? mother : father;
                } else {
                    /* Inherit genes evenly from both parents */
                    inheritedGene = (Math.random() < 0.5) ? mother : father;
                }

                /*
                 * Create the genes:
                 */
                
                 /* The DNA strand */
                let x = inheritedGene[i].x, y = inheritedGene[i].y;

                /* Mutate X */
                if (Math.random() < mutationChance) {

                    /* Apply the random mutation */
                    x += Math.random() * mutateAmount * 2 - mutateAmount;

                    /* Keep the value in range */
                    if (x < 0)
                        x = 0;

                    if (x > 1)
                        x = 1;
                }
                /* Mutate Y */
                if (Math.random() < mutationChance) {

                    /* Apply the random mutation */
                    y += Math.random() * mutateAmount * 2 - mutateAmount;

                    /* Keep the value in range */
                    if (y < 0)
                        y = 0;

                    if (y > 1)
                        y = 1;
                }

                newInd.dna.push(new Gene(x,y));
            
            }

        } else {
            newInd = this.newInstance();
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