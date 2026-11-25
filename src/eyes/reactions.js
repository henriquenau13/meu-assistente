// Cada reação dura um tempo (em milissegundos) e depois os olhos voltam ao normal.
// Para usar em qualquer lugar do app:  react('happy')

export const REACTIONS = {
  surprised: { label: 'Surpreso', duration: 1400 },
  happy:     { label: 'Feliz',    duration: 1800 },
  sad:       { label: 'Triste',   duration: 2000 },
  curious:   { label: 'Curioso',  duration: 2000 },
  squint:    { label: 'Apertado', duration: 1500 },
  cute:      { label: 'Fofo',     duration: 2200 },
}

export const REACTION_NAMES = Object.keys(REACTIONS)