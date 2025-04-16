import React, { useState, useRef } from 'react';
import {
  Box,
  SimpleGrid,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Text,
  Flex,
  IconButton,
  useColorModeValue,
  Skeleton,
  AspectRatio,
  Spinner,
  Grid,
  VStack,
  HStack,
  Badge,
  useBreakpointValue,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, InfoIcon } from '@chakra-ui/icons';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

interface MediaGalleryProps {
  images: Array<{
    url: string;
    title?: string;
    description?: string;
  }>;
  columns?: number;
}

const MediaGallery: React.FC<MediaGalleryProps> = ({ images, columns = 3 }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [showInfo, setShowInfo] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const overlayBg = useColorModeValue('rgba(255,255,255,0.9)', 'rgba(0,0,0,0.8)');
  const cardBg = useColorModeValue('white', 'gray.800');
  
  const columnCount = useBreakpointValue({ base: 1, sm: 2, md: columns });

  const handleImageClick = (index: number) => {
    setSelectedImage(index);
    setShowInfo(false);
    onOpen();

    // Start loading the clicked image with high priority
    if (imageRefs.current[index]) {
      imageRefs.current[index]?.setAttribute('loading', 'eager');
      imageRefs.current[index]?.setAttribute('fetchPriority', 'high');
    }
  };

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => new Set(prev).add(index));
  };

  const handlePrev = () => {
    setSelectedImage(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedImage(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const toggleInfo = () => {
    setShowInfo(!showInfo);
  };

  return (
    <>
      <Box
        height="calc(100vh - 200px)"
        width="100%"
        overflow="hidden"
      >
        <SimpleGrid
          columns={columnCount}
          spacing={6}
          pb={6}
          height="100%"
          overflowY="auto"
          px={4}
          sx={{
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'gray.500',
              borderRadius: '4px',
            },
          }}
        >
          {images.map((image, index) => (
            <MotionBox
              key={index}
              position="relative"
              cursor="pointer"
              overflow="hidden"
              borderRadius="xl"
              bg={cardBg}
              boxShadow="lg"
              transition="all 0.3s"
              whileHover={{ scale: 1.02 }}
              onClick={() => handleImageClick(index)}
            >
              <AspectRatio ratio={4/3}>
                <Box position="relative" width="100%" height="100%">
                  {!loadedImages.has(index) && (
                    <Flex
                      position="absolute"
                      top={0}
                      left={0}
                      right={0}
                      bottom={0}
                      bg="background.tertiary"
                      zIndex={1}
                      justify="center"
                      align="center"
                    >
                      <Spinner
                        thickness="4px"
                        speed="0.65s"
                        emptyColor="gray.600"
                        color="blue.500"
                        size="xl"
                      />
                    </Flex>
                  )}
                  <Image
                    ref={el => imageRefs.current[index] = el}
                    src={image.url}
                    alt={image.title || `Image ${index + 1}`}
                    objectFit="cover"
                    width="100%"
                    height="100%"
                    loading="lazy"
                    onLoad={() => handleImageLoad(index)}
                    opacity={loadedImages.has(index) ? 1 : 0}
                    transition="opacity 0.3s"
                  />
                  <MotionFlex
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    bg={overlayBg}
                    opacity={0}
                    transition={{ duration: 0.2 }}
                    _groupHover={{ opacity: 1 }}
                    direction="column"
                    justify="flex-end"
                    p={4}
                    initial={false}
                  >
                    {image.title && (
                      <Text
                        fontSize="lg"
                        fontWeight="bold"
                        color="text.primary"
                        mb={2}
                      >
                        {image.title}
                      </Text>
                    )}
                    {image.description && (
                      <Text
                        fontSize="sm"
                        color="text.secondary"
                        noOfLines={2}
                      >
                        {image.description}
                      </Text>
                    )}
                  </MotionFlex>
                </Box>
              </AspectRatio>
            </MotionBox>
          ))}
        </SimpleGrid>
      </Box>

      <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        size="full"
        motionPreset="slideInBottom"
      >
        <ModalOverlay backdropFilter="blur(10px)" bg="rgba(0,0,0,0.8)" />
        <ModalContent bg="transparent" boxShadow="none">
          <ModalCloseButton 
            color="white" 
            size="lg" 
            zIndex={2}
            top={4}
            right={4}
          />
          <ModalBody p={0}>
            <Flex 
              position="relative" 
              justify="center" 
              align="center" 
              minH="100vh"
              direction="column"
            >
              <Box 
                position="relative" 
                width="100%" 
                height="100vh"
                display="flex"
                justifyContent="center"
                alignItems="center"
              >
                {!loadedImages.has(selectedImage) && (
                  <Flex
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    bg="transparent"
                    zIndex={1}
                    justify="center"
                    align="center"
                  >
                    <Spinner
                      thickness="4px"
                      speed="0.65s"
                      color="blue.500"
                      size="xl"
                    />
                  </Flex>
                )}
                <Image
                  src={images[selectedImage].url}
                  alt={images[selectedImage].title || `Image ${selectedImage + 1}`}
                  objectFit="contain"
                  maxH="90vh"
                  maxW="90vw"
                  borderRadius="lg"
                  boxShadow="2xl"
                  loading="eager"
                  fetchPriority="high"
                />
                
                <HStack 
                  position="absolute" 
                  bottom={4} 
                  left="50%" 
                  transform="translateX(-50%)"
                  spacing={4}
                  bg="rgba(0,0,0,0.6)"
                  borderRadius="full"
                  px={4}
                  py={2}
                >
                  <IconButton
                    aria-label="Previous image"
                    icon={<ChevronLeftIcon />}
                    onClick={handlePrev}
                    variant="ghost"
                    color="white"
                    _hover={{ bg: 'whiteAlpha.200' }}
                    size="lg"
                  />
                  <Text color="white">
                    {selectedImage + 1} / {images.length}
                  </Text>
                  <IconButton
                    aria-label="Next image"
                    icon={<ChevronRightIcon />}
                    onClick={handleNext}
                    variant="ghost"
                    color="white"
                    _hover={{ bg: 'whiteAlpha.200' }}
                    size="lg"
                  />
                </HStack>

                <IconButton
                  aria-label="Toggle info"
                  icon={<InfoIcon />}
                  position="absolute"
                  top={4}
                  right={20}
                  onClick={toggleInfo}
                  variant="ghost"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.200' }}
                />

                <MotionFlex
                  position="absolute"
                  top={0}
                  right={0}
                  width="300px"
                  height="100%"
                  bg="rgba(0,0,0,0.8)"
                  p={6}
                  initial={{ x: 300 }}
                  animate={{ x: showInfo ? 0 : 300 }}
                  transition={{ duration: 0.3 }}
                >
                  {images[selectedImage].title && (
                    <VStack align="start" spacing={4}>
                      <Text color="white" fontSize="2xl" fontWeight="bold">
                        {images[selectedImage].title}
                      </Text>
                      {images[selectedImage].description && (
                        <Text color="gray.300">
                          {images[selectedImage].description}
                        </Text>
                      )}
                    </VStack>
                  )}
                </MotionFlex>
              </Box>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default MediaGallery; 