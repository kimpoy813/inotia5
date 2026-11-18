import { ROLES, SKILLS } from '../data/classes'
import { ITEMS } from '../data/items'
import { MAPS } from '../data/maps'
import { QUESTS } from '../data/quests'
import { CAPACITY, compatible, MAX_STACK } from './inventory'
import { clamp, createSave, defaultSettings, LEVEL_CAP, statsOf, xpRequired } from './progression'
import { ATTRIBUTES, CLASSES, EQUIPMENT_SLOTS, type Character, type ClassId, type CompanionId, type DropRecord, type Gear, type RegionId, type Save, type Settings, type Stack, type Mode } from './types'

const prefix='veilbound-save-'
const record=(v:unknown): Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{}
const own=(o:object,k:string)=>Object.prototype.hasOwnProperty.call(o,k)
const known=(v:unknown,o:object):v is string=>typeof v==='string'&&own(o,v)
const finite=(v:unknown,min:number,max:number,fallback=min)=>typeof v==='number'&&Number.isFinite(v)?clamp(v,min,max):fallback
const int=(v:unknown,min:number,max:number,fallback=min)=>Math.floor(finite(v,min,max,fallback))
const region=(v:unknown):RegionId=>known(v,MAPS)?v as RegionId:'village'
const text=(v:unknown,max:number,fallback='')=>typeof v==='string'&&v.trim()?v.trim().slice(0,max):fallback
const memberIds=['tarek','lyra'] as const
const modes=['Aggressive','Defensive','Support','Manual'] as const
function select<T extends string>(v:unknown,values:readonly T[],fallback:T):T{return values.includes(v as T)?v as T:fallback}
export function settingsFrom(v:unknown):Settings {
  const a=record(v)
  return { master:finite(a.master,0,1,defaultSettings.master),music:finite(a.music,0,1,defaultSettings.music),effects:finite(a.effects,0,1,defaultSettings.effects),
    motion:typeof a.motion==='boolean'?a.motion:defaultSettings.motion,mute:typeof a.mute==='boolean'?a.mute:defaultSettings.mute,
    difficulty:select(a.difficulty,['Story','Adventure','Veteran'],defaultSettings.difficulty),controls:select(a.controls,['Auto','Always','Never'],defaultSettings.controls) }
}
function stackFrom(v:unknown):Stack|null {
  const a=record(v); if(!known(a.id,ITEMS)||!Number.isInteger(a.qty)||Number(a.qty)<=0)return null
  return {id:a.id,qty:int(a.qty,1,ITEMS[a.id].type==='Gear'?1:MAX_STACK),plus:int(a.plus,0,ITEMS[a.id].type==='Gear'?3:0)}
}
function actorFrom(v:unknown,classId:ClassId,equipment:Gear):Character {
  const a=record(v), raw=record(a.equipment),gear:Gear=Object.keys(raw).length||a.equipment?{}:equipment
  for (const k of EQUIPMENT_SLOTS){const stack=stackFrom(raw[k]);if(!stack)continue;const item=ITEMS[stack.id];if(item.slot&&compatible(item.slot,k)&&(!item.classes||item.classes.includes(classId)))gear[k]=stack}
  return {classId,skin:int(a.skin,0,3),dye:int(a.dye,0,5),style:int(a.style,0,1),hp:finite(a.hp,0,5000,140),mp:finite(a.mp,0,5000,70),equipment:gear}
}
export function parseSave(v:unknown):Save|null {
  const pending=record(v)
  // Prototype schema stored appearance and equipment directly on the root.
  const a=pending.version===0?{...pending,version:1,hero:pending.hero??{classId:pending.classId,skin:pending.skin,dye:pending.dye,style:pending.style,equipment:pending.equipment,hp:pending.hp,mp:pending.mp}} as Record<string,unknown>:pending
  const hero=record(a.hero);if(a.version!==1||!CLASSES.includes(hero.classId as ClassId)||typeof a.name!=='string'||!a.name.trim())return null
  const classId=hero.classId as ClassId, s=createSave(text(a.name,20,'Aster'),classId,0,0,0,int(a.slot,1,3,1),settingsFrom(a.settings))
  s.updated=finite(a.updated,0,Number.MAX_SAFE_INTEGER,Date.now());s.level=int(a.level,1,LEVEL_CAP);s.xp=int(a.xp,0,LEVEL_CAP===s.level?0:xpRequired(s.level)-1)
  s.hero=actorFrom(hero,classId,s.hero.equipment);s.points=int(a.points,0,300);s.skillPoints=int(a.skillPoints,0,100);s.gold=int(a.gold,0,10000000,30)
  const attrs=record(a.attrs),ranks=record(a.ranks)
  for(const k of ATTRIBUTES)s.attrs[k]=int(attrs[k],1,400,ROLES[classId].attrs[k]+s.level-1)
  for(const sk of Object.values(SKILLS))if(sk.owner===classId&&own(ranks,sk.id)&&s.level>=sk.level)s.ranks[sk.id]=int(ranks[sk.id],sk.level===1?1:0,sk.rankMax)
  if(Array.isArray(a.bag))s.bag=a.bag.slice(0,CAPACITY).map(stackFrom).filter(x=>x!==null)
  s.region=region(a.region);const map=MAPS[s.region]; s.x=finite(a.x,16,(map.w-1)*16,s.x);s.y=finite(a.y,16,(map.h-1)*16,s.y)
  const ck=record(a.checkpoint),rc=region(ck.region),cm=MAPS[rc]
  s.checkpoint={ region:rc,x:finite(ck.x,16,(cm.w-1)*16,s.checkpoint.x),y:finite(ck.y,16,(cm.h-1)*16,s.checkpoint.y) }
  for(const [id,v] of Object.entries(record(a.quests)))if(own(QUESTS,id)) {
    const q=record(v), p=Array.isArray(q.progress)?q.progress:[], def=QUESTS[id]
    const progress=def.objectives.map((ob,i)=>int(p[i],0,ob.count))
    s.quests[id]={ state: q.state==='done' ? 'done' : progress.every((n,i)=>n>=def.objectives[i].count)?'ready':'active', progress }
  }
  s.tracked=known(a.tracked,s.quests)?a.tracked:Object.keys(s.quests).find(k=>s.quests[k].state!=='done')??'q1'
  s.flags=Object.fromEntries(Object.entries(record(a.flags)).slice(0,250).filter((e):e is [string,boolean|string]=>e[0].length<=70&&(typeof e[1]==='boolean'||(typeof e[1]==='string'&&e[1].length<=100))))
  if(s.quests.q9?.state==='done')s.flags.gate=true
  if(s.quests.q10?.progress[0])s.flags['boss-cleared']=true
  for(const [id,val] of Object.entries(record(a.drops)))if(own(MAPS,id)&&Array.isArray(val)){
    const r=id as RegionId, m=MAPS[r], result:DropRecord[]=[]
    for(const entry of val.slice(-1200)) {const d=record(entry), key=text(d.key,90), stack=stackFrom(d.stack), gold=int(d.gold,0,10000);if(key&&(stack||gold))result.push({key,x:finite(d.x,16,(m.w-1)*16),y:finite(d.y,16,(m.h-1)*16),stack:stack??undefined,gold:gold||undefined})}
    s.drops[r]=result
  }
  const roster=record(a.companions)
  for(const id of memberIds)if(own(roster,id)){
    const c=record(roster[id]), cls:ClassId=id==='tarek'?'warrior':'priest'
    s.companions[id]={...actorFrom(c,cls,{Weapon:{id:ROLES[cls].weapon,qty:1,plus:0}}),id,mode:select<Mode>(c.mode,modes,id==='tarek'?'Defensive':'Support'),level:int(c.level,1,s.level,s.level)}
  }
  s.active=[...new Set((Array.isArray(a.active)?a.active:[]).filter((id):id is CompanionId=>memberIds.includes(id)&&!!s.companions[id as CompanionId]))].slice(0,2)
  s.controlled=s.active.includes(a.controlled as CompanionId)?a.controlled as CompanionId:'hero'
  s.playtime=finite(a.playtime,0,100000000)
  for(const actor of [s.hero,...Object.values(s.companions)])if(actor){const d=statsOf(s,actor);actor.hp=Math.min(d.maxHp,actor.hp);actor.mp=Math.min(d.maxMp,actor.mp)}
  return s
}
let database:Promise<IDBDatabase|null>|undefined
function getDB(){
  if(!database)database=new Promise(resolve=>{
    try {
      const open=indexedDB.open('veilbound-chronicles',1)
      open.onupgradeneeded=()=>{if(!open.result.objectStoreNames.contains('slots'))open.result.createObjectStore('slots')}
      open.onsuccess=()=>{open.result.onversionchange=()=>{open.result.close();database=undefined};resolve(open.result)};open.onerror=open.onblocked=()=>{database=undefined;resolve(null)}
    } catch {resolve(null)}
  })
  return database
}
function mirror(slot:number) {try {return parseSave(JSON.parse(localStorage.getItem(prefix+slot)??'null'))}catch{return null}}
export async function readSlot(slot:number):Promise<Save|null> {
  const local=mirror(slot),db=await getDB();if(!db)return local
  const saved=await new Promise<Save|null>(resolve=>{try{const r=db.transaction('slots').objectStore('slots').get(slot);r.onsuccess=()=>resolve(parseSave(r.result));r.onerror=()=>resolve(null)}catch{resolve(null)}})
  return !saved||(local&&local.updated>=saved.updated)?local:saved
}
export async function readSlots(){return Promise.all([1,2,3].map(readSlot))}
export async function writeSave(s:Save) {
  s.updated=Math.max(s.updated+1,Date.now());const snapshot=structuredClone(s);let mirrored=false
  try{localStorage.setItem(prefix+s.slot,JSON.stringify(snapshot));mirrored=true}catch{/* IndexedDB still available */}
  const db=await getDB();if(!db)return mirrored
  return new Promise<boolean>(resolve=>{try{const tx=db.transaction('slots','readwrite');tx.objectStore('slots').put(snapshot,s.slot);tx.oncomplete=()=>resolve(true);tx.onerror=tx.onabort=()=>resolve(mirrored)}catch{resolve(mirrored)}})
}
export function readSettings(){try{return settingsFrom(JSON.parse(localStorage.getItem('veilbound-settings')??'null'))}catch{return {...defaultSettings}}}
export function storeSettings(s:Settings){try{localStorage.setItem('veilbound-settings',JSON.stringify(s))}catch{/* Settings still work in memory */}}
export function exportSave(s:Save){
  const url=URL.createObjectURL(new Blob([JSON.stringify(s,null,2)],{type:'application/json'})), a=document.createElement('a')
  a.href=url;a.download=`veilbound-slot-${s.slot}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
