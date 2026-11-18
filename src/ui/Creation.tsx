import { useState, type CSSProperties, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, ChevronDown, UserRound } from 'lucide-react'
import { DYES, ROLES, SKINS } from '../data/classes'
import { ATTRIBUTES, CLASSES, type ClassId, type Save } from '../game/types'
import { Button, Glyph, Ornament, Sigil, SpriteArt } from './ui'
export type CreationData={name:string;classId:ClassId;skin:number;dye:number;style:number;slot:number}
export function Creation({slots,back,start}:{slots:(Save|null)[];back:()=>void;start:(d:CreationData)=>void}){
  const [classId,setClass]=useState<ClassId>('knight'),[name,setName]=useState(''),[skin,setSkin]=useState(0),[dye,setDye]=useState(0),[style,setStyle]=useState(0),[slot,setSlot]=useState(slots.findIndex(s=>!s)>=0?slots.findIndex(s=>!s)+1:1),[confirm,setConfirm]=useState(false)
  const role=ROLES[classId],look={classId,dye,skin,style},exists=slots[slot-1]
  const submit=(e:FormEvent)=>{e.preventDefault();if(exists&&!confirm){setConfirm(true);return}start({name,classId,dye,skin,style,slot})}
  return <main className="creation-screen">
    <header className="creation-top"><button className="back-button" onClick={back}><ArrowLeft size={16}/> <span>Back to title</span></button><div className="brand"><Sigil size={32}/><div><b>Veilbound</b><span>Chronicles</span></div></div><span className="creation-chapter">Chapter I <i/> The Broken Seal</span></header>
    <div className="creation-heading"><div className="eyebrow"><span/> The first oath <span/></div><h1>Create Your Veilbound</h1><p>Choose who will answer when the Veil calls.</p></div>
    <form className="creation-layout" onSubmit={submit}>
      <section className="creation-panel class-picker"><div className="section-title"><span>01</span> Choose a class</div><div className="class-options">{CLASSES.map(id=>{const r=ROLES[id];return <button key={id} type="button" className={`class-option ${id===classId?'selected':''}`} aria-pressed={id===classId} onClick={()=>setClass(id)} style={{'--class-color':r.color} as CSSProperties}><i><Glyph id={r.icon} size={22}/></i><span><b>{r.name}</b><small>{r.short}</small></span><span className="selection-dot"/></button>})}</div></section>
      <section className="hero-stage" style={{'--class-color':role.color} as CSSProperties} aria-label={`${role.name} character preview`}>
        <div className="hero-stage-top"><Sigil size={28}/><span>{role.epithet}</span></div>
        <div className="ward ward--big"/><div className="ward ward--inner"/><div className="stage-platform"/><SpriteArt look={look} className="stage-hero"/>
        <div className="stage-description"><Ornament/><h2>{role.name}</h2><p>{role.description}</p><div className="stage-skills">{role.skills.slice(0,2).map(s=><span key={s.id} title={s.desc}><Glyph id={s.icon} size={16}/> {s.name}</span>)}</div></div>
      </section>
      <section className="creation-panel identity-panel"><div className="section-title"><span>02</span> Define your hero</div>
        <label htmlFor="hero-name">Character name</label><div className="field-with-icon"><UserRound size={17}/><input id="hero-name" value={name} maxLength={20} onChange={e=>setName(e.target.value)} placeholder="Aster" autoComplete="off"/></div>
        <div className="appearance-label">Cloak dye</div><div className="swatches">{DYES.map((color,i)=><button key={color} type="button" style={{'--swatch':color} as CSSProperties} className={dye===i?'selected':''} aria-label={['Crimson','River teal','Wisteria','Ochre','Pine green','Silver'][i]} aria-pressed={dye===i} onClick={()=>setDye(i)}/>)}</div>
        <div className="appearance-label">Complexion</div><div className="swatches swatches--skin">{SKINS.map((color,i)=><button key={color} type="button" style={{'--swatch':color} as CSSProperties} className={skin===i?'selected':''} aria-label={`Complexion ${i+1}`} aria-pressed={skin===i} onClick={()=>setSkin(i)}/>)}</div>
        <div className="appearance-label">Hair style</div><div className="segments">{['Short','Long'].map((s,i)=><button key={s} type="button" className={i===style?'selected':''} aria-pressed={i===style} onClick={()=>setStyle(i)}>{s}</button>)}</div>
        <div className="appearance-label creation-stat-label">Starting attributes</div><div className="creation-stats">{ATTRIBUTES.map(k=><div key={k}><small>{k}</small><b>{role.attrs[k]}</b></div>)}</div>
        <label className="appearance-label" htmlFor="creation-slot">Save slot</label><div className="select-with-icon"><select id="creation-slot" value={slot} onChange={e=>{setSlot(Number(e.target.value));setConfirm(false)}}>{slots.map((s,i)=><option value={i+1} key={i}>{`Slot ${i+1} · ${s?.name??'Empty'}`}</option>)}</select><ChevronDown size={15}/></div>
        {confirm&&<p className="muted warning-text">This will replace {exists?.name} in slot {slot}.</p>}
        <Button variant="primary" type="submit" className="begin-button">{confirm?'Overwrite & Begin':'Begin Adventure'} <ArrowRight size={18}/></Button>
      </section>
    </form>
    <footer className="creation-footer">{CLASSES.length} classes <i/> One oath</footer>
  </main>
}
