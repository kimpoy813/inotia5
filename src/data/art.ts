import type { ClassId } from '../game/types'

// Visual archetypes only. Saves still store a dye index, complexion and hair length.
export const CLASS_ART: Record<ClassId,{portrait:string;dye:number;accent:string;hair:string}> = {
  knight:   {portrait:'/art/classes/knight.webp',dye:0,accent:'#ec7778',hair:'#bdc9e2'},
  assassin: {portrait:'/art/classes/assassin.webp',dye:2,accent:'#c391ec',hair:'#37304c'},
  warlock:  {portrait:'/art/classes/warlock.webp',dye:2,accent:'#aa8cf4',hair:'#9271bd'},
  priest:   {portrait:'/art/classes/priest.webp',dye:5,accent:'#f0cf7b',hair:'#c09455'},
  ranger:   {portrait:'/art/classes/ranger.webp',dye:4,accent:'#a7d279',hair:'#a3784c'},
  warrior:  {portrait:'/art/classes/warrior.webp',dye:1,accent:'#8cbeef',hair:'#b45742'},
}
