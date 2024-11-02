const suits = ['c', 'd', 'h', 's'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];

export function generateRandomCardShort(): string {
    const suit = Math.floor((Math.random() * 4) + 1);
    const rng = Math.floor((Math.random() * 13) + 1);

    return constructCardStringShort(rng, suit);
};

export function constructCardStringShort(rng: number, suit: number): string {
    const cardSuit = suits[suit - 1];
    const cardValue = values[rng - 1];

    return cardValue + cardSuit;
};
