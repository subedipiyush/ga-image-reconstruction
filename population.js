
/*
* This class represents an entire population, composed of a number of
* individuals.
*/

class Population {

    constructor(config, individal) {
        this.config = config;
        this.size = config._populationSize;

        this.individuals = [];

        for (let i = 0; i < this.size; i++) {
            this.individuals.push(individal.newInstance());
        }
    }

    getFittest() {
        this.sort();
        return this.individuals[0];
    }

    sort() {
        // decreasing order of fitness i.e fitter solutions to less fit solutions
        this.individuals.sort(function (a, b) {
            return b.fitness() - a.fitness();
        });
    }

    selectParents() {
        // select two parents
        // tournament selection

        if(this.size == 1) {
            return this.individuals;
        }

        let parents = [];

        for(let k=0; k < 2; k++) {
            let inds = [];
            for(let i=0; i < this.config._tournamentSize; i++) {
                let randIndex = (Math.random() * this.size) >> 0;
                inds.push(this.individuals[randIndex]);
            }
            parents.push(inds.sort(function (a, b) {
                return b.fitness() - a.fitness();
            })[0]);
        }


        return parents;
    }

    crossOver(parents) {

        // uniform crossover
        let offspring1Dna = [];
        let offspring2Dna = [];
        for(let i=0; i < parents[0].dnaLength; i++) {
            let index = Math.random() < 0.5 ? 0 : 1;
            offspring1Dna.push(parents[index].dna[i].clone());
            offspring2Dna.push(parents[index ^ 1].dna[i].clone());
        }

        return [parents[0].newInstance(offspring1Dna), parents[0].newInstance(offspring2Dna)];
    }

    mutate(offsprings) {
        for (let j = 0; j < offsprings.length; j++) {
            for (let k = 0; k < offsprings[j].dna.length; k++) {
                
                let gene = offsprings[j].dna[k];
                for(let l=0; l < gene.length(); l++) {
                    if (Math.random() < this.config._mutationRate) {
                        let a = gene.getAlleleAt(l);

                        a += (Math.random() * this.config._mutationAmount * 2 - this.config._mutationAmount);
                        a = a < 0 ? 1 : a;
                        a = a > 1 ? 0 : a;

                        gene.setAlleleAt(l, a);
                    }
                }

                offsprings[j].dna[k] = gene;    // redundant?
            }
        }

        return offsprings;
    }

    iterate() {

        let offsprings = [];

        for (let i=0; i < this.size; i +=2 ) {

            // select
            let parents = this.selectParents();

            // crossover
            let offsprings_inner = parents;

            if (Math.random() < this.config._crossoverRate) {
                offsprings_inner = this.crossOver(parents);
            }

            // mutate
            offsprings_inner = this.mutate(offsprings_inner);

            offsprings = offsprings.concat(offsprings_inner);
        }

        this.individuals = offsprings;
    }

}