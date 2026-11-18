import { ROLES } from '../data/classes'
import { coord } from '../data/maps'
import { QUEST_LIST, restoreChapterEntry } from '../data/quests'
import { gainXp, makeCompanion, statsOf } from './progression'
import type { Save, Stack } from './types'

const stack=(id:string,qty=1,plus=0):Stack=>({id,qty,plus})
/** An explicit new-game start, never a mutation to an existing browser slot. */
export function beginAtAshenPass(save:Save) {
  gainXp(save,1680)
  const role=ROLES[save.hero.classId]
  // Catch up the first two unlocks, leaving spare points for the player’s build.
  for(const skill of role.skills.slice(2,4)){save.ranks[skill.id]=1;save.skillPoints--}
  for(const q of QUEST_LIST)if(q.category==='Main'&&!q.chapter)save.quests[q.id]={state:'done',progress:q.objectives.map(o=>o.count)}
  save.flags={...save.flags,gate:true,runes:true,'boss-cleared':true,'chapter-start':'II'}
  save.tracked='q10';save.region='pass';Object.assign(save,coord(27,13));save.checkpoint={region:'pass',...coord(10,17)}
  save.hero.equipment={Weapon:stack('spire-weapon',1,1),Chest:stack('brigandine'),Boots:stack('boots'),'Off-hand':stack(role.magic?'focus':'buckler')}
  const d=statsOf(save,save.hero);save.hero.hp=d.maxHp;save.hero.mp=d.maxMp
  save.gold=205;save.bag=[stack('shard'),stack('hp',6),stack('mp',5),stack('cleanse',2)]
  for(const key of ['tarek','lyra'] as const)save.companions[key]=makeCompanion(save,key)
  save.active=['tarek','lyra']
  restoreChapterEntry(save)
  return save
}
