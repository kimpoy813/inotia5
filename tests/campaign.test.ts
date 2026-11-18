import { describe, expect, test } from 'vitest'
import { COMPANIONS, ROLES } from '../src/data/classes'
import { ENEMIES } from '../src/data/enemies'
import { MAPS, TILE, VILLAGE_START, coord } from '../src/data/maps'
import { QUEST_LIST } from '../src/data/quests'
import { countItem } from '../src/game/inventory'
import { Game, type Actor } from '../src/game/model'
import { distance, open, pathfind, slide } from '../src/game/navigation'
import { createSave, defaultSettings, statsOf } from '../src/game/progression'
import { parseSave } from '../src/game/save'
import { CLASSES, type Point, type RegionId } from '../src/game/types'

const seconds = (g: Game, s: number, work?: () => void) => {
  for (let i = 0; i < s * 10; i++) { work?.(); g.advance(100) }
}
function settle(g: Game) { while (g.dialog) { if (g.dialog.index === g.dialog.lines.length - 1 && g.dialog.choices.length) g.dismiss(); else g.next() } }
function choice(g: Game, name: string | RegExp) {
  const d = g.dialog
  if (!d) throw new Error(`Expected dialogue for ${name} at ${g.map.id} (${g.activeActor.x}, ${g.activeActor.y})`)
  while (d.index < d.lines.length - 1) g.next()
  const option = d.choices.find(c => typeof name === 'string' ? c.label === name : name.test(c.label))
  expect(option, `Missing ${String(name)} in ${d.speaker}'s choices`).toBeTruthy()
  g.choose(option!)
}
function first(g: Game, id: string) {
  const f = g.mapFeatures.find(f => f.id === id)
  expect(f, `Expected ${id} in ${g.map.id}`).toBeDefined()
  return f!
}
function manage(g:Game) {
  if(g.blocked)return
  const s=statsOf(g.save,g.actor)
  if(g.actor.hp<s.maxHp*.44&&countItem(g.save.bag,'hp'))g.potion('hp')
  if(g.actor.mp<10&&countItem(g.save.bag,'mp'))g.potion('mp')
}
function use(g: Game, id:string) {
  const f=first(g,id)
  const point={x:f.x,y:f.y-(f.kind==='npc'?34:8)}
  g.click(point)
  for(let i=0;i<220&&g.destination&&!g.panel&&!g.dialog;i++) { g.advance(100); manage(g) }
  expect(g.panel, `Survived travelling to ${id} in ${g.map.id}`).toBeNull()
  if(g.auto&&g.target){ fight(g,g.target);return use(g,id) }
  return f
}
function strike(g:Game,e:Actor,index:number) {
  const a=g.activeActor,sk=ROLES[g.actor.classId].skills[index]
  if(g.rank(a,sk)&&!(a.effects.silence||a.effects.stun)&&g.actor.mp>=sk.cost&&(a.skills[sk.id]??0)<=g.time&&distance(a,e)<sk.range+4)g.useSkill(index)
}
function fight(g:Game,e:Actor,patterns?:Set<string>,phases?:Set<number>) {
  g.selectEnemy(e)
  for(let i=0;i<600&&e.hp>0&&!g.panel;i++){
    const a=g.activeActor, w=e.warning
    phases?.add(e.phase);if(w)patterns?.add(w.pattern)
    if(w&&w.end-g.time<220&&w.end>g.time&&distance(a,w)<w.r+4&&a.recovery<=g.time&&e.foe==='warden'&&w.pattern!=='barrage'){
      const dx=a.x-w.x,dy=a.y-w.y
      g.setKeyboard(Math.abs(dx)>2?Math.sign(dx):0,Math.abs(dy)>2?Math.sign(dy):1);g.dodge();g.setKeyboard(0,0)
    }
    if(!g.auto)g.selectEnemy(e)
    // Give each boss phase time to demonstrate its new pattern, then fight normally.
    if(!patterns||i>130||patterns.size>=3) {strike(g,e,0);if(e.foe!=='omen')strike(g,e,2); if(g.actor.classId==='priest'&&a.character!.hp<g.maxHealth(a)*.55&&(a.skills['priest-2']??0)<=g.time)g.useSkill(1)}
    manage(g);g.advance(100)
  }
  expect(e.hp,`Defeated ${e.foe} (${e.key}) in ${g.map.id}; hero ${g.activeActor.x.toFixed(1)},${g.activeActor.y.toFixed(1)}, target ${e.x.toFixed(1)},${e.y.toFixed(1)}, ${g.actor.hp.toFixed(0)} HP, panel ${g.panel}, auto ${g.auto}, route ${JSON.stringify(g.activeActor.path)}, cooldown ${g.time-g.activeActor.basicAt}`).toBe(0)
  expect(g.panel).toBeNull()
}
function loot(g:Game,idOrKey:string) {
  const d=g.drops.find(l=>l.stack?.id===idOrKey||l.key===idOrKey);expect(d).toBeTruthy()
  g.click({x:d!.x,y:d!.y-4});seconds(g,2.2,()=>manage(g))
  if(g.drops.includes(d!)&&g.nearest()?.key===d!.key)g.interact()
  expect(g.drops.find(l=>l.key===d!.key)).toBeUndefined()
}
function report(g:Game,n:number,id:string) {
  use(g,id)
  choice(g, `Report: ${QUEST_LIST[n-1].title}`)
  expect(g.save.quests[`q${n}`]?.state).toBe('done')
  settle(g)
}

