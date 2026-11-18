import { COMPANIONS, ROLES } from '../data/classes'
import { ITEMS } from '../data/items'
import { MAPS, VILLAGE_START } from '../data/maps'
import { ATTRIBUTES, type Attributes, type Character, type Companion, type CompanionId, type Settings, type Save, type ClassId } from './types'

export const defaultSettings: Settings = { master:.65, music:.45, effects:.75, mute:true, motion:true, difficulty:'Adventure', controls:'Auto' }
export const clamp = (n:number,min:number,max:number)=>Math.max(min,Math.min(max,n))
export const xpRequired = (level:number)=>Math.floor(60*level**1.45)
export const LEVEL_CAP = 100
export function createSave(name:string,classId:ClassId,skin=0,dye=0,style=0,slot=1,settings:Settings=defaultSettings):Save {
  const role=ROLES[classId]
  const save:Save={ version:1,slot,updated:Date.now(),name:name.trim().slice(0,20)||'Aster',hero:{classId,skin,dye,style,hp:0,mp:0,equipment:{Weapon:{id:role.weapon,qty:1,plus:0},Chest:{id:'coat',qty:1,plus:0}}},
    level:1,xp:0,points:0,skillPoints:0,attrs:{...role.attrs},ranks:Object.fromEntries(role.skills.slice(0,2).map(sk=>[sk.id,1])),
    bag:[{id:'hp',qty:4,plus:0},{id:'mp',qty:3,plus:0}], gold:30,region:'village',...VILLAGE_START,checkpoint:{region:MAPS.village.id,...VILLAGE_START},
    quests:{q1:{state:'active',progress:[0,0]}},tracked:'q1',flags:{},drops:{},companions:{},active:[],controlled:'hero',playtime:0,settings:{...settings} }
  const stats=statsOf(save,save.hero); save.hero.hp=stats.maxHp;save.hero.mp=stats.maxMp
  return save
}
export function statsOf(save:Save,actor:Character) {
  const level=actor===save.hero ? save.level : (actor as Companion).level ?? save.level
  const a:Attributes={ ...(actor===save.hero ? save.attrs : Object.fromEntries(ATTRIBUTES.map(x=>[x,ROLES[actor.classId].attrs[x]+level-1])) as Attributes) }
  let attack=0,armor=0
  for(const eq of Object.values(actor.equipment)) {
    const item=ITEMS[eq.id]; if(!item)continue
    for(const k of ATTRIBUTES)a[k]+=item.bonus?.[k]??0
    attack+=(item.attack??0)+(item.attack? 3*eq.plus:0)
    armor+=(item.armor??0)+(item.armor? 2*eq.plus:0)
  }
  const role=ROLES[actor.classId]
  return { a,maxHp:72+a.VIT*7+level*8, maxMp:32+a.SPI*5+level*3, physical:9+a.STR*1.5+a.DEX*.55+attack+level,
    magical:9+a.INT*1.40+a.SPI*.45+attack+level, defense:2+a.VIT*.65+armor, mdef:2+a.SPI*.70+armor*.44, speed:70+Math.min(a.DEX*.90,32),
    pace:Math.max(.39,role.pace-a.DEX*.006), crit:Math.min(.34,.025+a.DEX*.0045), critPower:1.65, accuracy:Math.min(.995,.91+a.DEX*.004),
    evasion:Math.min(.2,.02+a.DEX*.002), resistance:Math.min(.37,a.SPI*.0034), healing:18+a.SPI*2.5+a.INT*.5 }
}
export function makeCompanion(save:Save,id:CompanionId):Companion {
  const d=COMPANIONS[id],c:Companion={classId:d.classId,skin:d.skin,dye:d.dye,style:d.style,mode:d.mode,level:save.level,hp:0,mp:0,id,equipment:{Weapon:{id:ROLES[d.classId].weapon,qty:1,plus:0},Chest:{id:'coat',qty:1,plus:0}}}
  const stats=statsOf(save,c);c.hp=stats.maxHp;c.mp=stats.maxMp
  return c
}
export function gainXp(s:Save,amount:number) {
  if(s.level>=LEVEL_CAP)return 0
  s.xp+=Math.max(0,Math.floor(amount)); const before=s.level
  while(s.level<LEVEL_CAP&&s.xp>=xpRequired(s.level)) {
    s.xp-=xpRequired(s.level);s.level++;s.points+=3;s.skillPoints++
    for(const a of ATTRIBUTES)s.attrs[a]++
  }
  if(s.level>=LEVEL_CAP)s.xp=0
  if(s.level!==before) {
    const stats=statsOf(s,s.hero);s.hero.hp=stats.maxHp;s.hero.mp=stats.maxMp
    for(const c of Object.values(s.companions)) {
      if(!c)continue;c.level=s.level;const d=statsOf(s,c);if(c.hp>0){c.hp=d.maxHp;c.mp=d.maxMp}
    }
  }
  return s.level-before
}
export function damage(attack:number,power:number,defense:number, opts:{variance:number;crit:boolean;critPower?:number;resistance?:number}) {
  const raw=attack*power-defense*.64
  return Math.max(1,Math.round(raw*clamp(opts.variance,.88,1.12)*(opts.crit?(opts.critPower??1.65):1)*(1-clamp(opts.resistance??0,0,.85))))
}
