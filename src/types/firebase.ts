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
}

export interface EventSignup {
  userId: string;
  username: string;
  character: Character;
  signupDate: Date;
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
  signups: {
    [userId: string]: {
      userId: string;
      username: string;
      characterId: string;
      characterName: string;
      characterClass: string;
      characterRole: string;
    };
  };
  raidComposition?: {
    lastUpdated: Date | Timestamp;
    updatedBy: string;
    groups: Array<{
      id: string;
      name: string;
      players: Array<{
        userId: string;
        username: string;
        characterId: string;
        characterName: string;
        characterClass: string;
        characterRole: string;
      }>;
    }>;
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
  resourceType: 'event' | 'user' | 'character';
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