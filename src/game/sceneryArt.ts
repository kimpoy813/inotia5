import { TILE, type Decor, type Ground, type MapDef } from '../data/maps'
import { box, type Ink } from './pixelInk'

type Region = MapDef['id']
export const SCENERY_URLS = {
  wardhall: '/art/tiles/wardhall.png',
  oak: '/art/tiles/canopy-oak.png',
  cottage: '/art/tiles/lumen-cottage.png',
  terrain: '/art/commons/terrain.png',
  villageOak: '/art/commons/crown-oak.png',
  hollowOak: '/art/commons/hollow-oak.png',
  fern: '/art/commons/fern.png',
} as const

type PaintedProp = { id: Exclude<keyof typeof SCENERY_URLS, 'terrain'>; width: number; height?: number; shade?: number }
export function sceneryProp(kind: Decor, variant: number, region: Region, index: number): PaintedProp | undefined {
  if (kind === 'wardhall') return { id:'wardhall', width:119 } as const
  if (kind === 'house' && region === 'village' && variant !== 1) return { id:'cottage', width:110, height:72, shade:variant === 2 ? 0xd7cfe9 : undefined } as const
  if (kind === 'oak' && region !== 'pass') {
    const id = region === 'forest' ? 'hollowOak' : region === 'village' || region === 'road' ? 'villageOak' : 'oak'
    return { id, width:62 + variant * 4, shade:id === 'oak' ? 0xadbbc0 : undefined } as const
  }
  if (kind === 'pine' && region === 'forest' && index % 5 === 0) return { id:'hollowOak', width:61 } as const
  if (kind === 'bush' && (region === 'village' || region === 'road') && index % 3 !== 0) return { id:'fern', width:32 + variant * 2 } as const
  return undefined
}

// Five 16px swatches per row. Only the renderer sees these; no tile or collision data is changed.
const rows: Partial<Record<Region, Partial<Record<Ground, number>>>> = {
  village: { grass:0, moss:0, stone:4, path:9 },
  road: { grass:1, moss:1, path:9 },
  forest: { grass:2, moss:2, path:10 },
  pass: { snow:3 },
  capital: { cobbles:5 },
  spire: { slate:6 }, archive: { slate:7 }, bellvault: { slate:8 },
}
const tileHash = (x: number, y: number, seed: number) => ((Math.imul(x + 41, 113903) ^ Math.imul(y + 59, 94531) ^ seed) >>> 0)

export function paintTerrain(c: Ink, sheet: CanvasImageSource, m: MapDef, ground: Ground, x: number, y: number, dx: number, dy: number, neighbor: (x:number, y:number) => Ground | undefined) {
  const region = rows[m.id], row = region?.[ground]
  if (row === undefined) return false
  const hash = tileHash(x, y, m.seed)
  // Weight the quieter first swatch in the dungeons, so the cracks mark the floor instead of carpeting it.
  const ix = ground === 'slate' && hash % 4 < 2 ? 0 : hash % 5
  c.drawImage(sheet, ix * TILE, row * TILE, TILE, TILE, dx, dy, TILE, TILE)
  const tone = Math.sin(x * .37 + y * .44) + Math.cos(x * .6 - y * .28)
  box(c, tone < 0 ? `rgba(20,25,36,${-tone * .043})` : `rgba(224,207,157,${tone * .033})`, dx, dy, TILE, TILE)
  if (ground === 'path' || ground === 'stone') {
    for (const [sx, sy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
      const near = neighbor(x + sx, y + sy)
      if (near !== 'grass' && near !== 'moss') continue
      const layer = (region?.[near] ?? 0) * TILE
      for (let i = 0; i < 5; i++) {
        const pos = i * 3 + ((hash >>> (2*i)) & 1), depth = (hash >>> (3*i) & 3) + 1
        const ox = sx < 0 ? 0 : sx > 0 ? TILE - depth : pos
        const oy = sy < 0 ? 0 : sy > 0 ? TILE - depth : pos
        const w = sx ? depth : 2, h = sy ? depth : 2
        c.drawImage(sheet, ox, layer + oy, w, h, dx + ox, dy + oy, w, h)
      }
    }
  } else if ((ground === 'grass' || ground === 'moss') && hash % 13 === 0) {
    const warm = m.id !== 'forest', fx = dx + 3 + hash % 7, fy = dy + 5 + (hash >>> 8) % 7
    box(c, warm ? '#7a8552' : '#536e5c', fx + 1, fy + 1, 1, 3)
    box(c, warm ? '#c4a46d' : '#918297', fx, fy, 3, 2)
    box(c, warm ? '#ecd09b' : '#b5a5b5', fx + 1, fy - 1, 1, 2)
  }
  return true
}
