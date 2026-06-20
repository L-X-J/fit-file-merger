const SHIFT_AMOUNTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]

const TABLE = Array.from({ length: 64 }, (_, index) =>
  Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000) | 0
)

const rotateLeft = (value: number, shift: number) =>
  (value << shift) | (value >>> (32 - shift))

const add = (left: number, right: number) => (left + right) | 0

const toHexWord = (value: number) => {
  let output = ''
  for (let index = 0; index < 4; index += 1) {
    output += ((value >>> (index * 8)) & 0xff).toString(16).padStart(2, '0')
  }
  return output
}

export const md5ArrayBuffer = (buffer: ArrayBuffer): string => {
  const input = new Uint8Array(buffer)
  const originalLength = input.length
  let paddedLength = originalLength + 1

  while (paddedLength % 64 !== 56) {
    paddedLength += 1
  }

  const bytes = new Uint8Array(paddedLength + 8)
  bytes.set(input)
  bytes[originalLength] = 0x80

  const bitLengthLow = (originalLength << 3) >>> 0
  const bitLengthHigh = Math.floor(originalLength / 0x20000000) >>> 0

  for (let index = 0; index < 4; index += 1) {
    bytes[paddedLength + index] = (bitLengthLow >>> (index * 8)) & 0xff
    bytes[paddedLength + 4 + index] = (bitLengthHigh >>> (index * 8)) & 0xff
  }

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476
  const words = new Array<number>(16)

  for (let offset = 0; offset < bytes.length; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      const wordOffset = offset + index * 4
      words[index] =
        bytes[wordOffset] |
        (bytes[wordOffset + 1] << 8) |
        (bytes[wordOffset + 2] << 16) |
        (bytes[wordOffset + 3] << 24)
    }

    let a = a0
    let b = b0
    let c = c0
    let d = d0

    for (let index = 0; index < 64; index += 1) {
      let f: number
      let g: number

      if (index < 16) {
        f = (b & c) | (~b & d)
        g = index
      } else if (index < 32) {
        f = (d & b) | (~d & c)
        g = (5 * index + 1) % 16
      } else if (index < 48) {
        f = b ^ c ^ d
        g = (3 * index + 5) % 16
      } else {
        f = c ^ (b | ~d)
        g = (7 * index) % 16
      }

      const nextD = d
      d = c
      c = b
      b = add(
        b,
        rotateLeft(add(add(a, f), add(TABLE[index], words[g])), SHIFT_AMOUNTS[index])
      )
      a = nextD
    }

    a0 = add(a0, a)
    b0 = add(b0, b)
    c0 = add(c0, c)
    d0 = add(d0, d)
  }

  return `${toHexWord(a0)}${toHexWord(b0)}${toHexWord(c0)}${toHexWord(d0)}`
}

export const calculateFileMd5 = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer()
  return md5ArrayBuffer(buffer)
}
