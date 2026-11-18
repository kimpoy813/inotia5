import { describe, expect, test } from 'vitest'
import { COMPANIONS, ROLES } from '../src/data/classes'
import { ENEMIES } from '../src/data/enemies'
import { MAPS, TILE, VILLAGE_START, coord } from '../src/data/maps'
import { QUEST_LIST } from '../src/data/quests'
import { beginAtAshenPass } from '../src/game/chapterStart'
import { countItem } from '../src/game/inventory'
import { Game, type Actor } from '../src/game/model'
import { distance, open, pathfind, slide } from '../src/game/navigation'
import { createSave, defaultSettings, statsOf } from '../src/game/progression'
import { inTelegraph, retreatFrom } from '../src/game/patterns'
import { parseSave } from '../src/game/save'
import { CLASSES, type Point, type RegionId } from '../src/game/types'
import { advanceTo, legacyEnding } from './fixtures/journeys'

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
    if(w&&w.end-g.time<205&&w.end>g.time&&a.recovery<=g.time&&(['charge','sweep','ring'].includes(w.pattern)?inTelegraph(w,a):e.foe==='warden'&&w.pattern!=='barrage'&&distance(a,w)<w.r+4)){
      const v=retreatFrom(w,a)
      g.setKeyboard(v.x,v.y);g.dodge();g.setKeyboard(0,0)
    }
    if(!g.auto)g.selectEnemy(e)
    // Give each boss phase time to demonstrate its new pattern, then fight normally.
    if(!patterns||i>145||patterns.size>=3) {strike(g,e,0);if(e.foe!=='omen')strike(g,e,2); if(g.actor.classId==='priest'&&a.character!.hp<g.maxHealth(a)*.55&&(a.skills['priest-2']??0)<=g.time)g.useSkill(1)}
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
    expect(restored.save.quests.q11?.state).toBe('active')
    const xp=restored.save.xp;use(restored,'tarek');expect(restored.dialog?.choices.some(q=>q.label.includes('Report'))).toBe(false);settle(restored);expect(restored.save.xp).toBe(xp)
    use(restored,'to-pass');expect(restored.map.id).toBe('pass');expect(restored.save.level).toBeGreaterThanOrEqual(5)
    expect(restored.save.playtime).toBeGreaterThan(100)
  })
  test('every quest feature can be reached without getting through blocked tiles',()=>{
    const origin:Record<RegionId,Point>={village:VILLAGE_START,road:coord(5,22),forest:coord(5,25),spire:coord(6,23),pass:coord(6,17),capital:coord(6,31),archive:coord(9,34),bellvault:coord(26,33)}
    for(const [id,map] of Object.entries(MAPS))for(const f of map.features){
      const gate=f.id==='spire-return'||id==='archive';const route=pathfind(map,origin[id as RegionId],f,gate)
      expect(open(map,f.x,f.y,gate,5),`${id} cannot stand on ${f.id}`).toBe(true)
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

describe('Chapter Two: The Bell Below',()=>{
  test.each([
    ['legacy','warned','warlock','Read the names in public','names','dawnseal'],
    ['legacy','hidden','warrior','Shelter the names with the families','sheltered','cipherheart'],
    ['legacy','hidden','priest','Read the names in public','names','dawnseal'],
    ['legacy','warned','assassin','Shelter the names with the families','sheltered','cipherheart'],
    ['legacy','hidden','knight','Read the names in public','names','dawnseal'],
    ['legacy','warned','ranger','Shelter the names with the families','sheltered','cipherheart'],
    ['quick-start','hidden','knight','Shelter the names with the families','sheltered','cipherheart'],
  ] as const)('%s, %s: %s completes the new chapter', (entry,branch,cls,ending,fate,reward)=>{
    const quick=entry==='quick-start',save=quick?beginAtAshenPass(createSave('Aster',cls)):legacyEnding(cls,branch)
    let g=new Game(parseSave(JSON.parse(JSON.stringify(save)))!,undefined,()=>.42)
    expect(g.save.tracked).toBe('q11');expect(g.save.gold).toBe(save.gold)
    expect(g.save.quests.q10.state).toBe('done');expect(g.save.quests.q11.progress).toEqual(quick?[1,0]:[0,0])
    expect(g.guidance()?.points[0]).toMatchObject({id:quick?'veyra':'to-pass'})
    if(!quick)use(g,'to-pass')
    expect(g.map.id).toBe('pass');expect(g.save.quests.q11.progress[0]).toBe(1)
    use(g,'pass-shrine');use(g,'echo-ridge');expect(g.save.flags['echo:echo-ridge']).toBe(true);settle(g)
    use(g,'veyra');choice(g,'Show Veyra the Oath Shard')
    if(quick)choice(g,'Keep the shard hidden')
    expect(g.dialog?.lines[0]).toMatch(branch==='warned'?/bronze shields/:/through the canal/);settle(g)
    expect(g.save.quests.q11.state).toBe('done')
    use(g,'veyra');choice(g,'Recruit Veyra');settle(g)
    expect(g.save.active).toEqual(['tarek','lyra']);g.roster('tarek');g.roster('veyra');expect(g.control('veyra')).toBe(true);expect(g.actor.classId).toBe('assassin');expect(g.control('hero')).toBe(true);g.roster('veyra');g.roster('tarek')
    use(g,'to-capital');expect(g.map.id).toBe('capital');use(g,'city-shrine')
    use(g,'mira');choice(g,'Ask about A Letter Without a Name');choice(g,'Accept quest')
    use(g,'echo-door');settle(g);use(g,'census-stone');settle(g)
    use(g,'iona');choice(g,'Ask about the erased names');settle(g)
    use(g,'iona');choice(g,'Ask about The Blank Roster');choice(g,'Accept quest');expect(g.save.quests['side-watch'].progress).toEqual([1,0])
    const entrance=branch==='warned'?'archive-steps':'archive-culvert'
    expect(g.guidance()?.points[0]).toMatchObject({id:entrance})
    expect(g.mapFeatures.some(f=>f.id===(branch==='warned'?'archive-culvert':'archive-steps'))).toBe(false)
    use(g,entrance);expect(g.map.id).toBe('archive')
    expect(g.enemies.filter(e=>e.foe==='bailiff')).toHaveLength(branch==='warned'?2:0)
    for(const e of g.enemies.filter(e=>e.foe==='bailiff'&&e.hp))fight(g,e)
    use(g,'archive-shrine')
    expect(pathfind(g.map,g.activeActor,first(g,'sealing-press'),g.gate)).toHaveLength(0)
    use(g,branch==='warned'?'east-wheel':'west-wheel');expect(g.gate).toBe(false)
    g=new Game(parseSave(JSON.parse(JSON.stringify(g.save)))!,undefined,()=>.42)
    expect(g.save.companions.veyra).toMatchObject({classId:'assassin',mode:'Aggressive'});expect(g.gate).toBe(false)
    use(g,branch==='warned'?'west-wheel':'east-wheel');expect(g.gate).toBe(true)
    expect(pathfind(g.map,g.activeActor,first(g,'sealing-press'),g.gate).length).toBeGreaterThan(0)
    fight(g,g.enemies.find(e=>e.foe==='archiveHusk')!);expect(g.save.quests.q13.state).toBe('ready')
    use(g,'sealing-press');settle(g);expect(g.save.quests.q13.state).toBe('done')
    use(g,'echo-letter');settle(g);use(g,'echo-watch');settle(g)
    expect(g.save.quests['side-letter'].state).toBe('ready');expect(g.save.quests['side-watch'].state).toBe('ready')
    use(g,'seris-archive');choice(g,'Hear what happened at the seal');expect(g.dialog?.speaker).toBe('Seris');g.next();expect(g.dialog?.speaker).toBe('Captain Tarek');settle(g)
    expect(g.save.quests.q14.state).toBe('done')
    use(g,'to-bellvault');expect(g.map.id).toBe('bellvault');use(g,'vault-shrine');expect(g.save.checkpoint.region).toBe('bellvault')
    const boss=g.boss!,phases=new Set<number>(),patterns=new Set<string>();expect(boss.foe).toBe('hollow')
    fight(g,boss,patterns,phases);expect([...phases]).toEqual([1,2,3]);expect([...patterns]).toEqual(expect.arrayContaining(['sweep','ring']))
    expect(g.save.flags['seen:hollow']).toBe(true);expect(g.save.flags['hollow-cleared']).toBe(true)
    // The boss kill and key drop survive a reload before pickup, without a duplicate boss or key.
    g=new Game(parseSave(JSON.parse(JSON.stringify(g.save)))!,undefined,()=>.42);expect(g.boss).toBeUndefined();expect(g.drops.filter(d=>d.stack?.id==='bell-key')).toHaveLength(1)
    loot(g,'bell-key');expect(g.save.quests.q15.state).toBe('ready')
    use(g,'bell-altar');expect(g.save.quests.q15.state).toBe('done');expect(countItem(g.save.bag,'bell-key')).toBe(0);g.next();expect(g.dialog?.speaker).toBe('Lord Malrec');settle(g)
    use(g,'to-archive');expect(g.enemies.some(e=>e.foe==='archiveHusk')).toBe(false);use(g,'archive-lift');expect(g.map.id).toBe('capital')
    use(g,'iona');choice(g,'Report: The Blank Roster');settle(g);expect(countItem(g.save.bag,'oathweave')).toBe(1)
    use(g,'mira');choice(g,'Report: A Letter Without a Name');settle(g);expect(countItem(g.save.bag,'letters-ring')).toBe(1)
    use(g,'iona');choice(g,'Decide what happens to the names');g.dismiss();expect(g.save.quests.q16.state).toBe('active');expect(g.save.flags['bell-fate']).toBeUndefined()
    use(g,'iona');choice(g,'Decide what happens to the names');choice(g,ending);expect(g.chapterSignal).toBe(2);settle(g)
    expect(g.save.quests.q16.state).toBe('done');expect(g.save.flags['bell-fate']).toBe(fate);expect(countItem(g.save.bag,reward)).toBe(1)
    const finalized=parseSave(JSON.parse(JSON.stringify(g.save)))!,reload=new Game(finalized)
    expect(reload.save.flags['bell-fate']).toBe(fate);expect(reload.main).toBeUndefined()
    use(reload,'iona');expect(reload.dialog?.choices.some(c=>/Decide|Report/.test(c.label))).toBe(false);expect(countItem(reload.save.bag,reward)).toBe(1)
  })
  test('direct Chapter II start has a valid level-six kit, checkpoint and active route',()=>{
    const s=beginAtAshenPass(createSave('Aster','knight',0,2,1,3)),restored=parseSave(JSON.parse(JSON.stringify(s)))!,g=new Game(restored)
    expect(restored.slot).toBe(3);expect(restored.level).toBe(6);expect(restored.flags.decision).toBeUndefined()
    expect(restored.skillPoints).toBe(3);expect(ROLES.knight.skills.map(sk=>g.rank(g.activeActor,sk))).toEqual([1,1,1,1,0,0])
    expect(restored.quests.q10.state).toBe('done');expect(g.guidance()?.points[0]).toMatchObject({id:'veyra'})
    expect(restored.checkpoint.region).toBe('pass');expect(g.actor.hp).toBe(g.maxHealth(g.activeActor));expect(g.party.length).toBe(3)
  })
  test('a Bellwing commits to three telegraphed rays and shielded bailiffs take less damage from the front',()=>{
    const s=advanceTo(legacyEnding('ranger','warned'),12);s.region='archive';s.active=[];Object.assign(s,coord(45,34))
    const g=new Game(s,undefined,()=>.42),a=g.activeActor,b=g.enemies.find(e=>e.foe==='bailiff')!,wing=g.enemies.find(e=>e.foe==='bellwing')!
    for(const e of g.enemies)if(e!==b)e.hp=0
    seconds(g,.1);expect(b.warning?.pattern).toBe('sweep');g.selected=b.key;const max=b.hp
    g.useSkill(0);seconds(g,.13)
    const frontDamage=max-b.hp;expect(frontDamage).toBeGreaterThan(0)
    // Attack the same guard from behind while still inside the exact same windup window.
    a.x=b.x;a.y=b.y-17;a.skills={}
    const before=b.hp;g.useSkill(0);seconds(g,.12);expect(before-b.hp).toBeGreaterThan(frontDamage)
    b.hp=0;wing.hp=ENEMIES.bellwing.hp;Object.assign(a,coord(26,35));Object.assign(wing,coord(22,35),{spawn:coord(22,35)})
    seconds(g,.1);expect(wing.warning?.pattern).toBe('fan');const rays=wing.warning!.rays!.map(n=>Math.round(n*1000));expect(rays).toHaveLength(3)
    g.setKeyboard(0,1);seconds(g,.45);g.setKeyboard(0,0);seconds(g,.41)
    expect(g.projectiles.filter(p=>p.owner===wing).map(p=>Math.round(Math.atan2(p.dir.y,p.dir.x)*1000))).toEqual(rays)
  })
  test('a legacy Ashen Pass save whose shard choice was dismissed can finish that choice with Veyra',()=>{
    const g=new Game(parseSave(legacyEnding('ranger',undefined,'pass'))!,undefined,()=>.42)
    expect(g.save.quests.q11.progress).toEqual([1,0])
    use(g,'veyra');choice(g,'Show Veyra the Oath Shard');choice(g,'Warn the kingdom');settle(g)
    expect(g.save.flags.decision).toBe('warned');expect(g.save.quests.q11.state).toBe('done');expect(g.unlocked(first(g,'to-capital'))).toBe(true)
  })
  test('the Hollow Knight’s warning matches damage: safe centre and outer edge, damaging annulus',()=>{
    const make=()=>{const s=advanceTo(legacyEnding('warrior','hidden'),14);s.region='bellvault';s.active=[];Object.assign(s,coord(26,22));return new Game(s,undefined,()=>.42)}
    for(const [offset,safe] of [[17,true],[48,false],[96,true]] as const){
      const g=make(),e=g.boss!;e.phase=2;e.pattern=0
      seconds(g,.1);const w=e.warning;expect(w?.pattern).toBe('ring');expect(w).toBeDefined()
      g.activeActor.x=w!.x;g.activeActor.y=w!.y+offset;const hp=g.actor.hp
      expect(inTelegraph(w!,g.activeActor)).toBe(!safe)
      seconds(g,1.5)
      if(safe)expect(g.actor.hp).toBe(hp);else expect(g.actor.hp).toBeLessThan(hp)
      expect(e.vulnerable).toBeGreaterThan(g.time)
    }
  })
  test('a Siltmaw lunges along its locked lane rather than tracking a sidestep',()=>{
    const s=advanceTo(legacyEnding('ranger','hidden'),12);s.region='archive';s.active=[];Object.assign(s,coord(15,34))
    const g=new Game(s,undefined,()=>.42),e=g.enemies.find(e=>e.foe==='siltmaw')!
    seconds(g,.1);const w=e.warning!;expect(w?.pattern).toBe('charge');expect(inTelegraph(w,g.activeActor)).toBe(true)
    const hp=g.actor.hp;g.setKeyboard(0,1);seconds(g,.32);g.setKeyboard(0,0);expect(inTelegraph(w,g.activeActor)).toBe(false)
    seconds(g,.6);expect(g.actor.hp).toBe(hp);expect(e.x).toBeGreaterThan(w.x+38);expect(e.y).toBeCloseTo(w.y,0)
  })
})
