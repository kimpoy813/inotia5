import { COMPANIONS, ROLES } from '../data/classes'
import { BELL_REVELATION, BELL_VISION, ECHO_BY_ID, personaId, personFor, type StoryLine } from '../data/chronicle'
import { ENEMIES, type EnemyDef, type EnemyId } from '../data/enemies'
import { ITEMS } from '../data/items'
import { MAPS, VILLAGE_START, type Feature, type Spawn } from '../data/maps'
import { NPC_TEXT, QUEST_LIST, QUESTS, restoreChapterEntry } from '../data/quests'
import { add, countItem, craft, enhance, equip, remove, trade, unequip } from './inventory'
import { distance, open, pathfind, safePoint, sight, slide, vector } from './navigation'
import { BOSS_RULES, angularDistance, casts, closestInLane, inTelegraph, isBoss, rayAngles, retreatFrom, withinArena, type Telegraph } from './patterns'
import { clamp, damage, gainXp, makeCompanion, statsOf } from './progression'
import type { Attribute, Character, CompanionId, DropRecord, Facing, Mode, Point, Quest, QuestEvent, RegionId, Save, Settings, Skill, Slot, StatusId, StatusSpec } from './types'

export type Panel = 'inventory'|'character'|'skills'|'party'|'journal'|'map'|'shop'|'forge'|'settings'|'pause'|'help'|'over'
export type ActorKey = 'hero'|CompanionId
export type Focus = { label: string; action: string; x: number; y: number; key: string; feature?: Feature; drop?: DropRecord }
export type Choice = { label: string; run: () => void }
export type Conversation = { speaker: string; portrait: string; origin: string; caption: string; lines: StoryLine[]; index: number; choices: Choice[]; art?: string }
type Effect = { end:number; strength:number; tick:number; source?:Actor }
export type Warning = Telegraph & { start:number; end:number; target:Actor }
export type State = 'idle'|'patrol'|'chase'|'windup'|'recovery'|'return'|'dead'|'stunned'
export type Actor = Point & {
  key:string; character?:Character; foe?:EnemyId; spawn:Point; hp:number; facing:Facing; aim:Point; moving:boolean; state:State;
  path:Point[]; replan:number; basicAt:number; inv:number; nextPotion:number; skills:Record<string,number>; effects:Partial<Record<StatusId,Effect>>;
  animation?:{ id:'slash'|'cast'|'dash'|'hurt'; until:number }; roll?:{ until:number; dir:Point; speed:number }; warning?:Warning; phase:number;
  pattern:number; recovery:number; hurt:number; deadAt:number; threat?:Actor; wandered:number; summoned?:boolean; vulnerable:number; nextStep:number;
}
export type Projectile = Point & { key:number; owner:Actor; skill?:Skill; dir:Point; time:number; speed:number; power:number; hits:Set<string>; color:string; rank:number; ailment?:StatusSpec }
export type Trap = Point & { key:number; owner:Actor; skill:Skill; rank:number; expiry:number; ready:number }
export type Visual = Point & { kind:'slash'|'burst'|'cast'|'hit'|'heal'|'text'|'death'|'loot'|'level'|'step'|'impact'; color:string; size?:number; angle?:number; text?:string; sound?:string; heavy?:boolean; variation?:number }
export type Toast = { id:number; text:string; kind:'info'|'good'|'bad'; until:number }
const NAMES:Record<string,string>={tarek:'Captain Tarek',lyra:'Lyra',seris:'Seris',guard:'Wounded Sentinel',corin:'Corin',mara:'Mara',ellan:'Ellan',bess:'Bess',ruin:'The Oath Gate','oath-door':'The Spire','inscription':'Weathered Inscription',veilstone:'Fractured Waystone',mira:'Mira',gatekeeper:'Crown Gatekeeper',ren:'Provisioner Ren','forge-city':'Smith Kera','census-stone':'The Census of the Living','sealing-press':'The Sealing Press','bell-altar':'The Altar of the Last Bell'}
const CAPTIONS:Record<string,string>={tarek:'The Fallen Commander',lyra:'The Wandering Healer',seris:'The Lost Guardian',mara:'Lumenford Blacksmith',corin:'Lumenford Merchant',guard:'The Lost Patrol',bess:'Keeper of the Lanterns',ellan:'Lumenford Villager'}
const RUNES=['ember','tide','thorn']
const HARMFUL:StatusId[]=['poison','burn','bleed','stun','slow','silence','sunder','root']
const STATUS_NAMES:Partial<Record<StatusId,string>>={stun:'Stunned',root:'Rooted',silence:'Silenced',sunder:'Sundered',shield:'Guarded',veil:'Veiled',might:'Inspired',regen:'Renewal',poison:'Poisoned',burn:'Burning',bleed:'Bleeding',slow:'Slowed'}
const FIXED=1000/60
export class Game {
  time=0
  panel:Panel|null=null
  dialog:Conversation|null=null
  enemies:Actor[]=[]
  party:Actor[]=[]
  projectiles:Projectile[]=[]
  traps:Trap[]=[]
  toasts:Toast[]=[]
  visuals:Visual[]=[]
  selected:string|null=null
  auto=false
  route:Point[]=[]
  destination:Point|null=null
  pendingFocus:Focus|null=null
  harvested=new Set<string>()
  epoch=0
  hidden=false
  bossSeen=false
  runeIndex=0
  chapterSignal:1|2|false=false
  enteredAt=0
  onPersist:(s:Save)=>Promise<boolean>
  private callbacks=new Set<()=>void>()
  private revision=0
  private nextUpdate=0
  private nextSave=0
  private seed=0
  private accumulator=0
  private positionDirty=0
  private pendingHits:{time:number;run:()=>void}[]=[]
  private stick={x:0,y:0}
  private keyboard={x:0,y:0}
  constructor(public save:Save,onSave:(s:Save)=>Promise<boolean>=async()=>true, private random:()=>number=Math.random) {
    this.onPersist=onSave
    restoreChapterEntry(save)
    this.loadMap(save.region,{x:save.x,y:save.y},true)
    if(!this.activeActor.character!.hp) {
      const living=this.party.find(a=>this.health(a)>0);if(living)this.save.controlled=living.key as ActorKey;else this.panel='over'
    }
  }
  subscribe=(listener:()=>void)=>{this.callbacks.add(listener);return()=>{this.callbacks.delete(listener)}}
  snapshot=()=>this.revision
  refresh(){this.revision++;for(const cb of this.callbacks)cb()}
  get map(){return MAPS[this.save.region]}
  get gate(){return this.map.id==='archive'?this.save.flags['water-gates']===true:this.save.flags.gate===true}
  get entry(){return this.save.flags.decision==='warned'?'warned':'hidden'}
  get activeActor(){return this.party.find(a=>a.key===this.save.controlled)??this.party[0]}
  get actor(){return this.activeActor.character!}
  get target(){return this.enemies.find(a=>a.key===this.selected&&this.health(a)>0)}
  get drops(){return this.save.drops[this.save.region]??=[]}
  get boss(){return this.enemies.find(a=>isBoss(a.foe)&&this.health(a)>0)}
  get main(){return QUEST_LIST.find(q=>q.category==='Main'&&this.save.quests[q.id]?.state!=='done'&&this.save.quests[q.id])}
  get tracked(){const q=QUESTS[this.save.tracked];return q&&this.save.quests[q.id]?.state!=='done'?q:this.main}
  get blocked(){return this.hidden||!!this.panel||!!this.dialog}
  health=(a:Actor)=>a.character?a.character.hp:a.hp
  maxHealth=(a:Actor)=>a.character?statsOf(this.save,a.character).maxHp:ENEMIES[a.foe!].hp
  status(a:Actor){return Object.keys(a.effects).filter(k=>a.effects[k as StatusId]!.end>this.time).map(k=>STATUS_NAMES[k as StatusId]??k)}
  private makeActor(key:string,point:Point,character?:Character,foe?:EnemyId):Actor {
    return {key,...point,character,foe,spawn:{...point},hp:foe?ENEMIES[foe].hp:0, facing:'south',aim:{x:0,y:1},moving:false,state:character&&character.hp<=0?'dead':'idle',
      path:[],replan:0,basicAt:0,inv:0,nextPotion:0,skills:{},effects:{},phase:1,pattern:0,recovery:0,hurt:0,deadAt:0,vulnerable:0,wandered:0,nextStep:0}
  }
  private syncParty(reset=false,point:Point=this.activeActor){
    const old=this.party
    this.party=(['hero',...this.save.active] as ActorKey[]).flatMap((key,i)=>{
      const data=key==='hero'?this.save.hero:this.save.companions[key];if(!data)return []
      const oldActor=!reset&&old.find(a=>a.key===key);if(oldActor)return [oldActor]
      const p=key===this.save.controlled?point:safePoint(this.map,{x:point.x-15*i,y:point.y+14*i},this.gate)
      return [this.makeActor(key,p,data)]
    })
  }
  private loadMap(region:RegionId,point:Point,initial=false) {
    const prior=this.save.region
    this.save.region=region
    const p=safePoint(this.map,point,this.gate);this.save.x=p.x;this.save.y=p.y
    this.harvested.clear();this.enemies=[];this.projectiles=[];this.traps=[];this.visuals=[];this.pendingHits=[];this.runeIndex=0;this.bossSeen=false;this.clearOrder();this.selected=null
    this.syncParty(true,p)
    for(const spawn of this.map.spawns) {
      const id=spawn.id
      if(id==='omen'||(spawn.entry&&spawn.entry!==this.entry))continue
      if(isBoss(id)&&this.save.flags[BOSS_RULES[id].cleared]) {
        const item=BOSS_RULES[id].prize, q=id==='warden'?this.save.quests.q10:this.save.quests.q15, i=id==='warden'?1:2
        if(q?.state!=='done'&&!q?.progress[i]&&!this.drops.some(d=>d.stack?.id===item)&&!countItem(this.save.bag,item))this.loot(item,1,spawn)
      }else if(id!=='archiveHusk'||!this.save.flags['husk-cleared'])this.spawn(spawn)
    }
    this.epoch++;this.enteredAt=this.time;this.mark('visit',region,1)
    if(!initial&&region!==prior)void this.persist()
  }
  private spawn(s:Spawn,summoned=false){const e=this.makeActor(s.key,safePoint(this.map,s,this.gate),undefined,s.id);e.summoned=summoned;this.enemies.push(e);return e}
  private render(v:Visual){this.visuals.push(v);if(this.visuals.length>200)this.visuals.shift()}
  consumeVisuals(){return this.visuals.splice(0)}
  toast(text:string,kind:Toast['kind']='info') {this.toasts=[...this.toasts.slice(-3),{text,kind,id:++this.seed,until:this.time+3900}];this.refresh()}
  async persist(manual=false){this.save.x=this.activeActor?.x??this.save.x;this.save.y=this.activeActor?.y??this.save.y;const ok=await this.onPersist(this.save);if(manual)this.toast(ok?'Journey saved':'Unable to write this save',ok?'good':'bad');return ok}
  visibility(hidden:boolean){this.hidden=hidden;this.resetInput();if(hidden)void this.persist()}
  resetInput(){this.keyboard={x:0,y:0};this.stick={x:0,y:0}}
  setKeyboard(x:number,y:number){this.keyboard={x,y}}
  setStick(x:number,y:number){this.stick={x,y}}
  setPanel(panel:Panel|null){this.panel=panel;this.resetInput();this.refresh()}
  toggle(panel:Panel){if(this.panel==='over')return;if(this.dialog){this.dismiss();return}this.setPanel(this.panel===panel?null:panel)}
  escape(){if(this.dialog){this.dismiss();return}if(this.panel==='over')return;this.setPanel(this.panel?null:'pause')}
  settings(change:Settings){this.save.settings={...change};this.refresh();void this.persist()}
  private clearOrder(){this.auto=false;this.route=[];this.destination=null;this.pendingFocus=null}
  private face(a:Actor,v:Point){if(!v.x&&!v.y)return;a.aim=v;a.facing=Math.abs(v.x)>Math.abs(v.y)?v.x<0?'west':'east':v.y>0?'south':'north'}
  private stepActor(a:Actor,v:Point,speed:number,dt:number,face=true){
    if (!v.x&&!v.y || a.effects.root || a.effects.stun) {a.moving=false;return}
    if(face)this.face(a,v)
    const ox=a.x,oy=a.y, slow=1-(a.effects.slow?.strength??0)
    slide(this.map,a,v.x*speed*dt*slow,v.y*speed*dt*slow,this.gate,isBoss(a.foe)?7:5)
    a.moving=Math.hypot(a.x-ox,a.y-oy)>.08
  }
  private followPath(a:Actor,route:Point[],speed:number,dt:number){
    while(route.length&&distance(a,route[0])<3)route.shift()
    const next=route[0];if(!next){a.moving=false;return}
    const v=vector(next.x-a.x,next.y-a.y);this.stepActor(a,v,speed,dt)
  }
  private approach(a:Actor,p:Point,speed:number,dt:number) {
    if(sight(this.map,a,p,this.gate,5)){a.path=[];this.stepActor(a,vector(p.x-a.x,p.y-a.y),speed,dt);return}
    if(this.time>=a.replan){a.path=pathfind(this.map,a,p,this.gate,640);a.replan=this.time+400+this.random()*280}
    this.followPath(a,a.path,speed,dt)
  }
  private ranges(a:Actor,b:Point,range:number){return distance(a,b)<=range&&sight(this.map,a,b,this.gate,1.25)}
  rank(a:Actor,s:Skill){return a.key==='hero'?this.save.ranks[s.id]??0:(a.character&&'level' in a.character&&Number(a.character.level)>=s.level?1:0)}
  targetNext() {
    if(this.blocked)return
    const a=this.activeActor,list=this.enemies.filter(e=>this.health(e)>0&&distance(a,e)<175&&sight(this.map,a,e,this.gate)).sort((b,c)=>distance(a,b)-distance(a,c))
    this.clearOrder();this.selected=list.length?list[(list.findIndex(e=>e.key===this.selected)+1)%list.length].key:null
    if(!list.length)this.toast('No enemies in sight');else this.refresh()
  }
  private aimTarget(a:Actor,range:number,preferred?:Actor) {
    if(preferred&&this.health(preferred)>0&&this.ranges(a,preferred,range))return preferred
    if(a===this.activeActor&&this.target)return this.ranges(a,this.target,range)?this.target:undefined
    return this.enemies.filter(e=>this.health(e)>0&&this.ranges(a,e,range)).sort((p,q)=>distance(a,p)-distance(a,q))[0]
  }
  basicOrder(){
    if(this.blocked)return
    const a=this.activeActor
    let t=this.target
    if(!t)t=this.enemies.filter(e=>this.health(e)>0&&distance(a,e)<190&&sight(this.map,a,e,this.gate)).sort((b,c)=>distance(a,b)-distance(a,c))[0]
    if(!t){this.toast('No enemies in sight');return}
    this.selectEnemy(t)
  }
  selectEnemy(t:Actor){if(this.blocked||this.health(t)<=0)return;this.clearOrder();this.auto=true;this.selected=t.key;this.refresh()}
  click(p:Point){
    if(this.blocked)return
    const e=this.enemies.filter(a=>this.health(a)>0&&Math.abs(a.x-p.x)<(isBoss(a.foe)?25:a.foe==='archiveHusk'?19:12)&&p.y>=a.y-(isBoss(a.foe)?69:a.foe==='archiveHusk'?50:34)&&p.y<=a.y+8).sort((a,b)=>b.y-a.y)[0]
    if(e){this.selectEnemy(e);return}
    const f=this.focuses().filter(f=>Math.abs(f.x-p.x)<(f.feature?.kind==='npc'?16:15)&&p.y>=f.y-(f.feature?.kind==='npc'?50:27)&&p.y<=f.y+8).sort((a,b)=>distance(a,p)-distance(b,p))[0]
    this.clearOrder()
    const a=this.activeActor
    if(f&&this.ranges(a,f,31)){this.useFocus(f);return}
    this.destination=f??safePoint(this.map,p,this.gate);this.route=pathfind(this.map,a,this.destination,this.gate);this.pendingFocus=f??null
    if(!this.route.length){this.destination=null;this.pendingFocus=null;if(f)this.toast('No open path that way')}
  }
  private knows(a:Actor,s:Skill){return a.character?.classId===s.owner&&this.rank(a,s)>0}
  useSkill(index:number) {
    if(this.blocked)return false
    const a=this.activeActor,skill=ROLES[this.actor.classId].skills[index]
    if(!skill)return false
    if(!this.knows(a,skill)){this.toast(`Learn ${skill.name} in the skillbook at level ${skill.level}`);return false}
    const error=this.cast(a,skill,this.target)
    if(error){this.toast(error,'bad');return false}
    this.refresh();return true
  }
  private cast(a:Actor,s:Skill,preferred?:Actor) {
    const c=a.character!,rank=this.rank(a,s)
    if(!c||this.health(a)<=0||!this.knows(a,s))return 'Skill not learned'
    if(a.effects.stun||a.effects.silence)return 'You cannot cast right now'
    if(a.roll)return 'Finish your dodge first'
    if((a.skills[s.id]??0)>this.time)return 'Skill is recovering'
    if(c.mp<s.cost)return 'Not enough mana'
    if(s.kind==='dash'&&a.effects.root)return 'You are rooted in place'
    const targetRequired=['strike','bolt','drain'].includes(s.kind)||(s.kind==='burst'&&s.range>0)||(s.kind==='dash'&&s.power>0)
    const enemy=targetRequired?this.aimTarget(a,s.range,preferred):undefined
    if(targetRequired&&!enemy)return 'No target within range or line of sight'
    const allies=this.party.filter(p=>this.health(p)>0&&this.ranges(a,p,s.radius||s.range||1))
    const best=[...allies].sort((p,q)=>this.health(p)/this.maxHealth(p)-this.health(q)/this.maxHealth(q))[0]??a
    c.mp-=s.cost;a.skills[s.id]=this.time+s.cd*1000
    a.animation={id:s.anim,until:this.time+340};a.basicAt=Math.max(a.basicAt,this.time+270)
    if(enemy){this.face(a,vector(enemy.x-a.x,enemy.y-a.y));if(a===this.activeActor)this.selected=enemy.key}
    if(targetRequired||s.kind==='burst'||s.kind==='trap')delete a.effects.veil
    const color=s.color, variation=Number(s.id.at(-1))||1, point=enemy??a
    switch(s.kind) {
      case 'bolt':this.fire(a,point,s.power,color,s,rank);this.render({x:a.x,y:a.y,kind:'cast',color,angle:Math.atan2(a.aim.y,a.aim.x),sound:s.sound,variation});break
      case 'strike':{
        const list=s.radius?this.enemies.filter(b=>this.health(b)>0&&this.ranges(a,b,s.radius)&&(!s.cone||((b.x-a.x)*a.aim.x+(b.y-a.y)*a.aim.y)>=-7)):[enemy!]
        this.render({x:a.x,y:a.y,kind:'slash',color,angle:Math.atan2(a.aim.y,a.aim.x),size:s.radius||s.range,sound:s.sound,variation})
        for(const b of list)this.skillHit(a,b,s,rank,s.range+9)
        break
      }
      case 'burst':this.burst(a,point,s,rank);break
      case 'drain':{
        const n=this.strike(a,enemy!,s.power*(1+(rank-1)*.24),!!s.magic)
        if(s.focus)c.mp=Math.min(statsOf(this.save,c).maxMp,c.mp+18+(rank-1)*5);else this.heal(a,Math.round(n*1.1))
        this.render({x:point.x,y:point.y,kind:'burst',color,size:23,sound:s.sound,variation});break
      }
      case 'dash':{
        a.inv=this.time+380
        if(a===this.activeActor)this.clearOrder()
        this.render({x:a.x,y:a.y,kind:'slash',color,angle:Math.atan2(a.aim.y,a.aim.x),size:33,sound:s.sound})
        const d=enemy?Math.max(0,distance(a,enemy)-12):s.range
        if(d>4){a.roll={dir:{...a.aim},speed:d/.21,until:this.time+214}}
        if(enemy)this.pendingHits.push({time:this.time+207,run:()=>{if(this.health(a)>0&&this.health(enemy)>0&&this.ranges(a,enemy,29))this.skillHit(a,enemy,s,rank,33)}})
        if(s.self)this.apply(a,s.self,a,rank)
        break
      }
      case 'trap':this.traps.push({key:++this.seed,x:a.x,y:a.y,owner:a,skill:s,rank,ready:this.time+300,expiry:this.time+18000});this.render({x:a.x,y:a.y,kind:'cast',color,sound:s.sound,variation,size:18});break
      case 'ward':case 'heal':case 'purge':{
        const recipients=s.radius?allies:s.kind==='heal'?[best]:[a]
        for(const b of recipients){
          if(s.kind==='purge')for(const id of HARMFUL)delete b.effects[id]
          if(s.kind!=='ward')this.heal(b,Math.round(statsOf(this.save,c).healing*s.power*(1+(rank-1)*.24)))
          if(s.self)this.apply(b,s.self,a,rank)
        }
        this.render({x:a.x,y:a.y,kind:'burst',color,size:s.radius?Math.min(54,s.radius):24,sound:s.sound,variation});break
      }
    }
    return null
  }
  private burst(a:Actor,point:Point,s:Skill,rank:number) {
    this.render({x:point.x,y:point.y,kind:'burst',color:s.color,size:s.radius,sound:s.sound,heavy:s.power>=2.5,variation:Number(s.id.at(-1))})
    for(const b of this.enemies)if(this.health(b)>0&&this.ranges(b,point,s.radius)&&sight(this.map,a,b,this.gate))this.skillHit(a,b,s,rank,s.range+s.radius+12)
  }
  private skillHit(a:Actor,b:Actor,s:Skill,rank:number,limit:number) {
    const multiplier=1+(rank-1)*.24
    const applyHit=(i:number)=>{
      if(this.health(a)<=0||this.health(b)<=0||(i>0&&!this.ranges(a,b,limit)))return
      const flank=s.flank&&((a.x-b.x)*b.aim.x+(a.y-b.y)*b.aim.y)<-5
      this.strike(a,b,s.power*multiplier*(flank?1.75:1),!!s.magic)
      if(!i&&this.health(b)>0) {
        if(s.status)this.apply(b,s.status,a,rank)
        if((s.knock||s.pull)&&!isBoss(b.foe)){const v=vector(b.x-a.x,b.y-a.y),push=s.pull?-Math.min(32,Math.max(0,distance(a,b)-12)):s.knock!; slide(this.map,b,v.x*push,v.y*push,this.gate)}
      }
    }
    applyHit(0);for(let i=1;i<(s.hits??1);i++)this.pendingHits.push({time:this.time+i*114,run:()=>applyHit(i)})
  }
  private basic(a:Actor,b:Actor){
    if(this.time<a.basicAt||a.effects.stun||a.roll||this.health(a)<=0)return
    const c=a.character!,r=ROLES[c.classId],s=statsOf(this.save,c);a.basicAt=this.time+1000*s.pace;a.animation={id:r.range>40?'cast':'slash',until:this.time+235};a.moving=false
    this.face(a,vector(b.x-a.x,b.y-a.y));delete a.effects.veil
    if(r.range>40){this.fire(a,b,1,r.color);this.render({x:a.x,y:a.y,kind:'cast',color:r.color,size:13,sound:r.magic?'spell':'arrow'})}
    else {this.render({x:a.x,y:a.y,kind:'slash',color:'#ecdcaa',size:r.range+3,angle:Math.atan2(a.aim.y,a.aim.x),sound:'slash'});this.strike(a,b,1,false,true)}
  }
  private fire(a:Actor,b:Point,power:number,color:string,s?:Skill,rank=1,angle?:number,ailment?:StatusSpec,extent?:number) {
    const dir=angle===undefined?vector(b.x-a.x,b.y-a.y):{x:Math.cos(angle),y:Math.sin(angle)}
    const speed=a.foe?(isBoss(a.foe)?91:105):s?.id==='warlock-4'?144:240
    this.projectiles.push({key:++this.seed,owner:a,x:a.x+dir.x*7,y:a.y+dir.y*7,dir,time:this.time+((extent??s?.range??(isBoss(a.foe)?255:a.character?ROLES[a.character.classId].range+18:145)) /speed)*1000,speed,power,color,skill:s,rank,hits:new Set(),ailment})
  }
  private updateProjectiles(dt:number) {
    this.projectiles=this.projectiles.filter(p=>{
      const a=p.owner,next={x:p.x+p.dir.x*p.speed*dt,y:p.y+p.dir.y*p.speed*dt}
      if(this.time>=p.time||a.foe&&!this.health(a)||!sight(this.map,p,next,this.gate))return false
      p.x=next.x;p.y=next.y
      const targets=a.foe?this.party:this.enemies
      for(const b of targets) if(this.health(b)>0&&!p.hits.has(b.key)&&distance(p,b)<(isBoss(b.foe)?17:10)) {
        p.hits.add(b.key)
        if(a.foe){if(this.injury(b,ENEMIES[a.foe].attack*p.power,true)&&p.ailment)this.apply(b,p.ailment,a);return false}
        if(p.skill){if(p.skill.radius)this.burst(a,b,p.skill,p.rank);else this.skillHit(a,b,p.skill,p.rank,p.skill.range+25)}
        else this.strike(a,b,p.power,ROLES[a.character!.classId].magic,true)
        if(!p.skill?.pierce||p.skill.id==='priest-1'&&p.hits.size>=2)return false
      }
      return true
    })
    this.traps=this.traps.filter(t=>{
      if(this.time>=t.expiry)return false
      if(this.time>=t.ready&&this.enemies.some(e=>this.health(e)>0&&this.ranges(e,t,18))){this.burst(t.owner,t,t.skill,t.rank);return false}
      return true
    })
  }
  private apply(a:Actor,s:StatusSpec,source?:Actor,rank=1){
    const p=a.effects[s.id],cc=['stun','root','silence'].includes(s.id), factor=isBoss(a.foe)&&cc ? .4 : 1
    let strength=s.strength??1;if(['poison','burn','bleed','shield','regen'].includes(s.id))strength*=1+(rank-1)*.24
    a.effects[s.id]={end:Math.max(p?.end??0,this.time+s.time*1000*factor),strength:Math.max(p?.strength??0,strength),tick:p?.tick??this.time+1000,source}
    if(s.id==='stun'&&!isBoss(a.foe)){a.warning=undefined;a.recovery=this.time+300}
  }
  private tickEffects(a:Actor) {
    for(const [key,ef] of Object.entries(a.effects) as [StatusId,Effect][]){
      if(this.time>=ef.end||(key==='shield'&&ef.strength<=0)){delete a.effects[key];continue}
      if(this.time<ef.tick)continue
      ef.tick+=1000
      if(key==='regen')this.heal(a,Math.round(ef.strength))
      else if(['bleed','burn','poison'].includes(key))this.deal(a,Math.round(ef.strength),key==='bleed'?'#f193a0':key==='burn'?'#ec9e65':'#a9d78b',false,ef.source,true)
    }
  }
  private strike(a:Actor,b:Actor,power:number,magic:boolean,basic=false) {
    if(!a.character||this.health(b)<=0)return 0
    const d=statsOf(this.save,a.character),e:EnemyDef=ENEMIES[b.foe!];const crit=this.random()<d.crit
    if(basic&&this.random()>d.accuracy){this.render({x:b.x,y:b.y,kind:'text',color:'#c6c5b8',text:'MISS'});return 0}
    const attack=(magic?d.magical:d.physical)*(1+(a.effects.might?.strength??0))*(b.vulnerable>this.time?1.32:1)
    const defense=(magic?e.resist:e.armor)*(1-(b.effects.sunder?.strength??0))
    const braced=b.foe==='bailiff'&&b.warning?.pattern==='sweep'&&angularDistance(b.warning.angle,Math.atan2(a.y-b.y,a.x-b.x))<1.17
    if(braced)this.render({x:b.x,y:b.y,kind:'text',color:'#f2bf83',text:'GUARD'})
    return this.deal(b,damage(attack,power*(braced?(magic ? .65 : .36):1),defense,{variance:.92+this.random()*.16,crit,critPower:d.critPower,resistance:magic?e.resist*.004:0}),crit?'#ffe098':'#fff2d7',crit,a)
  }
  private injury(a:Actor,attack:number,magic=false) {
    if(!a.character||a.inv>this.time||this.health(a)<=0)return 0
    const stats=statsOf(this.save,a.character), defense=(magic?stats.mdef:stats.defense)*(1-(a.effects.sunder?.strength??0))
    const power={Story:.62,Adventure:1,Veteran:1.35}[this.save.settings.difficulty]
    if(this.random()<stats.evasion){this.render({x:a.x,y:a.y,kind:'text',color:'#e6e0ba',text:'EVADE'});return 0}
    return this.deal(a,damage(attack*power,1,defense,{variance:.94+this.random()*.12,crit:false,resistance:magic?stats.resistance:0}),'#ed929c')
  }
  private deal(a:Actor,n:number,color:string,crit=false,source?:Actor,dot=false){
    if(n<=0||this.health(a)<=0||a.inv>this.time)return 0
    const guard=a.effects.shield
    if(guard){const taken=Math.min(n,guard.strength);guard.strength-=taken;n-=taken;if(guard.strength<=0)delete a.effects.shield}
    n=Math.round(n)
    if(!n){this.render({x:a.x,y:a.y,kind:'text',color:'#a4dace',text:'BLOCK'});return 0}
    if(a.character)a.character.hp=Math.max(0,a.character.hp-n);else a.hp=Math.max(0,a.hp-n)
    if(source&&a.foe){a.threat=source;this.discover(a);if(isBoss(a.foe)&&!this.bossSeen)this.bossIntro(a)}
    if(!dot)a.hurt=this.time+125
    this.render({x:a.x,y:a.y,kind:'text',color,text:crit?`${n}!`:String(n),heavy:crit})
    if(!dot)this.render({x:a.x,y:a.y,kind:'hit',color,size:crit?19:12,sound:crit?'critical':'hit',heavy:crit})
    if(this.health(a)<=0)this.kill(a)
    else if(isBoss(a.foe))this.checkPhase(a,a.foe)
    return n
  }
  private heal(a:Actor,n:number) {
    if(!a.character||this.health(a)<=0)return
    const healed=Math.min(this.maxHealth(a)-a.character.hp,n)
    if(healed<=0)return
    a.character.hp+=healed
    this.render({x:a.x,y:a.y,kind:'text',color:'#a8e6ad',text:`+${Math.ceil(healed)}`})
    this.render({x:a.x,y:a.y,kind:'heal',color:'#a8e6ad'})
  }
  private kill(a:Actor) {
    a.state='dead';a.deadAt=this.time;a.warning=undefined;a.moving=false;a.effects={};a.roll=undefined
    this.render({x:a.x,y:a.y,kind:'death',color:a.foe?ENEMIES[a.foe].color:'#dbaa93',size:isBoss(a.foe)?57:24,sound:isBoss(a.foe)?'victory':a.foe?undefined:'defeat',heavy:isBoss(a.foe)})
    if(a.foe){
      if(this.selected===a.key){this.selected=null;this.auto=false}
      const def:EnemyDef=ENEMIES[a.foe]
      if(!a.summoned){
        this.mark('kill',a.foe,1);this.xp(def.xp);if(def.gold)this.loot(null,def.gold,a)
        for(const [id,chance] of def.loot)if(this.random()<=chance)this.loot(id,1,a)
      }
      if(a.foe==='archiveHusk'){this.save.flags['husk-cleared']=true;void this.persist()}
      if(isBoss(a.foe)) {
        this.save.flags[BOSS_RULES[a.foe].cleared]=true
        this.projectiles=this.projectiles.filter(p=>!p.owner.foe)
        for(const summon of this.enemies)if(summon.summoned&&summon.hp>0){summon.hp=0;summon.deadAt=this.time;summon.state='dead';summon.warning=undefined}
        this.toast(a.foe==='warden'?'Warden felled · Recover the Oath Shard':'The watch is over · Recover the Last Bell Clapper','good');void this.persist()
      }
    }else if(a===this.activeActor){
      const next=this.party.find(p=>p!==a&&this.health(p)>0);if(next){this.control(next.key as ActorKey);this.toast(`${a.key==='hero'?this.save.name:COMPANIONS[a.key as CompanionId].name} is down`,'bad')}
      else{this.setPanel('over');void this.persist()}
    }
  }
  private discover(a:Actor){if(a.foe&&!a.summoned)this.save.flags[`seen:${a.foe}`]=true}
  private bossIntro(a:Actor){if(!isBoss(a.foe))return;this.bossSeen=true;this.toast(BOSS_RULES[a.foe].intro,'bad');this.render({x:a.x,y:a.y,kind:'cast',color:ENEMIES[a.foe].color,size:40,sound:a.foe==='hollow'?'bell':'boss'})}
  private checkPhase(a:Actor,id:keyof typeof BOSS_RULES) {
    const rules=BOSS_RULES[id],fraction=a.hp/ENEMIES[id].hp, next=fraction<=rules.thresholds[1]?3:fraction<=rules.thresholds[0]?2:1
    if(next<=a.phase)return
    a.phase=next;a.pattern=0;a.state='recovery';a.recovery=this.time+710;a.warning=undefined;delete a.effects.stun
    this.render({x:a.x,y:a.y,kind:'burst',color:next===2?'#efbd78':'#ef8a9c',size:77,heavy:true,sound:id==='hollow'?'bell':'boss'})
    this.toast(`Phase ${next===2?'II':'III'} · ${rules.phases[next-2]}`,'bad')
    this.reinforcements(a,next===2?1:2)
  }
  private reinforcements(a:Actor,num:number){
    if(!isBoss(a.foe))return
    const foes=BOSS_RULES[a.foe].call,existing=this.enemies.filter(e=>e.summoned&&e.hp>0).length
    for(let i=0;i<Math.min(num,3-existing);i++){
      const p=safePoint(this.map,{x:a.x+((this.seed+i)%2?1:-1)*(31+8*i),y:a.y+27+13*i},this.gate)
      if(!withinArena(a.foe,p))continue
      const add=this.spawn({id:foes[i%foes.length],key:`summon-${++this.seed}`,...p},true);add.threat=this.activeActor;add.recovery=this.time+800
      this.render({...p,kind:'burst',color:ENEMIES[a.foe].color,size:21})
    }
  }
  private warning(a:Actor,target:Actor,def:EnemyDef) {
    let pattern:Warning['pattern']=def.style==='boss'||def.style==='bite'?'strike':def.style
    const boss=isBoss(a.foe),hollow=a.foe==='hollow'
    if(isBoss(a.foe)){
      const order=BOSS_RULES[a.foe].patterns[a.phase-1];pattern=order[a.pattern++%order.length]
    }else if(a.foe==='archiveHusk'&&a.pattern++%2===1)pattern='ring'
    if(a.effects.silence&&casts(pattern))pattern=boss&&hollow?'sweep':'strike'
    const point=pattern==='spikes'||pattern==='pounce'?target:a,v=vector(target.x-a.x,target.y-a.y);this.face(a,v)
    const r=pattern==='ring'?hollow?a.phase===3?91:80:61:pattern==='charge'?hollow?16:13:pattern==='sweep'?hollow?58:def.range+9:pattern==='spikes'?a.phase===3?43:35:pattern==='pounce'?23:pattern==='strike'?boss?53:def.range+9:pattern==='summon'?33:13
    const length=boss?(pattern==='spikes'?1120:pattern==='barrage'?960:pattern==='ring'?1480:pattern==='charge'?1160:1030)-(a.phase-1)*105:def.windup
    const angle=Math.atan2(v.y,v.x)
    const w:Warning={x:point.x,y:point.y,r,pattern,start:this.time,end:this.time+length,angle,target}
    if(pattern==='sweep')w.arc=hollow?1.17:1.03
    if(pattern==='ring')w.inner=hollow?26:21
    if(pattern==='fan'){w.rays=rayAngles(angle,hollow&&a.phase===3?5:3,hollow ? .30 : .37);w.length=hollow?145:122}
    if(pattern==='charge'){
      const extent=hollow?105:74
      let run=0
      for(let n=2;n<=extent;n+=2){const p={x:a.x+v.x*n,y:a.y+v.y*n};if(!open(this.map,p.x,p.y,this.gate,boss?7:5)||!withinArena(a.foe,p))break;run=n}
      w.length=run
    }
    a.warning=w;a.state='windup';a.moving=false
    if(boss||pattern==='ring')this.render({x:a.x,y:a.y,kind:'cast',color:'#fabf82',sound:hollow||pattern==='ring'?'bell':'omen',variation:a.phase})
  }
  private execute(a:Actor,w:Warning,def:EnemyDef){
    a.warning=undefined;a.state='recovery';a.moving=false
    const boss=isBoss(a.foe),hollow=a.foe==='hollow', ring=w.pattern==='ring'
    a.recovery=this.time+(boss?(hollow?Math.max(980,1690-(a.phase-1)*180):Math.max(720,1450-(a.phase-1)*235)):a.foe==='archiveHusk'?810:440)
    a.basicAt=this.time+(boss?1350-(a.phase-1)*180:def.rest)
    if(boss&&w.pattern!=='summon'||a.foe==='archiveHusk'&&ring)a.vulnerable=this.time+(ring||w.pattern==='spikes'?1550:980)
    a.animation={id:casts(w.pattern)?'cast':'slash',until:this.time+340}
    const factor=boss?1+(a.phase-1)*.13:1
    if(w.pattern==='barrage'||w.pattern==='bolt'||w.pattern==='fan'){
      const rays=w.rays??rayAngles(w.angle,boss?3+a.phase*2:1,boss?(a.phase===3?.28:.21):0)
      for(const angle of rays)this.fire(a,w.target,factor*(w.pattern==='fan'?.88:1),w.pattern==='barrage'?'#d4a0ed':def.color,undefined,1,angle,!boss?def.ailment:undefined,w.pattern==='fan'?w.length:undefined)
      this.render({x:a.x,y:a.y,kind:'cast',color:def.color,sound:w.pattern==='fan'?'chime':'spell',size:boss?31:12});return
    }
    if(w.pattern==='summon'){this.reinforcements(a,a.phase-1);return}
    if(w.pattern==='pounce'){
      const v=vector(w.x-a.x,w.y-a.y),d=Math.min(39,distance(a,w));slide(this.map,a,v.x*d,v.y*d,this.gate)
    }
    const center=(w.pattern==='strike'||w.pattern==='pounce')?a:w, lane=w.pattern==='charge', sweep=w.pattern==='sweep'
    for(const b of this.party){
      if(this.health(b)<=0)continue
      if(lane||sweep||ring){if(!inTelegraph(w,b)||!sight(this.map,lane?closestInLane(w,b):w,b,this.gate))continue}
      else if(!this.ranges(b,center,w.r))continue
      if(!boss&&w.pattern==='strike'&&((b.x-a.x)*a.aim.x+(b.y-a.y)*a.aim.y)<-8)continue
      if(this.injury(b,def.attack*factor*(w.pattern==='spikes'||ring?1.23:1),w.pattern==='spikes'||ring)&&def.ailment)this.apply(b,def.ailment,a)
    }
    if(lane){
      const ox=a.x,oy=a.y; a.x=w.x+Math.cos(w.angle)*(w.length??0);a.y=w.y+Math.sin(w.angle)*(w.length??0)
      for(let i=0;i<5;i++)this.render({x:ox+(a.x-ox)*i/5,y:oy+(a.y-oy)*i/5,kind:'cast',color:def.color,size:16})
    }
    const impact=lane?a:center
    this.render({x:impact.x,y:impact.y,kind:w.pattern==='strike'||sweep?'slash':'impact',color:w.pattern==='spikes'?'#f5a493':def.color,size:w.r,angle:w.angle,heavy:boss,sound:ring?'bell':boss?'impact':'slash',variation:w.pattern==='spikes'?8:ring?7:0})
  }
  private enemyAI(a:Actor,dt:number) {
    if(!this.health(a))return
    const d:EnemyDef=ENEMIES[a.foe!],boss=isBoss(a.foe)
    if(a.effects.stun){a.state='stunned';a.moving=false;return}
    if(a.warning){
      a.moving=false
      if(a.effects.silence&&casts(a.warning.pattern)){a.warning=undefined;a.recovery=this.time+450;return}
      if(this.time>=a.warning.end)this.execute(a,a.warning,d);return
    }
    if(a.recovery>this.time){a.moving=false;return}
    const party=this.party.filter(p=>this.health(p)>0&&!p.effects.veil&&withinArena(a.foe,p))
    const current=a.threat,leash=distance(a,a.spawn)
    const seen=party.filter(p=>this.ranges(a,p,d.sight)).sort((b,c)=>distance(a,b)-distance(a,c))[0]
    const target=current&&party.includes(current)&&distance(a,current)<(boss?350:194)&&leash<(boss?400:185)?current:seen
    if(!target||!boss&&!a.summoned&&leash>212){
      a.threat=undefined
      if(leash>18){a.state='return';this.approach(a,a.spawn,d.speed*.78,dt)}
      else if(a.summoned){a.state='idle';a.moving=false}
      else if(a.foe==='omen'||boss){a.state='idle';a.moving=false}
      else{
        if(this.time>a.wandered){a.wandered=this.time+2800+this.random()*2500;a.path=[safePoint(this.map,{x:a.spawn.x+(this.random()-.5)*40,y:a.spawn.y+(this.random()-.5)*32},this.gate)]}
        a.state=a.path.length?'patrol':'idle';this.followPath(a,a.path,d.speed*.36,dt)
      }
      return
    }
    if(a.threat!==target)this.discover(a)
    a.threat=target
    if(boss&&!this.bossSeen)this.bossIntro(a)
    const range=boss?(a.pattern===0&&a.phase===1?d.range:a.foe==='hollow'?93:105):d.range
    if(this.ranges(a,target,range)){
      a.moving=false;this.face(a,vector(target.x-a.x,target.y-a.y))
      if(this.time>=a.basicAt)this.warning(a,target,d)
    }else{a.state='chase';this.approach(a,target,d.speed*(boss?1+(a.phase-1)*.20:1),dt)}
  }
  private companionAI(a:Actor,dt:number,i:number) {
    if(!this.health(a))return
    const main=this.activeActor
    const stats=statsOf(this.save,a.character!),role=a.character!.classId, r=ROLES[role]
    const companion=this.save.companions[a.key as CompanionId]
    const mode=companion?.mode??(role==='priest'?'Support':'Defensive')
    const dist=distance(a,main)
    if(dist>225){Object.assign(a,safePoint(this.map,{x:main.x-16-i*8,y:main.y+13},this.gate));a.path=[];return}
    if(a.effects.stun){a.moving=false;return}
    const candidates=this.enemies.filter(e=>this.health(e)>0&&distance(e,main)<(mode==='Aggressive'?139:85)&&sight(this.map,main,e,this.gate)&&(!e.warning||isBoss(e.foe)||mode!=='Manual')).sort((b,c)=>distance(a,b)-distance(a,c))
    const imminent=candidates.find(e=>e.warning&&e.warning.end-this.time<(e.warning.pattern==='ring'?800:485)&&(!['bolt','barrage','fan','summon'].includes(e.warning.pattern))&&inTelegraph(e.warning,a,8))
    if(imminent?.warning&&mode!=='Manual'){this.stepActor(a,retreatFrom(imminent.warning,a),stats.speed*1.1,dt);return}
    if(role==='priest'&&mode!=='Manual'){
      const low=this.party.some(p=>this.health(p)>0&&this.health(p)<this.maxHealth(p)*.64&&this.ranges(a,p,105))
      if(low&&!this.cast(a,r.skills[1]))return
    }
    const visible=candidates.filter(e=>sight(this.map,a,e,this.gate)), selected=this.target
    const target=selected&&visible.includes(selected)?selected:visible[0]
    if(target&&mode!=='Manual'&&(mode!=='Support'||r.range>55)) {
      if(role==='warrior'&&mode==='Defensive'&&this.ranges(a,target,36)&&target.threat!==a){target.threat=a}
      if(mode==='Aggressive'||mode==='Defensive'&&r.range<45)if(!this.cast(a,r.skills[0],target))return
      if(this.ranges(a,target,r.range)){this.basic(a,target);a.moving=false;return}
      if(dist<98){this.approach(a,target,stats.speed*.93,dt);return}
    }
    const p=safePoint(this.map,{x:main.x+(i%2?1:-1)*(14+i*4)-main.aim.x*11,y:main.y+18-main.aim.y*17},this.gate)
    if(distance(a,p)>12)this.approach(a,p,stats.speed*(dist>67?1.21:.94),dt);else a.moving=false
  }
  dodge() {
    if(this.blocked)return
    const a=this.activeActor;if(a.inv>this.time||a.effects.stun||a.effects.root||a.recovery>this.time)return
    const direct=vector(this.keyboard.x+this.stick.x,this.keyboard.y+this.stick.y),v=direct.x||direct.y?direct:a.aim
    this.clearOrder();this.face(a,v);a.inv=this.time+300;a.recovery=this.time+820;a.roll={dir:{...v},speed:205,until:this.time+245};a.animation={id:'dash',until:this.time+245}
    this.render({x:a.x,y:a.y,kind:'cast',color:'#b6bbab',size:14,sound:'step'})
  }
  private playerStep(dt:number) {
    const a=this.activeActor
    if(!this.health(a))return
    const ox=a.x,oy=a.y, stats=statsOf(this.save,a.character!),role=ROLES[a.character!.classId]
    a.moving=false
    const input=vector(this.keyboard.x+this.stick.x,this.keyboard.y+this.stick.y)
    if(a.roll){ if(this.time<a.roll.until)this.stepActor(a,a.roll.dir,a.roll.speed,dt);else a.roll=undefined }
    else if(input.x||input.y){this.clearOrder();this.stepActor(a,input,stats.speed,dt)}
    else if(this.auto){
      const t=this.target
      if(!t)this.clearOrder()
      else if(this.ranges(a,t,role.range+(isBoss(t.foe)?9:0))){this.basic(a,t)}
      else this.approach(a,t,stats.speed,dt)
    }else if(this.destination){
      if(this.pendingFocus&&this.ranges(a,this.pendingFocus,25)){const f=this.pendingFocus;this.clearOrder();this.useFocus(f)}
      else {this.followPath(a,this.route,stats.speed,dt);if(!this.route.length)this.clearOrder()}
    }
    const moved=Math.hypot(a.x-ox,a.y-oy)
    this.save.x=this.activeActor.x;this.save.y=this.activeActor.y
    if(moved>.1&&!this.blocked){
      this.positionDirty+=moved
      if(this.positionDirty>=10){const n=Math.floor(this.positionDirty);this.mark('move',this.map.id,n,false);this.positionDirty-=n}
      if(this.time>=a.nextStep){a.nextStep=this.time+290;this.render({x:a.x,y:a.y,kind:'step',color:'#cfc2a0',sound:'step'})}
    }
  }
  private tick(dt:number){
    if(this.blocked)return
    this.time+=dt;const sec=dt/1000
    this.save.playtime+=sec
    this.toasts=this.toasts.filter(t=>t.until>this.time)
    if(this.save.region==='village'&&this.save.quests.q1?.state==='active'&&this.save.quests.q1.progress[0]>=40&&!this.save.quests.q1.progress[1]&&!this.enemies.some(a=>a.foe==='omen')){
      const spawn=this.map.spawns[0];this.spawn(spawn);this.render({x:spawn.x,y:spawn.y,kind:'burst',color:'#e5a8f4',size:26,sound:'omen'});this.toast('A spark breaks free in the square')
    }
    for(const a of [...this.party,...this.enemies])if(this.health(a)>0)this.tickEffects(a)
    const epoch=this.epoch;this.playerStep(sec)
    if(this.epoch!==epoch||this.blocked)return
    for(const [i,a] of this.party.entries())if(this.health(a)>0){
      const c=a.character!,s=statsOf(this.save,c), danger=this.enemies.some(e=>this.health(e)>0&&(e.threat===a||e.warning?.target===a))
      c.mp=Math.min(s.maxMp,c.mp+sec*(danger?2.0:4.4));if(!danger&&(this.map.id==='village'||this.map.id==='capital'))c.hp=Math.min(s.maxHp,c.hp+sec*2.8)
      if(a!==this.activeActor){if(a.roll){if(this.time<a.roll.until)this.stepActor(a,a.roll.dir,a.roll.speed,sec);else a.roll=undefined}else this.companionAI(a,sec,i)}
    }
    for(const a of this.enemies) this.enemyAI(a,sec)
    this.updateProjectiles(sec)
    for(const h of this.pendingHits.filter(h=>h.time<=this.time))h.run()
    this.pendingHits=this.pendingHits.filter(h=>h.time>this.time)
    if(this.time>=this.nextSave){this.nextSave=this.time+18000;void this.persist()}
    if(this.time>=this.nextUpdate){this.nextUpdate=this.time+100;this.refresh()}
  }
  advance(delta:number){if(this.hidden)return;this.accumulator+=clamp(delta,0,100);while(this.accumulator>=FIXED){this.accumulator-=FIXED;this.tick(FIXED)}}
  private loot(id:string|null,qty:number,p:Point,plus=0) {
    const drops=this.drops, near=drops.filter(d=>distance(p,d)<52)
    let point=safePoint(this.map,p,this.gate,5)
    if(near.length)for(let i=0;i<24;i++) {
      const angle=this.seed*1.2+i*2.4,r=14+(i%3)*12,x=p.x+Math.cos(angle)*r,y=p.y+Math.sin(angle)*r
      const best=safePoint(this.map,{x,y},this.gate,5)
      if(sight(this.map,p,best,this.gate)&&near.every(d=>distance(d,best)>13)){point=best;break}
    }
    drops.push({key:`drop-${Date.now()}-${++this.seed}`,...point,stack:id?{id,qty,plus}:undefined,gold:id?undefined:qty})
    this.render({...point,kind:'loot',color:id?'#e8bf85':'#eac865'})
  }
  xp(n:number){
    const levels=gainXp(this.save,n)
    if(levels){for(const a of this.party)if(this.health(a)>0&&a.state==='dead')a.state='idle';this.toast(`Level ${this.save.level} · Attribute and skill points earned`,'good');this.render({x:this.activeActor.x,y:this.activeActor.y,kind:'level',color:'#f5d986',size:32,sound:'level'});void this.persist()}
    this.refresh()
  }
  private pickup(drop:DropRecord){
    if(drop.stack){const {id,qty,plus}=drop.stack;if(!add(this.save.bag,id,qty,plus)){this.toast('Inventory full. Make room before picking this up.','bad');return false}
      this.mark('collect',id,qty,false);this.toast(`Acquired ${ITEMS[id].name}${qty>1?` ×${qty}`:''}`,'good')
    }
    if(drop.gold){this.save.gold+=drop.gold;this.toast(`+${drop.gold} gold`,'good')}
    const i=this.drops.indexOf(drop);if(i>=0)this.drops.splice(i,1)
    this.render({x:drop.x,y:drop.y,kind:'loot',color:'#efce86',sound:'loot'});void this.persist();return true
  }
  potion(id:string){
    if(this.dialog||this.panel==='over'||this.hidden)return
    const a=this.activeActor,item=ITEMS[id],c=a.character!,d=statsOf(this.save,c)
    if(!item?.effect||this.health(a)<=0)return
    if(a.nextPotion>this.time){this.toast('Potion is recovering','bad');return}
    if(item.effect==='hp'&&c.hp>=d.maxHp||item.effect==='mp'&&c.mp>=d.maxMp){this.toast('Already full');return}
    if(!remove(this.save.bag,id)){this.toast(`No ${item.name} left`,'bad');return}
    a.nextPotion=this.time+2200
    if(item.effect==='hp')this.heal(a,item.amount!);if(item.effect==='mp')c.mp=Math.min(d.maxMp,c.mp+item.amount!);if(item.effect==='cleanse')for(const k of HARMFUL)delete a.effects[k]
    this.render({x:a.x,y:a.y,kind:'cast',color:item.effect==='mp'?'#a2c5fa':'#b2dea4',sound:'heal'});this.toast(`Used ${item.name}`,'good');void this.persist()
  }
  attribute(attr:Attribute){if(this.save.points>0){this.save.attrs[attr]++;this.save.points--;this.refresh();void this.persist()}}
  upgrade(skill:Skill){const s=this.save,rank=s.ranks[skill.id]??0
    if(skill.owner!==s.hero.classId||s.level<skill.level||s.skillPoints<=0||rank>=skill.rankMax||skill.needs&&!s.ranks[skill.needs])return
    s.ranks[skill.id]=rank+1;s.skillPoints--;this.toast(`${skill.name} · Rank ${rank+1}`,'good');this.render({x:this.activeActor.x,y:this.activeActor.y,kind:'cast',color:skill.color,sound:'level'});void this.persist()
  }
  private transact(message:string|null,success:string){this.toast(message??success,message?'bad':'good');if(!message)void this.persist();return !message}
  equip(i:number,slot?:Slot){return this.transact(equip(this.save,this.actor,i,slot),'Equipment changed')}
  unequip(slot:Slot){return this.transact(unequip(this.save,this.actor,slot),'Equipment removed')}
  trade(kind:'buy'|'sell',key:number|string){return this.transact(trade(this.save,kind,key),kind==='buy'?'Purchase complete':'Item sold')}
  craft(id:string){return this.transact(craft(this.save,id),'Crafting complete')}
  enhance(slot:Slot){return this.transact(enhance(this.save,this.actor,slot),'Equipment strengthened')}
  drop(i:number){const s=this.save.bag[i];if(!s||ITEMS[s.id].type==='Quest')return false
    this.loot(s.id,s.qty,this.activeActor,s.plus);this.save.bag.splice(i,1);return this.transact(null,`${ITEMS[s.id].name} left on the ground`)
  }
  sort(){this.save.bag.sort((a,b)=>ITEMS[a.id].type.localeCompare(ITEMS[b.id].type)||ITEMS[a.id].name.localeCompare(ITEMS[b.id].name));this.refresh()}
  control(id:ActorKey){const a=this.party.find(p=>p.key===id);if(!a||!this.health(a))return false
    this.save.controlled=id;this.clearOrder();this.selected=null;this.resetInput();this.refresh();return true
  }
  recruit(id:CompanionId) {
    if(this.save.companions[id])return
    const d=COMPANIONS[id];this.save.companions[id]=makeCompanion(this.save,id)
    if(this.save.active.length<2){this.save.active.push(id);this.syncParty()}
    this.mark('recruit',id,1);this.toast(`${d.name} joined the party`,'good');void this.persist()
  }
  partyMode(id:CompanionId,mode:Mode){const c=this.save.companions[id];if(c){c.mode=mode;this.refresh();void this.persist()}}
  roster(id:CompanionId){if(!this.save.companions[id])return
    if(this.save.active.includes(id)){
      if(this.save.controlled===id&&!this.control('hero')&&!this.save.active.some(next=>next!==id&&this.control(next))){this.toast('At least one living member must remain','bad');return}
      this.save.active=this.save.active.filter(x=>x!==id)
    }else if(this.save.active.length<2)this.save.active.push(id);else return
    this.syncParty();this.refresh();void this.persist()
  }
  private startQuest(q:Quest){
    if(this.save.quests[q.id]||q.after&&this.save.quests[q.after]?.state!=='done')return false
    this.save.quests[q.id]={state:'active',progress:q.objectives.map(()=>0)}
    if(q.category==='Main')this.save.tracked=q.id
    for(const ob of q.objectives){
      if(ob.event==='collect'&&ob.target)this.mark('collect',ob.target,countItem(this.save.bag,ob.target),false,q.id)
      if(ob.event==='recruit'&&this.save.companions[ob.target as CompanionId])this.mark('recruit',ob.target,1,false,q.id)
      if(ob.event==='inspect'&&ob.target&&this.save.flags[`echo:${ob.target}`])this.mark('inspect',ob.target,1,false,q.id)
      if(ob.event==='visit'&&this.map.id===ob.target)this.mark('visit',ob.target,1,false,q.id)
    }
    this.toast(`New quest · ${q.title}`,'good');void this.persist();return true
  }
  mark(event:QuestEvent,target:string|undefined,n:number,announce=true,only?:string){
    if(n<=0)return
    for(const [id,data] of Object.entries(this.save.quests))if(data.state==='active'&&(!only||id===only)){
      const q=QUESTS[id];let changed=false
      q.objectives.forEach((o,i)=>{if(o.event===event&&(!o.target||o.target===target)&&data.progress[i]<o.count&&(event!=='kill'||o.map===this.map.id)){
        data.progress[i]=Math.min(o.count,data.progress[i]+n);changed=true
      }})
      if(changed&&data.progress.every((x,i)=>x>=q.objectives[i].count)){
        data.state='ready';if(announce)this.toast(`Objective complete · ${q.title}`,'good')
      }
      if(changed&&event!=='move'&&announce)void this.persist()
    }
  }
  track(id:string){if(this.save.quests[id]&&this.save.quests[id].state!=='done'){this.save.tracked=id;this.refresh()}}
  private finish(q:Quest) {
    const state=this.save.quests[q.id];if(state?.state!=='ready')return
    const requested:Record<string,[string,number]>={q3:['herb',3],'side-lamps':['essence',2],'side-iron':['ore',2],q15:['bell-key',1]}
    const delivery=requested[q.id]
    if(delivery&&!remove(this.save.bag,...delivery)){this.toast(`Bring ${delivery[1]} × ${ITEMS[delivery[0]].name} in your bag to turn this in.`,'bad');return}
    state.state='done';this.save.gold+=q.gold;this.xp(q.xp)
    const prize=q.id==='q16'?this.save.flags['bell-fate']==='names'?'dawnseal':'cipherheart':q.prize
    if(prize&&!add(this.save.bag,prize))this.loot(prize,1,this.activeActor)
    if(q.id==='q9')this.save.flags.gate=true
    if(q.next)this.startQuest(QUESTS[q.next]);else if(this.save.tracked===q.id)this.save.tracked=this.main?.id??q.id
    this.toast(`Quest complete · ${q.title}`,'good');this.render({x:this.activeActor.x,y:this.activeActor.y,kind:'cast',color:'#f2d78e',sound:'quest'});void this.persist()
    if(q.id==='q10')this.say(q.end,QUESTS.q10.finish,this.shardChoices(),'A choice at the end of Chapter I')
    else if(q.id==='q11'){
      const branch=this.entry==='warned'?'Your letter reached the Crown before it reached Iona. Two men with bronze shields followed me as far as the canal. They’ll be watching the public stair.':'Good. The Crown is still looking in the forest. I know a way through the canal. By the time they look down, we’ll be inside.'
      this.say('veyra',[branch,...q.finish],[],q.title)
    }else if(q.id==='q12'){
      const line=this.entry==='warned'?'Use the eastern public stair. The Crown is reading your letter in every ward. Veyra sent word ahead, but the two bailiffs have orders to hold the archive.':'Use the culvert south of the western bridge. There’s a bronze basket by the drain. Keep your feet out of the silt; the things there can hear you walk.'
      this.say('iona',[line,...q.finish],[],q.title)
    }else if(q.id==='q14'){
      this.say('seris-archive',this.save.active.includes('tarek')?BELL_REVELATION:BELL_REVELATION.filter(l=>typeof l==='string'||l.speaker!=='tarek'),[],q.title)
    }else if(q.id==='q15'){
      this.say('bell-altar',[...q.finish,...BELL_VISION],[],'An echo in the bronze','/art/bell-sanctum.webp')
    }else if(q.id==='q16'){
      const open=this.save.flags['bell-fate']==='names'
      this.chapterSignal=2
      this.say('iona',[open?'I’ll read the names in the square. When the Crown asks who stands witness, I’ll let the crowd answer.':'I’ll bring the book door to door. Some people will need time before they’re ready to hear a knock.',...q.finish],[],'Chapter II complete · The Bell Below','/art/vesperhold.webp')
    }else this.say(q.end,q.finish,[],q.title)
  }
  private shardChoices(fromPass=false):Choice[]{return [
    {label:'Keep the shard hidden',run:()=>this.ending('hidden','Then let the capital believe the bells only fell silent. We owe the dead one more quiet night.',fromPass)},
    {label:'Warn the kingdom',run:()=>this.ending('warned','Then I will write it in my own hand, and sign the name I should have signed the first time.',fromPass)},
  ]}
  private ending(decision:'hidden'|'warned',text:string,fromPass=false){
    if(this.save.flags.decision)return
    this.save.flags.decision=decision;this.chapterSignal=1;void this.persist()
    if(fromPass){this.mark('talk','veyra',1);this.finish(QUESTS.q11);return}
    this.say('tarek',[text,'The dawn comes late to Lumenford. Far in the north, another bell answers. Ashen Pass is open now.'],[],'Chapter I complete · The Broken Seal')
  }
  private chooseFate(){
    this.say('iona',['I can read each name in the square and make the Crown hear them. Or I can take the book to the families and let them decide when to speak.','There’s strength in a square full of voices. There’s also a kind of strength in being the first person to knock quietly.'],[
      {label:'Read the names in public',run:()=>this.endBell('names')},
      {label:'Shelter the names with the families',run:()=>this.endBell('sheltered')},
    ],'When the Bell Forgets')
  }
  private endBell(fate:'names'|'sheltered'){
    if(this.save.quests.q16?.state==='done')return
    this.save.flags['bell-fate']=fate;this.mark('talk','iona',1);this.finish(QUESTS.q16)
  }
  private setSpeaker(d:Conversation){
    const line=d.lines[d.index],id=typeof line==='string'?d.origin:line.speaker,p=personFor(id)
    d.portrait=personaId(id);d.speaker=p?.name??NAMES[id]??id
    if(p)this.save.flags[`met:${p.id}`]=true
  }
  say(id:string,lines:StoryLine[],choices:Choice[]=[],caption=personFor(id)?.title??CAPTIONS[id]??'From the Chronicle',art?:string){
    this.clearOrder();this.resetInput();this.dialog={speaker:id,portrait:id,origin:id,caption,lines,index:0,choices,art};this.setSpeaker(this.dialog);this.refresh()
  }
  next(){if(!this.dialog)return;const d=this.dialog;if(d.index<d.lines.length-1){d.index++;this.setSpeaker(d);this.refresh()}else if(!d.choices.length)this.dismiss()}
  dismiss(){if(this.dialog){this.dialog=null;this.refresh();void this.persist()}}
  choose(choice:Choice){if(!this.dialog||!this.dialog.choices.includes(choice)||this.dialog.index<this.dialog.lines.length-1)return;this.dialog=null;choice.run();this.refresh()}
  private speak(f:Feature){
    const choices:Choice[]=[];const main=this.main
    let lines=[NPC_TEXT[personaId(f.id)]??'The road is quiet today.']
    const ready=QUEST_LIST.filter(q=>q.end===f.id&&this.save.quests[q.id]?.state==='ready')
    for(const q of ready)choices.push({label:`Report: ${q.title}`,run:()=>q.id==='q16'?this.chooseFate():this.finish(q)})
    if(main?.giver===f.id&&this.save.quests[main.id].state==='active')lines=[main.begin]
    if(f.id==='veyra'&&main?.id==='q11'&&this.save.quests.q11.state==='active')choices.push({label:'Show Veyra the Oath Shard',run:()=>{
      if(!this.save.flags.decision){this.say('veyra',['I can still get a letter to the city before we’re seen. What did you intend to tell the Crown?'],this.shardChoices(true),'The unfinished choice');return}
      this.mark('talk',f.id,1);this.finish(main)
    }})
    if(f.id==='iona'&&main?.id==='q12'&&this.save.quests.q12.state==='active'){
      if(this.save.quests.q12.progress[0])choices.push({label:'Ask about the erased names',run:()=>{this.mark('talk',f.id,1);this.finish(main)}})
      else lines.push('Read the census in the square first. Note where the rows have been cut away. That tells you more than the numbers do.')
    }
    if(f.id==='seris-archive'&&main?.id==='q14'&&this.save.quests.q14.state==='active')choices.push({label:'Hear what happened at the seal',run:()=>{this.mark('talk',f.id,1);this.finish(main)}})
    if(f.id==='iona'&&main?.id==='q16'&&this.save.quests.q16.state==='active')choices.push({label:'Decide what happens to the names',run:()=>this.chooseFate()})
    if(f.id==='gatekeeper')lines=[this.save.flags['bell-fate']==='names'?'My father was on that list. All this time I thought he’d deserted. I don’t know how to take my helmet off in front of you.':this.entry==='warned'?'Your captain’s letter is on every desk in the city. That doesn’t mean it’s being read.':'It’s quiet on the census today. That usually means someone is working very hard to keep it that way.']
    if(f.id==='mira'&&this.save.quests['side-letter']?.state==='done')lines=[this.save.flags['bell-fate']==='names'?'Iona said Meret’s name to a whole square of people. I heard it all the way out here.':this.save.flags['bell-fate']==='sheltered'?'Iona kept my daughter’s name between us. I’ll say it to the street when I’m ready.':'I’ve put Meret’s letter on the sill. She always knew how to bring a little light in.']
    if(f.id==='iona'&&this.save.quests.q16?.state==='done')lines=[this.save.flags['bell-fate']==='names'?'Yesterday the chapel opened without a birth roll. There was a queue this morning.':'The first family came to the archives today. They asked what the pages could remember. We found out together.']
    const id=personaId(f.id)
    if(id==='tarek'||id==='lyra'||id==='veyra'){
      const canRecruit=id==='veyra'?this.save.quests.q11?.state==='done':this.save.quests.q6?.state==='done'
      if(canRecruit&&!this.save.companions[id])choices.push({label:`Recruit ${COMPANIONS[id].name}`,run:()=>{
        this.recruit(id)
        const q=this.main, response=id==='veyra'?'I know every door in Vesperhold that shouldn’t open. If your party is full, keep me in reserve until you need one.':`I’m with you, ${this.save.name}. Let’s see where that road leads.`
        if(q?.end===f.id&&this.save.quests[q.id].state==='ready')this.say(id,[response],[{label:`Report: ${q.title}`,run:()=>this.finish(q)}]);else this.say(id,[response])
      }})
    }
    for(const q of QUEST_LIST)if(q.category==='Side'&&q.giver===f.id&&!this.save.quests[q.id]&&(!q.after||this.save.quests[q.after]?.state==='done')&&(q.id!=='side-lyra'||this.save.companions.lyra))choices.push({label:`Ask about ${q.title}`,run:()=>this.say(f.id,[q.begin],[{label:'Accept quest',run:()=>{this.startQuest(q)}},{label:'Not now',run:()=>{}}],q.title)})
    if(f.id==='ren')lines=['I’ve kept the window light on. If you walk out with anything down there, I want it to know where the road ends.']
    if(f.id==='forge-city')lines=['Bronze from the archives tempers well. Beats putting your ear to it and asking what it’s for.']
    if(f.id==='corin'||f.id==='ren')choices.push({label:'Browse wares',run:()=>this.setPanel('shop')})
    if(f.id==='mara'||f.id==='forge-city')choices.push({label:'Use the forge',run:()=>this.setPanel('forge')})
    if(f.id==='lyra')choices.push({label:'Rest and recover',run:()=>{this.recover();this.toast('The party is restored','good');void this.persist()}})
    if(f.id==='seris'&&this.save.quests.q4?.state==='active'&&!this.save.quests.q4.progress[0])choices.push({label:'Show Seris the sigil',run:()=>{this.mark('talk','seris',1);this.say('seris',['There’s a waystone east of the camp, near the pool. Touch it and tell me whose voice you hear.'])}})
    if(f.id==='tarek'&&this.save.quests.q10?.state==='done'&&!this.save.flags.decision)choices.push({label:'Decide the shard’s fate',run:()=>this.say('tarek',QUESTS.q10.finish,this.shardChoices())})
    if(f.id==='tarek'&&this.save.quests.q1.state==='active')lines=[QUESTS.q1.begin,`${ROLES[this.save.hero.classId].name} or no, don’t stand in its light. Click the spark to engage, or press Tab then use a skill.`]
    this.say(f.id,lines,choices)
  }
  get mapFeatures(){return this.map.features.filter(f=>this.onRoute(f)&&(f.kind==='exit'||((!f.needs||!!this.save.quests[f.needs])&&!this.harvested.has(f.id)&&!this.save.flags[`taken:${f.id}`])))}
  onRoute(f:Feature){return !f.entry||this.entry===f.entry}
  unlocked(f:Feature){return this.onRoute(f)&&(!f.needs||this.save.quests[f.needs]?.state==='done'||!!this.save.flags[f.needs])}
  focuses():Focus[]{
    const verb={npc:'Talk',exit:'Travel',loot:'Gather',shrine:'Rest & save',inspect:'Examine',rune:'Touch',chest:'Open'}
    return [...this.mapFeatures.map(f=>({label:f.name,action:verb[f.kind],x:f.x,y:f.y,key:f.id,feature:f})),...this.drops.map(d=>({label:d.stack?ITEMS[d.stack.id].name:`${d.gold} gold`,action:'Pick up',x:d.x,y:d.y,key:d.key,drop:d}))]
  }
  nearest(){const a=this.activeActor;return this.focuses().filter(f=>this.ranges(a,f,30)).sort((b,c)=>distance(a,b)-distance(a,c))[0]}
  interact(){if(this.blocked)return;const f=this.nearest();if(f)this.useFocus(f);else this.toast('Move closer to something you can interact with')}
  private useFocus(focus:Focus){
    if(focus.drop){this.pickup(focus.drop);return}
    const f=focus.feature;if(!f)return
    switch(f.kind){
      case 'npc':this.speak(f);return
      case 'exit':
        if(!this.unlocked(f)){this.toast(f.id==='to-pass'?'Finish The Broken Seal to travel onward.':'The way is closed. Follow the main quest.','bad');return}
        if(f.to){this.loadMap(f.to.region,f.to);this.refresh()}return
      case 'shrine':this.recover();this.save.checkpoint={region:this.map.id,x:this.activeActor.x,y:this.activeActor.y};this.render({x:f.x,y:f.y,kind:'burst',color:'#f0e0a0',size:34,sound:'heal'});this.toast('Checkpoint restored · HP and MP replenished','good');void this.persist();return
      case 'loot':case 'chest':
        if(!f.item)return
        if(!add(this.save.bag,f.item)){this.toast('Inventory full','bad');return}
        if(f.kind==='chest'||ITEMS[f.item].type==='Quest')this.save.flags[`taken:${f.id}`]=true;else this.harvested.add(f.id)
        this.mark('collect',f.item,1);this.render({x:f.x,y:f.y,kind:'loot',color:'#f2cf91',sound:'loot'});this.toast(`Acquired ${ITEMS[f.item].name}`,'good');void this.persist();return
      case 'rune': {
        if(this.gate||this.save.flags.runes){this.toast('The runes are already lit');return}
        if(f.id!==RUNES[this.runeIndex]){this.runeIndex=0;this.toast('The light fades. Read the inscription for the order.','bad');return}
        this.runeIndex++;this.render({x:f.x,y:f.y,kind:'burst',color:'#c2dfff',size:22,sound:'spell'});this.toast(`${f.name} awakened · ${this.runeIndex}/3`,'good')
        if(this.runeIndex===RUNES.length){this.save.flags.runes=true;this.mark('puzzle','runes',1);void this.persist()}
        return
      }
      case 'inspect':{
        if(f.id==='inscription'){this.say(f.id,['Ember first remembers what the water takes; only then may the thorn be laid.','Three marks glow on the map: Ember in the west, Tide to the north, Thorn to the south.']);return}
        if(f.id==='horizon'){this.say('Kingdom Overlook',['Twice the eclipse has crossed the capital. There is only one sun.','Below the arch, a woman holds her cloak against the wind. She watches the road, not the city.'],[],'Chapter II · The Bell Below','/art/vesperhold.webp');return}
        const echo=ECHO_BY_ID[f.id]
        if(echo){
          if(!this.save.flags[`echo:${f.id}`]){this.save.flags[`echo:${f.id}`]=true;this.toast(`Memory recorded · ${echo.title}`,'good')}
          this.mark('inspect',f.id,1);this.say(echo.title,[echo.text],[],echo.excerpt,echo.art);void this.persist();return
        }
        if(f.id==='west-wheel'||f.id==='east-wheel'){
          if(this.gate||this.save.flags[f.id]){this.toast(this.gate?'The bridge is open':'This wheel is set. Find the other one.');return}
          this.save.flags[f.id]=true;this.mark('inspect',f.id,1)
          this.save.flags['water-gates']=Boolean(this.save.flags['west-wheel']&&this.save.flags['east-wheel'])
          this.render({x:f.x,y:f.y,kind:'burst',color:'#a9e3da',size:28,sound:'chime'})
          this.toast(this.gate?'Both wheels are set · The central grating is open':'One wheel turns · Find the other wheel','good');void this.persist();return
        }
        if(f.id==='census-stone'){
          this.mark('inspect',f.id,1)
          this.say(f.id,['Households: 7,214. Residents: 19,903. Above the total, several rows have been scraped so deep that rain pools in the letters.','At the bottom, a single name remains. Caldus. Next to it is a word you can barely make out: “Paid.”']);return
        }
        if(f.id==='bell-altar'&&this.save.quests.q15?.state!=='ready'){
          this.say(f.id,[this.save.quests.q15?.state==='done'?'Nothing in the bronze asks you to stay. The mark on your hand no longer hurts.':'There is an empty slot in the altar. You can hear something walking between the columns.']);return
        }
        if(f.id==='sealing-press'&&this.save.quests.q13?.state!=='ready'){
          this.say(f.id,[this.save.quests.q13?.state==='done'?'A narrow strip of ink runs towards Seris’s hand.':'When the Husk moves, something printed inside it moves a moment later.']);return
        }
        if(f.id==='veilstone'&&!this.save.quests.q4?.progress[0]){this.say(f.id,['The stone is cold. Seris may know how to wake it.']);return}
        this.mark('inspect',f.id,1)
        const ending=QUEST_LIST.find(q=>q.end===f.id&&this.save.quests[q.id]?.state==='ready')
        if(ending){this.finish(ending);return}
        this.say(f.id,[f.id==='veilstone'?'“Let me through.” It speaks with your voice. Then it repeats the words, too quietly to be asking you.':f.id==='oath-door'?'The latch is shaped to hold three moving lights. Look for the runes, and mind the guardians.':'The old stone is warm to the touch.']);return
      }
    }
  }
  private recover(){for(const a of [this.save.hero,...Object.values(this.save.companions)])if(a){const d=statsOf(this.save,a);a.hp=d.maxHp;a.mp=d.maxMp}for(const a of this.party){a.effects={};a.state='idle';a.inv=this.time+1200}}
  respawn(){this.recover();const p=this.save.checkpoint??{region:'village',...VILLAGE_START};this.panel=null;this.save.controlled='hero';this.loadMap(p.region,p);this.toast('The shrine answers. Your journey continues.','good');void this.persist()}
  guidance(): { quest:Quest; text:string; map:RegionId; points:Point[] }|null {
    const q=this.tracked;if(!q)return null
    const state=this.save.quests[q.id], index=q.objectives.findIndex((o,i)=>state.progress[i]<o.count), ob=q.objectives[index]
    let region:RegionId=ob?.map??'village',points:Point[]=[]
    let text=ob?`${ob.label}${ob.count>1&&ob.event!=='move'?` · ${state.progress[index]}/${ob.count}`:''}`:'Return to report your findings'
    if(!ob){for(const m of Object.values(MAPS)){const f=m.features.find(f=>f.id===q.end);if(f){region=m.id;points=[f];text=f.kind==='inspect'?`Examine ${f.name}`:`Return to ${f.name}`;break}}}
    else {
      const m=MAPS[region]
      if(ob.event==='kill')points=m.id===this.map.id?this.enemies.filter(a=>a.foe===ob.target&&a.hp>0):m.spawns.filter(s=>s.id===ob.target&&(!s.entry||s.entry===this.entry))
      if(ob.event==='collect')points=[...m.features.filter(f=>this.onRoute(f)&&f.item===ob.target&&!this.save.flags[`taken:${f.id}`]&&(!this.harvested.has(f.id)||m.id!==this.map.id)),...(this.save.drops[region]??[]).filter(d=>d.stack?.id===ob.target)]
      if(ob.event==='talk'||ob.event==='inspect'||ob.event==='recruit')points=m.features.filter(f=>f.id===ob.target)
      if(ob.event==='puzzle')points=m.features.filter(f=>f.kind==='rune')
      if(ob.event==='move')points=m.features.filter(f=>f.id==='tarek')
      if(ob.event==='visit')points=m.features.filter(f=>f.kind==='shrine').slice(0,1)
    }
    if(q.id==='q13'&&region==='archive'&&this.map.id==='archive'&&this.gate&&ob?.event==='kill'&&this.activeActor.y>23*16){points=[{x:29.5*16,y:22.1*16}];text='Cross the open grating to reach the Archive Husk'}
    if(region!==this.map.id){
      const search:[RegionId,Feature|undefined][]=[[this.map.id,undefined]],seen=new Set<RegionId>([this.map.id]);let first:Feature|undefined
      while(search.length){const [r,from]=search.shift()!;if(r===region){first=from;break}for(const f of MAPS[r].features)if(f.to&&!seen.has(f.to.region)&&this.unlocked(f)){seen.add(f.to.region);search.push([f.to.region,from??f])}}
      points=first?[first]:[];if(first)text+=` · via ${first.name}`
    }
    return {quest:q,text,map:region,points}
  }
}
