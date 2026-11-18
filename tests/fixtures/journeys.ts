import { ROLES } from '../../src/data/classes'
import { coord } from '../../src/data/maps'
import { QUEST_LIST } from '../../src/data/quests'
import { Game } from '../../src/game/model'
import { createSave, defaultSettings, gainXp } from '../../src/game/progression'
import type { ClassId, RegionId, Save, Settings } from '../../src/game/types'

export function legacyEnding(id:ClassId,decision?:'hidden'|'warned',region:RegionId='village',difficulty:Settings['difficulty']='Adventure') {
  const s=createSave('Liora',id,2,1,1,1,{...defaultSettings,difficulty})
  gainXp(s,1760)
  for(const q of QUEST_LIST)if(q.category==='Main'&&!q.chapter)s.quests[q.id]={state:'done',progress:q.objectives.map(o=>o.count)}
  s.tracked='q10';s.flags={gate:true,runes:true,'boss-cleared':true,...decision&&{decision}}
  s.hero.equipment.Weapon={id:'spire-weapon',qty:1,plus:1};s.hero.equipment.Chest={id:'brigandine',qty:1,plus:0}
  s.bag.push({id:'shard',qty:1,plus:0},{id:'hp',qty:7,plus:0},{id:'mp',qty:4,plus:0},{id:'essence',qty:2,plus:0})
  s.gold=650
  for(const sk of ROLES[id].skills)if(sk.level<=s.level)s.ranks[sk.id]=1
  const g=new Game(s);g.recruit('tarek');g.recruit('lyra')
  delete s.quests.q11;s.tracked='q10'
  s.region=region;Object.assign(s,region==='village'?coord(51,31):coord(6,17))
  return s
}
export function advanceTo(s:Save,last:number){
  for(const q of QUEST_LIST)if(q.category==='Main'&&Number(q.id.slice(1))<=last)s.quests[q.id]={state:'done',progress:q.objectives.map(o=>o.count)}
  const next=QUEST_LIST.find(q=>q.id===`q${last+1}`)
  if(next){s.quests[next.id]={state:'active',progress:next.objectives.map(()=>0)};s.tracked=next.id}
  if(last>=13)Object.assign(s.flags,{'water-gates':true,'west-wheel':true,'east-wheel':true,'husk-cleared':true})
  if(last>=15)s.flags['hollow-cleared']=true
  return s
}
