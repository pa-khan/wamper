type Range = [number, number]

const ranges: Range[]  = [
  [48, 57],
  [65, 90],
  [97, 122],
]

function random(range: Range) {
  const minCeiled = Math.ceil(range[0]);
  const maxFloored = Math.floor(range[1]);
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
}

export function hash(length: number = 16) {
  let hash = ''
  
  for (let i = 0; i < length; i++ ) {
    const type = random([1, ranges.length - 1])
    hash += String.fromCharCode(random(ranges[type]))
  }
  
  return hash
}