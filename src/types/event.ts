export interface SignupPlayer {
  userId: string;
  username: string;
  characterId: string;
  characterName: string;
  characterClass: string;
  characterRole: string;
  discordNickname?: string;
  originalDiscordName?: string;
  isDiscordSignup?: boolean;
  spec?: string;
  absenceReason?: string;
  originalClass?: string;
} 