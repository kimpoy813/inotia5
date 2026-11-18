import Phaser from 'phaser'
import { ENEMIES } from '../data/enemies'
import { TILE, random } from '../data/maps'
import { npcLook, type Look } from '../data/npcs'
import { audio, type Theme } from './audio'
import { distance } from './navigation'
import { type Actor, Game, type Visual } from './model'
import { DIRECTIONS, FRAMES, HUMAN_H, HUMAN_W, enemyAtlas, featureTexture, groundTexture, humanAtlas, propTexture } from './pixels'
import type { Character, Point } from './types'

const heightOver=(a:Actor)=>a.foe==='warden'?74:a.foe?['slime','spider','wolf'].includes(a.foe)?25:36:43
const color=(s:string)=>parseInt(s.slice(1),16)
const markGold=0xf4cf83
const uv=(i:number)=>i%1
const particleColors={village:0xe9cd89,road:0xdbc28f,forest:0xa0cdb6,spire:0xc0a8d8,pass:0xc5dfed}
type DrawEvent= Visual & { born:number; duration:number }
export class WorldScene extends Phaser.Scene {
  private epochSeen=-1
  private environment:Phaser.GameObjects.GameObject[]=[]
  private actors=new Map<string,Phaser.GameObjects.Sprite>()
  private props=new Map<string,Phaser.GameObjects.Image>()
  private features=new Map<string,Phaser.GameObjects.Image>()
  private labels=new Map<string,Phaser.GameObjects.Text>()
  private scenery!:Phaser.GameObjects.Graphics
  private foreground!:Phaser.GameObjects.Graphics
  private underlay!:Phaser.GameObjects.Graphics
  private glow!:Phaser.GameObjects.Graphics
  private ambient: {x:number;y:number;v:number;p:number}[]=[]
  private water:Point[]=[]
  private drawEvents:DrawEvent[]=[]
  private follow:string|null=null
  private frameTime=0
  private victoryUntil=0
  constructor(private sim:Game){super({key:'World'})}
  create(){
    this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(p.button===0){audio.unlock();const v=p.positionToCamera(this.cameras.main) as Phaser.Math.Vector2;this.sim.click(v)}})
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>{this.input.removeAllListeners();this.tweens.killAll()})
    this.makeGlow()
    this.scenery=this.add.graphics().setDepth(-1950)
    this.underlay=this.add.graphics().setDepth(-1500)
    this.foreground=this.add.graphics().setDepth(3100)
    this.glow=this.add.graphics().setDepth(2900)
    this.cameras.main.setRoundPixels(true)
    this.rebuild()
  }
  private makeGlow(){
    if(this.textures.exists('softlight'))return
    const t=this.textures.createCanvas('softlight',64,64)!;const c=t.context, g=c.createRadialGradient(32,32,0,32,32,32)
    g.addColorStop(0,'rgba(255,255,255,.65)');g.addColorStop(.25,'rgba(255,255,255,.26)');g.addColorStop(.7,'rgba(255,255,255,.06)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,64,64);t.refresh()
  }
  private store(key:string,source:HTMLCanvasElement){const t=this.textures.addCanvas(key,source)!;t.setFilter(Phaser.Textures.FilterMode.NEAREST);return t}
  private atlas(look:Look){
    const key=`person-${look.classId}-${look.dye}-${look.skin}-${look.style}`
    if(!this.textures.exists(key)){
      const t=this.store(key,humanAtlas(look.classId,look.dye,look.skin,look.style))
      for(let dir=0;dir<4;dir++)for(let f=0;f<FRAMES;f++)t.add(dir*FRAMES+f,0,f*HUMAN_W,dir*HUMAN_H,HUMAN_W,HUMAN_H)
    }
    return key
  }
  private getEnemy(a:Actor){
    const key=`monster-${a.foe}`
    if(!this.textures.exists(key)){
      const {a:image,w,h}=enemyAtlas(a.foe!),t=this.store(key,image)
      for(let dir=0;dir<2;dir++)for(let f=0;f<FRAMES;f++)t.add(dir*FRAMES+f,0,f*w,dir*h,w,h)
    }
    return key
  }
  private light(x:number,y:number,tint:number,scale:number,alpha:number){
    const light=this.add.image(x,y,'softlight').setTint(tint).setScale(scale).setAlpha(alpha).setBlendMode(Phaser.BlendModes.ADD).setDepth(-2000)
    this.environment.push(light);return light
  }
  private rebuild(){
    this.epochSeen=this.sim.epoch;this.follow=null
    for(const o of this.environment)o.destroy();this.environment=[];this.props.clear()
    for(const map of [this.actors,this.features,this.labels]){for(const o of map.values())o.destroy();map.clear()}
    this.tweens.killAll();this.drawEvents=[];this.water=[]
    const map=this.sim.map
    const camera=this.cameras.main;camera.setBackgroundColor(map.id==='spire'?0x131521:0x233533)
    camera.setBounds(0,0,map.w*TILE,map.h*TILE)
    for(let y=0;y<map.h;y+=16)for(let x=0;x<map.w;x+=16){
      const key=`ground-${map.id}-${x}-${y}`,w=Math.min(16,map.w-x),h=Math.min(16,map.h-y)
      if(!this.textures.exists(key))this.store(key,groundTexture(map,x,y,w,h))
      this.environment.push(this.add.image(x*TILE,y*TILE,key).setOrigin(0).setDepth(-2100))
    }
    for(const [i,p] of map.props.entries()){
      const key=`prop-${map.id}-${p.kind}-${p.variant}`
      if(!this.textures.exists(key))this.store(key,propTexture(p.kind,p.variant,map.id))
      const pic=this.add.image(p.x,p.y+7,key).setOrigin(.5,1).setDepth(p.y)
      this.environment.push(pic);this.props.set(String(i),pic)
      if(p.kind==='lamp')this.light(p.x+6,p.y-19,0xffb268,1.24,.45)
      if(p.kind==='crystal')this.light(p.x,p.y-13,p.variant%2?0xbe86c3:0x8ddfc0,1,.42)
      if(p.kind==='house'){this.light(p.x-24,p.y-10,0xffb573,1.05,.23);this.light(p.x+26,p.y-10,0xffb573,.91,.26)}
    }
    const rng=random(map.seed*1951);this.ambient=Array.from({length:map.id==='pass'?63:43},()=>({x:rng()*1280,y:rng()*710,v:5+rng()*18,p:rng()}))
    map.tiles.forEach((t,i)=>{if(t==='water'&&rng()<.34)this.water.push({x:(i%map.w+.15+rng()*.55)*TILE,y:(Math.floor(i/map.w)+.2+rng()*.62)*TILE})})
    this.updateActors()
    const p=this.sim.activeActor;camera.centerOn(p.x,p.y-16)
    if(this.sim.save.settings.motion&&this.sim.epoch>1){camera.resetFX();camera.fadeIn(270,12,19,24)}
  }
  private featureKey(name:string,variant=0){
    const key=`feature-${name}-${variant}`
    if(!this.textures.exists(key))this.store(key,featureTexture(name,variant))
    return key
  }
  private sprite(a:Actor,key:string){
    let s=this.actors.get(a.key)
    if(!s){s=this.add.sprite(a.x,a.y,key,0).setOrigin(.5,1);this.actors.set(a.key,s)}
    return s
  }
  private updateActors(){
    const t=this.sim.time
    const all=[...this.sim.party,...this.sim.enemies], ids=new Set(all.map(a=>a.key))
    for(const [id,s] of this.actors)if(!ids.has(id)){s.destroy();this.actors.delete(id)}
    for(const a of all){
      const char=a.character as Character|undefined
      const s=this.sprite(a,char?this.atlas(char):this.getEnemy(a))
      const living=this.sim.health(a)>0,body=a.foe==='warden'?88:a.foe?43:HUMAN_H,yLift=a.foe==='wisp'||a.foe==='bat'?Math.sin(t/240+a.x)*2:0
      const dir=char?DIRECTIONS.indexOf(a.facing):a.facing==='west'?1:0
      const anim=a.animation&&t<a.animation.until?a.animation:null
      const frame=!living?7:a.hurt>t?7:a.roll?8:anim?anim.id==='slash'?5:6:a.warning?6:a.moving?1+Math.floor(t/(a.foe==='warden'?160:105))%4:a.foe==='wisp'||a.foe==='bat'||a.foe==='omen'?Math.floor(t/135)%5:0
      const death=a.deadAt?t-a.deadAt:1000
      s.setVisible(living||death<590).setFrame(dir*FRAMES+frame).setPosition(Math.round(a.x),Math.round(a.y+3+yLift+(living?0:Math.min(12,death/38)))).setDepth(a.y+(a===this.sim.activeActor ? .1 : 0))
      s.setAlpha(living?(a.effects.veil?.end??0)>t?.52:1:Math.max(0,1-death/590)).setAngle(living?a.roll?(a.aim.x<0?-1:1)*20:0:a.foe==='warden'?Math.min(11,death/50):Math.min(27,death/10)).setDisplaySize(s.frame.width,body*(living?1:Math.max(.55,1-death/1700)))
      if(a.hurt>t&&living)s.setTintFill(0xffd7bf);else if(a.vulnerable>t&&living)s.setTint(0xf1e0a4);else s.clearTint()
      if(a===this.sim.activeActor&&this.follow!==a.key){this.follow=a.key;this.cameras.main.startFollow(s,true,.13,.13,0,12)}
    }
  }
  private updateFeatures(guide:ReturnType<Game['guidance']>){
    const {mapFeatures,drops}=this.sim,needed=new Set<string>(),points=guide?.points??[],t=this.sim.time
    const track=(f:Point)=>points.some(p=>distance(f,p)<3)
    for(const f of mapFeatures){
      needed.add(f.id)
      const look=f.kind==='npc'?npcLook(f.id):undefined
      const type=f.kind==='loot'?f.item==='herb'?'herb':f.item==='ore'?'ore':'scroll':f.kind
      const variant=f.kind==='exit'?this.sim.unlocked(f)?0:1:f.kind==='rune'?f.id==='tide'?1:f.id==='thorn'?2:0:0
      const key=look?this.atlas(look):this.featureKey(type,variant)
      let pic=this.features.get(f.id)
      if(!pic){pic=this.add.image(f.x,f.y+(look?3:7),key,look?0:undefined).setOrigin(.5,1).setDepth(f.y+.06);this.features.set(f.id,pic)}
      else if(pic.texture.key!==key)pic.setTexture(key)
      if(f.kind==='rune')pic.setAlpha(this.sim.save.flags.runes||(f.id==='ember'&&this.sim.runeIndex>0)||(f.id==='tide'&&this.sim.runeIndex>1)?1:.62)
      if(f.kind==='npc'&&(track(f)||distance(this.sim.activeActor,f)<63)||f.kind==='exit'||track(f)&&f.kind!=='loot'){
        const label=this.label(f.id,f.name);label.setPosition(Math.round(f.x),Math.round(f.y-(look?45:31))).setVisible(true).setColor(track(f)?'#f4d693':f.kind==='exit'?(variant?'#b0aaa0':'#b0ded1'):'#e4d7bc')
      }else this.labels.get(f.id)?.setVisible(false)
      if(track(f))this.diamond(this.glow,f.x,f.y-(look?56:42)+Math.sin(t/330)*2,markGold,4)
      if(!look&&['exit','shrine','rune'].includes(f.kind)){
        this.scenery.lineStyle(1,variant?0xb9aa90:f.kind==='shrine'?markGold:0x92d6bc,.19+Math.sin(this.frameTime/540)*.055).strokeEllipse(f.x,f.y,f.kind==='exit'?30:25,9)
      }
    }
    for(const d of drops){
      needed.add(d.key);const key=this.featureKey(d.gold?'coin':d.stack?.id==='dispatch'?'scroll':'drop');let slot=this.features.get(d.key)
      if(!slot){slot=this.add.image(d.x,d.y+7,key).setOrigin(.5,1).setDepth(d.y);this.features.set(d.key,slot)}
      slot.y=d.y+7+Math.round(Math.sin(t/270+d.x)*1.5)
      const tint=d.stack?.id==='shard'?0xefbcf6:d.gold?markGold:0xd6bade
      this.scenery.lineStyle(1,tint,.32).strokeEllipse(d.x,d.y,17,5)
      this.glow.lineStyle(1,tint,.18).lineBetween(d.x,d.y-13,d.x,d.y-22-Math.sin(t/290)*3)
    }
    for(const [id,o] of this.features)if(!needed.has(id)){o.destroy();this.features.delete(id);this.labels.get(id)?.destroy();this.labels.delete(id)}
    if(this.sim.map.id==='spire'&&!this.sim.gate){
      const g=this.glow;g.lineStyle(2,0x78c5c0,.77);for(let i=0;i<7;i++)g.lineBetween(600+i*2,318,600+i*2,400);g.fillStyle(0x47878f,.2).fillRect(600,317,13,83)
    }
  }
  private label(key:string,text:string){
    let l=this.labels.get(key)
    if(!l){l=this.add.text(0,0,text,{fontFamily:'DM Sans, sans-serif',fontSize:'9px',color:'#eadbbd',stroke:'#101b21',strokeThickness:3,fontStyle:'bold',resolution:2}).setOrigin(.5,1).setDepth(3100);this.labels.set(key,l)}
    return l
  }
  private diamond(g:Phaser.GameObjects.Graphics,x:number,y:number,tint:number,size:number){
    g.fillStyle(0x121a21,.8).fillTriangle(x,y-size-2,x-size-2,y,x,y+size+2).fillTriangle(x,y-size-2,x+size+2,y,x,y+size+2)
    g.lineStyle(1,tint,.92).strokePoints([{x,y:y-size},{x:x+size,y},{x,y:y+size},{x:x-size,y}],true);g.fillStyle(tint,1).fillRect(Math.round(x)-1,Math.round(y)-1,2,2)
  }
  private groundFx(guide:ReturnType<Game['guidance']>){
    const g=this.scenery,u=this.underlay,t=this.sim.time,s=this.sim.save.settings.motion, map=this.sim.map, camera=this.cameras.main
    for(const p of this.water){const phase=(t/420+p.y/8+p.x/15)%8,k=s?Math.sin(phase):.6;g.fillStyle(0xa2cbc5,.10+.13*Math.abs(k)).fillRect(Math.round(p.x+(s?k*3:0)),Math.round(p.y),3+Math.abs(k)*6,1)}
    if(s) for(const [i,p] of map.props.entries())if(p.kind==='lamp'){const k=(Math.sin(t/60+i)+Math.sin(t/34+i*7))*.72,x=p.x+6,y=p.y-26;u.fillStyle(0xffd299,.85).fillRect(Math.round(x+k),Math.round(y+k),2,3);u.fillStyle(0xffe7af,.46).fillRect(x,y-2-k,1,2)}
    const party=[...this.sim.party,...this.sim.enemies]
    for(const a of party){
      if(this.sim.health(a)<=0)continue
      const x=Math.round(a.x),y=Math.round(a.y), selected=a===this.sim.target,hero=a===this.sim.activeActor, e=a.foe?ENEMIES[a.foe]:null
      const wide=a.foe==='warden'?53:a.foe==='wolf'?32:22
      u.fillStyle(0x0d181e,.53).fillEllipse(x,y+1,wide,8)
      if(hero||selected){u.lineStyle(1,hero?0xe6d6a2:0xe99d8d,.75).strokeEllipse(x,y+1,wide+5,9);if(selected)u.fillStyle(0xcf746b,.13).fillEllipse(x,y+1,wide+5,11)}
      if(a.effects.shield){this.glow.lineStyle(1,0xa2dac2,.43).strokeEllipse(x,y-13,26,29)}
      if(a.vulnerable>t){this.glow.lineStyle(1,markGold,.63).strokeEllipse(x,y-31,44,56)}
      if(a.warning){
        const w=a.warning,k=Phaser.Math.Clamp((t-w.start)/(w.end-w.start),0,1),c=w.pattern==='summon'?0xd7ba84:0xea938d
        if(w.pattern==='bolt'||w.pattern==='barrage'){
          const fan=w.pattern==='barrage'?.35:.025,len=w.pattern==='barrage'?124:75
          u.fillStyle(c,.13+k*.15).fillTriangle(x,y,x+Math.cos(w.angle-fan)*len,y+Math.sin(w.angle-fan)*len,x+Math.cos(w.angle+fan)*len,y+Math.sin(w.angle+fan)*len)
          u.lineStyle(1,c,.77).lineBetween(x,y,x+Math.cos(w.angle)*len,y+Math.sin(w.angle)*len)
        }else{
          u.fillStyle(c,.14+k*.20).fillCircle(w.x,w.y,w.r);u.lineStyle(1,c,.84).strokeCircle(w.x,w.y,w.r);u.lineStyle(1,c,.64).strokeCircle(w.x,w.y,Math.max(2,w.r*k));
          if(w.pattern==='spikes')for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5])u.lineStyle(1,c,.62).lineBetween(w.x+Math.cos(angle)*w.r*.65,w.y+Math.sin(angle)*w.r*.65,w.x+Math.cos(angle)*w.r,w.y+Math.sin(angle)*w.r)
        }
      }
      if(e&&(selected||this.sim.health(a)<e.hp||a.threat)&&a.foe!=='warden'){
        const yy=y-heightOver(a)-6, width=28;this.glow.fillStyle(0x121920,.93).fillRect(x-width/2-1,yy-1,width+2,4);this.glow.fillStyle(selected?0xed9a82:0xb67378,1).fillRect(x-width/2,yy,width*this.sim.health(a)/e.hp,2)
        if(selected)this.label(`enemy-${a.key}`,e.name).setPosition(x,yy-3).setVisible(true).setColor('#f2d1bf');else this.labels.get(`enemy-${a.key}`)?.setVisible(false)
      }
      if(e&&guide?.points.some(p=>p===a)&&!selected&&!a.threat)this.diamond(this.glow,x,y-heightOver(a)-11,markGold,3)
    }
    for(const [key,l] of this.labels)if(key.startsWith('enemy-')&&`enemy-${this.sim.selected}`!==key)l.setVisible(false)
    const active=this.sim.activeActor
    for(const trap of this.sim.traps){u.lineStyle(1,0xa6c993,.78).strokeEllipse(trap.x,trap.y,21,13);u.strokeRect(trap.x-5,trap.y-4,10,8);u.lineBetween(trap.x-4,trap.y-3,trap.x+4,trap.y+3);u.lineBetween(trap.x+4,trap.y-3,trap.x-4,trap.y+3)}
    for(const p of this.sim.projectiles){const c=color(p.color),y=Math.round(p.y-9),x=Math.round(p.x);this.foreground.lineStyle(p.owner.foe?3:2,c,.86).lineBetween(x-p.dir.x*9,y-p.dir.y*9,x,y);this.foreground.fillStyle(0xffefc6,.87).fillRect(x-1,y-1,3,3)}
    if(this.sim.destination){const p=this.sim.destination;u.lineStyle(1,0xe4cc90,.62).strokeEllipse(p.x,p.y,11+Math.sin(t/150)*4,7);u.fillStyle(markGold,.8).fillRect(p.x,p.y,1,1)}
    if(this.sim.target&&distance(active,this.sim.target)<50&&s)this.glow.lineStyle(1,0xf3c68b,.16).lineBetween(active.x,active.y,this.sim.target.x,this.sim.target.y)
    if(s){
      const k=this.frameTime/1000,c=particleColors[map.id],v=camera.worldView,gx=this.foreground
      for(const m of this.ambient){const nx=((m.x+m.v*k*.47)%Math.max(v.width,1))+v.x,ny=((m.y+(map.id==='pass'?m.v:k%2)*k*.86)%Math.max(v.height,1))+v.y
        const alpha=.15+Math.sin(k*2+m.p*23)**2*.36
        if(map.id==='pass')gx.fillStyle(c,alpha).fillRect(Math.floor(nx),Math.floor(ny),m.p>.7?2:1,1)
        else if(map.id==='road'&&m.p>.77)gx.lineStyle(1,c,.18).lineBetween(nx,ny,nx-2,ny+7)
        else gx.fillStyle(c,alpha).fillRect(Math.round(nx),Math.round(ny),m.p>.84?2:1,map.id==='forest'&&m.p>.65?2:1)
      }
    }
  }
  private effects(){
    const t=this.frameTime,g=this.foreground,motion=this.sim.save.settings.motion
    for(const e of this.sim.consumeVisuals()){
      if(e.sound)audio.play(e.sound)
      if(e.sound==='victory')this.victoryUntil=t+5500
      if(e.kind==='step'||e.kind==='text'&&!e.text)continue
      if(e.kind==='text'){
        const label=this.add.text(Math.round(e.x),Math.round(e.y-27),e.text??'',{fontFamily:'DM Sans, sans-serif',fontSize:e.heavy?'15px':'12px',fontStyle:'bold',color:e.color,stroke:'#191824',strokeThickness:3,resolution:2}).setOrigin(.5).setDepth(3200)
        this.tweens.add({targets:label,y:label.y-(motion?27:5),alpha:0,duration:690,delay:130,onComplete:()=>label.destroy()});this.environment.push(label)
        if(this.environment.length%30===0)this.environment=this.environment.filter(o=>!!o.scene)
        continue
      }
      this.drawEvents.push({...e,born:t,duration:e.kind==='level'?860:e.kind==='death'?650:e.kind==='slash'?275:435})
      if(e.heavy&&motion&&e.kind!=='hit')this.cameras.main.shake(105,.003)
    }
    this.drawEvents=this.drawEvents.filter(e=>e.born+e.duration>t)
    for(const e of this.drawEvents){
      const f=(t-e.born)/e.duration,k=1-f,c=color(e.color),z=e.size??21,x=e.x,y=e.y-8, angle=e.angle??0, v=e.variation??0
      if(e.kind==='slash'){
        const a0=angle-.99+f*.45,a1=angle+.97+f*.60,r=z*(.65+.35*f)
        g.lineStyle(4-(f*2),c,k*.87).beginPath().arc(x,y,r,a0,a1).strokePath();g.lineStyle(1,0xfff0bf,k*.69).beginPath().arc(x,y,r+2,a0+.18,a1-.1).strokePath()
      }else if(e.kind==='burst'||e.kind==='level'||e.kind==='impact'){
        const r=z*(.35+f*.68);g.fillStyle(c,k*.11).fillCircle(x,y,r*.83);g.lineStyle(2,c,k*.63).strokeCircle(x,y,r)
        if(v===8){for(let i=0;i<11;i++){const p=i*2.4, d=z*.63*(.35+uv(i*.56)),a=x+Math.cos(p)*d,b=y+Math.sin(p)*d;g.fillStyle(c,k*.8).fillTriangle(a-3,b,a+(i%2?3:-2),b-17*k,a+4,b)}}
        else if(v%2===1||e.kind==='level')g.lineStyle(1,c,k*.69).strokePoints([{x,y:y-r},{x:x+r,y},{x,y:y+r},{x:x-r,y}],true)
        if(v%3===0)g.lineStyle(1,0xf5e5be,k*.5).strokeCircle(x,y,r*.71)
      }
      const ct=e.kind==='death'?21:e.kind==='level'?16:e.kind==='burst'||e.kind==='impact'?12:7
      for(let i=0;i<ct;i++){
        const a=i*2.399+(e.x+e.y)*.03+v*.56, d=z*(.2+f*.82)*(.32+uv(i*.382)), yy=y+Math.sin(a)*d-f*(e.kind==='heal'?32:13)
        g.fillStyle(i%4?c:0xffe8bd,k*(.45+uv(i*.145)*.45)).fillRect(Math.round(x+Math.cos(a)*d),Math.round(yy),i%5===0?3:1,i%3===0?2:1)
      }
    }
  }
  update(_time:number,delta:number){
    this.frameTime+=Math.min(delta,80)
    this.sim.advance(delta)
    if(this.epochSeen!==this.sim.epoch)this.rebuild()
    this.updateActors();this.scenery.clear();this.underlay.clear();this.glow.clear();this.foreground.clear()
    const guide=this.sim.guidance();this.updateFeatures(guide);this.groundFx(guide);this.effects()
    const sim=this.sim,map=sim.save.region,a=sim.activeActor
    const theme:Theme=sim.panel==='over'?'defeat':this.frameTime<this.victoryUntil?'victory':sim.dialog?'story':sim.bossSeen&&sim.boss?'boss':sim.enemies.some(e=>e.threat===a)?'combat':map==='pass'?'forest':map
    audio.use(theme)
  }
}
export function mountWorld(parent:HTMLElement,sim:Game){
  const size=()=>{const d=parent.getBoundingClientRect(),factor=d.width<840?1.65:Math.min(2.7,Math.max(1.9,d.width/640));return {width:Math.max(150,Math.round(d.width/factor)),height:Math.max(150,Math.round(d.height/factor))}}
  const game=new Phaser.Game({type:Phaser.AUTO,parent,...size(),backgroundColor:'#152126',pixelArt:true,roundPixels:true,
    scale:{mode:Phaser.Scale.NONE},render:{antialias:false,roundPixels:true,powerPreference:'low-power'},input:{keyboard:false,gamepad:false},
    audio:{noAudio:true},fps:{target:60},banner:false,scene:[new WorldScene(sim)]})
  const ro=new ResizeObserver(()=>{if(game.isBooted){const {width,height}=size();game.scale.resize(width,height);game.scale.updateBounds()}});ro.observe(parent)
  return ()=>{ro.disconnect();game.destroy(true)}
}
