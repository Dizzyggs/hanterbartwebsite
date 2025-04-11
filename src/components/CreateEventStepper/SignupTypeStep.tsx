import {
  VStack,
  Text,
  Box,
  HStack,
  useRadioGroup,
  useTheme,
  Icon,
  Flex,
} from '@chakra-ui/react';
import { FaDiscord, FaCalendarAlt } from 'react-icons/fa';

interface SignupTypeStepProps {
  signupType: string;
  setSignupType: (type: string) => void;
}

const SignupTypeStep = ({ signupType, setSignupType }: SignupTypeStepProps) => {
  const { currentTheme } = useTheme();
  const isNeonTheme = currentTheme === 'neon';

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: 'signupType',
    defaultValue: signupType,
    onChange: setSignupType,
  });

  const group = getRootProps();

  const options = [
    {
      value: 'raidhelper',
      label: 'RaidHelper Discord Bot',
      description: 'Spelare anmäler sig via Discord',
      icon: FaDiscord,
    },
    {
      value: 'manual',
      label: 'Manual anmälan',
      description: 'Spelare anmäler sig via kalendern',
      icon: FaCalendarAlt,
    },
  ];

  return (
    <VStack spacing={4} align="stretch">
      <HStack {...group} spacing={4}>
        {options.map((option) => {
          const radio = getRadioProps({ value: option.value });
          const isChecked = signupType === option.value;

          return (
            <Box
              key={option.value}
              as="label"
              cursor="pointer"
              flex="1"
            >
              <input {...radio} type="radio" hidden />
              <HStack spacing={3}>
                <Flex
                  w="40px"
                  h="40px"
                  bg={isChecked ? (isNeonTheme ? 'primary.500' : 'blue.500') : 'transparent'}
                  border="2px solid"
                  borderColor={isChecked ? (isNeonTheme ? 'primary.500' : 'blue.500') : 'whiteAlpha.300'}
                  borderRadius="md"
                  align="center"
                  justify="center"
                  transition="all 0.2s"
                  _hover={{
                    borderColor: isNeonTheme ? 'primary.400' : 'blue.400',
                  }}
                >
                  <Icon
                    as={option.icon}
                    boxSize={5}
                    color={isChecked ? 'white' : 'whiteAlpha.600'}
                  />
                </Flex>
                <VStack align="start" spacing={0}>
                  <Text color="text.primary">{option.label}</Text>
                  <Text fontSize="sm" color="text.secondary">{option.description}</Text>
                </VStack>
              </HStack>
            </Box>
          );
        })}
      </HStack>
    </VStack>
  );
};

export default SignupTypeStep; 