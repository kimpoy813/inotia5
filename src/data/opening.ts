export type ChapterNumber = 1 | 2
export type OpeningScene = {
  id: string
  title: string
  place: string
  moment: string
  art: string
  focus: string
  accent: string
  text: string
  line?: { speaker: 'bess' | 'tarek'; text: string }
  next: string
}

/** Shared by the new-journey flow and the read-only Chronicle. No plot choices or saves are created here. */
export const OPENINGS: Record<ChapterNumber, readonly OpeningScene[]> = {
  1: [
    {
      id: 'morning-bell', title: 'The Morning Bell', place: 'Lumenford Valley', moment: 'Before dawn',
      art: '/art/opening/lumen-ridge.webp', focus: '56% 52%', accent: '#e0b787',
      text: 'Before dawn, you carry a flame to the east gate. Bess sets out one lantern for each rider expected home. Two lanterns are still burning when the bell rings, though the tower has been locked all winter.',
      next: 'Go to the gate',
    },
    {
      id: 'empty-line', title: 'The Empty Line', place: 'East Gate', moment: 'First light',
      art: '/art/opening/watchbook.webp', focus: '53% 54%', accent: '#ecbd7a',
      text: 'A horse comes back without its rider. Bess opens the watchbook to tell you who is missing. The whole page is wet, but only the name beneath your thumb washes away.',
      line: { speaker: 'bess', text: 'I set out two lanterns. Don’t let anyone tell you it was one.' },
      next: 'Follow the sound',
    },
    {
      id: 'mark-answers', title: 'The Mark Answers', place: 'Lumenford Square', moment: 'Dawn',
      art: '/art/lumenford.webp', focus: '40% 56%', accent: '#c7a6e3',
      text: 'The bell rings again. The missing letters burn across your palm. And somewhere in the square, a violet spark calls out in the rider’s voice. It knows your name.',
      line: { speaker: 'tarek', text: 'I hear it too. Come into the square, but keep out of its light.' },
      next: 'Enter Lumenford',
    },
  ],
  2: [
    {
      id: 'oath-shard-recap', title: 'What the Roots Kept', place: 'The Fallen Spire', moment: 'Previously',
      art: '/art/eclipse-title.webp', focus: '68% 53%', accent: '#d5b29b',
      text: 'At the Fallen Spire, you broke the seal and freed its guardian. The Oath Shard held a memory: two people had stood inside the seal, keeping it shut. Then a bell answered from the north.',
      next: 'Take the north road',
    },
    {
      id: 'ashen-recap', title: 'Snow on the Pass', place: 'Ashen Pass', moment: 'The next morning',
      art: '/art/opening/ashen-overlook.webp', focus: '56% 48%', accent: '#abd4dd',
      text: 'Tarek and Lyra walk beside you. Vesperhold’s courier, Veyra, waits at the overlook. Before you take the shard into the capital, she wants to know what you’re willing to tell the Crown.',
      line: { speaker: 'tarek', text: 'We’ve carried the shard this far. Let’s decide who gets to hear what it remembers.' },
      next: 'Enter Ashen Pass',
    },
  ],
}
