import { ITEMS, RECIPES, SHOP } from '../data/items'
import { statsOf } from './progression'
import type { Character, Save, Slot, Stack } from './types'
export const CAPACITY=36
export const MAX_STACK=99
export const sellingPrice=(item:Stack)=>Math.max(1, Math.floor((ITEMS[item.id].value + item.plus*9)*.43))
export const countItem=(bag:Stack[],id:string)=>bag.reduce((n,s)=>n+(s.id===id?s.qty:0),0)
export function add(bag:Stack[], id:string,qty=1,plus=0) {
  const item=ITEMS[id];if(!item||qty<1||!Number.isInteger(qty))return false
  const max=item.type==='Gear'?1:MAX_STACK
  const capacity=(CAPACITY-bag.length)*max + bag.reduce((n,s)=>n+(s.id===id&&s.plus===plus?max-s.qty:0),0)
  if(capacity<qty)return false
  for(const existing of bag)if(existing.id===id&&existing.plus===plus&&existing.qty<max){const n=Math.min(max-existing.qty,qty);existing.qty+=n;qty-=n}
  while(qty>0){const n=Math.min(max,qty);bag.push({id,qty:n,plus});qty-=n}
  return true
}
export function remove(bag:Stack[],id:string,qty=1) {
  if(qty<1||!Number.isInteger(qty)||countItem(bag,id)<qty)return false
  for(let i=bag.length-1;i>=0&&qty>0;i--)if(bag[i].id===id){const n=Math.min(qty,bag[i].qty);bag[i].qty-=n;qty-=n;if(!bag[i].qty)bag.splice(i,1)}
  return true
}
export const compatible=(itemSlot:Slot,slot:Slot)=>itemSlot===slot||(itemSlot.startsWith('Ring')&&slot.startsWith('Ring'))
function normalizeVitals(s:Save,a:Character) { const d=statsOf(s,a);a.hp=Math.min(d.maxHp,a.hp);a.mp=Math.min(d.maxMp,a.mp) }
export function equip(s:Save,a:Character,index:number,dest?:Slot) {
  const stack=s.bag[index];const item=stack&&ITEMS[stack.id];if(!item?.slot)return 'Select a piece of equipment.'
  if(item.classes&&!item.classes.includes(a.classId))return 'This class cannot wield that item.'
  if((item.level??1)>(a===s.hero?s.level:('level' in a?Number(a.level):s.level)))return `Requires level ${item.level}.`
  const slot=dest??(item.slot==='Ring I'&&a.equipment['Ring I']&&!a.equipment['Ring II']?'Ring II':item.slot)
  if(!compatible(item.slot,slot))return 'That item does not fit this slot.'
  const prior=a.equipment[slot];a.equipment[slot]=stack
  if(prior) s.bag[index]=prior;else s.bag.splice(index,1)
  normalizeVitals(s,a);return null
}
export function unequip(s:Save,a:Character,slot:Slot) {
  const item=a.equipment[slot];if(!item)return 'Nothing is equipped here.'
  if(!add(s.bag,item.id,1,item.plus))return 'Your inventory is full.'
  delete a.equipment[slot];normalizeVitals(s,a);return null
}
export function trade(s:Save,kind:'buy'|'sell',key:number|string) {
  if(kind==='buy') {
    const id=String(key), item=ITEMS[id];if(!item||!SHOP.includes(id))return 'Corin does not stock that item.'
    if(s.gold<item.value)return 'Not enough gold.'
    if(!add(s.bag,id))return 'Your inventory is full.'
    s.gold-=item.value;return null
  }
  const i=Number(key), item=s.bag[i];if(!item||!ITEMS[item.id].value)return 'That item cannot be sold.'
  s.gold+=sellingPrice(item);if(--item.qty===0)s.bag.splice(i,1);return null
}
export const enhancementCost=(plus:number)=>({gold:22+plus*18, ore:1+plus, essence:plus>=2?1:0})
export function enhance(s:Save,a:Character,slot:Slot) {
  const item=a.equipment[slot];if(!item)return 'There is no item in this slot.'
  if(!ITEMS[item.id].attack&&!ITEMS[item.id].armor)return 'This item cannot be tempered.'
  if(item.plus>=3)return 'This equipment is already at +3.'
  const cost=enhancementCost(item.plus)
  if(s.gold<cost.gold||countItem(s.bag,'ore')<cost.ore||countItem(s.bag,'essence')<cost.essence)return 'You need more materials or gold.'
  s.gold-=cost.gold;remove(s.bag,'ore',cost.ore);if(cost.essence)remove(s.bag,'essence',cost.essence);item.plus++
  return null
}
export function craft(s:Save,id:string) {
  const recipe=RECIPES.find(r=>r.id===id);if(!recipe)return 'Unknown recipe.'
  if(s.gold<recipe.gold)return 'Not enough gold.'
  const draft=s.bag.map(i=>({...i}))
  for(const [item,qty] of Object.entries(recipe.needs)) if(!remove(draft,item,qty))return 'Missing crafting materials.'
  if(!add(draft,recipe.result,recipe.count))return 'Your inventory is full.'
  s.gold-=recipe.gold;s.bag=draft;return null
}
