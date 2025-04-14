import {
  warriorIcon,
  mageIcon,
  priestIcon,
  warlockIcon,
  hunterIcon,
  paladinIcon,
  druidIcon,
  rogueIcon,
  furyIcon
} from '../assets/classes';
import protIcon from '../assets/classes/prot.png';

export type ClassIconType = 'WARRIOR' | 'MAGE' | 'PRIEST' | 'WARLOCK' | 'HUNTER' | 'PALADIN' | 'DRUID' | 'ROGUE' | 'TANK' | 'FURY';

export const CLASS_ICONS: Record<ClassIconType, string> = {
  WARRIOR: warriorIcon,
  MAGE: mageIcon,
  PRIEST: priestIcon,
  WARLOCK: warlockIcon,
  HUNTER: hunterIcon,
  PALADIN: paladinIcon,
  DRUID: druidIcon,
  ROGUE: rogueIcon,
  TANK: protIcon,
  FURY: furyIcon
};

export const CLASS_COLORS: Record<ClassIconType, string> = {
  WARRIOR: '#C69B6D',
  MAGE: '#3FC7EB',
  PRIEST: '#FFFFFF',
  WARLOCK: '#8788EE',
  HUNTER: '#AAD372',
  PALADIN: '#F48CBA',
  DRUID: '#FF7C0A',
  ROGUE: '#FFF468',
  TANK: '#C41E3A',
  FURY: '#C69B6D'
}; 