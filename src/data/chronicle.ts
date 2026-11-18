import type { RegionId, Save } from '../game/types'

export const CHAPTERS = [
  { id:1, numeral:'I', name:'The Broken Seal', place:'Lumenford & the Hollowwood', art:'/art/eclipse-title.webp', detail:'A bell answers to your name. Beyond Lumenford, an old order remembers a promise you never made.', last:'q10' },
  { id:2, numeral:'II', name:'The Bell Below', place:'Vesperhold & the Drowned Archive', art:'/art/vesperhold.webp', detail:'The capital has been keeping peace by taking names out of the world. Cross Ashen Pass and follow the bell that was never meant to ring again.', last:'q16' },
] as const
export const regionChapter=(id:RegionId)=> ['pass','capital','archive','bellvault'].includes(id)?CHAPTERS[1]:CHAPTERS[0]
export type Echo = { id:string; title:string; region:RegionId; art:string; excerpt:string; text:string; afterQuest?:string }
export const ECHOES: Echo[] = [
  { id:'echo-watchbook', afterQuest:'q1', title:'The Empty Line', region:'village', art:'/art/opening/watchbook.webp', excerpt:'Prologue · Bess’s watchbook', text:'Bess kept two lanterns lit. One horse came home alone. I watched a name wash out of the book, but the mark on my hand still burns with its shape.' },
  { id:'echo-bellrope', title:'The Last Bellrope', region:'village', art:'/art/lumenford.webp', excerpt:'Lumenford · A lampkeeper’s note', text:'I changed the bellrope in spring. The old one had little cuts in it, one for every time the bell rang without a hand. I counted them as a child until someone taught me not to.' },
  { id:'echo-sap', title:'Before the Bargain', region:'forest', art:'/art/eclipse-title.webp', excerpt:'Hollowwood · A memory in resin', text:'There is a handprint in the sap older than the tree. A child’s voice: “I asked the guardian to remember my name. He said I ought to give him a better one.”' },
  { id:'echo-ridge', title:'A Post Left Empty', region:'pass', art:'/art/vesperhold.webp', excerpt:'Ashen Pass · A soldier’s locket', text:'First watch. Bright frost. Caldus kept the post alone so I could go down the ridge and see my daughter. The roll says there was no second watchman. I remember his boots outside the door.' },
  { id:'echo-door', title:'The Height of a Child', region:'capital', art:'/art/vesperhold.webp', excerpt:'Lantern Ward · A doorframe', text:'Year marks run up the side of the door: Meret, age six; Meret, age seven. The eighth mark has a height, but no letters. Someone tried to scrape the name out without taking away the child.' },
  { id:'echo-letter', title:'A Letter Without a Name', region:'archive', art:'/art/bell-sanctum.webp', excerpt:'Drowned Archive · A dry envelope', text:'Mira, I took the lower stairs because everyone else was taking the upper ones. If I don’t make it back, measure the door again next spring. It will still be ours. — Meret' },
  { id:'echo-watch', title:'The Unfinished Watch', region:'archive', art:'/art/bell-sanctum.webp', excerpt:'Drowned Archive · A watch roster', text:'Tarek wrote the night roster. Caldus signed it. There are several lines left over from the names Seris was told to remove. The ink hasn’t dried, although the paper has been underwater for years.' },
  { id:'echo-bell', title:'What a Bell Can Hold', region:'bellvault', art:'/art/bell-sanctum.webp', excerpt:'Vault of the Last Bell · A maker’s mark', text:'A bell can hold a note only while it is moving. We should have known that a city could not hold still forever either.' },
]
export const ECHO_BY_ID=Object.fromEntries(ECHOES.map(e=>[e.id,e])) as Record<string,Echo>
export function isEchoFound(save:Save,id:string){
  const quest=ECHO_BY_ID[id]?.afterQuest
  return save.flags[`echo:${id}`]===true || (!!quest && save.quests[quest]?.state==='done')
}

