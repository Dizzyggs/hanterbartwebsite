import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Image,
  Button,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import hanterbartLogo from '../assets/HANTERBART.png';
import overlayImage from '../assets/overlay.png';
import '../styles/global.css';
import { useBreakpointValue } from '@chakra-ui/react';

const Home = () => {
  const bgColor = '#171923';
  const textColor = '#e2e8f0';
  const isMobile = useBreakpointValue({ base: true, md: false });

  return (
    <Box 
      bg={bgColor} 
      height="100vh"
      width="100%"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        backgroundImage={`url(${overlayImage})`}
        backgroundSize="cover"
        backgroundPosition="center"
        backgroundRepeat="no-repeat"
        opacity={0.15}
        pointerEvents="none"
      />
      <Container 
        maxW="container.lg" 
        height="100%" 
        position="relative" 
        zIndex={1}
        display="flex"
        alignItems="center"
      >
        <VStack 
          spacing={6} 
          align="center" 
          w="100%" 
          justify="center"
          marginTop={isMobile ? '0rem' : '-15rem'}
        >
          <Image
            src={hanterbartLogo}
            alt="Hanterbart logo"
            boxSize="150px"
            objectFit="contain"
          />
          <Heading
            as="h1"
            size="xl"
            textAlign="center"
            fontFamily="Poppins"
            fontWeight="600"
            color={textColor}
            mb={2}
          >
            Hanterbart
          </Heading>
          <Text color="white" fontSize="lg" mb={4}>Spineshatter-EU</Text>
          <VStack spacing={8} maxW="700px">
            <Text
              fontSize="lg"
              textAlign="center"
              fontFamily="Inter"
              color={textColor}
              lineHeight="1.7"
            >
              Hanterbart har sin grund i privatserver-scenen. Många av oss kommer från guilden Regementet som låg under vår regi på Northdale. Men ny faction och official servers så blir det även ett nytt namn!
            </Text>

            <Text
              fontSize="lg"
              textAlign="center"
              fontFamily="Inter"
              color={textColor}
              lineHeight="1.7"
            >
              Som guild så söker vi dig som älskar PvE och vill göra ditt bästa varje raid. Vi kommer aldrig ha attityden att raids enbart är för att fixa gear för PvP, men vi kommer heller aldrig ha attityden att vi är enbart här för att raida. Har någon fräckheten att vara i BRM samtidigt som oss så kommer det smälla och då räknar vi med att hela raiden agerar som en.
            </Text>

            <Text
              fontSize="lg"
              textAlign="center"
              fontFamily="Inter"
              color={textColor}
              lineHeight="1.7"
            >
              Vi är griefers at heart och kommer aktivt underbygga konflikter med horde guilds. När de plockar songflower i Felwood kommer vi vara där. När de är påväg till BRM kommer vi vara där. När de grindar till Scarab Lord, ja ni förstår.
            </Text>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
};

export default Home; 