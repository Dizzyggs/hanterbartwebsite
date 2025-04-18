import { RaidGroup, SignupPlayer } from '../types/firebase';

type RaidGroupName = 'Raid 1-8' | 'Raid 11-18' | undefined;

export const getMRTExport = (raidGroups: RaidGroup[], groupName?: RaidGroupName): string => {
  const formatGroup = (group: RaidGroup) => {
    const lines = [];
    for (let i = 0; i < 5; i++) {
      const player = group.players[i];
      lines.push(player ? player.characterName : '-');
    }
    return lines;
  };

  const formatRaid = (groups: RaidGroup[]) => {
    // Get all group lines
    const groupLines = groups.map(group => formatGroup(group));
    let output = '';
    
    // First row of groups (0-1)
    for (let row = 0; row < 5; row++) {
      output += groupLines[0][row] + '\t' + groupLines[1][row] + '\n';
    }
    output += '\n';

    // Second row of groups (2-3)
    for (let row = 0; row < 5; row++) {
      output += groupLines[2][row] + '\t' + groupLines[3][row] + '\n';
    }
    output += '\n';

    // Third row of groups (4-5)
    for (let row = 0; row < 5; row++) {
      output += groupLines[4][row] + '\t' + groupLines[5][row] + '\n';
    }
    output += '\n';

    // Fourth row of groups (6-7)
    for (let row = 0; row < 5; row++) {
      output += groupLines[6][row] + '\t' + groupLines[7][row] + '\n';
    }
    return output;
  };

  // For Raid 1-8 export
  if (groupName === 'Raid 1-8') {
    return formatRaid(raidGroups.slice(0, 8));
  }
  // For Raid 11-18 export
  else if (groupName === 'Raid 11-18') {
    return formatRaid(raidGroups.slice(8, 16));
  }
  // For full roster export (when no groupName is provided)
  else {
    return formatRaid(raidGroups);
  }
}; 