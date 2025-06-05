import { Box, HStack, Text, Tooltip } from '@chakra-ui/react';
import { memo } from 'react';
import { SignupPlayer } from '../types/firebase';

interface AbsencePlayerProps {
  player: SignupPlayer;
  userNicknames: Record<string, string>;
}

const AbsencePlayer = memo(({ player, userNicknames }: AbsencePlayerProps) => {
  const getDisplayName = () => {
    if (player.isDiscordSignup) {
      return player.discordNickname || player.username;
    }
    return player.characterName;
  };

  const content = (
    <Box
      bg="rgba(44, 49, 60, 0.95)"
      p={3}
      borderRadius="md"
      borderLeft="3px solid"
      borderLeftColor="red.400"
      cursor={player.absenceReason ? "help" : "default"}
    >
      <HStack spacing={3} justify="space-between" width="100%">
        <Text color="white" fontSize="sm">
          {getDisplayName()}
        </Text>
        {player.originalClass && (
          <Text color="gray.400" fontSize="xs" textTransform="uppercase">
            {player.originalClass}
          </Text>
        )}
      </HStack>
    </Box>
  );

  // Show tooltip for any absence that has a reason
  if (player.absenceReason) {
    return (
      <Tooltip 
        label={`Absence Reason: ${player.absenceReason}`}
        placement="top"
        hasArrow
      >
        {content}
      </Tooltip>
    );
  }

  return content;
});

AbsencePlayer.displayName = 'AbsencePlayer';

export default AbsencePlayer; 