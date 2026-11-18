import { COMPANIONS } from './classes'
import type { ClassId } from '../game/types'
export type Look = { classId:ClassId; skin:number; dye:number; style:number }
const LOOKS:Record<string,Look>={
  tarek:COMPANIONS.tarek,lyra:COMPANIONS.lyra,seris:{classId:'warlock',dye:2,skin:3,style:1},
  guard:{classId:'warrior',dye:3,skin:0,style:1},mara:{classId:'warrior',dye:0,skin:2,style:1},corin:{classId:'ranger',dye:4,skin:1,style:0},
  ellan:{classId:'ranger',dye:1,skin:2,style:1},bess:{classId:'priest',dye:3,skin:1,style:1},
}
export function npcLook(id:string){return LOOKS[id]}
