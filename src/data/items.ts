import type { Item, Rarity } from '../game/types'
const definitions: Item[] = [
  { id:'iron', name:'Duskforged Greatsword', detail:'A heavy blade, blackened by the forge rather than magic.', type:'Gear', slot:'Weapon', rarity:'Common', icon:'sword', attack:6, value:18, classes:['knight'] },
  { id:'daggers', name:'Wayfarer’s Knives', detail:'Balanced for the fast, certain cut.', type:'Gear', slot:'Weapon', rarity:'Common', icon:'blades', attack:5, value:17, classes:['assassin'] },
  { id:'staff', name:'Emberwood Staff', detail:'The old wood feels warm in a cold room.', type:'Gear', slot:'Weapon', rarity:'Common', icon:'wand', attack:6, value:18, classes:['warlock','priest'] },
  { id:'scepter', name:'Wayside Scepter', detail:'A modest birch wand marked with the pilgrims’ sun.', type:'Gear', slot:'Weapon', rarity:'Common', icon:'cross', attack:6, value:18, classes:['priest','warlock'] },
  { id:'bow', name:'Yew Longbow', detail:'Waxed string and pale, supple yew.', type:'Gear', slot:'Weapon', rarity:'Common', icon:'bow', attack:6, value:18, classes:['ranger'] },
  { id:'blade', name:'Militia Sword', detail:'The edge was kept sharper than the polish.', type:'Gear', slot:'Weapon', rarity:'Common', icon:'sword', attack:7, value:18, classes:['warrior','knight'] },
  { id:'edge', name:'Veil-Touched Armament', detail:'The Fracture has sharpened the form of this weapon. It takes the shape its bearer knows.', type:'Gear', slot:'Weapon', rarity:'Rare', icon:'sword', attack:17, value:118, bonus:{ STR:2, INT:2, DEX:2 }, level:2 },
  { id:'spire-weapon', name:'Root of the First Oath', detail:'The Warden’s core remembers every guardian who kept their oath.', type:'Gear', slot:'Weapon', rarity:'Epic', icon:'sparkle', attack:26, value:240, bonus:{ VIT:3, SPI:3 }, level:4 },
  { id:'buckler', name:'Tinbound Buckler', detail:'A small shield hammered out of reclaimed nails.', type:'Gear', slot:'Off-hand', rarity:'Uncommon', icon:'shield', armor:4, value:41, bonus:{ VIT:1 } },
  { id:'focus', name:'Runeclasp Focus', detail:'An engraved clasp to steady an unquiet spell.', type:'Gear', slot:'Off-hand', rarity:'Uncommon', icon:'orb', attack:3, value:38, bonus:{ SPI:2 } },
  { id:'cowl', name:'Pinewatch Cowl', detail:'Tight-woven thread keeps the night wind away.', type:'Gear', slot:'Head', rarity:'Uncommon', icon:'helmet', armor:3, value:29, bonus:{ INT:1, DEX:1 } },
  { id:'coat', name:'Roadworn Tunic', detail:'A faded tunic lined with heavy wool.', type:'Gear', slot:'Chest', rarity:'Common', icon:'mail', armor:2, value:13 },
  { id:'brigandine', name:'Guard’s Brigandine', detail:'Small, lacquered plates sewn between layers of cloth.', type:'Gear', slot:'Chest', rarity:'Rare', icon:'mail', armor:9, value:88, bonus:{ VIT:3 }, level:2 },
  { id:'wraps', name:'Warden’s Handwraps', detail:'Tough hide wrapped in pine-dyed thread.', type:'Gear', slot:'Gloves', rarity:'Uncommon', icon:'hand', armor:2, value:34, bonus:{ STR:1, DEX:2 } },
  { id:'boots', name:'Fellrunner Boots', detail:'Quiet leather with a hardened heel.', type:'Gear', slot:'Boots', rarity:'Uncommon', icon:'boots', armor:2, value:32, bonus:{ DEX:3 } },
  { id:'pendant', name:'Lanternheart Pendant', detail:'Its little warmth is a promise that someone is waiting for you.', type:'Gear', slot:'Necklace', rarity:'Rare', icon:'gem', value:83, bonus:{ SPI:4, VIT:2 } },
  { id:'ring', name:'Circle of Twine', detail:'A remembrance tied from the rope of the old bell.', type:'Gear', slot:'Ring I', rarity:'Common', icon:'ring', value:23, bonus:{ DEX:2 } },
  { id:'onyx', name:'Onyx of Two Dawns', detail:'Even a grain of reflected light has a shadow here.', type:'Gear', slot:'Ring II', rarity:'Epic', icon:'ring', value:153, bonus:{ INT:4, STR:4 } },
  { id:'crest', name:'Vigil Keeper’s Crest', detail:'An unbroken oath, worn against the heart.', type:'Gear', slot:'Accessory', rarity:'Legendary', icon:'sun', armor:3, value:280, bonus:{ VIT:4, SPI:4 } },
  { id:'sigil', name:'Echo of the Unsealed', detail:'There are two quiet voices in the stone. Neither will speak first.', type:'Gear', slot:'Accessory', rarity:'Mythic', icon:'gem', armor:5, value:500, bonus:{ STR:4, DEX:4, INT:4, VIT:4, SPI:4 } },
  { id:'hp', name:'Crimson Tonic', detail:'Restores 85 HP. A little bitter; swallow quickly.', type:'Supplies', rarity:'Common', icon:'bottle', effect:'hp', amount:85, value:14 },
  { id:'mp', name:'Azure Tonic', detail:'Restores 55 MP. Tastes of cold springwater.', type:'Supplies', rarity:'Common', icon:'bottle', effect:'mp', amount:55, value:13 },
  { id:'cleanse', name:'Pilgrim’s Prayer', detail:'A scroll that removes harmful effects.', type:'Supplies', rarity:'Uncommon', icon:'scroll', effect:'cleanse', value:22 },
  { id:'herb', name:'Moonmint', detail:'Crushed leaves have a cool, sweet scent.', type:'Materials', rarity:'Common', icon:'leaf', value:3 },
  { id:'ore', name:'Pine-Iron Ore', detail:'Blue-grey iron found where water runs under the hills.', type:'Materials', rarity:'Common', icon:'stone', value:5 },
  { id:'essence', name:'Veil Dust', detail:'Fine grains caught in the wake of corrupted creatures.', type:'Materials', rarity:'Uncommon', icon:'gem', value:8 },
  { id:'dispatch', name:'Tarek’s Dispatch', detail:'The wax has an impression of an eye drawn inside a door.', type:'Quest', rarity:'Uncommon', icon:'scroll', value:0 },
  { id:'shard', name:'The Oath Shard', detail:'It does not reflect your face. It remembers it.', type:'Quest', rarity:'Epic', icon:'gem', value:0 },
]
export const ITEMS: Record<string, Item> = Object.fromEntries(definitions.map(i => [i.id, i]))
export const RARITY: Record<Rarity,string> = { Common:'#d3d6cf', Uncommon:'#a5dd9e', Rare:'#8bc5ee', Epic:'#c8a6ef', Legendary:'#efbe74', Mythic:'#f58da8' }
export const SHOP = ['hp','mp','cleanse','buckler','cowl','focus','boots','brigandine','edge']
export const RECIPES = [
  { id:'tonic', name:'Brew Crimson Tonics', result:'hp', count:2, gold:6, needs:{ herb:2 } },
  { id:'azure', name:'Brew Azure Tonics', result:'mp', count:2, gold:6, needs:{ herb:1, essence:1 } },
  { id:'weapon', name:'Temper a Veil-Touched Armament', result:'edge', count:1, gold:38, needs:{ ore:3, essence:2 } },
  { id:'armor', name:'Forge Guard’s Brigandine', result:'brigandine', count:1, gold:32, needs:{ ore:3 } },
  { id:'clasp', name:'Inlay a Runeclasp Focus', result:'focus', count:1, gold:19, needs:{ ore:1, essence:2 } },
] as const
