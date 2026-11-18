import type { EnemyId } from './enemies'
import type { Point, RegionId } from '../game/types'
export const TILE = 16
export type Ground = 'grass' | 'path' | 'stone' | 'water' | 'bridge' | 'moss' | 'wall' | 'slate' | 'snow' | 'abyss'
export type Decor = 'pine' | 'oak' | 'rock' | 'house' | 'fence' | 'bush' | 'lamp' | 'well' | 'column' | 'arch' | 'crystal' | 'banner' | 'crate' | 'lily'
export type Prop = Point & { kind: Decor; variant: number; solid?: boolean }
export type Feature = Point & { id: string; name: string; kind: 'npc' | 'exit' | 'loot' | 'shrine' | 'inspect' | 'rune' | 'chest'; to?: { region: RegionId; x: number; y: number }; needs?: string; item?: string; palette?: number }
export type Spawn = Point & { id: EnemyId; key: string }
export type MapDef = { id: RegionId; name: string; sub: string; w: number; h: number; seed: number; tiles: Ground[]; blocked: boolean[]; props: Prop[]; features: Feature[]; spawns: Spawn[] }
export const coord = (x: number, y: number): Point => ({ x: Math.round((x + .5) * TILE), y: Math.round((y + .5) * TILE) })
export const VILLAGE_START = coord(18, 22)
export const random = (seed: number) => () => { seed = (Math.imul(1664525,seed) + 1013904223) >>> 0; return seed / 4294967296 }
function build(id: RegionId, name: string, sub: string, w: number, h: number, seed: number, ground: Ground) {
  const m: MapDef = { id, name, sub, w, h, seed, tiles: Array<Ground>(w*h).fill(ground), blocked: Array<boolean>(w*h).fill(false), props:[], features:[], spawns:[] }
  const tile = (x: number,y: number,g: Ground) => { if (x>=0 && x<w && y>=0 && y<h) m.tiles[y*w+x] = g }
  const rect = (x: number,y: number,ww: number,hh: number,g: Ground) => { for(let j=y;j<y+hh;j++) for(let i=x;i<x+ww;i++) tile(i,j,g) }
  const ellipse = (x: number,y: number,rx: number,ry: number,g: Ground) => {
    for(let j=Math.floor(y-ry);j<=y+ry;j++) for(let i=Math.floor(x-rx);i<=x+rx;i++) if (((i-x)/rx)**2+((j-y)/ry)**2 < 1 + .11*Math.sin(i*.91+j*1.8)) tile(i,j,g)
  }
  const road = (points: number[][], radius: number, g: Ground = 'path') => {
    for(let i=1;i<points.length;i++) { const [ax,ay]=points[i-1], [bx,by]=points[i]; const n=Math.ceil(Math.hypot(bx-ax,by-ay)*1.6)
      for (let j=0;j<=n;j++) ellipse(ax+(bx-ax)*j/n,ay+(by-ay)*j/n,radius,radius*.8,g)
    }
  }
  const prop = (kind: Decor, x: number, y: number, variant=0, solid=false) => { m.props.push({kind,...coord(x,y),variant,solid}); if(solid) {
    const xr = kind==='house'?2:kind==='well'?1:0, ya = kind==='house'?2:kind==='well'?1:0
    for(let j=Math.floor(y)-ya;j<=Math.floor(y);j++) for (let i=Math.floor(x)-xr;i<=Math.floor(x)+xr;i++) if(i>0&&i<w&&j>0&&j<h) m.blocked[j*w+i]=true
  } }
  const feature = (id: string,name: string,kind: Feature['kind'],x: number,y: number, extra: Partial<Feature>={}) => { m.features.push({id,name,kind,...coord(x,y),...extra}) }
  const exit = (id:string,name:string,x:number,y:number,region:RegionId,tx:number,ty:number,needs?:string) => feature(id,name,'exit',x,y,{to:{region,...coord(tx,ty)},needs})
  const spawn = (id: EnemyId, points: number[][]) => points.forEach(([x,y]) => m.spawns.push({id,key:`${m.id}-${m.spawns.length}`,...coord(x,y)}))
  const flora = (amount:number, allow:(x:number,y:number)=>boolean, pines=.65) => {
    const rng=random(seed*129)
    for(let i=0;i<amount*5 && amount>0;i++) { const x=1+Math.floor(rng()*(w-2)), y=1+Math.floor(rng()*(h-2));
      if(!allow(x,y)||!['grass','moss','snow'].includes(m.tiles[y*w+x])||m.blocked[y*w+x]) continue
      if(m.props.some(p=>Math.hypot(p.x-coord(x,y).x,p.y-coord(x,y).y)<28)) continue
      if(m.features.some(f=>Math.hypot(f.x-coord(x,y).x,f.y-coord(x,y).y)<35)) continue
      if(m.spawns.some(e=>Math.hypot(e.x-coord(x,y).x,e.y-coord(x,y).y)<28)) continue
      const t=rng(), v=Math.floor(rng()*4)
      prop(t<.78?(rng()<pines?'pine':'oak'):t<.90?'bush':'rock',x,y,v,t<.78 || t>=.90); amount--
    }
  }
  const finish = () => { m.props.sort((a,b)=>a.y-b.y); return m }
  return { m, tile, rect, ellipse, road, prop, feature, exit, spawn, flora, finish }
}
const village = (()=>{
  const { m,tile,rect,ellipse,road,prop,feature,exit,spawn,flora,finish }=build('village','Lumenford Village','The last light of the frontier',58,39,41,'grass')
  ellipse(21,20,16,12,'grass');
  for(let y=0;y<m.h;y++) {const x=39+Math.round(Math.sin(y*.24)*1.8);for(let i=-1;i<=2;i++)tile(x+i,y,'water')}
  road([[4,22],[12,22],[17,21],[27,22],[35,22],[52,22],[55,22]],2.45,'stone')
  road([[20,5],[21,15],[21,24],[21,31],[16,34]],1.65,'path')
  road([[8,11],[12,15],[12,22],[11,29]],1.35)
  road([[25,15],[31,13],[34,14],[35,22],[33,29],[27,32]],1.3)
  for(let y=0;y<m.h;y++) {const x=39+Math.round(Math.sin(y*.24)*1.8);for(let i=-1;i<=2;i++)tile(x+i,y,y>=20&&y<=23?'bridge':'water')}
  ellipse(21,20,8.25,4.8,'stone'); rect(48,21,7,3,'path')
  ;[[11,12,0],[21,10,1],[30,12,2],[13,29,2],[25,30,0],[33,29,1],[47,15,1]].forEach(([x,y,v])=>prop('house',x,y,v,true))
  ;[[10,18],[14,20],[20,16],[27,20],[31,23],[35,20],[44,20],[52,21],[21,28],[10,30]].forEach(([x,y],i)=>prop('lamp',x,y,i%2))
  ;[[15,12],[16,12],[26,12],[27,12],[31,29],[30,29],[29,29],[10,28],[9,28]].forEach(([x,y],i)=>prop('fence',x,y,i%3,true))
  prop('well',24,23,0,true);prop('banner',21,19,0);prop('banner',50,19,1)
  prop('crate',31,20,0);prop('crate',32,20,1);prop('oak',15,17,2,true);prop('oak',29,25,0,true)
  feature('tarek','Captain Tarek','npc',22,18,{palette:0}); feature('lyra','Lyra','npc',11,16,{palette:1}); feature('corin','Corin · Merchant','npc',30,21,{palette:2})
  feature('mara','Mara · Blacksmith','npc',31,14,{palette:3}); feature('bess','Bess · Lampkeeper','npc',13,24,{palette:2}); feature('ellan','Ellan','npc',19,28,{palette:4})
  feature('vigil','Wayside Shrine','shrine',20,23); feature('cache-village','Abandoned Footlocker','chest',8,29,{item:'ring'})
  exit('to-road','Whisperpine Road',54,22,'road',5,22,'q1'); exit('to-pass','Ashen Pass',51,32,'pass',6,17,'q10')
  spawn('omen',[[16,20]]); flora(157,(x,y)=>x<8||x>34||y<8||y>30||((x<16||x>27)&&y!==18),.49)
  return finish()
})()
const road = (()=>{
  const {ellipse,road,prop,feature,exit,spawn,flora,finish}=build('road','Whisperpine Road','The wind carries unfamiliar names',66,41,82,'grass')
  ellipse(31,11,10,7,'water'); ellipse(43,31,10,6,'moss'); ellipse(17,31,7,6,'moss'); ellipse(54,13,7,6,'moss')
  road([[3,22],[14,22],[22,20],[31,22],[38,22],[50,18],[62,16]],2.5)
  road([[14,23],[16,28],[20,30],[28,29],[31,23]],1.4);road([[38,22],[42,26],[47,27],[56,24],[59,19]],1.65)
  ellipse(17,29,4.7,3.8,'path'); ellipse(34,23,4.7,3.4,'path')
  ;[[7,20],[17,27],[26,22],[48,16],[59,15]].forEach(([x,y])=>prop('lamp',x,y))
  prop('rock',36,18,2,true);prop('crate',17,30,1);prop('banner',15,27,0);prop('column',42,28,1,true)
  feature('seris','Seris','npc',17,28,{palette:4});feature('road-shrine','Pilgrim’s Shrine','shrine',19,28)
  feature('veilstone','Fractured Waystone','inspect',43,28,{needs:'q4'});feature('cache-road','Smuggler’s Cache','chest',51,29,{item:'edge'})
  ;[[13,25],[24,24],[30,21],[47,23],[36,29]].forEach(([x,y],i)=>feature(`herb-${i}`,'Moonmint','loot',x,y,{item:'herb'}))
  ;[[22,27],[50,21],[51,27]].forEach(([x,y],i)=>feature(`ore-${i}`,'Pine-Iron Vein','loot',x,y,{item:'ore'}))
  exit('to-village','Lumenford Village',3,22,'village',51,22);exit('to-forest','Hollowwood Forest',62,16,'forest',5,25,'q4')
  spawn('slime',[[15,20],[21,22],[27,20],[32,25],[38,24]]);spawn('goblin',[[41,21],[52,16]]);spawn('bat',[[37,17],[52,24]]);spawn('bandit',[[47,28],[57,20]]);
  flora(220,(x,y)=>x<11||x>17||y<18||y>27);return finish()
})()
const forest = (()=>{
  const {ellipse,road,prop,feature,exit,spawn,flora,finish}=build('forest','Hollowwood Forest','Beneath a canopy that remembers',64,44,219,'moss')
  ellipse(22,13,9,5,'water');ellipse(42,21,5,5,'water');ellipse(31,35,9,4,'grass');ellipse(54,10,9,5,'grass')
  road([[3,25],[9,25],[16,27],[23,27],[30,24],[39,27],[48,24],[55,17],[61,13]],2.05)
  road([[28,25],[29,31],[38,32],[44,30],[51,25]],1.45);road([[30,24],[34,18],[37,15],[47,14],[55,17]],1.65)
  ellipse(22,28,5,3.8,'path');ellipse(41,31,5.5,3.7,'path');ellipse(56,16,5.6,4.2,'stone')
  ;[[13,23],[27,29],[36,16],[49,24]].forEach(([x,y])=>prop('lamp',x,y,1))
  prop('arch',60,13,1);prop('column',52,15,2,true);prop('column',57,18,1,true);prop('column',61,15,0,true);prop('crate',42,31);prop('banner',22,26,1)
  feature('guard','Wounded Sentinel','npc',20,29,{palette:0});feature('forest-shrine','Sentinel’s Shrine','shrine',23,29)
  feature('dispatch','Lost Dispatch','loot',42,30,{item:'dispatch',needs:'q6'});feature('ruin','Oath Gate','inspect',57,15,{needs:'q8'})
  feature('cache-forest','Overgrown Coffer','chest',37,14,{item:'onyx'});feature('ore-forest','Pine-Iron Vein','loot',39,33,{item:'ore'});feature('herb-forest','Moonmint','loot',18,28,{item:'herb'})
  exit('to-road','Whisperpine Road',3,25,'road',59,17);exit('to-spire','The Fallen Spire',60,13,'spire',6,23,'q8')
  spawn('wolf',[[11,25],[15,28],[26,24],[30,27],[37,26],[47,25]]);spawn('spider',[[31,32],[44,30],[46,14]]);spawn('wisp',[[36,18],[52,19]]);spawn('bandit',[[40,29]])
  flora(245,()=>true,.88);return finish()
})()
const spire = (()=>{
  const {m,rect,prop,feature,exit,spawn,finish}=build('spire','The Fallen Spire','The roots of the world are listening',68,42,581,'wall')
  ;[[3,18,12,11],[13,18,10,10],[13,9,6,11],[16,10,11,5],[23,8,15,8],[23,14,8,16],[15,25,9,9],[21,26,13,10],[27,18,10,9],[39,17,4,10],[42,8,12,26],[39,12,7,20]].forEach(([x,y,w,h])=>rect(x,y,w,h,'slate'))
  rect(25,21,12,3,'stone');rect(42,15,10,13,'stone');rect(45,13,5,2,'stone');rect(45,28,5,2,'stone');rect(37,20,2,5,'slate')
  for(let y=9;y<33;y++)for(let x=42;x<54;x++) if((x===42||x===53)&&(y<13||y>28))m.tiles[y*m.w+x]='abyss'
  ;[[6,18],[11,26],[20,24],[15,12],[26,16],[30,21],[34,23],[40,18],[40,27],[44,12],[50,12],[43,31],[51,31]].forEach(([x,y],i)=>prop(i%3===0?'crystal':'column',x,y,i%3,i%3!==0))
  prop('arch',37.5,19,2);prop('banner',32,19,2);prop('crystal',49,11,2);prop('crystal',47,31,0)
  rect(55,9,8,25,'abyss');prop('column',55,14,1,true);prop('column',55,31,1,true);prop('crystal',55,19,1);prop('crystal',58,26,2);prop('column',61,12,0,true);prop('column',61,32,1,true)
  feature('spire-shrine','Vestibule Shrine','shrine',8,24)
  feature('inscription','Weathered Inscription','inspect',16,20);feature('tide','Tide Rune','rune',34,12);feature('thorn','Thorn Rune','rune',27,32);feature('ember','Ember Rune','rune',14,12)
  feature('oath-door','Warden’s Threshold','inspect',35,22);feature('spire-treasure','Sealed Reliquary','chest',30,34,{item:'crest'})
  exit('to-forest','Hollowwood Forest',4,23,'forest',58,15);exit('spire-return','Return to Lumenford',47,29,'village',25,21,'boss-cleared')
  spawn('skeleton',[[12,21],[28,12],[25,31],[29,24]]);spawn('guardian',[[20,21],[29,27],[32,13]]);spawn('bat',[[17,25],[31,32]]);spawn('wisp',[[24,19]]);spawn('warden',[[48,20]])
  return finish()
})()
const pass = (()=>{
  const {ellipse,road,prop,feature,exit,spawn,flora,finish}=build('pass','Ashen Pass','Chapter II · A kingdom under shadow',37,31,772,'snow')
  ellipse(14,9,6,5,'abyss');ellipse(27,22,6,7,'abyss');road([[3,17],[12,17],[18,14],[24,13],[29,9],[31,6]],2.25)
  prop('arch',31,7,2);prop('crystal',27,10,2);prop('rock',22,13,1,true);prop('banner',30,10,2)
  feature('horizon','Kingdom Overlook','inspect',31,9);feature('cache-pass','Wayfarer’s Gift','chest',28,13,{item:'sigil'});exit('to-village','Lumenford Village',4,17,'village',49,30)
  spawn('wisp',[[20,11],[25,12]]);flora(71,()=>true);return finish()
})()
export const MAPS: Record<RegionId,MapDef> = { village,road,forest,spire,pass }
export function tileBlocked(map:MapDef,x:number,y:number,gate=false) {
  if(x<1||y<1||x>=map.w-1||y>=map.h-1)return true
  if(map.id==='spire'&&!gate&&(x===37||x===38)&&y>=20&&y<=24)return true
  const i=y*map.w+x, t=map.tiles[i]
  return map.blocked[i]||t==='wall'||t==='water'||t==='abyss'
}
