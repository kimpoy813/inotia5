import { ArrowDownToLine, ArrowRight, BellRing, ChevronRight, CircleHelp, FolderOpen, Gamepad2, Keyboard, Settings2, Volume2, VolumeX } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Button, Ornament, Sigil } from './ui'
export type TitlePanel='load'|'settings'|'help'|'credits'|'chapter'
const specks=Array.from({length:23},(_,i)=>({left:`${(i*27.655+18)%100}%`,top:`${(i*19.73+29)%93}%`,animationDelay:`-${i*.774}s`,animationDuration:`${5+(i*3.2)%9}s`,opacity:.26+(i%4)*.14}))
export function Title({onNew,onContinue,onPanel,save,mute,toggleMute,motion,offline,onInstall}:{onNew:()=>void;onContinue:()=>void;onPanel:(p:TitlePanel)=>void;save?:{name:string;level:number;place:string};mute:boolean;toggleMute:()=>void;motion:boolean;offline:boolean;onInstall?:()=>void}){
  return <main className={`title-screen ${motion?'':'no-motion'}`}>
    <div className="title-art" aria-hidden="true"/><div className="title-shade" aria-hidden="true"/>
    <div className="embers" aria-hidden="true">{specks.map((s,i)=><i key={i} style={s as CSSProperties}/>)}</div>
    <div className="title-frame" aria-hidden="true"><i className="corner corner--tl"/><i className="corner corner--tr"/><i className="corner corner--bl"/><i className="corner corner--br"/><i className="frame-notch frame-notch--top"/><i className="frame-notch frame-notch--bottom"/></div>
    <header className="title-top">
      <div className="brand"><Sigil size={39}/><div><b>Veilbound</b><span>Chronicles</span></div></div>
      <div className="title-options">{onInstall&&<button className="small-icon" onClick={onInstall} aria-label="Install game"><ArrowDownToLine size={16}/><span>Install</span></button>}
        <button className="small-icon sound-button" onClick={toggleMute} aria-label={mute?'Unmute game audio':'Mute game audio'}>{mute?<VolumeX size={17} strokeWidth={1.65}/>:<Volume2 size={17} strokeWidth={1.65}/>}<span>Sound {mute?'off':'on'}</span></button></div>
    </header>
    <section className="title-main" aria-label="Main menu">
      <div className="title-kicker"><span className="kicker-line"/><span>A Veilbound chronicle</span></div>
      <h1><span>Eclipse</span><span>of the Veil</span></h1>
      <Ornament className="title-ornament"/>
      <p className="title-tagline">The bell rang from a locked tower.<br className="desktop-break"/> By dawn, a name was missing.</p>
      <div className="title-actions">
        <Button variant="primary" className="title-action title-action--new" onClick={onNew} aria-label="New Game"><BellRing size={22} strokeWidth={1.55}/><span className="title-action-copy"><b>New Game</b><small>Chapter I · Start with the prologue</small></span><ArrowRight size={17} strokeWidth={1.6}/></Button>
        <Button className="title-action title-action--continue" onClick={onContinue} aria-label="Continue" disabled={!save}><Gamepad2 size={19} strokeWidth={1.6}/><span className="title-action-copy"><b>Continue</b><small>{save?`${save.name} · Lv. ${save.level} · ${save.place}`:'No journey saved yet'}</small></span><ChevronRight size={16}/></Button>
        <Button className="title-action" onClick={()=>onPanel('load')}><FolderOpen size={19} strokeWidth={1.6}/><span>Load Game</span><ChevronRight size={16} strokeWidth={1.5}/></Button>
      </div>
      <div className="title-links"><button onClick={()=>onPanel('settings')}><Settings2 size={15} strokeWidth={1.6}/> Settings</button><i/><button onClick={()=>onPanel('help')}><CircleHelp size={15} strokeWidth={1.6}/> How to Play</button></div>
    </section>
    <button className="chapter-card" onClick={()=>onPanel('chapter')} aria-label="Open Chronicle">
      <span className="chapter-thumb"/><span className="chapter-copy"><span className="eyebrow"><i/> Story & chapters</span><b>Chronicle</b><small>The Broken Seal · The Bell Below</small></span><ChevronRight size={16} strokeWidth={1.4}/>
    </button>
    <footer className="title-footer"><span className="version"><i/> {offline?'Offline ready':'Single-player'} <span>·</span> v1.3</span><span className="control-copy"><Keyboard size={14}/> Keyboard & touch</span><button onClick={()=>onPanel('credits')}>Credits</button></footer>
  </main>
}
