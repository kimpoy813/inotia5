import { describe, expect, test } from 'vitest'
import { ROLES } from '../src/data/classes'
import { QUEST_LIST } from '../src/data/quests'
import { add, CAPACITY, countItem, craft, enhance, equip, remove, trade, unequip } from '../src/game/inventory'
import { createSave, damage, gainXp, statsOf, xpRequired } from '../src/game/progression'
import { parseSave, readSlot, writeSave } from '../src/game/save'
import { type Stack } from '../src/game/types'

describe('progression and character builds',()=>{
  test('more XP takes higher levels; exact thresholds award one point and three attributes',()=>{
    const s=createSave('Aster','knight'),start=statsOf(s,s.hero)
    expect(xpRequired(1)).toBe(60);expect(xpRequired(3)).toBeGreaterThan(xpRequired(2))
    expect(gainXp(s,59)).toBe(0);expect(gainXp(s,1)).toBe(1)
    expect([s.level,s.xp,s.points,s.skillPoints]).toEqual([2,0,3,1]);expect(s.hero.hp).toBeGreaterThan(start.maxHp)
    expect(damage(0,0,1000,{variance:2,crit:false})).toBe(1)
    expect(damage(29,1.6,7,{variance:1,crit:true})).toBeGreaterThan(damage(29,1.6,7,{variance:1,crit:false}))
  })
  test('classes own unique skill IDs and prerequisites form a forward progression',()=>{
    const ids=new Set<string>()
    for(const r of Object.values(ROLES))for(const s of r.skills){expect(ids.has(s.id)).toBe(false);ids.add(s.id);expect(s.owner).toBe(r.id)
      if(s.needs)expect(r.skills.some(k=>k.id===s.needs&&k.level<s.level)).toBe(true)
    }
    expect(ids.size).toBe(36)
  })
})
describe('inventory and economy',()=>{
  test('stacks never overflow, and a full-bag equipped item swap is atomic',()=>{
    const s=createSave('Aster','knight');gainXp(s,60);s.bag=[]
    expect(add(s.bag,'herb',100)).toBe(true);expect(s.bag.map(x=>x.qty)).toEqual([99,1]);expect(remove(s.bag,'herb',101)).toBe(false)
    expect(add(s.bag,'edge',1)).toBe(true);expect(add(s.bag,'coat',CAPACITY-s.bag.length)).toBe(true)
    expect(add(s.bag,'boots')).toBe(false);const old=statsOf(s,s.hero).physical
    const ix=s.bag.findIndex(i=>i.id==='edge');expect(equip(s,s.hero,ix)).toBeNull();expect(s.bag[ix].id).toBe('iron');expect(statsOf(s,s.hero).physical).toBeGreaterThan(old)
    expect(unequip(s,s.hero,'Weapon')).toBe('Your inventory is full.');expect(s.hero.equipment.Weapon?.id).toBe('edge')
  })
  test('cannot trade or craft away gold or ingredients on a failed transaction',()=>{
    const s=createSave('Eira','ranger');s.gold=100;s.bag=[{id:'herb',qty:3,plus:0},...Array.from({length:35},()=>({id:'ring',qty:1,plus:0}))] as Stack[]
    expect(trade(s,'buy','hp')).toBe('Your inventory is full.');expect(craft(s,'tonic')).toBe('Your inventory is full.')
    expect(countItem(s.bag,'herb')).toBe(3);expect(s.gold).toBe(100)
    expect(trade(s,'sell',1)).toBeNull();expect(craft(s,'tonic')).toBeNull();expect(countItem(s.bag,'herb')).toBe(1);expect(countItem(s.bag,'hp')).toBe(2)
    expect(enhance(s,s.hero,'Weapon')).toBeTruthy();remove(s.bag,'ring');add(s.bag,'ore',1);expect(enhance(s,s.hero,'Weapon')).toBeNull();expect(s.hero.equipment.Weapon?.plus).toBe(1)
  })
})
describe('persistent data',()=>{
  test('validate corrupted, unfamiliar or hostile saves without applying unknown keys',()=>{
    expect(parseSave(null)).toBeNull();expect(parseSave({ version:2,name:'Invalid' })).toBeNull()
    const a=createSave('Eira','priest');const loaded=parseSave({...a,level:999,bag:[{id:'unknown',qty:1},{id:'hp',qty:120}],hero:{...a.hero,hp:-3},quests:{'__proto__':null,q1:{state:'ready',progress:[40,0]}}})!
    expect(loaded.level).toBe(100);expect(loaded.hero.hp).toBe(0);expect(loaded.bag).toEqual([{id:'hp',plus:0,qty:99}]);expect(loaded.quests.q1.state).toBe('active')
    expect(parseSave({version:0,classId:'ranger',name:'Old Route'})?.hero.classId).toBe('ranger')
  })
  test('fallback preserves slot, story decision, loot, inventory, equipment and checkpoint',async()=>{
    const memory=new Map<string,string>();const stub={setItem:(k:string,v:string)=>memory.set(k,v),getItem:(k:string)=>memory.get(k)}
    const prior=Object.getOwnPropertyDescriptor(globalThis,'localStorage');Object.defineProperty(globalThis,'localStorage',{configurable:true,value:stub})
    try{
      const a=createSave('Eira','priest',1,2,1,2)
      a.flags.decision='warned';a.checkpoint.x=77;a.drops.village=[{key:'item',x:78,y:280,stack:{id:'edge',qty:1,plus:0}}];a.hero.equipment.Weapon!.plus=2
      for(const q of QUEST_LIST.slice(0,7))a.quests[q.id]={state:'done',progress:q.objectives.map(o=>o.count)}
      expect(await writeSave(a)).toBe(true);const b=await readSlot(2)
      expect(b?.hero).toEqual(a.hero);expect(b?.quests).toEqual(a.quests);expect(b?.flags).toEqual(a.flags);expect(b?.bag).toEqual(a.bag);expect(b?.drops).toEqual(a.drops);expect(b?.checkpoint).toEqual(a.checkpoint)
    }finally{if(prior)Object.defineProperty(globalThis,'localStorage',prior);else Reflect.deleteProperty(globalThis,'localStorage')}
  })
})