describe('Chapter One: The Broken Seal',()=>{
  test.each(CLASSES)('%s plays all ten quests, an optional quest, the boss and its epilogue without editing progress',classId=>{
    const g=new Game(createSave('Eira',classId),undefined,()=>.42)
    expect(g.map.id).toBe('village')
    g.setKeyboard(0,-1);seconds(g,1);g.setKeyboard(0,0)
    const omen=g.enemies.find(e=>e.foe==='omen')!;expect(omen).toBeTruthy()
    fight(g,omen);report(g,1,'tarek')
    use(g,'bess');choice(g,/Ask about/);choice(g,'Accept quest');expect(g.save.quests['side-lamps'].state).toBe('active')
    use(g,'to-road');expect(g.map.id).toBe('road')
    for(const e of g.enemies.filter(e=>e.foe==='slime').slice(0,3))fight(g,e)
    let essences=0
    for(const d of [...g.drops].filter(d=>d.stack?.id==='essence').slice(0,2)){loot(g,d.key);essences++}
    expect(essences).toBe(2)
    use(g,'to-village');expect(g.map.id).toBe('village');report(g,2,'tarek')
    const edge=g.save.bag.findIndex(it=>it.id==='edge');expect(g.equip(edge)).toBe(true);expect(g.save.hero.equipment.Weapon?.id).toBe('edge')
    use(g,'bess');choice(g,'Report: A Light Left Burning');settle(g);expect(g.save.quests['side-lamps'].state).toBe('done')
    use(g,'to-road');for(const id of ['herb-0','herb-1','herb-2','ore-0'])use(g,id)
    use(g,'to-village');report(g,3,'lyra')
    use(g,'mara');choice(g,'Use the forge');expect(g.panel).toBe('forge');expect(g.enhance('Weapon')).toBe(true);g.setPanel(null)
    use(g,'corin');choice(g,'Browse wares');const gold=g.save.gold;expect(g.trade('buy','hp')).toBe(true);expect(g.save.gold).toBeLessThan(gold);g.setPanel(null)
    use(g,'to-road');use(g,'seris');choice(g,'Show Seris the sigil');settle(g);use(g,'veilstone');settle(g);report(g,4,'seris')
    use(g,'road-shrine');use(g,'to-forest');expect(g.map.id).toBe('forest')
    for(const e of g.enemies.filter(e=>e.foe==='wolf').slice(0,3))fight(g,e)
    report(g,5,'guard');use(g,'dispatch');report(g,6,'guard')
    use(g,'forest-shrine');use(g,'to-road');use(g,'to-village');use(g,'tarek');choice(g,'Recruit Captain Tarek');choice(g,/Report:/);settle(g)
    expect(g.save.quests.q7.state).toBe('done');use(g,'lyra');choice(g,'Recruit Lyra');settle(g);expect(g.party.length).toBe(3)
    expect(g.control('lyra')).toBe(true);expect(g.actor.classId).toBe(COMPANIONS.lyra.classId);expect(g.control('hero')).toBe(true)
    use(g,'to-road');use(g,'to-forest');use(g,'ruin');settle(g);expect(g.save.quests.q8.state).toBe('done')
    use(g,'to-spire');expect(g.map.id).toBe('spire');use(g,'spire-shrine')
    for(const e of g.enemies.filter(e=>e.foe==='guardian').slice(0,2))fight(g,e)
    use(g,'tide');expect(g.runeIndex).toBe(0)
    for(const id of ['ember','tide','thorn'])use(g,id)
    expect(g.save.quests.q9.state).toBe('ready');use(g,'oath-door');settle(g);expect(g.gate).toBe(true)
    const boss=g.boss!;expect(boss).toBeTruthy();const patterns=new Set<string>(),phases=new Set<number>()
    fight(g,boss,patterns,phases)
    expect([...phases]).toEqual([1,2,3]);expect([...patterns]).toEqual(expect.arrayContaining(['strike','spikes','barrage']))
    expect(g.save.flags['boss-cleared']).toBe(true);loot(g,'shard')
    const saved=parseSave(JSON.parse(JSON.stringify(g.save)))!, restored=new Game(saved,undefined,()=>.42)
    expect(restored.boss).toBeUndefined();expect(restored.party.length).toBe(3);expect(restored.save.hero.equipment.Weapon?.plus).toBe(1)
    use(restored,'spire-return');expect(restored.map.id).toBe('village');use(restored,'tarek');choice(restored,/Report:/);choice(restored,'Keep the shard hidden');settle(restored)
    expect(restored.save.quests.q10.state).toBe('done');expect(restored.save.flags.decision).toBe('hidden')
    const xp=restored.save.xp;use(restored,'tarek');expect(restored.dialog?.choices.some(q=>q.label.includes('Report'))).toBe(false);settle(restored);expect(restored.save.xp).toBe(xp)
    use(restored,'to-pass');expect(restored.map.id).toBe('pass');expect(restored.save.level).toBeGreaterThanOrEqual(5)
    expect(restored.save.playtime).toBeGreaterThan(100)
  })
  test('every quest feature can be reached without getting through blocked tiles',()=>{
    const origin:Record<RegionId,Point>={village:VILLAGE_START,road:coord(5,22),forest:coord(5,25),spire:coord(6,23),pass:coord(6,17)}
    for(const [id,map] of Object.entries(MAPS))for(const f of map.features){
      const gate=f.id==='spire-return';const route=pathfind(map,origin[id as RegionId],f,gate)
      expect(route.length,`${id} cannot reach ${f.id}`).toBeGreaterThan(0)
      for(const p of route)expect(open(map,p.x,p.y,gate,5)).toBe(true)
    }
    const blocked=coord(37,22), p=coord(36,22)
    slide(MAPS.spire,p,42,0,false);expect(p.x).toBeLessThan(blocked.x)
    const dragon=MAPS.spire.spawns.find(e=>e.id==='warden')!;expect(pathfind(MAPS.spire,origin.spire,dragon,false)).toHaveLength(0)
    expect(pathfind(MAPS.spire,origin.spire,dragon,true)).not.toHaveLength(0)
  })
})

