import type { Config } from '../config'

export type PropKind =
  | 'plates'
  | 'bowls'
  | 'glass'
  | 'mug'
  | 'jar'
  | 'spices'
  | 'bottle'
  | 'pot'
  | 'pan'
  | 'board'
  | 'trays'
  | 'cutlery'
  | 'shirt'
  | 'coat'
  | 'folded'
  | 'trousers'
  | 'shoes'
  | 'boots'
  | 'suitcase'
  | 'sockRolls'
  | 'jacket'
  | 'bag'
  | 'hat'
  | 'scarf'
  | 'keyBowl'
  | 'entryBasket'
  | 'towels'
  | 'towelRolls'
  | 'lotion'
  | 'pump'
  | 'toothbrush'
  | 'bathBasket'
  | 'paperRolls'
  | 'grooming'
  | 'tv'
  | 'soundbar'
  | 'books'
  | 'booksHorizontal'
  | 'candle'
  | 'handTowels'
  | 'soapSet'
  | 'vase'
  | 'sculpture'
  | 'plant'
  | 'console'
  | 'mediaBox'
  | 'remote'
  | 'storageBox'
  | 'folders'
  | 'blankets'
  | 'basket'
  | 'hanger'
export type PropZone = 'hanging' | 'drawer' | 'top' | 'middle' | 'bottom'
export const productPropSets: Record<Config['m'], Record<PropZone, PropKind[]>> = {
  mutfak: {
    hanging: [],
    drawer: ['cutlery'],
    top: ['plates', 'glass', 'mug', 'bowls'],
    middle: ['jar', 'spices', 'bottle'],
    bottom: ['pot', 'pan', 'board', 'trays'],
  },
  gardirop: {
    hanging: ['shirt', 'coat'],
    drawer: ['sockRolls'],
    top: ['storageBox', 'suitcase'],
    middle: ['folded', 'trousers'],
    bottom: ['shoes', 'boots'],
  },
  portmanto: {
    hanging: ['jacket', 'bag'],
    drawer: ['keyBowl', 'entryBasket'],
    top: ['hat', 'scarf'],
    middle: ['bag', 'scarf', 'keyBowl', 'entryBasket'],
    bottom: ['shoes', 'boots'],
  },
  banyo: {
    hanging: [],
    drawer: ['grooming'],
    top: ['towels', 'handTowels', 'towelRolls'],
    middle: ['soapSet', 'pump', 'lotion', 'toothbrush'],
    bottom: ['bathBasket', 'paperRolls'],
  },
  tv: {
    hanging: [],
    drawer: ['remote', 'mediaBox'],
    top: ['books', 'vase', 'sculpture', 'plant', 'booksHorizontal', 'candle'],
    middle: ['booksHorizontal', 'plant', 'vase', 'candle'],
    bottom: ['console', 'mediaBox', 'booksHorizontal'],
  },
  ozel: {
    hanging: ['hanger'],
    drawer: ['storageBox', 'blankets'],
    top: ['storageBox', 'folders'],
    middle: ['books', 'blankets', 'basket', 'booksHorizontal', 'vase'],
    bottom: ['basket', 'folders'],
  },
}
/** Bounding dimensions in metres. Never scale up to fill a compartment. */
export const propSizes: Record<PropKind, [number, number, number]> = {
  plates: [0.26, 0.07, 0.26],
  bowls: [0.23, 0.13, 0.23],
  glass: [0.075, 0.1, 0.075],
  mug: [0.12, 0.1, 0.09],
  jar: [0.11, 0.2, 0.11],
  spices: [0.22, 0.11, 0.075],
  bottle: [0.075, 0.28, 0.075],
  pot: [0.34, 0.22, 0.27],
  pan: [0.44, 0.06, 0.26],
  board: [0.24, 0.33, 0.025],
  trays: [0.3, 0.36, 0.065],
  cutlery: [0.25, 0.035, 0.28],
  shirt: [0.44, 0.75, 0.065],
  coat: [0.44, 1.18, 0.09],
  folded: [0.3, 0.16, 0.28],
  trousers: [0.28, 0.1, 0.32],
  shoes: [0.22, 0.12, 0.28],
  boots: [0.23, 0.25, 0.28],
  suitcase: [0.4, 0.28, 0.3],
  sockRolls: [0.24, 0.08, 0.22],
  jacket: [0.44, 0.88, 0.085],
  bag: [0.25, 0.37, 0.15],
  hat: [0.25, 0.15, 0.25],
  scarf: [0.28, 0.09, 0.24],
  keyBowl: [0.16, 0.045, 0.13],
  entryBasket: [0.24, 0.16, 0.22],
  towels: [0.3, 0.18, 0.28],
  handTowels: [0.21, 0.13, 0.2],
  soapSet: [0.19, 0.135, 0.12],
  towelRolls: [0.29, 0.1, 0.24],
  lotion: [0.07, 0.22, 0.07],
  pump: [0.085, 0.19, 0.075],
  toothbrush: [0.09, 0.2, 0.075],
  bathBasket: [0.28, 0.24, 0.26],
  paperRolls: [0.24, 0.12, 0.12],
  grooming: [0.25, 0.05, 0.24],
  tv: [1.1, 0.64, 0.08],
  soundbar: [0.6, 0.055, 0.08],
  books: [0.2, 0.25, 0.18],
  booksHorizontal: [0.25, 0.085, 0.18],
  candle: [0.09, 0.12, 0.09],
  vase: [0.13, 0.22, 0.13],
  sculpture: [0.14, 0.18, 0.11],
  plant: [0.14, 0.22, 0.14],
  console: [0.3, 0.075, 0.23],
  mediaBox: [0.18, 0.06, 0.15],
  remote: [0.06, 0.025, 0.19],
  storageBox: [0.28, 0.18, 0.26],
  folders: [0.2, 0.31, 0.25],
  blankets: [0.3, 0.14, 0.28],
  basket: [0.27, 0.2, 0.25],
  hanger: [0.44, 0.7, 0.05],
}
