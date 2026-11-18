import { useEffect, useRef, useState } from 'react'
import { ArrowDownToLine, ArrowRight, ArrowUpFromLine, FileArchive } from 'lucide-react'
import { ROLES } from '../data/classes'
import { MAPS } from '../data/maps'
import { beginAtAshenPass } from '../game/chapterStart'
import { audio } from '../game/audio'
import { Game } from '../game/model'
import { createSave } from '../game/progression'
import { exportSave, parseSave, readSettings, readSlots, storeSettings, writeSave } from '../game/save'
import type { Save, Settings } from '../game/types'
import { Creation, type CreationData } from '../ui/Creation'
import { ChronicleMenu } from '../ui/Chronicle'
import { Help, SettingsForm } from '../ui/settings'
import { Title, type TitlePanel } from '../ui/Title'
import { Button, DialogShell, Ornament, Sigil, SpriteArt, formatTime } from '../ui/ui'
import { GameScreen } from './GameScreen'

type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice?:Promise<{outcome:string}>}
function LoadSlots({slots,start,update}:{slots:(Save|null)[];start:(s:Save)=>void;update:()=>Promise<void>}){
  const [target,setTarget]=useState(1),[incoming,setIncoming]=useState<Save|null>(null),[message,setMessage]=useState(''),input=useRef<HTMLInputElement>(null)
  async function importFile(file:File|undefined){if(!file)return;setMessage('');setIncoming(null)
    if(file.size>1024*1024){setMessage('That file is too large to be a journey save.');return}
    try{const data=parseSave(JSON.parse(await file.text()));if(!data){setMessage('This is not a valid Eclipse of the Veil save.');return}setIncoming(data);setMessage(`Ready to import ${data.name}, level ${data.level}.`)}catch{setMessage('The save file could not be read.')}
  }
  async function confirm(){if(!incoming)return;const copy={...incoming,slot:target,updated:Math.max(Date.now(),(slots[target-1]?.updated??0)+1)}
    if(await writeSave(copy)){setMessage(`Imported ${copy.name} into slot ${target}.`);setIncoming(null);await update()}else setMessage('This browser could not write the save.')
  }
  return <div className="load-ui"><p className="muted">Three local journey slots. Export a save to keep a backup or move it to another device.</p><div className="save-list">{slots.map((s,i)=><article className="save-row" key={i}>{s?<SpriteArt look={s.hero} face/>:<div className="save-empty-icon"><FileArchive size={23}/></div>}<div><span className="eyebrow">Slot 0{i+1}</span><h3>{s?s.name:'Empty slot'}</h3><p>{s?`Lv. ${s.level} ${ROLES[s.hero.classId].name} · ${MAPS[s.region].name} · ${formatTime(s.playtime)}`:'Start a new game or import a journey.'}</p></div>{s&&<><button className="icon-button" aria-label={`Export slot ${i+1}`} title="Export save" onClick={()=>exportSave(s)}><ArrowDownToLine size={17}/></button><Button onClick={()=>start(s)}>Load <ArrowRight size={15}/></Button></>}</article>)}</div>
    <div className="import-tools"><input type="file" accept="application/json,.json" ref={input} hidden onChange={e=>{void importFile(e.target.files?.[0]);e.target.value=''}}/><Button variant="quiet" onClick={()=>input.current?.click()}><ArrowUpFromLine size={16}/> Import Save</Button>{incoming&&<><select aria-label="Import destination" value={target} onChange={e=>setTarget(Number(e.target.value))}>{slots.map((s,i)=><option key={i} value={i+1}>Slot {i+1}: {s?.name??'Empty'}</option>)}</select><Button variant="primary" onClick={()=>void confirm()}>{slots[target-1]?'Replace Save':'Import to Slot'}</Button></>}</div>{message&&<p role="status" className="import-message">{message}</p>}
  </div>
}
export default function App(){
  const [view,setView]=useState<'title'|'creation'>('title'),[entry,setEntry]=useState<1|2>(1),[slots,setSlots]=useState<(Save|null)[]>([null,null,null]),[panel,setPanel]=useState<TitlePanel|null>(null),[session,setSession]=useState<Game|null>(null),[settings,setSettings]=useState<Settings>(readSettings),[offline,setOffline]=useState(false),[install,setInstall]=useState<InstallEvent|null>(null)
  const refreshSlots=async()=>setSlots(await readSlots())
  useEffect(()=>{
    void refreshSlots()
    const unlock=()=>audio.unlock(),vis=()=>audio.visibility(document.hidden),pwa=(e:Event)=>{e.preventDefault();setInstall(e as InstallEvent)}
    window.addEventListener('pointerdown',unlock);window.addEventListener('keydown',unlock);window.addEventListener('beforeinstallprompt',pwa);document.addEventListener('visibilitychange',vis)
    let mounted=true
    if(import.meta.env.PROD&&'serviceWorker' in navigator){void navigator.serviceWorker.register('/sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{if(mounted)setOffline(true)}).catch(()=>{})}
    return ()=>{mounted=false;window.removeEventListener('pointerdown',unlock);window.removeEventListener('keydown',unlock);window.removeEventListener('beforeinstallprompt',pwa);document.removeEventListener('visibilitychange',vis);audio.dispose()}
  },[])
  useEffect(()=>{
    if(session)return
    audio.use('title');audio.set(settings)
    const esc=(e:KeyboardEvent)=>{if(e.key==='Escape'){if(panel)setPanel(null);else if(view==='creation')setView('title')}}
    window.addEventListener('keydown',esc);return ()=>window.removeEventListener('keydown',esc)
  },[settings,session,panel,view])
  function updateSettings(s:Settings){setSettings(s);storeSettings(s);audio.set(s);audio.unlock()}
  function start(s:Save){const copy=structuredClone(s);audio.set(copy.settings);audio.unlock();audio.play('ui');setPanel(null);setSession(new Game(copy,writeSave));void writeSave(copy)}
  function openCreation(chapter:1|2=1){setEntry(chapter);setPanel(null);setView('creation');audio.play('ui');void import('../game/WorldScene').catch(()=>{})}
  function create(data:CreationData){const {name,classId,skin,dye,style,slot}=data,s=createSave(name,classId,skin,dye,style,slot,settings);start(entry===2?beginAtAshenPass(s):s)}
  function goTitle(){if(session){void session.persist().then(refreshSlots);updateSettings(session.save.settings)}setSession(null);setView('title');setPanel(null)}
  if(session)return <GameScreen sim={session} onTitle={goTitle} onSettings={()=>updateSettings(session.save.settings)}/>
  if(view==='creation')return <Creation slots={slots} chapter={entry} motion={settings.motion} back={goTitle} start={create}/>
  const latest=slots.filter(s=>s!==null).sort((a,b)=>b.updated-a.updated)[0]
  const dismiss=()=>setPanel(null)
  return <>
    <Title onNew={()=>openCreation()} hasSave={!!latest} onContinue={()=>{if(latest)start(latest)}} onPanel={p=>{setPanel(p);audio.play('ui')}} mute={settings.mute} toggleMute={()=>updateSettings({...settings,mute:!settings.mute})} motion={settings.motion} offline={offline} onInstall={install?()=>{void install.prompt().then(()=>setInstall(null))}:undefined}/>
    {panel==='load'&&<DialogShell title="Load Game" kicker="Journeys" onClose={dismiss} wide><LoadSlots slots={slots} start={start} update={refreshSlots}/></DialogShell>}
    {panel==='settings'&&<DialogShell title="Settings" kicker="Options" onClose={dismiss}><SettingsForm settings={settings} onChange={updateSettings}/></DialogShell>}
    {panel==='help'&&<DialogShell title="How to Play" kicker="Field guide" onClose={dismiss} wide><Help/></DialogShell>}
    {panel==='chapter'&&<DialogShell title="Chronicle" kicker="The story so far" onClose={dismiss} wide><ChronicleMenu save={latest} onNew={()=>openCreation()} onChapterTwo={()=>openCreation(2)} onContinue={()=>{if(latest)start(latest)}}/></DialogShell>}
    {panel==='credits'&&<DialogShell title="Credits" onClose={dismiss}><div className="credits-content"><Sigil size={47}/><h3>Eclipse of the Veil</h3><Ornament/><p>An unofficial Inotia-inspired fan project. Not affiliated with or endorsed by Com2uS.</p><p>Original pixel sprites, terrain, icons, story, and synthesized score. The crimson-eclipse cover, class portraits, and select scenery were generated for this project, using the supplied showcase as visual direction.</p><p className="mini muted">Built with Phaser, React, TypeScript, Vite and Lucide. Fonts: Cinzel, Crimson Pro, and DM Sans.</p></div></DialogShell>}
  </>
}