describe('Combat simulation',()=>{
  test.each(CLASSES)('%s executes all six class skills with costs and recovery',id=>{
    for(const [i,skill] of ROLES[id].skills.entries()) {
      const save=createSave('Skill tester',id,0,0,0,1,{...defaultSettings,difficulty:'Story'})
      save.region='spire';save.level=9;save.flags.gate=true;save.ranks=Object.fromEntries(ROLES[id].skills.map(s=>[s.id,2]));Object.assign(save,coord(46,20));save.hero.mp=statsOf(save,save.hero).maxMp
      const g=new Game(save,undefined,()=>.42),a=g.activeActor,e=g.boss!
      Object.assign(e,{x:a.x+(skill.kind==='trap'?15:21),y:a.y});g.selected=e.key;const mana=g.actor.mp,health=e.hp
      g.actor.hp=statsOf(save,g.actor).maxHp-20
      expect(g.useSkill(i),skill.name).toBe(true)
      expect(a.skills[skill.id]).toBeGreaterThan(0)
      expect(g.actor.mp).toBe(skill.focus?Math.min(mana,mana-skill.cost+23):mana-skill.cost)
      expect(g.useSkill(i),`${skill.name} must enforce cooldown`).toBe(false)
      const initial=g.consumeVisuals();expect(initial.some(v=>v.sound===skill.sound),skill.name).toBe(true)
      if(['bolt','burst','strike','drain','dash','trap'].includes(skill.kind)&&skill.power>0){seconds(g,1.5);expect(e.hp,`${skill.name} does damage`).toBeLessThan(health)}
      if(skill.self&&skill.kind==='ward')expect(a.effects[skill.self.id]).toBeDefined()
      if(skill.kind==='heal'||skill.kind==='purge')expect(g.actor.hp).toBeGreaterThan(statsOf(save,g.actor).maxHp-20)
    }
  })
  test('village combat is real; a signalled enemy bolt connects and tab inactivity pauses time',()=>{
    const g=new Game(createSave('Sable','knight'),undefined,()=>.42)
    g.setKeyboard(-1,0);seconds(g,.7);g.setKeyboard(0,0)
    const e=g.enemies.find(e=>e.foe==='omen')!;expect(e).toBeTruthy()
    const hp=g.actor.hp;expect(g.actor.hp).toBe(g.maxHealth(g.activeActor))
    seconds(g,2);expect(g.actor.hp).toBeLessThan(hp)
    g.visibility(true);const time=g.time;seconds(g,5);expect(g.time).toBe(time)
    g.visibility(false);g.setPanel('pause');seconds(g,1);expect(g.time).toBe(time);g.setPanel(null)
    fight(g,e);expect(g.save.xp).toBe(ENEMIES.omen.xp)
  })
  test('a support companion heals and all members down triggers a checkpoint revival',()=>{
    const save=createSave('Eira','warrior');const g=new Game(save,undefined,()=>.42);g.recruit('lyra');g.recruit('tarek')
    const max=g.maxHealth(g.activeActor);g.actor.hp=max*.33;seconds(g,1)
    expect(g.actor.hp).toBeGreaterThan(max*.6)
    const low=createSave('Bren','ranger');low.hero.hp=1;const sim=new Game(low,undefined,()=>.42)
    sim.setKeyboard(-1,0);seconds(sim,.65);sim.setKeyboard(0,0);seconds(sim,5)
    expect(sim.panel).toBe('over');sim.respawn();expect(sim.actor.hp).toBe(sim.maxHealth(sim.activeActor));expect(sim.panel).toBeNull()
  })
  test('wall blocks movement at normal speed and during dodge',()=>{
    const save=createSave('Bren','ranger');save.region='road';Object.assign(save,coord(31,18));const g=new Game(save,undefined,()=>.42)
    g.setKeyboard(0,-1);seconds(g,1);g.dodge();seconds(g,.5);expect(open(MAPS.road,g.activeActor.x,g.activeActor.y,false,5)).toBe(true);expect(Math.floor(g.activeActor.y/TILE)).toBeGreaterThan(16)
  })
  test('divided elapsed time produces equivalent movement',()=>{
    const g=new Game(createSave('Bren','ranger')),b=new Game(createSave('Bren','ranger'))
    g.setKeyboard(1,0);b.setKeyboard(1,0)
    for(let i=0;i<25;i++)g.advance(40)
    for(let i=0;i<50;i++)b.advance(20)
    expect(distance(g.activeActor,b.activeActor)).toBeLessThan(2)
  })
})
