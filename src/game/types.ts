export const ATTRIBUTES = ['STR', 'DEX', 'INT', 'VIT', 'SPI'] as const
export type Attribute = typeof ATTRIBUTES[number]
export type Attributes = Record<Attribute, number>
export const CLASSES = ['knight', 'assassin', 'warlock', 'priest', 'ranger', 'warrior'] as const
export type ClassId = typeof CLASSES[number]
export type RegionId = 'village' | 'road' | 'forest' | 'spire' | 'pass' | 'capital' | 'archive' | 'bellvault'
export type Mode = 'Aggressive' | 'Defensive' | 'Support' | 'Manual'
export const COMPANION_IDS = ['tarek', 'lyra', 'veyra'] as const
export type CompanionId = typeof COMPANION_IDS[number]
export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic'
export type Point = { x: number; y: number }
export type Facing = 'south' | 'west' | 'east' | 'north'
export const EQUIPMENT_SLOTS = ['Weapon', 'Off-hand', 'Head', 'Chest', 'Gloves', 'Boots', 'Necklace', 'Ring I', 'Ring II', 'Accessory'] as const
export type Slot = typeof EQUIPMENT_SLOTS[number]
export type StatusId = 'poison' | 'burn' | 'bleed' | 'stun' | 'slow' | 'silence' | 'sunder' | 'might' | 'regen' | 'shield' | 'root' | 'veil'
export type StatusSpec = { id: StatusId; time: number; strength?: number }
export type SkillKind = 'strike' | 'burst' | 'bolt' | 'heal' | 'ward' | 'dash' | 'trap' | 'drain' | 'purge'
export type GlyphId = 'sun' | 'sword' | 'blades' | 'flame' | 'wand' | 'cross' | 'bow' | 'shield' | 'sparkle' | 'wind' | 'target' | 'roots' | 'ghost' | 'orb' | 'waves' | 'hammer' | 'bag' | 'gem' | 'leaf' | 'bottle' | 'scroll' | 'boots' | 'helmet' | 'mail' | 'chest' | 'ring' | 'heart' | 'stone' | 'hand' | 'bell'
export type Skill = {
  id: string; owner: ClassId; name: string; desc: string; icon: GlyphId; kind: SkillKind; rankMax: number; level: number; needs?: string;
  cost: number; cd: number; power: number; range: number; radius: number; color: string; anim: 'slash' | 'cast' | 'dash'; sound: 'slash' | 'spell' | 'arrow' | 'heal';
  status?: StatusSpec; self?: StatusSpec; magic?: boolean; pierce?: boolean; hits?: number; knock?: number; cone?: boolean; flank?: boolean; focus?: boolean; pull?: boolean;
}
export type Role = { id: ClassId; name: string; epithet: string; short: string; description: string; icon: GlyphId; color: string; attrs: Attributes; weapon: string; range: number; magic: boolean; pace: number; skills: Skill[] }
export type Stack = { id: string; qty: number; plus: number }
export type Gear = Partial<Record<Slot, Stack>>
export type Item = { id: string; name: string; detail: string; type: 'Gear' | 'Supplies' | 'Materials' | 'Quest'; rarity: Rarity; icon: GlyphId; value: number; slot?: Slot; classes?: ClassId[]; bonus?: Partial<Attributes>; attack?: number; armor?: number; effect?: 'hp' | 'mp' | 'cleanse'; amount?: number; level?: number }
export type QuestEvent = 'move' | 'kill' | 'collect' | 'talk' | 'inspect' | 'visit' | 'recruit' | 'puzzle'
export type Objective = { event: QuestEvent; target?: string; count: number; label: string; map: RegionId }
export type Quest = { id: string; chapter?: 2; title: string; detail: string; category: 'Main' | 'Side'; giver: string; end: string; after?: string; next?: string; objectives: Objective[]; xp: number; gold: number; prize?: string; begin: string; finish: string[] }
export type QuestState = { state: 'active' | 'ready' | 'done'; progress: number[] }
export type Settings = { master: number; music: number; effects: number; mute: boolean; motion: boolean; difficulty: 'Story' | 'Adventure' | 'Veteran'; controls: 'Auto' | 'Always' | 'Never' }
export type Character = { classId: ClassId; skin: number; dye: number; style: number; hp: number; mp: number; equipment: Gear }
export type Companion = Character & { id: CompanionId; mode: Mode; level: number }
export type DropRecord = { key: string; x: number; y: number; stack?: Stack; gold?: number }
export type Save = {
  version: 1; slot: number; updated: number; name: string; hero: Character; level: number; xp: number; points: number; skillPoints: number; attrs: Attributes; ranks: Record<string, number>;
  bag: Stack[]; gold: number; region: RegionId; x: number; y: number; checkpoint: { region: RegionId; x: number; y: number };
  quests: Record<string, QuestState>; tracked: string; flags: Record<string, boolean | string>; drops: Partial<Record<RegionId, DropRecord[]>>;
  companions: Partial<Record<CompanionId, Companion>>; active: CompanionId[]; controlled: 'hero' | CompanionId; playtime: number; settings: Settings;
}
