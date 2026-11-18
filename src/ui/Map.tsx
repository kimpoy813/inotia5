import { useEffect, useRef, useState } from 'react'
import { LockKeyhole, MapPin } from 'lucide-react'
import { MAPS, TILE, type Ground, type MapDef } from '../data/maps'
import type { Game } from '../game/model'
import type { Point, RegionId } from '../game/types'
const colors:Record<Ground,string>={grass:'#34504a',moss:'#2c4148',path:'#8b7a56',stone:'#7b7d6d',water:'#2c5d6a',bridge:'#a1865c',wall:'#181f2c',slate:'#615871',snow:'#77939c',abyss:'#1c2a39',cobbles:'#506771',marble:'#818391',grate:'#6f7f83'}
function Texture({map,gate}:{map:MapDef;gate:boolean}){
  const ref=useRef<HTMLCanvasElement>(null)
  useEffect(()=>{const c=ref.current?.getContext('2d');if(!c)return
    for(let y=0;y<map.h;y++)for(let x=0;x<map.w;x++){
      c.fillStyle=colors[map.tiles[y*map.w+x]];c.fillRect(x,y,1,1)
      if(map.blocked[y*map.w+x]||map.id==='archive'&&!gate&&map.tiles[y*map.w+x]==='grate'){c.fillStyle='#1119227c';c.fillRect(x,y,1,1)}
    }
  },[map,gate])
  return <canvas ref={ref} width={map.w} height={map.h} aria-hidden="true"/>
}
export function MapSurface({sim,id=sim.map.id,compact=false}:{sim:Game;id?:RegionId;compact?:boolean}){
  const map=MAPS[id],current=id===sim.map.id,g=sim.guidance(),party=current?sim.party:[]
  const convert=(p:Point)=>({x:p.x/TILE,y:p.y/TILE})
  return <div className={`map-surface ${compact?'map-surface--small':''}`} style={{aspectRatio:`${map.w}/${map.h}`}} aria-hidden={compact||undefined}>
    <Texture map={map} gate={id==='archive'&&sim.save.flags['water-gates']===true}/><svg viewBox={`0 0 ${map.w} ${map.h}`} role="img" aria-label={`Topographic map of ${map.name}`}>
      {map.features.filter(f=>sim.onRoute(f)&&(f.kind==='exit'||f.kind==='shrine')).map(f=>{const {x,y}=convert(f);return f.kind==='exit'?<rect key={f.id} x={x-.65} y={y-.65} width="1.3" height="1.3" rx=".1" fill={sim.unlocked(f)?'#9fd1c1':'#a7a493'} stroke="#0c171f" strokeWidth=".32"/>:<path key={f.id} d={`M${x} ${y-1}l.88 1-.88 1-.88-1z`} fill="#7ed6c3" stroke="#192827" strokeWidth=".24"/>})}
      {current&&g?.points.map((p,i)=>{const {x,y}=convert(p);return <path key={i} d={`M${x} ${y-1.35}l1.25 1.35-1.25 1.35-1.25-1.35z`} fill="#f1c276" stroke="#392d20" strokeWidth=".34"/>})}
      {party.filter(p=>sim.health(p)>0).map(p=>{const {x,y}=convert(p);return p===sim.activeActor?<g key={p.key} transform={`translate(${x} ${y}) rotate(${Math.atan2(p.aim.y,p.aim.x)*180/Math.PI+90})`}><path d="M0 -1.55 1.2 1.16 0 .65-1.2 1.16Z" fill="#fff8d7" stroke="#1b2423" strokeWidth=".4"/></g>:<circle key={p.key} cx={x} cy={y} r=".7" fill="#a8eac5" stroke="#0f2624" strokeWidth=".24"/>})}
    </svg>
    <span className="map-north">N</span>
  </div>
}
const regions=Object.keys(MAPS) as RegionId[]
export function WorldMap({sim}:{sim:Game}){
  const [id,setId]=useState<RegionId>(sim.map.id),def=MAPS[id],goal=sim.guidance(),known=new Set<RegionId>(['village',sim.map.id])
  for(const r of known)for(const f of MAPS[r].features)if(f.to&&sim.unlocked(f))known.add(f.to.region)
  const available=(r:RegionId)=>known.has(r)
  return <div className="world-map-layout"><nav aria-label="Regions" className="region-list">{regions.map((r,i)=><button key={r} onClick={()=>setId(r)} disabled={!available(r)} aria-pressed={r===id}><span>{`0${i+1}`}</span><b>{MAPS[r].name}</b>{r===sim.map.id?<MapPin size={14}/>:!available(r)?<LockKeyhole size={13}/>:null}</button>)}</nav><div><div className="section-title">{def.name}</div><p className="muted map-description">{def.sub}</p><MapSurface sim={sim} id={id}/><div className="map-legend"><span><i/> You</span><span><i/> Objective</span><span><i/> Shrine / exit</span></div>{goal&&<p className="mini muted">Tracked: {goal.quest.title} · {MAPS[goal.map].name}</p>}</div></div>
}
