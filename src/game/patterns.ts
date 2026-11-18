import type { EnemyId } from '../data/enemies'
import type { Point } from './types'

export type Pattern = 'strike'|'spikes'|'barrage'|'summon'|'pounce'|'bolt'|'charge'|'fan'|'sweep'|'ring'
export type Telegraph = Point & { pattern:Pattern; r:number; angle:number; length?:number; inner?:number; arc?:number; rays?:number[] }
type BossId = 'warden'|'hollow'
type BossRules = { intro:string; cleared:string; prize:string; thresholds:[number,number]; phases:[string,string]; patterns:Pattern[][]; call:EnemyId[] }
export const BOSS_RULES:Record<BossId,BossRules>={
  warden:{intro:'Gloomroot Warden · Keeper of the Oath',cleared:'boss-cleared',prize:'shard',thresholds:[.70,.35],phases:['Wrath of the Roots','A Crown Unbound'],patterns:[['strike','spikes','barrage'],['spikes','strike','barrage','summon'],['barrage','spikes','strike','spikes','summon']],call:['wolf','wisp']},
  hollow:{intro:'Caldus, the Hollow Knight · The Last Watch',cleared:'hollow-cleared',prize:'bell-key',thresholds:[.68,.32],phases:['A Bell With No Hand','The Last Watch'],patterns:[['sweep','charge','fan'],['ring','charge','sweep','summon'],['ring','fan','charge','ring','summon']],call:['bellwing','siltmaw']},
}
export const isBoss=(id:EnemyId|undefined):id is BossId=>id==='warden'||id==='hollow'
export const casts=(p:Pattern)=>p==='bolt'||p==='barrage'||p==='fan'||p==='ring'||p==='spikes'||p==='summon'
export const withinArena=(id:EnemyId|undefined,p:Point)=>id==='warden'?p.x>39*16:id==='hollow'?p.y<30*16:true
export const rayAngles=(angle:number,count:number,spread:number)=>Array.from({length:count},(_,i)=>angle+(i-(count-1)/2)*spread)
export const angularDistance=(a:number,b:number)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)))
export function closestInLane(w:Telegraph,p:Point) {
  const x=Math.cos(w.angle),y=Math.sin(w.angle),along=Math.max(0,Math.min(w.length??0,(p.x-w.x)*x+(p.y-w.y)*y))
  return {x:w.x+x*along,y:w.y+y*along}
}
export function inTelegraph(w:Telegraph,p:Point,padding=0) {
  const distance=Math.hypot(p.x-w.x,p.y-w.y)
  switch(w.pattern){
    case 'ring':return distance>=(w.inner??0)-padding&&distance<=w.r+padding
    case 'sweep':return distance<=w.r+padding&&(distance<3||angularDistance(w.angle,Math.atan2(p.y-w.y,p.x-w.x))<=(w.arc??1)+padding*.015)
    case 'charge':{const q=closestInLane(w,p);return Math.hypot(p.x-q.x,p.y-q.y)<=w.r+padding}
    default:return distance<w.r+padding
  }
}
export function retreatFrom(w:Telegraph,p:Point):Point {
  const center=w.pattern==='charge'?closestInLane(w,p):w
  const dx=p.x-center.x,dy=p.y-center.y,d=Math.hypot(dx,dy)
  if(d<.1)return w.pattern==='charge'?{x:-Math.sin(w.angle),y:Math.cos(w.angle)}:{x:1,y:0}
  const factor=w.pattern==='ring'&&d-w.inner!<w.r-d?-1:1
  return {x:dx/d*factor,y:dy/d*factor}
}
