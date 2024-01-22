export const declOfNum = (number: number, words: string[]) => {
  if (words?.length !== 3) {
    throw new Error('words length must be 3')
  }

  const parsedNum = Math.abs(number) % 100
  const n1 = parsedNum % 10

  if (parsedNum > 10 && parsedNum < 20) {
    return words[2]
  }

  if (n1 > 1 && n1 < 5) {
    return words[1]
  }

  if (n1 == 1) {
    return words[0]
  }

  return words[2]
}
