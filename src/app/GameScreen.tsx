import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type PointerEvent as ReactPointer } from 'react'
import { ArrowRight, BookOpen, ChevronDown, ChevronRight, CircleCheck, Compass, Crosshair, Gem, Menu, ScrollText, Shield, Sparkles, Users, Volume2, VolumeX } from 'lucide-react'
import { CHAPTERS, personFor, regionChapter } from '../data/chronicle'
import { COMPANIONS, ROLES } from '../data/classes'
import { ENEMIES } from '../data/enemies'
import { MAPS } from '../data/maps'
import { npcLook } from '../data/npcs'
import { audio } from '../game/audio'
import { countItem } from '../game/inventory'
import { Game, type Panel } from '../game/model'
import { statsOf, xpRequired } from '../game/progression'
import { MapSurface } from '../ui/Map'
import { GamePanel } from '../ui/Panels'
import { Button, Meter, PixelIcon, Sigil, SpriteArt } from '../ui/ui'
const MOVES=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight'])
const menu:Record<string,Panel>={KeyI:'inventory',KeyC:'character',KeyK:'skills',KeyJ:'journal',KeyM:'map',KeyP:'party'}
function GameCanvas({sim,onTitle}:{sim:Game;onTitle:()=>void}){
  const ref=useRef<HTMLDivElement>(null),[ready,setReady]=useState(false),[error,setError]=useState(false)
  useEffect(()=>{
    let end=false,cleanup:(()=>void)|undefined
    void import('../game/WorldScene').then(({mountWorld})=>{if(end||!ref.current)return;cleanup=mountWorld(ref.current,sim);setReady(true)}).catch(()=>{if(!end)setError(true)})
    return ()=>{end=true;cleanup?.()}
  },[sim])
  return <div className="world-frame"><div className="game-canvas" ref={ref} aria-label="Playable world" data-testid="world"/>{!ready&&<div className="world-loading"><Sigil size={53}/><p>{error?'The world could not be loaded.':'Opening the Veil…'}</p>{error&&<Button onClick={onTitle}>Return to Title</Button>}</div>}</div>
}
function KeyboardInput({sim}:{sim:Game}){
  useEffect(()=>{
    const down=new Set<string>()
    const update=()=>sim.setKeyboard(Number(down.has('KeyD')||down.has('ArrowRight'))-Number(down.has('KeyA')||down.has('ArrowLeft')),Number(down.has('KeyS')||down.has('ArrowDown'))-Number(down.has('KeyW')||down.has('ArrowUp')))
    const keydown=(e:KeyboardEvent)=>{
      const code=e.code||e.key,el=e.target as HTMLElement|null,editing=el?.matches('input, select, textarea, [contenteditable]')
      if((e.altKey||e.metaKey||e.ctrlKey)||editing&&code!=='Escape')return
      if(code==='Escape'){e.preventDefault();if(!e.repeat)sim.escape();return}
      if(sim.dialog){
        if((code==='KeyE'||code==='Enter'&&!el?.closest('button'))&&!e.repeat){e.preventDefault();sim.next()}
        return
      }
      if(sim.panel){if(!e.repeat&&menu[code]){e.preventDefault();sim.toggle(menu[code])}return}
      if(MOVES.has(code)){e.preventDefault();down.add(code);update();return}
      if(e.repeat)return
      if(menu[code]){e.preventDefault();sim.toggle(menu[code]);return}
      if(/^Digit[1-6]$/.test(code)){e.preventDefault();sim.useSkill(Number(code.slice(5))-1);return}
      switch(code){
        case 'Tab':e.preventDefault();sim.targetNext();break
        case 'Space':e.preventDefault();sim.dodge();break
        case 'KeyE':sim.interact();break
        case 'KeyF':sim.basicOrder();break
        case 'KeyQ':sim.potion('hp');break
        case 'KeyR':sim.potion('mp');break
        case 'F1':case 'F2':case 'F3':e.preventDefault();{const id=(['hero',...sim.save.active] as const)[Number(code.slice(1))-1];if(id)sim.control(id)}break
      }
    }
    const keyup=(e:KeyboardEvent)=>{if(down.delete(e.code))update()}
    const clear=()=>{down.clear();sim.resetInput()}
    const vis=()=>{clear();sim.visibility(document.hidden)}
    const unload=()=>{void sim.persist()}
    window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',clear);window.addEventListener('pagehide',unload);document.addEventListener('visibilitychange',vis)
    return ()=>{window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',clear);window.removeEventListener('pagehide',unload);document.removeEventListener('visibilitychange',vis);clear()}
  },[sim])
  return null
}
function Joystick({sim}:{sim:Game}){
  const ref=useRef<HTMLButtonElement>(null),active=useRef(-1),[pad,setPad]=useState({x:0,y:0})
  function steer(e:ReactPointer<HTMLButtonElement>){
    const r=ref.current?.getBoundingClientRect();if(!r||active.current!==e.pointerId)return
    const limit=r.width*.36,x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,dist=Math.hypot(x,y),rat=dist>limit?limit/dist:1
    setPad({x:x*rat,y:y*rat});sim.setStick(dist>4?x*rat/limit:0,dist>4?y*rat/limit:0)
  }
  function stop(e:ReactPointer<HTMLButtonElement>){if(active.current===e.pointerId){active.current=-1;setPad({x:0,y:0});sim.setStick(0,0)}}
  return <button ref={ref} type="button" className="joystick" aria-label="Movement joystick" onPointerDown={e=>{if(active.current!==-1)return;active.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);steer(e)}} onPointerMove={steer} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}><span style={{transform:`translate(${pad.x}px, ${pad.y}px)`}}><Compass size={22}/></span></button>
}
function PlayerHud({sim}:{sim:Game}){
  const {save,actor}=sim,a=sim.activeActor,d=statsOf(save,actor),hero=a.key==='hero',name=hero?save.name:COMPANIONS[save.controlled as keyof typeof COMPANIONS].name,potions=countItem(save.bag,'hp'),mana=countItem(save.bag,'mp')
  return <div className="player-hud">
    <section className="vitals hud-panel"><button className="hud-face" aria-label="Open Character" onClick={()=>sim.toggle('character')}><SpriteArt look={actor} face person={hero?undefined:a.key}/><span>{save.level}</span></button><div className="vitals-body"><div className="vitals-name"><strong>{name}</strong><small>Lv. {save.level}</small></div><Meter value={actor.hp} max={d.maxHp} skin="hp" label="HP"/><Meter value={actor.mp} max={d.maxMp} skin="mp" label="MP"/><Meter value={save.xp} max={xpRequired(save.level)} skin="xp" label="XP" show={false}/></div></section>
    <div className="player-status">{sim.status(a).map(s=><span key={s}><Sparkles size={11}/>{s}</span>)}</div>
    {save.active.length>0&&<div className="party-hud">{sim.party.filter(p=>p!==a).map(p=>{const c=p.character!,s=statsOf(save,c),label=p.key==='hero'?save.name:COMPANIONS[p.key as keyof typeof COMPANIONS].name;return <button key={p.key} aria-label={`Control ${label}`} disabled={!c.hp} onClick={()=>sim.control(p.key as typeof save.controlled)} className="hud-panel">{personFor(p.key)?.art?<img className="hud-portrait" src={personFor(p.key)?.art} alt=""/>:<SpriteArt look={c} face/>}<span><b>{label}</b><Meter value={c.hp} max={s.maxHp} skin="hp" label={`${label} HP`} show={false}/></span></button>})}</div>}
    <div className="tonic-strip" aria-label="Quick tonics"><button className="hud-panel tonic-hp" aria-label={`Health tonic (${potions})`} title="Health tonic · Q" onClick={()=>sim.potion('hp')}><PixelIcon id="bottle" tone="#d26777" size={18}/><kbd>Q</kbd><small>{potions}</small></button><button className="hud-panel tonic-mp" aria-label={`Mana tonic (${mana})`} title="Mana tonic · R" onClick={()=>sim.potion('mp')}><PixelIcon id="bottle" tone="#66a7dc" size={18}/><kbd>R</kbd><small>{mana}</small></button></div>
  </div>
}
function KeyPrompts({sim}:{sim:Game}){
  const f=sim.nearest()
  return <div className="interaction-area">{!sim.blocked&&f&&<button className="interaction-prompt" aria-label={`${f.action} ${f.label}`} onClick={()=>sim.interact()}><kbd>E</kbd><span><b>{f.action}</b><small>{f.label}</small></span><ChevronRight size={17}/></button>}</div>
}
function ActionBar({sim}:{sim:Game}){
  const a=sim.activeActor,r=ROLES[sim.actor.classId],busy=sim.status(a).includes('Silenced')||sim.status(a).includes('Stunned')
  return <div className="action-zone">
    <div className="action-strip hud-panel"><button className={`action-tile action-attack ${sim.auto?'engaged':''}`} onClick={()=>sim.basicOrder()} aria-label="Basic attack" title="Basic attack · F"><kbd>F</kbd><PixelIcon id="blades" tone="#e9ba79" size={34}/></button><i/>
      {r.skills.map((s,i)=>{const rank=sim.rank(a,s),seconds=Math.max(0,((a.skills[s.id]??0)-sim.time)/1000),enough=sim.actor.mp>=s.cost,ready=!!rank&&seconds<=0&&enough&&!busy
        return <button className={`action-tile skill-tile ${ready?'':'unavailable'} ${rank?'':'locked'}`} style={{'--skill-color':s.color,'--cooldown':`${100*seconds/s.cd}%`} as CSSProperties} key={s.id} aria-label={`Use ${s.name}`} aria-disabled={!ready} onClick={()=>sim.useSkill(i)} title={`${s.name} · ${i+1} · ${rank?`${s.cost} MP — ${s.desc}`:`Learn at level ${s.level}`}`}><kbd>{i+1}</kbd><PixelIcon id={s.icon} tone={s.color} size={32} charged/>{seconds>0&&<><span className="cooldown-mask"/><small className="cooldown-num">{seconds>1?Math.ceil(seconds):seconds.toFixed(1)}</small></>}{!rank&&<span className="action-lock">{s.level}</span>}</button>})}
      <i/><button className="action-tile evade-tile" title="Dodge · Space" aria-label="Dodge" onClick={()=>sim.dodge()}><kbd>Space</kbd><PixelIcon id="wind" tone="#a7bbd4" size={29}/></button><button className="action-tile target-tile" title="Select target · Tab" aria-label="Select target" onClick={()=>sim.targetNext()}><kbd>Tab</kbd><PixelIcon id="target" tone="#e5b090" size={28}/></button></div>
    <div className="action-caption"><i/>{sim.auto?'Auto-attacking':r.name}<i/></div>
  </div>
}
function ConversationUI({sim}:{sim:Game}){
  const d=sim.dialog,ref=useRef<HTMLElement>(null)
  const origin=d?.origin
  useEffect(()=>{if(origin)ref.current?.focus({preventScroll:true})},[origin])
  if(!d)return null
  const look=npcLook(d.portrait),last=d.index===d.lines.length-1,p=personFor(d.portrait),line=d.lines[d.index],text=typeof line==='string'?line:line.text
  const art=d.art&&!p?.art?d.art:undefined
  const vars={'--speaker':p?.color??'#d2b78b','--story-art':d.art?`url(${d.art})`:undefined} as CSSProperties
  return <div className={`story-shade ${d.art?'story-shade--scene':''}`}><section ref={ref} tabIndex={-1} style={vars} className={`story-panel ${p?.art||art?'story-panel--illustrated':''} ${d.art?'story-panel--scene':''}`} role="dialog" aria-modal="true" aria-label={`Conversation with ${d.speaker}`}>
    <div className="corner corner--tl"/><div className="corner corner--tr"/><div className="corner corner--bl"/><div className="corner corner--br"/>
    <div className="story-portrait" key={d.portrait}>{p?.art||art?<img src={p?.art??art} alt=""/>:look?<SpriteArt look={look} face/>:<Sigil size={49}/>}</div><div className="story-content"><header><div><span className="eyebrow">{d.caption}</span><h2>{d.speaker}</h2></div><span className="story-count">0{d.index+1} / 0{d.lines.length}</span></header><p className="story-line" aria-live="polite">{text}</p><div className="story-actions">{last&&d.choices.length?d.choices.map((choice,i)=><Button variant={i===0?'primary':'secondary'} key={i} onClick={()=>sim.choose(choice)}>{choice.label} {i===0&&<ChevronRight size={14}/>}</Button>):<Button variant="primary" onClick={()=>sim.next()}>{last?'Return':'Continue'} <ChevronRight size={16}/></Button>}<button className="story-dismiss" onClick={()=>sim.dismiss()}>Leave <kbd>Esc</kbd></button></div></div>
  </section></div>
}
export function GameScreen({sim,onTitle,onSettings}:{sim:Game;onTitle:()=>void;onSettings:()=>void}){
  useSyncExternalStore(sim.subscribe,sim.snapshot,sim.snapshot)
  const {save}=sim,target=sim.target,boss=sim.bossSeen?sim.boss:null,goal=sim.guidance(),m=MAPS[save.region],chapter=regionChapter(m.id),cleared=sim.chapterSignal&&CHAPTERS[sim.chapterSignal-1]
  const bossTell=boss?.warning?.pattern==='ring'?'Bell ring · Inside the small circle or beyond the large one':boss?.warning?.pattern==='charge'?'Charge · Move out of the lane':boss?.warning?.pattern==='fan'?'Bell bolts · Find a gap':null
  useEffect(()=>{audio.set(save.settings)},[save.settings])
  return <main className={`game-screen touch-${save.settings.controls.toLowerCase()} ${sim.blocked?'world-blocked':''} ${save.settings.motion?'':'no-motion'} region-${m.id}`}>
    <KeyboardInput sim={sim}/><GameCanvas sim={sim} onTitle={onTitle}/><div className="world-vignette"/>{m.id==='forest'&&<div className="forest-mist" aria-hidden="true"/>}
    <div className="game-hud" inert={!!sim.dialog||!!sim.panel} aria-hidden={sim.blocked||undefined}>
      <PlayerHud sim={sim}/>
      <div className="area-label" key={m.id}><Sigil size={20}/><span className="eyebrow">Chapter {chapter.numeral} · {chapter.name}</span><h1>{m.name}</h1><span className="location-rule"/></div>
      <aside className="right-hud"><div className="hud-panel map-hud"><header><span><Compass size={15}/> {m.name}</span><button className="icon-button" aria-label="Open Menu" title="Menu · Esc" onClick={()=>sim.toggle('pause')}><Menu size={17}/></button></header><button type="button" className="map-open" aria-label="Open World Map" onClick={()=>sim.toggle('map')}><MapSurface sim={sim} compact/></button></div>
        {goal?<button className="quest-widget hud-panel" onClick={()=>sim.toggle('journal')}><span className="eyebrow"><Gem size={13}/> {goal.quest.category} quest</span><strong>{goal.quest.title}</strong><small>{goal.text}</small><ChevronDown size={13}/></button>:save.quests.q16?.state==='done'&&<button className="quest-widget hud-panel" onClick={()=>sim.toggle('journal')}><span className="eyebrow"><CircleCheck size={14}/> Chapter II complete</span><strong>The Bell Below</strong><small>{save.flags['bell-fate']==='names'?'The city has heard the names.':'The families hold the names now.'}</small></button>}
      </aside>
      {boss?<div className="target-hud boss-hud" aria-label="Boss encounter"><div className="eyebrow">{boss.foe==='hollow'?'The Last Watch':'Keeper of the Oath'} · Phase {['','I','II','III'][boss.phase]}</div><h2>{ENEMIES[boss.foe!].name}</h2><Meter value={sim.health(boss)} max={sim.maxHealth(boss)} label="Boss HP" skin="boss" show={false}/>{bossTell?<small className="boss-tell">{bossTell}</small>:boss.vulnerable>sim.time&&<small>{boss.foe==='hollow'?'Armour exposed':'Heart exposed'}</small>}</div>:target&&<div className="target-hud hud-panel"><h2><Crosshair size={14}/> {ENEMIES[target.foe!].name}</h2><Meter value={sim.health(target)} max={sim.maxHealth(target)} label="Target HP" skin="hp" show={false}/>{sim.status(target).length>0&&<small>{sim.status(target).join(' · ')}</small>}</div>}
      <KeyPrompts sim={sim}/>
      <div className="joystick-wrap"><Joystick sim={sim}/></div>
      <nav className="world-tools" aria-label="Journey menus">{([{id:'inventory',name:'Inventory',key:'I',icon:'bag'},{id:'character',name:'Character',key:'C',icon:'shield'},{id:'skills',name:'Skillbook',key:'K',icon:'wand'},{id:'journal',name:'Journal',key:'J',icon:'scroll'},{id:'party',name:'Party',key:'P',icon:'hand'}] as const).map(p=><button className="hud-panel" key={p.id} aria-label={p.name} title={`${p.name} · ${p.key}`} onClick={()=>sim.toggle(p.id)}><PixelIcon id={p.icon} tone="#d3a878" size={23}/><kbd>{p.key}</kbd>{p.id==='skills'&&save.skillPoints>0&&<span className="point-dot"/>}{p.id==='character'&&save.points>0&&<span className="point-dot"/>}</button>)}</nav>
      <ActionBar sim={sim}/>
      <button className="game-sound icon-button hud-panel" title={save.settings.mute?'Enable audio':'Mute audio'} aria-label={save.settings.mute?'Enable audio':'Mute audio'} onClick={()=>{sim.settings({...save.settings,mute:!save.settings.mute});audio.set(save.settings);audio.unlock();onSettings()}}>{save.settings.mute?<VolumeX size={17}/>:<Volume2 size={17}/>}</button>
      {cleared&&!sim.blocked&&<aside className="chapter-cleared hud-panel"><CircleCheck size={18}/><div><b>{cleared.name}</b><small>Chapter {cleared.numeral} complete</small></div><button className="icon-button" aria-label="Dismiss chapter notice" onClick={()=>{sim.chapterSignal=false;sim.refresh()}}><ArrowRight size={17}/></button></aside>}
      <aside className="toast-stack" aria-live="polite">{sim.toasts.map(t=><div className={`toast ${t.kind}`} key={t.id}>{t.kind==='good'?<Sparkles size={14}/>:t.kind==='bad'?<Shield size={14}/>:<ScrollText size={14}/>}<span>{t.text}</span></div>)}</aside>
      {!sim.blocked&&sim.map.id==='village'&&save.quests.q1.state!=='done'&&<div className="tutorial-hint hud-panel"><BookOpen size={15}/><span><b>First steps</b><small>{save.quests.q1.progress[1] ? <>Speak to Tarek <kbd>E</kbd></> : save.quests.q1.progress[0]>=40 ? <>Click the spark to attack · Skill <kbd>1</kbd></> : <>Move <kbd>WASD</kbd> · Interact <kbd>E</kbd></>}</small></span></div>}
    </div>
    <ConversationUI sim={sim}/><GamePanel sim={sim} onTitle={onTitle} onSettings={onSettings}/>
    <div className="mobile-orientation" aria-hidden="true"><Users size={12}/> Rotate for more room</div>
  </main>
}
