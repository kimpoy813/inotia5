import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, MapPin, SkipForward } from 'lucide-react'
import { ROLES } from '../data/classes'
import { CHAPTERS, personFor } from '../data/chronicle'
import { npcLook } from '../data/npcs'
import { OPENINGS, type ChapterNumber } from '../data/opening'
import { audio } from '../game/audio'
import type { CreationData } from './Creation'
import { Button, Ornament, Sigil, SpriteArt } from './ui'

type OpeningProps = { chapter: ChapterNumber; motion: boolean; back: () => void } & (
  { draft: CreationData; enter: () => void } | { draft?: never; enter?: never }
)
const labelNumber = (i: number) => String(i + 1).padStart(2, '0')

export function Opening({ chapter, draft, motion, back, enter }: OpeningProps) {
  const scenes = OPENINGS[chapter], info = CHAPTERS[chapter - 1]
  const [step, setStep] = useState(0)
  const heading = useRef<HTMLHeadingElement>(null)
  const scene = scenes[step], last = step === scenes.length - 1
  const speaker = scene.line?.speaker
  const portrait = speaker && personFor(speaker)?.art
  const reading = !enter
  const title = chapter === 1 ? 'Prologue' : 'Chapter I recap'

  useEffect(() => {
    window.scrollTo(0, 0)
    heading.current?.focus({ preventScroll: true })
  }, [step])
  useEffect(() => {
    const arrow = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat || e.altKey || e.metaKey || e.ctrlKey) return
      const offset = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0
      const to = step + offset
      if (!offset || to < 0 || to >= scenes.length) return
      e.preventDefault(); audio.play(to === 2 && chapter === 1 ? 'bell' : 'ui'); setStep(to)
    }
    window.addEventListener('keydown', arrow)
    return () => window.removeEventListener('keydown', arrow)
  }, [chapter, scenes.length, step])

  const turn = (to: number) => {
    audio.play(to === 2 && chapter === 1 ? 'bell' : 'ui')
    setStep(to)
  }
  const next = last ? enter ?? back : () => turn(step + 1)

  return <main className={`opening-screen ${motion ? '' : 'no-motion'}`} aria-label={title}>
    <div className="opening-backdrop" style={{ backgroundImage: `url(${scene.art})` }} aria-hidden="true" />
    <div className="opening-wrap">
      <header className="opening-masthead">
        <button className="back-button" onClick={back}><ArrowLeft size={17}/><span>{reading ? 'Back to Chronicle' : 'Back to hero'}</span></button>
        <div className="brand"><Sigil size={33}/><div><b>Veilbound</b><span>Chronicles</span></div></div>
        {enter ? <button className="opening-skip" onClick={enter}>{chapter === 1 ? 'Skip prologue' : 'Skip recap'}<SkipForward size={15}/></button> : <span className="opening-read-label"><BookOpen size={14}/> Story reader</span>}
      </header>
      <article className="opening-book" style={{ '--scene-accent': scene.accent } as CSSProperties}>
        <i className="corner corner--tl" aria-hidden="true"/><i className="corner corner--tr" aria-hidden="true"/>
        <i className="corner corner--bl" aria-hidden="true"/><i className="corner corner--br" aria-hidden="true"/>
        <figure className="opening-illustration" key={scene.id}>
          <img src={scene.art} alt="" style={{ objectPosition: scene.focus }}/>
          <span className="opening-plate" aria-hidden="true">{labelNumber(step)}</span>
          <figcaption><span><MapPin size={13}/> {scene.place}</span><small>{scene.moment}</small></figcaption>
        </figure>
        <section className="opening-panel" aria-labelledby="opening-title">
          <div className="opening-section-label"><BookOpen size={16}/><span>{title}</span><i/><span>{info.name}</span></div>
          <div className="opening-copy" key={scene.id}>
            <h1 id="opening-title" ref={heading} tabIndex={-1}>{scene.title}</h1>
            <Ornament className="opening-rule"/>
            <p>{scene.text}</p>
            {scene.line && <div className="opening-quote">
              <div className="opening-speaker-art" aria-hidden="true">{portrait ? <img src={portrait} alt=""/> : speaker && <SpriteArt look={npcLook(speaker)} face person={speaker}/>}</div>
              <div><span className="opening-speaker">{speaker === 'bess' ? 'Bess · Lampkeeper' : 'Captain Tarek'}</span><blockquote>{scene.line.text}</blockquote></div>
            </div>}
          </div>
          <div className="opening-controls">
            <ol className="opening-pages" aria-label={`Scene ${step + 1} of ${scenes.length}`}>
              {scenes.map((p, i) => <li key={p.id} className={i < step ? 'read' : ''} aria-current={i === step ? 'step' : undefined}>{labelNumber(i)}</li>)}
            </ol>
            <div className="opening-actions">
              <button type="button" className="opening-previous" disabled={step === 0} aria-label="Previous scene" title="Previous scene · Left arrow" onClick={() => turn(step - 1)}><ArrowLeft size={18}/></button>
              <Button variant="primary" className="opening-next" onClick={next}>{reading && last ? 'Return to Chronicle' : scene.next}<ArrowRight size={17}/></Button>
            </div>
          </div>
        </section>
      </article>
      <footer className="opening-footer">
        {draft ? <div className="opening-hero"><SpriteArt look={draft} face/><span><b>{draft.name.trim() || 'Aster'}</b><small>{ROLES[draft.classId].name} · Slot {draft.slot}</small></span></div> : <span>Chronicle · Chapter {info.numeral}</span>}
        <span className="opening-key-hint"><kbd>←</kbd><kbd>→</kbd> Turn the page</span>
      </footer>
    </div>
  </main>
}
