import { useEffect, useId, useRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react'
import { Backpack, Bell, Circle, Cross, Droplets, Eclipse, Feather, Flame, Footprints, Gem, Ghost, Hammer, Hand, Heart, Mountain, ScanEye, ScrollText, Shield, Shirt, Sparkles, Sun, Sword, Swords, Target, TreeDeciduous, WandSparkles, Waves, Wind, X } from 'lucide-react'
import { ICON_SIZE, iconTexture } from '../game/iconArt'
import { HUMAN_H, HUMAN_W, PORTRAIT_H, PORTRAIT_W, human, portrait } from '../game/peopleArt'
import { FOOT_PAD } from '../game/pixelInk'
import type { GlyphId } from '../game/types'
import type { Look } from '../data/npcs'
function BowGlyph({size=20,className,strokeWidth=1.55}:{size?:number;className?:string;strokeWidth?:number}){return <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 19A12 12 0 0 0 5 5l7 7-7 7Zm3-7h13m-4-3 4 3-4 3"/></svg>}
const glyphs={ sun:Sun,sword:Sword,blades:Swords,flame:Flame,wand:WandSparkles,cross:Cross,bow:BowGlyph,shield:Shield,sparkle:Sparkles,wind:Wind,target:Target,roots:TreeDeciduous,ghost:Ghost,orb:Eclipse,waves:Waves,hammer:Hammer,bag:Backpack,gem:Gem,leaf:Feather,bottle:Droplets,scroll:ScrollText,boots:Footprints,helmet:ScanEye,mail:Shirt,chest:Backpack,ring:Circle,heart:Heart,stone:Mountain,hand:Hand,bell:Bell }
export function Glyph({id,size=20,className}:{id:GlyphId;size?:number;className?:string}) {const Icon=glyphs[id];return <Icon size={size} className={className} strokeWidth={1.55} aria-hidden="true"/>}
export function Sigil({size=38,className}:{size?:number;className?:string}){return <svg width={size} height={size} viewBox="0 0 44 44" className={className} fill="none" aria-hidden="true"><path d="M22 1.8 42.2 22 22 42.2 1.8 22 22 1.8Z" stroke="currentColor" strokeOpacity=".6" strokeWidth=".85"/><path d="M22 6 38 22 22 38 6 22 22 6Z" stroke="currentColor" strokeOpacity=".26" strokeWidth=".7"/><path d="M24.8 12.8a9.7 9.7 0 1 0 6.3 13.9 8.05 8.05 0 0 1-6.3-13.9Z" stroke="currentColor" strokeWidth="1.25"/><path d="m27.7 14.4 1.05 3.6 3.6 1.05-3.6 1.05-1.05 3.6-1.05-3.6-3.6-1.05 3.6-1.05 1.05-3.6Z" fill="currentColor"/><path d="m22 0 2 2-2 2-2-2 2-2Zm0 40 2 2-2 2-2-2 2-2ZM0 22l2-2 2 2-2 2-2-2Zm40 0 2-2 2 2-2 2-2-2Z" fill="currentColor"/></svg>}
export function Ornament({className=''}:{className?:string}){return <span className={`ornament ${className}`} aria-hidden="true"><i/><b/><i/></span>}
export function Button({children,variant='secondary',className='',...props}:ButtonHTMLAttributes<HTMLButtonElement>&{variant?:'primary'|'secondary'|'quiet'|'danger'}){return <button type="button" {...props} className={`button button--${variant} ${className}`}>{children}</button>}
export function PixelIcon({id,size=24,tone='#d8b17a',charged=false}:{id:GlyphId;size?:number;tone?:string;charged?:boolean}){
  const ref=useRef<HTMLCanvasElement>(null)
  useEffect(()=>{
    const c=ref.current?.getContext('2d');if(!c)return
    c.clearRect(0,0,ICON_SIZE,ICON_SIZE);c.drawImage(iconTexture(id,tone,charged),0,0)
  },[id,tone,charged])
  return <canvas ref={ref} className="pixel-icon" aria-hidden="true" width={ICON_SIZE} height={ICON_SIZE} style={{'--icon-size':`${size}px`} as CSSProperties}/>
}
export type SpritePreview='idle'|'walk'|'attack'
export function SpriteArt({look,face=false,className='',style,person,preview='idle',motion=true}:{look:Look;face?:boolean;className?:string;style?:CSSProperties;person?:string;preview?:SpritePreview;motion?:boolean}){
  const ref=useRef<HTMLCanvasElement>(null)
  const {classId,dye,skin,style:hair}=look
  useEffect(()=>{
    const a=ref.current,c=a?.getContext('2d');if(!a||!c)return
    const frames=preview==='walk'?[1,2,3,4]:preview==='attack'?[0,0,classId==='knight'||classId==='assassin'||classId==='warrior'?5:6,0,0]:[0]
    const animate=motion&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let i=0
    const draw=()=>{
      c.clearRect(0,0,a.width,a.height);c.imageSmoothingEnabled=false
      if(face)portrait(c,classId,dye,skin,hair,person)
      else {c.save();c.translate(HUMAN_W/2,HUMAN_H-FOOT_PAD);human(c,classId,dye,skin,hair,preview==='attack'?'east':'south',frames[animate?i++%frames.length:preview==='attack'?2:0],person);c.restore()}
    }
    draw();if(!face&&animate&&frames.length>1){const timer=window.setInterval(draw,preview==='walk'?122:192);return ()=>window.clearInterval(timer)}
  },[classId,dye,skin,hair,face,person,preview,motion])
  return <canvas aria-hidden="true" ref={ref} className={`pixel-portrait ${className}`} width={face?PORTRAIT_W:HUMAN_W} height={face?PORTRAIT_H:HUMAN_H} style={style}/>
}
export function DialogShell({title,kicker='Veilbound Chronicles',children,onClose,wide=false,className=''}:{title:string;kicker?:string;children:ReactNode;onClose?:()=>void;wide?:boolean;className?:string}){
  const id=useId(),ref=useRef<HTMLDivElement>(null)
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null;ref.current?.focus({preventScroll:true})
    return ()=>{if(previous?.isConnected)previous.focus({preventScroll:true})}
  },[])
  return <div className={`modal-shade ${className}`} onMouseDown={e=>{if(e.target===e.currentTarget)onClose?.()}}>
    <div className={`modal ${wide?'modal--wide':''}`} role="dialog" aria-modal="true" aria-labelledby={id} ref={ref} tabIndex={-1} onKeyDown={e=>{
      if(e.key==='Tab'){
        const nodes=Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href]')??[]).filter(el=>!!el.getClientRects().length)
        const first=nodes[0],last=nodes.at(-1);if(!first)return
        if(e.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
      }
    }}>
      <div className="corner corner--tl"/><div className="corner corner--tr"/><div className="corner corner--bl"/><div className="corner corner--br"/>
      <header className="modal-header"><Sigil size={35}/><div><div className="eyebrow">{kicker}</div><h2 id={id}>{title}</h2></div>{onClose&&<button className="icon-button modal-close" aria-label="Close" onClick={onClose}><X size={18}/></button>}</header>
      <div className="modal-content">{children}</div>
    </div>
  </div>
}
export function Meter({value,max,skin,label,show=true}:{value:number;max:number;skin:'hp'|'mp'|'xp'|'boss';label:string;show?:boolean}){
  const percent=Math.min(100,Math.max(0,value/max*100||0))
  return <div className={`meter meter--${skin}`} role="meter" aria-label={label} aria-valuenow={Math.ceil(value)} aria-valuemin={0} aria-valuemax={max}>
    <span className="meter-fill" style={{width:`${percent}%`}}/>{show&&<span className="meter-label"><b>{label}</b><span>{Math.ceil(value)} <small>/</small> {max}</span></span>}
  </div>
}
export const formatTime=(n:number)=>`${Math.floor(n/3600)>0?`${Math.floor(n/3600)}h `:''}${Math.floor(n/60)%60}m ${Math.floor(n)%60}s`