export type Person = { id:string; name:string; title:string; bio:string; art?:string; color:string; chapter:1|2 }
export const PEOPLE:Person[] = [
  { id:'tarek',name:'Captain Tarek',title:'The Fallen Commander',color:'#e0a56e',chapter:1,art:'/art/portraits/tarek.webp',bio:'An old commission, a broken nose, and a memory that won’t behave. Tarek knows the signature on the dispatch because he used to give the order.' },
  { id:'lyra',name:'Lyra',title:'The Wandering Healer',color:'#a2cabe',chapter:1,art:'/art/portraits/lyra.webp',bio:'Lyra ties a ribbon to her bag each time one of her patients dies. She ties a different colour for the people who come back.' },
  { id:'seris',name:'Seris',title:'The Lost Guardian',color:'#baa9e6',chapter:1,art:'/art/portraits/seris.webp',bio:'She can remember the correct pronunciation of dead languages, but not whether she had a sister. The waystone answers her in the same voice it uses for you.' },
  { id:'veyra',name:'Veyra',title:'The Shadow Emissary',color:'#df9297',chapter:2,art:'/art/portraits/veyra.webp',bio:'The best courier in Vesperhold lost her credentials when she refused to burn a letter. The letter is still somewhere in the city. So is Veyra.' },
  { id:'iona',name:'Archivist Iona',title:'Keeper of the Unlisted',color:'#e5b579',chapter:2,art:'/art/portraits/iona.webp',bio:'Iona kept two ledgers through the worst years of the Crown’s rule. One contains its orders. The other contains the names those orders tried to erase.' },
  { id:'malrec',name:'Lord Malrec',title:'The Eclipse Sovereign',color:'#bba8cc',chapter:2,art:'/art/portraits/malrec.webp',bio:'A guardian who heard the same voice on both sides of the seal and decided that neither side deserved to be left outside.' },
]
export const PERSON_BY_ID=Object.fromEntries(PEOPLE.map(p=>[p.id,p])) as Record<string,Person>
export const personaId=(id:string)=>({ 'veyra-city':'veyra','veyra-archive':'veyra','seris-archive':'seris' } as Record<string,string>)[id]??id
export const personFor=(id:string)=>PERSON_BY_ID[personaId(id)]
export const isPersonMet=(save:Save,id:string)=>Boolean(save.flags[`met:${id}`] || (id==='tarek'||id==='lyra' ? save.companions[id] : id==='seris' ? save.quests.q4?.progress[0] : id==='veyra' ? save.quests.q11?.progress[1] : id==='iona' ? save.quests.q12?.progress[1] : id==='malrec' ? save.quests.q15?.state==='done' : false))
export type StoryLine = string | { speaker:string; text:string }
export const BELL_REVELATION:StoryLine[]=[
  {speaker:'seris',text:'Caldus stood on the lower stair. I could see his glove through the bars. The order said to wait for the second bell. I could have reached for his hand.'},
  {speaker:'tarek',text:'He used to carry a spare glove. He knew I always lost one. I remembered that and never wondered who it belonged to.'},
  {speaker:'seris',text:'Malrec said the seal would take the names first, and the bodies would pass in peace. It took the names. The bodies stayed.'},
  {speaker:'seris',text:'The bell won’t let him stop guarding the vault. Find his clapper and bring it to the altar. Let him hear his own name one last time.'},
]
export const BELL_VISION:StoryLine[]=[
  {speaker:'malrec',text:'Caldus used to carry a second glove for the boy beside him. Do you suppose the Veil forgot that too, or only the boy?'},
  {speaker:'malrec',text:'I made the order, Veilbound. I believed silence could keep the city alive. When my own son’s name stopped answering, I finally understood what I had asked of everyone else.'},
  {speaker:'seris',text:'A life is not an entry in a ledger. You cannot just tear one side out and call the book whole.'},
  {speaker:'malrec',text:'Then you had better keep the book. The Crown has already sent people to burn it.'},
]
