import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Compass, Feather, Sparkles } from 'lucide-react'
import { CHAPTERS, ECHOES, PEOPLE, PROLOGUE, isEchoFound, isPersonMet } from '../data/chronicle'
import { BESTIARY, ENEMIES, type EnemyId } from '../data/enemies'
import { ITEMS } from '../data/items'
import { MAPS } from '../data/maps'
import type { Save } from '../game/types'
import { enemyAtlas } from '../game/pixels'
import { Button, Ornament, Sigil } from './ui'

export function ChronicleMenu({save,onNew,onChapterTwo,onContinue}:{save?:Save;onNew:()=>void;onChapterTwo:()=>void;onContinue:()=>void}) {
  const [page,setPage]=useState<number|null>(null)
  const prologue=page===null?null:PROLOGUE[page]
  if(prologue)return <article className="chronicle-opening">
    <div className="chronicle-opening-art" style={{backgroundImage:`url(${prologue.art})`}}><Sigil size={38}/></div>
    <div className="eyebrow">{prologue.eyebrow}</div><h3>{prologue.title}</h3><Ornament/><p>{prologue.text}</p>
    <div className="chronicle-controls"><Button variant="quiet" onClick={()=>setPage(page===0?null:0)}><ArrowLeft size={15}/> Back</Button><span className="mini muted">{page!+1} / {PROLOGUE.length}</span>{page!<PROLOGUE.length-1?<Button onClick={()=>setPage(page!+1)}>Continue <ArrowRight size={15}/></Button>:<Button variant="primary" onClick={onNew}>Create Hero <ArrowRight size={15}/></Button>}</div>
  </article>
  return <><div className="chapters-grid">{CHAPTERS.map(c=>{
    const complete=save?.quests[c.last]?.state==='done',started=c.id===1?!!save:!!save?.quests.q11||save?.quests.q10?.state==='done'
    const state=complete?'Complete':started?'In progress':c.id===1?'Available':'New chapter'
    return <article className="chapter-detail-card" key={c.id} style={{'--chapter-image':`url(${c.art})`} as CSSProperties}>
      <div className="chapter-card-art"><span className="chapter-numeral">{c.numeral}</span></div>
      <div className="chapter-card-body"><div className="eyebrow"><span>Chapter {c.numeral}</span><span>{complete?<Check size={13}/>:!started&&c.id===2?<Sparkles size={12}/>:null}{state}</span></div><h3>{c.name}</h3><small><Compass size={13}/> {c.place}</small><p>{c.detail}</p>{c.id===2&&<Button className="chapter-resume" onClick={onChapterTwo}>Start in Chapter II <ArrowRight size={15}/></Button>}</div>
    </article>
  })}</div><div className="chronicle-controls"><Button variant="quiet" onClick={()=>setPage(0)}><BookOpen size={16}/> Read the Prologue</Button><Button variant="primary" onClick={save?onContinue:onNew}>{save?'Continue Journey':'Start Chapter I'} <ArrowRight size={16}/></Button></div></>
}

export const recordTabs=['Quests','People','Memories','Bestiary'] as const
export type RecordTab=typeof recordTabs[number]
function EnemyIcon({id}:{id:EnemyId}) {
  const ref=useRef<HTMLCanvasElement>(null)
  useEffect(()=>{
    const c=ref.current?.getContext('2d');if(!c)return
    const {a,w,h}=enemyAtlas(id);c.imageSmoothingEnabled=false;c.clearRect(0,0,72,68)
    const scale=Math.min(66/w,64/h,1.33),dw=Math.floor(w*scale),dh=Math.floor(h*scale)
    c.drawImage(a,0,0,w,h,Math.floor((72-dw)/2),64-dh,dw,dh)
  },[id])
  return <canvas ref={ref} width={72} height={68} aria-hidden="true"/>
}
export function FieldRecord({save,tab}:{save:Save;tab:Exclude<RecordTab,'Quests'>}){
  const entries=tab==='People'?PEOPLE.filter(p=>isPersonMet(save,p.id)):tab==='Memories'?ECHOES.filter(e=>isEchoFound(save,e.id)):BESTIARY.filter(e=>save.flags[`seen:${e.id}`]||e.id==='warden'&&save.flags['boss-cleared']||e.id==='hollow'&&save.flags['hollow-cleared'])
  const count=entries.length,total=tab==='People'?PEOPLE.length:tab==='Memories'?ECHOES.length:BESTIARY.length
  const [selected,setSelected]=useState<string>()
  const active=entries.find(e=>e.id===selected)??entries[0]
  const name=(e:typeof entries[number])=>'name' in e?e.name:'title' in e?e.title:ENEMIES[e.id].name
  return <>
    <div className="record-intro"><span>{tab==='People'?'People you have met on the journey.':tab==='Memories'?'Lost accounts and fragments you have found.':'What you have learned about the creatures of the Veil.'}</span><b>{count} / {total}</b></div>
    {!active?<div className="record-empty"><Feather size={30}/><p>{tab==='People'?'Speak to a named companion or story character.':tab==='Memories'?'Examine objects marked with a pale shard of light.':'Encounter a creature to record what you’ve learned about it.'}</p></div>:<div className="record-layout">
      <nav className="journal-list" aria-label={tab}>{entries.map(e=><button key={e.id} aria-pressed={active.id===e.id} onClick={()=>setSelected(e.id)}><b>{name(e)}</b><ChevronRight size={13}/></button>)}</nav>
      <article className="record-entry">
        {'bio' in active?<><div className="record-person" style={{'--person':active.color} as CSSProperties}>{active.art&&<img src={active.art} alt=""/>}<div><span className="eyebrow">{active.title}</span><h3>{active.name}</h3></div></div><p>{active.bio}</p></>: 'excerpt' in active?<><div className="record-landscape" style={{backgroundImage:`linear-gradient(0deg,#15242c,transparent 80%),url(${active.art})`}}/><div className="eyebrow">{MAPS[active.region].name}</div><h3>{active.title}</h3><p className="record-quote">{active.text}</p></>:<><div className="record-monster" style={{'--person':ENEMIES[active.id].color} as CSSProperties}><EnemyIcon id={active.id}/><div><span className="eyebrow">{active.habitat}</span><h3>{ENEMIES[active.id].name}</h3></div></div><p>{active.note}</p><div className="record-tell"><b>Combat tell</b><p>{active.tell}</p></div></>}
      </article>
    </div>}
  </>
}
export function Deeds({save}:{save:Save}){
  const fate=save.flags['bell-fate'],decision=save.flags.decision
  const started=save.flags['chapter-start']==='II'
  if(!fate&&!decision&&!started)return null
  return <div className="deeds"><div className="eyebrow">Your chronicle</div>{started&&<p>Started in Chapter II with the Chapter I recap.</p>}{decision&&<p><b>The Oath Shard:</b> {decision==='warned'?'Warned the kingdom':'Kept the shard hidden'}</p>}{fate&&<p><b>The recovered names:</b> {fate==='names'?'Read in public':'Sheltered with the families'} · {ITEMS[fate==='names'?'dawnseal':'cipherheart'].name}</p>}</div>
}
