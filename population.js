
/*
* This class represents an entire population, composed of a number of
* individuals.
*/

class Population {

    constructor(size, individal) {
        this.size = size;
        this.individuals = [];

        for (var i = 0; i < size; i++) {
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
        let tournamentSize = 5;
        let numberOfTournaments = 2;

        for(let k=0; k < numberOfTournaments; k++) {
            let inds = [];
            for(let i=0; i < tournamentSize; i++) {
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

    mutate(offsprings, mutationRate) {
        let mutateAmount = 0.1;
        for (let j = 0; j < offsprings.length; j++) {
            for (let k = 0; k < offsprings[j].dna.length; k++) {
                
                let gene = offsprings[j].dna[k];
                for(let l=0; l < gene.length(); l++) {
                    if (Math.random() < mutationRate) {
                        let a = gene.getAlleleAt(l);

                        a += (Math.random() * mutateAmount * 2 - mutateAmount);
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

            let crossOverRate = 1.0;
            if (Math.random() < crossOverRate) {
                offsprings_inner = this.crossOver(parents);
            }

            // mutate
            let mutationRate = 0.01;
            offsprings_inner = this.mutate(offsprings_inner, mutationRate);

            offsprings = offsprings.concat(offsprings_inner);
        }

        this.individuals = offsprings;
    }

}