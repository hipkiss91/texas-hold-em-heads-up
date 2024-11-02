import { generateRandomCardShort } from '~/utils/generateRandomCard';

const order = '23456789TJQKA';
export let simulations: number = 10000;
export let player1Wins: number = 0;
export let player2Wins: number = 0;
export let ties: number = 0;

type CurrentCombinationType = string[];
type HandComparisonType = {[key: string]: number | string};

export function reset() {
    player1Wins = 0;
    player2Wins = 0;
    ties = 0;
}

export function formatWinRates(p1: number, p2: number, tie: number, sims: number) {
    const player1WinPercentage = ((p1 / sims) * 100).toFixed(1);
    const player2WinPercentage = ((p2 / sims) * 100).toFixed(1);
    const tiePercentage = ((tie / sims) * 100).toFixed(1);

    return {
        player1WinPercentage,
        player2WinPercentage,
        tiePercentage,
    };
}

export function generateCombinations(cards: string[], size: number) {
    const combinations: string[][] = [];

    function backtrack(startIndex: number, currentCombination: CurrentCombinationType) {
        if (currentCombination.length === size) {
            combinations.push([
                ...currentCombination,
            ]);
            return;
        }

        for (let i = startIndex; i < cards.length; i++) {
            currentCombination.push(cards[i]);
            backtrack(i + 1, currentCombination);
            currentCombination.pop();
        }
    }

    backtrack(0, [] as CurrentCombinationType);
    return combinations;
}

export function findBestHandFromCombination(hands: string[][]) {
    let j = 0;
    let strongest = null;
    while (j < hands.length) {
        const next: string[] = hands[j];
        if (strongest) {
            strongest = compare(strongest, next);
        } else {
            strongest = compare(next, hands[j + 1]);
        }
        j++;
    }

    if (strongest) {
        return strongest;
    } else{
        throw Error('findBestHandFromCombination failed');
    }
}

// Monte Carlo Simulations
export function run(player1Cards: string[], player2Cards: string[], n: number): Promise<void> {
    return new Promise((resolve, reject) => {
        reset();
        simulations = n;
        for (let i = 0; i < simulations; i++) {
            // Generate community cards
            const communityCards: string[] = [];
            while (communityCards.length < 5) {
                const card = generateRandomCardShort();
                if (!communityCards.includes(card) && !player1Cards.includes(card) && !player2Cards.includes(card)) {
                    communityCards.push(card);
                }
            }

            const player1HandCombinations = generateCombinations([
                ...communityCards,
                ...player1Cards,
            ], 5);
            const player2HandCombinations = generateCombinations([
                ...communityCards,
                ...player2Cards,
            ], 5);

            // What is the best hand from: player1HandCombinations ?
            const player1StrongestHand = findBestHandFromCombination(player1HandCombinations);
            // What is the best hand from: player2HandCombinations ?
            const player2StrongestHand = findBestHandFromCombination(player2HandCombinations);

            if (!player1StrongestHand || !player2StrongestHand) {
                reject({error: 'simulation failed'});
            }

            compareHands(player1StrongestHand, player2StrongestHand);
        }

        // return formatWinRates(player1Wins, player2Wins, ties, simulations);
        resolve(formatWinRates(player1Wins, player2Wins, ties, simulations));
    });
}

export function getHandDetails(cards: string[]) {
    const faces = cards.map(a => String.fromCharCode(...[77 - order.indexOf(a[0])])).sort();
    const suits = cards.map(a => a[1]).sort();
    const counts = faces.reduce(count, {});
    const duplicates = Object.values(counts).reduce(count, {}) as HandComparisonType[];
    const flush = suits[0] === suits[4];
    const first = faces[0].charCodeAt(0);
    const straight = faces.every((f, index) => f.charCodeAt(0) - first === index);
    const rank = (flush && straight && 1)
        || (duplicates[4] && 2)
        || (duplicates[3] && duplicates[2] && 3)
        || (flush && 4)
        || (straight && 5)
        || (duplicates[3] && 6)
        || (duplicates[2] > 1 && 7)
        || (duplicates[2] && 8)
        || 9;

    return {
        rank,
        value: faces.sort(byCountFirst).join(''),
    };

    function byCountFirst(a: string, b: string) {
        const countDiff = counts[b] - counts[a];
        if (countDiff) {
            return countDiff;
        }

        return (b > a) ? -1 : ((b === a) ? 0 : 1);
    }

    function count(c: HandComparisonType, a: number | string) {
        c[a] = (c[a] || 0) + 1;
        return c;
    }
}

export function compare(h1: string[], h2: string[]) {
    const d1 = getHandDetails(h1);
    const d2 = getHandDetails(h2);
    if (d1.rank === d2.rank) {
        if (d1.value < d2.value) {
            return h1;
        } else if (d1.value > d2.value) {
            return h2;
        } else {
            return h1;
        }
    } else if (d1.rank < d2.rank) {
        return h1;
    } else {
        return h2;
    }
}

export function compareHands(h1: string[], h2: string[]) {
    const d1 = getHandDetails(h1);
    const d2 = getHandDetails(h2);
    if (d1.rank === d2.rank) {
        if (d1.value < d2.value) {
            player1Wins++;
        } else if (d1.value > d2.value) {
            player2Wins++;
        } else {
            ties++;
        }
    } else if (d1.rank < d2.rank) {
        player1Wins++;
    } else {
        player2Wins++;
    }
}
