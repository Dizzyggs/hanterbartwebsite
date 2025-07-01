import { Timestamp } from 'firebase/firestore';

export interface GuildEvent {
  id: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  createdBy: string;
  attendees: string[];
}

export interface GuildMember {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  characters: Character[];
  joinedAt: Date;
  role: 'member' | 'officer' | 'admin';
}

export interface Character {
  id: string;
  name: string;
  race: string;
  class: string;
  level: number;
  role: 'Tank' | 'Healer' | 'DPS';
  isMain: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastActive?: Date | Timestamp | null;
  warcraftLogsLink?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'officer' | 'member';
  characters?: Character[];
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date;
  avatarUrl?: string;
  discordId?: string;
  discordUsername?: string;
  discordSignupNickname?: string;
  confirmedRaider?: boolean;
}

export interface EventSignup {
  userId: string;
  username: string;
  character: Character;
  signupDate: Date;
}

export interface RaidHelperSignup {
  id: string | number;
  name: string;
  status: string;
  className?: string;
  role?: string;
  classEmoteId?: string;
  entryTime?: number;
  userId?: string;
  position?: number;
  specName?: string;
  specEmoteId?: string;
  roleName?: string;
  roleEmoteId?: string;
  tentative?: boolean;
  timestamp?: number;
  spec?: string;
  absenceReason?: string;
}

export interface RaidHelperResponse {
  signUps: RaidHelperSignup[];
  // Add other fields as needed
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  start: Date | Timestamp;
  end: Date | Timestamp;
  type: 'raid' | 'dungeon' | 'social';
  difficulty: 'normal' | 'heroic' | 'mythic';
  maxPlayers: number;
  signupType: 'manual' | 'raidhelper';
  raidHelperId?: string;
  signups: Record<string, {
    userId: string;
    username: string;
    characterId: string;
    characterName: string;
    characterClass: string;
    characterRole: string;
    absenceReason?: string;
    attendanceStatus?: 'attending' | 'absent' | 'tentative';
    originalClass?: string;
  } | null>;
  raidHelperSignups?: RaidHelperResponse;
  raidComposition?: {
    lastUpdated: Date;
    updatedBy: {
      userId: string;
      username: string;
    };
    groups: {
      id: string;
      name: string;
      players: {
        userId: string;
        username: string;
        characterId: string;
        characterName: string;
        characterClass: string;
        characterRole: string;
      }[];
    }[];
    benchedPlayers: {
      userId: string;
      username: string;
      characterId: string;
      characterName: string;
      characterClass: string;
      characterRole: string;
    }[];
  };
  createdBy: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: 'create' | 'update' | 'delete';
  resourceType: 'event' | 'user' | 'character' | 'confirmedRaider' | 'role';
  resourceId: string;
  details: string;
  timestamp: Date;
}

export interface RaidGroup {
  id: string;
  name: string;
  players: {
    userId: string;
    username: string;
    characterId: string;
    characterName: string;
    characterClass: string;
    characterRole: string;
  }[];
}

export interface SignupPlayer {
  userId: string;
  username: string;
  characterId: string;
  characterName: string;
  characterClass: string;
  characterRole: string;
  originalDiscordName?: string;
  discordNickname?: string;
  spec?: string;
  absenceReason?: string;
  attendanceStatus?: 'attending' | 'absent' | 'tentative';
  isDiscordSignup?: boolean;
  isPreview?: boolean;
  matchedPlayerId?: string;
  originalClass?: string;
  originalClassName?: string;
}

export interface RaidTemplate {
  id: string;
  name: string;
  size: number;
  duration: number;
  roles: {
    tank: number;
    healer: number;
    dps: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface RosterTemplatePlayer {
  name: string;
  class: string;
  role: string;
}

export interface RosterTemplateGroup {
  id: string;
  name: string;
  players: RosterTemplatePlayer[];
}

export interface RosterTemplate {
  id: string;
  name: string;
  groupData: RosterTemplateGroup[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
} 