import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Button,
  Input,
  VStack,
  Image,
  Text,
  useToast,
  IconButton,
  Flex,
  AspectRatio,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  Divider,
  HStack,
  Spinner,
  useBreakpointValue,
} from '@chakra-ui/react';
import { useState, useRef, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { storage, db } from '../firebase';
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { collection, addDoc, query, onSnapshot, Timestamp, orderBy, doc, updateDoc } from 'firebase/firestore';
import { DeleteIcon, AddIcon, DownloadIcon, ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useTheme } from '../context/ThemeContext';
import Breadcrumbs from './Breadcrumbs';

interface Comment {
  id: string;
  text: string;
  userId: string;
  username: string;
  createdAt: Date;
}

interface MediaItem {
  id: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  description?: string;
  comments: Comment[];
}

const Media = () => {
  const { user } = useUser();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageData, setSelectedImageData] = useState<MediaItem | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loadingImages, setLoadingImages] = useState<{ [key: string]: boolean }>({});
  const [loadingModalImage, setLoadingModalImage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const columns = useBreakpointValue({ base: 1, sm: 2, md: 3, lg: 5 }) || 5;
  const itemsPerPage = columns * 3; // 3 rows
  const totalPages = Math.ceil(mediaItems.length / itemsPerPage);
  
  const paginatedItems = mediaItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const { currentTheme } = useTheme();

  const isNeonTheme = currentTheme === 'neon';

  const neonButtonStyles = isNeonTheme ? {
    bg: 'primary.500',
    color: 'white',
    _hover: {
      bg: 'primary.600',
      boxShadow: '0 0 15px rgba(0, 224, 80, 0.4)',
      transform: 'translateY(-2px)'
    }
  } : {};

  useEffect(() => {
    const mediaQuery = query(collection(db, 'media'), orderBy('uploadedAt', 'desc'));
    const unsubscribe = onSnapshot(mediaQuery, (snapshot) => {
      const newMediaItems: MediaItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        newMediaItems.push({
          id: doc.id,
          url: data.url,
          uploadedBy: data.uploadedBy,
          uploadedAt: data.uploadedAt?.toDate() || new Date(),
          description: data.description,
          comments: (data.comments || []).map((comment: any) => ({
            ...comment,
            createdAt: comment.createdAt?.toDate() || new Date()
          }))
        });
      });
      setMediaItems(newMediaItems);
    });

    return () => unsubscribe();
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `media/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'media'), {
        url,
        uploadedBy: user.username,
        uploadedAt: Timestamp.now(),
        description: '',
        comments: []
      });

      toast({
        title: 'Upload successful',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Upload failed',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageLoad = (imageId: string) => {
    setLoadingImages(prev => ({
      ...prev,
      [imageId]: false
    }));
  };

  const handleModalImageLoad = () => {
    setLoadingModalImage(false);
  };

  const handleImageClick = (item: MediaItem) => {
    setSelectedImage(item.url);
    setSelectedImageData(item);
    setNewComment('');
    setLoadingModalImage(true);
    onOpen();
  };

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `hanterbart_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: 'Download failed',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handlePostComment = async (commentText: string) => {

    if (!user || !selectedImageData || !commentText.trim()) {
      console.log('Validation failed:', { user: !!user, selectedImageData: !!selectedImageData, hasComment: !!commentText.trim() });
      return;
    }

    setIsPostingComment(true);
    try {
      const newCommentId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = Timestamp.now();
      
      const comment = {
        id: newCommentId,
        text: commentText.trim(),
        userId: user.username,
        username: user.username,
        createdAt: timestamp
      };

      const mediaRef = doc(db, 'media', selectedImageData.id);
      
      const updatedComments = [
        ...selectedImageData.comments,
        { ...comment, createdAt: timestamp }
      ];

      const firestoreComments = updatedComments.map(c => ({
        ...c,
        createdAt: c.createdAt instanceof Date ? Timestamp.fromDate(c.createdAt) : c.createdAt
      }));

      await updateDoc(mediaRef, {
        comments: firestoreComments
      });

      // Update local states with Date objects
      const localComment = {
        ...comment,
        createdAt: timestamp.toDate()
      };

      const localUpdatedComments = [
        ...selectedImageData.comments,
        localComment
      ];

      setSelectedImageData(prev => {
        const updated = prev ? {
          ...prev,
          comments: localUpdatedComments
        } : null;
        return updated;
      });

      setMediaItems(prev => {
        const updated = prev.map(item => 
          item.id === selectedImageData.id 
            ? { ...item, comments: localUpdatedComments }
            : item
        );
        return updated;
      });

      setNewComment('');
      toast({
        title: 'Comment posted',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: 'Failed to post comment',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentIndex: number) => {
    if (!user || !selectedImageData) return;

    try {
      const updatedComments = [...selectedImageData.comments];
      updatedComments.splice(commentIndex, 1);

      const mediaRef = doc(db, 'media', selectedImageData.id);
      await updateDoc(mediaRef, {
        comments: updatedComments.map(comment => ({
          ...comment,
          createdAt: Timestamp.fromDate(comment.createdAt)
        }))
      });

      // Update local states
      setSelectedImageData(prev => prev ? {
        ...prev,
        comments: updatedComments
      } : null);

      setMediaItems(prev => prev.map(item => 
        item.id === selectedImageData.id 
          ? { ...item, comments: updatedComments }
          : item
      ));

      toast({
        title: 'Comment deleted',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Failed to delete comment',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const formatDate = (date: Date | null | undefined, defaultText: string = 'N/A') => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return defaultText;
    }
    try {
      return format(date, 'dd MMM yyyy', { locale: sv });
    } catch (error) {
      return defaultText;
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const CommentInput = ({ onSubmit }: { onSubmit: (text: string) => void }) => {
    const [comment, setComment] = useState('');
    const { currentTheme } = useTheme();
    const isNeonTheme = currentTheme === 'neon';

    const handleSubmit = () => {
      if (comment.trim()) {
        onSubmit(comment);
        setComment('');
      }
    };

    return (
      <VStack spacing={2} align="stretch" mt={4}>
        <Textarea
          value={comment}
          onChange={(e) => {
            setComment(e.target.value);
          }}
          placeholder="Add a comment..."
          size="sm"
          resize="vertical"
          borderColor="border.primary"
          color="white !important"
          _placeholder={{ color: 'whiteAlpha.500' }}
          _hover={{
            borderColor: 'border.secondary'
          }}
          _focus={{
            borderColor: isNeonTheme ? 'primary.400' : 'primary.500',
            boxShadow: isNeonTheme ? 'neon' : 'frost',
            borderWidth: '1px'
          }}
        />
        <Button
          size="sm"
          colorScheme="primary"
          variant="solid"
          isDisabled={!comment.trim()}
          onClick={handleSubmit}
          isLoading={isPostingComment}
        >
          Post comment
        </Button>
      </VStack>
    );
  };

  return (
    <Box 
      minH="calc(100vh - 4rem)"
      bgGradient="linear(to-br, background.primary, background.secondary)"
      py={8}
      pt="80px"
      pb="500px"
    >
      <Container maxW="7xl">
        <Breadcrumbs />
        <VStack spacing={8} align="stretch">
          <Flex justify="space-between" align="center">
            <Heading 
              color="text.primary" 
              fontSize="2xl"
              textShadow={isNeonTheme ? '0 0 10px currentColor' : 'none'}
            >
              Media Gallery
            </Heading>
            {user && (
              <Button
                leftIcon={<AddIcon />}
                onClick={() => fileInputRef.current?.click()}
                isLoading={isUploading}
                {...neonButtonStyles}
              >
                Ladda upp Bild
              </Button>
            )}
            <Input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              display="none"
              onChange={handleFileSelect}
            />
          </Flex>

          <Flex justify="center" align="center" mb={4}>
            <IconButton
              aria-label="Previous page"
              icon={<ChevronLeftIcon boxSize={6} />}
              onClick={() => handlePageChange(currentPage - 1)}
              isDisabled={currentPage === 1}
              variant="ghost"
              color={isNeonTheme ? 'primary.400' : 'gray.400'}
              _hover={{ 
                bg: isNeonTheme ? 'whiteAlpha.100' : 'whiteAlpha.200',
                color: isNeonTheme ? 'primary.300' : 'white',
                textShadow: isNeonTheme ? '0 0 10px currentColor' : 'none'
              }}
              _active={{
                bg: isNeonTheme ? 'whiteAlpha.200' : 'whiteAlpha.300'
              }}
              _disabled={{
                opacity: 0.3,
                cursor: 'not-allowed'
              }}
            />
            <Text 
              color={isNeonTheme ? 'primary.400' : 'gray.400'} 
              fontSize="md" 
              mx={4}
              textShadow={isNeonTheme ? '0 0 10px currentColor' : 'none'}
            >
              {currentPage} / {totalPages}
            </Text>
            <IconButton
              aria-label="Next page"
              icon={<ChevronRightIcon boxSize={6} />}
              onClick={() => handlePageChange(currentPage + 1)}
              isDisabled={currentPage === totalPages}
              variant="ghost"
              color={isNeonTheme ? 'primary.400' : 'gray.400'}
              _hover={{ 
                bg: isNeonTheme ? 'whiteAlpha.100' : 'whiteAlpha.200',
                color: isNeonTheme ? 'primary.300' : 'white',
                textShadow: isNeonTheme ? '0 0 10px currentColor' : 'none'
              }}
              _active={{
                bg: isNeonTheme ? 'whiteAlpha.200' : 'whiteAlpha.300'
              }}
              _disabled={{
                opacity: 0.3,
                cursor: 'not-allowed'
              }}
            />
          </Flex>

          <Box 
            maxH="calc(100vh - 300px)"
            overflowY="auto"
            sx={{
              '&::-webkit-scrollbar': {
                width: '6px',
                display: 'block'
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent'
              },
              '&::-webkit-scrollbar-thumb': {
                background: isNeonTheme ? 'primary.400' : 'whiteAlpha.300',
                borderRadius: 'full',
                '&:hover': {
                  background: isNeonTheme ? 'primary.300' : 'whiteAlpha.400'
                }
              },
              scrollbarWidth: 'thin',
              scrollbarColor: isNeonTheme ? 'var(--chakra-colors-primary-400) transparent' : 'var(--chakra-colors-whiteAlpha-300) transparent'
            }}
          >
            <SimpleGrid 
              columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
              spacing={6}
              pb={16}
              maxW="container.xl"
              mx="auto"
            >
              {paginatedItems.map((item) => (
                <Box
                  key={item.id}
                  bg="background.secondary"
                  borderRadius="lg"
                  overflow="hidden"
                  boxShadow="xl"
                  transition="transform 0.2s, box-shadow 0.2s"
                  _hover={{ transform: 'scale(1.02)' }}
                  cursor="pointer"
                  onClick={() => handleImageClick(item)}
                  position="relative"
                  w="100%"
                  maxW="280px"
                  mx="auto"
                  {...neonButtonStyles}
                >
                  <AspectRatio ratio={4/3} w="100%">
                    <>
                      {(loadingImages[item.id] !== false) && (
                        <Flex
                          position="absolute"
                          top="0"
                          left="0"
                          right="0"
                          bottom="0"
                          bg={isNeonTheme ? "whiteAlpha.50" : "background.overlay"}
                          backdropFilter="blur(4px)"
                          zIndex="1"
                          justify="center"
                          align="center"
                          boxShadow={isNeonTheme ? "inset 0 0 20px rgba(0, 224, 80, 0.2)" : "none"}
                        >
                          <Spinner
                            thickness="4px"
                            speed="0.65s"
                            emptyColor={isNeonTheme ? "whiteAlpha.100" : "background.tertiary"}
                            color={isNeonTheme ? 'primary.500' : 'blue.500'}
                            size="xl"
                          />
                        </Flex>
                      )}
                      <Image
                        src={item.url}
                        alt="Gallery item"
                        objectFit="cover"
                        onLoad={() => handleImageLoad(item.id)}
                      />
                    </>
                  </AspectRatio>
                  <Box p={4}>
                    <Text 
                      color="text.primary" 
                      fontSize="sm"
                      textShadow={isNeonTheme ? '0 0 10px currentColor' : 'none'}
                    >
                      Uploaded by {item.uploadedBy}
                    </Text>
                    <Text 
                      color="text.secondary" 
                      fontSize="xs"
                      textShadow={isNeonTheme ? '0 0 10px currentColor' : 'none'}
                    >
                      {item.uploadedAt.toLocaleDateString()}
                    </Text>
                    <Text 
                      color="text.secondary" 
                      fontSize="xs" 
                      mt={1}
                      textShadow={isNeonTheme ? '0 0 10px currentColor' : 'none'}
                    >
                      {item.comments.length} kommentar(er)
                    </Text>
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
          </Box>

          <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            size="6xl" 
            isCentered
            motionPreset="slideInBottom"
          >
            <ModalOverlay 
              bg="background.overlay"
              backdropFilter="blur(10px)"
            />
            <ModalContent 
              bg="transparent" 
              boxShadow={isNeonTheme ? 'neon' : 'none'}
              maxW="90vw"
              maxH="90vh"
              overflow="hidden"
            >
              <ModalCloseButton 
                color="text.primary" 
                size="lg"
                zIndex={2}
                top={4}
                right={4}
                _hover={{
                  color: isNeonTheme ? 'primary.300' : 'white',
                  textShadow: isNeonTheme ? '0 0 10px currentColor' : 'none'
                }}
              />
              <ModalBody p={0} position="relative">
                <Flex direction={{ base: "column", md: "row" }} h="full">
                  <Box 
                    flex="1"
                    bg="background.secondary"
                    borderRadius="lg"
                    overflow="hidden"
                    position="relative"
                  >
                    {loadingModalImage && (
                      <Flex
                        position="absolute"
                        inset="0"
                        bg={isNeonTheme ? "whiteAlpha.50" : "background.overlay"}
                        backdropFilter="blur(4px)"
                        zIndex="1"
                        justify="center"
                        align="center"
                        boxShadow={isNeonTheme ? "inset 0 0 20px rgba(0, 224, 80, 0.2)" : "none"}
                      >
                        <Spinner
                          thickness="4px"
                          speed="0.65s"
                          emptyColor={isNeonTheme ? "whiteAlpha.100" : "background.tertiary"}
                          color={isNeonTheme ? 'primary.500' : 'blue.500'}
                          size="xl"
                        />
                      </Flex>
                    )}
                    {selectedImage && (
                      <Image
                        src={selectedImage}
                        alt="Preview"
                        w="100%"
                        h="100%"
                        objectFit="contain"
                        maxH={{ base: "60vh", md: "85vh" }}
                        onLoad={handleModalImageLoad}
                      />
                    )}
                  </Box>

                  {selectedImageData && (
                    <Box
                      bg="background.secondary"
                      p={6}
                      w={{ base: "100%", md: "400px" }}
                      borderLeftRadius={{ base: "none", md: "lg" }}
                      borderTopRadius={{ base: "lg", md: "none" }}
                      mt={{ base: 4, md: 0 }}
                      ml={{ base: 0, md: 4 }}
                      maxH={{ base: "auto", md: "85vh" }}
                      overflowY="auto"
                      fontFamily={isNeonTheme ? "Oxanium" : "inherit"}
                    >
                      <VStack spacing={4} align="stretch">
                        <Box>
                          <Text color="text.secondary" fontSize="sm" fontWeight="bold">
                            Uploaded by
                          </Text>
                          <Text color="text.primary" fontSize="md">
                            {selectedImageData.uploadedBy}
                          </Text>
                        </Box>

                        <Box>
                          <Text color="text.secondary" fontSize="sm" fontWeight="bold">
                            Upload Date
                          </Text>
                          <Text color="text.primary" fontSize="md">
                            {formatDate(selectedImageData.uploadedAt)}
                          </Text>
                        </Box>

                        {selectedImageData.description && (
                          <Box>
                            <Text color="text.secondary" fontSize="sm" fontWeight="bold">
                              Description
                            </Text>
                            <Text color="text.primary" fontSize="md">
                              {selectedImageData.description}
                            </Text>
                          </Box>
                        )}

                        <Divider borderColor="border.primary" />

                        <Box>
                          <Text color="text.secondary" fontSize="sm" fontWeight="bold" mb={4}>
                            Comments ({selectedImageData.comments.length})
                          </Text>
                          
                          <VStack spacing={4} align="stretch" maxH="300px" overflowY="auto">
                            {selectedImageData.comments.map((comment, index) => (
                              <Box 
                                key={index}
                                bg="background.tertiary"
                                p={3}
                                borderRadius="md"
                              >
                                <Flex justify="space-between" align="start">
                                  <Text color="text.primary" fontSize="sm">
                                    {comment.text}
                                  </Text>
                                  {user && comment.userId === user.username && (
                                    <IconButton
                                      aria-label="Delete comment"
                                      icon={<DeleteIcon />}
                                      size="xs"
                                      variant="ghost"
                                      colorScheme="red"
                                      onClick={() => handleDeleteComment(index)}
                                      ml={2}
                                      _hover={{ bg: 'whiteAlpha.200' }}
                                    />
                                  )}
                                </Flex>
                                <HStack spacing={2} mt={2}>
                                  <Text color="blue.400" fontSize="xs">
                                    {comment.username}
                                  </Text>
                                  <Text color="text.secondary" fontSize="xs">
                                    {formatDate(comment.createdAt)}
                                  </Text>
                                </HStack>
                              </Box>
                            ))}
                          </VStack>

                          <CommentInput onSubmit={handlePostComment} />
                        </Box>
                      </VStack>
                    </Box>
                  )}
                </Flex>
              </ModalBody>
            </ModalContent>
          </Modal>
        </VStack>
      </Container>
    </Box>
  );
};

export default Media; 