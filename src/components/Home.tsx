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
import { motion } from 'framer-motion';
import hanterbartLogo from '../assets/HANTERBART.png';
import overlayImage from '../assets/overlay.png';
import '../styles/global.css';
import { useBreakpointValue } from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavbarVisibility } from '../context/NavbarVisibilityContext';

// Create motion components
const MotionBox = motion(Box);
const MotionHeading = motion(Heading);
const MotionText = motion(Text);
const MotionImage = motion(Image);

const Home = () => {
  const bgColor = '#171923';
  const textColor = '#e2e8f0';
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [showOverlay, setShowOverlay] = useState(false);
  const [showHeader, setShowHeader] = useState(false);
  const [glitchDone, setGlitchDone] = useState(false);
  const { setNavbarVisible } = useNavbarVisibility();

  // Step 1: Glitch animation, then overlay, then header
  useEffect(() => {
    const glitchTimer = setTimeout(() => {
      setGlitchDone(true);
      setShowOverlay(true);
    }, 1200); // glitch-flash duration
    return () => clearTimeout(glitchTimer);
  }, []);

  useEffect(() => {
    setNavbarVisible(false); // Hide Navbar on mount
    return () => setNavbarVisible(true); // Restore Navbar on unmount
  }, [setNavbarVisible]);

  // Remove setTimeout for showHeader, use onAnimationComplete instead
  const handleOverlayAnimationComplete = useCallback(() => {
    setShowHeader(true);
    setNavbarVisible(true); // Show Navbar after overlay animation is complete
  }, [setNavbarVisible]);

  return (
    <Box
      bg={showOverlay ? bgColor : '#000'}
      height="100vh"
      width="100%"
      position="relative"
      overflow="auto"
      transition="background-color 1.2s cubic-bezier(0.4, 0, 0.2, 1)"
      css={{
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          width: '6px',
          background: 'rgba(0, 0, 0, 0.1)',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '24px',
        },
      }}
    >
      {/* Overlay animation */}
      <AnimatePresence>
        {showOverlay && (
          <MotionBox
            key="overlay"
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            backgroundImage={`url(${overlayImage})`}
            backgroundSize="cover"
            backgroundPosition="center"
            backgroundRepeat="no-repeat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
            pointerEvents="none"
            zIndex={0}
            onAnimationComplete={handleOverlayAnimationComplete}
          />
        )}
      </AnimatePresence>

      {/* Header animation */}
      <AnimatePresence>
        {showHeader && (
          <MotionBox
            key="header"
            position="fixed"
            top={0}
            left={0}
            right={0}
            zIndex={10}
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30, duration: 0.7 }}
            bg={useColorModeValue('gray.900', 'gray.800')}
            boxShadow="sm"
            py={2}
            px={6}
          >
            {/* You can replace this with your actual header/navbar component */}
            <Heading as="h2" size="md" color="white" fontFamily="ClashDisplay" fontWeight="700">
              Hanterbart
            </Heading>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Main content */}
      <Container
        maxW="container.lg"
        minH="100%"
        position="relative"
        zIndex={1}
        display="flex"
        alignItems="center"
        py={8}
      >
        <VStack
          spacing={6}
          align="center"
          w="100%"
          justify="center"
          marginTop={isMobile ? '0rem' : '-15rem'}
        >
          {/* LOGO always at the top */}
          {showHeader && (
            <MotionImage
              src={hanterbartLogo}
              alt="Hanterbart logo"
              boxSize="150px"
              objectFit="contain"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: 'brightness(1)',
                x: [0, -16, 16, -12, 12, -8, 8, -4, 4, 0],
                rotate: [0, -18, 18, -12, 12, -8, 8, -4, 4, 0],
              }}
              transition={{
                opacity: { duration: 1, delay: 0.2 },
                scale: { duration: 1, delay: 0.2 },
                filter: { duration: 1, delay: 0.2 },
                x: { duration: 3.2, ease: 'easeInOut' },
                rotate: { duration: 3.2, ease: 'easeInOut' },
              }}
            />
          )}

          {/* HANTERBART always in hero position */}
          <Heading
            as="h1"
            size="xl"
            textAlign="center"
            fontFamily="ClashDisplay"
            fontWeight="600"
            color={textColor}
            mb={2}
            className={!glitchDone ? 'glitch-flash' : ''}
            style={{ minHeight: '2.5rem' }}
          >
            {`<HANTERBART>`}
          </Heading>

          {/* Spineshatter-EU subtitle */}
          {showHeader && (
            <MotionText
              color="white"
              fontSize="lg"
              mb={4}
              fontFamily={"ClashDisplay"}
              fontWeight={"400"}
              mt={"-2rem"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Spineshatter-EU
            </MotionText>
          )}

          {/* Only show rest of content after overlay and header are visible */}
          {showHeader && (
            <MotionBox
              maxW="700px"
              w="100%"
              px={4}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              <VStack spacing={8}>
                <MotionText
                  fontSize="lg"
                  textAlign="center"
                  fontFamily={"Satoshi"}
                  fontWeight={"300"}
                  color={textColor}
                  lineHeight="1.7"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  Hanterbart har sin grund i privatserver-scenen. Många av oss kommer från guilden Regementet som låg under vår regi på Northdale. Samlade under en ny banner och med ny faction från gehennas och framåt föddes Hanterbart.
                  År 2019 var vi Sveriges bästa guild, i alla kategorier, och nu på Spineshatter gör vi det igen, fast större och bättre.
                </MotionText>
                <MotionText
                  fontSize="lg"
                  textAlign="center"
                  fontFamily={"Satoshi"}
                  fontWeight={"300"}
                  color={textColor}
                  lineHeight="1.7"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                >
                  Som guild så söker vi dig som älskar PvE och vill göra ditt bästa varje raid. Vi kommer aldrig ha attityden att raids enbart är för att fixa gear för PvP, men vi kommer heller aldrig ha attityden att vi är enbart här för att raida. Har någon fräckheten att vara i BRM samtidigt som oss så kommer det smälla och då räknar vi med att hela raiden agerar som en.
                </MotionText>
                <MotionText
                  fontSize="lg"
                  textAlign="center"
                  fontFamily={"Satoshi"}
                  fontWeight={"300"}
                  color={textColor}
                  lineHeight="1.7"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 1 }}
                >
                  Vi är griefers at heart och kommer aktivt underbygga konflikter med horde guilds. När de plockar songflower i Felwood kommer vi vara där. När de är påväg till BRM kommer vi vara där. När de grindar till Scarab Lord, ja ni förstår.
                </MotionText>
              </VStack>
            </MotionBox>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default Home; 