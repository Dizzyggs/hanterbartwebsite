import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  useToast,
  Input,
  FormControl,
  FormLabel,
  useColorModeValue,
  Container,
  Divider,
  ScaleFade,
  Fade,
  useDisclosure,
  Icon,
  Image,
  Progress,
} from '@chakra-ui/react';
import { useUser } from '../context/UserContext';
import { db, storage } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import MediaGallery from '../components/MediaGallery';
import { FaCheckCircle, FaExclamationCircle, FaCloudUploadAlt } from 'react-icons/fa';

interface MediaItem {
  id: string;
  title: string;
  url: string;
  createdAt: Timestamp;
  createdBy: string;
}

const Media: React.FC = () => {
  const { user } = useUser();
  const toast = useToast();
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isOpen: isFormVisible, onToggle: toggleForm } = useDisclosure({ defaultIsOpen: true });

  const bgColor = useColorModeValue('background.secondary', 'background.primary');
  const borderColor = useColorModeValue('border.primary', 'border.secondary');

  useEffect(() => {
    fetchMediaItems();
  }, []);

  const fetchMediaItems = async () => {
    try {
      const mediaQuery = query(collection(db, 'media'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(mediaQuery);
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as MediaItem[];
      setMediaItems(items);
    } catch (error) {
      console.error('Error fetching media items:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch media items',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Create a unique filename
      const filename = `${Date.now()}-${selectedFile.name}`;
      const storageRef = ref(storage, `media/${filename}`);
      
      // Upload file
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);
      
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          setSubmitStatus('error');
          toast({
            title: 'Error',
            description: 'Failed to upload image',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          setIsSubmitting(false);
        },
        async () => {
          // Get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Add to Firestore
          await addDoc(collection(db, 'media'), {
            title: selectedFile.name,
            url: downloadURL,
            createdAt: Timestamp.now(),
            createdBy: user.username,
          });

          setSubmitStatus('success');
          toast({
            title: 'Success',
            description: 'Image uploaded successfully',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });

          // Reset form after success
          setTimeout(() => {
            setSelectedFile(null);
            setPreviewUrl(null);
            setUploadProgress(0);
            setSubmitStatus('idle');
            setIsSubmitting(false);
            toggleForm();
          }, 1500);

          fetchMediaItems();
        }
      );
    } catch (error) {
      console.error('Error adding media item:', error);
      setSubmitStatus('error');
      toast({
        title: 'Error',
        description: 'Failed to add media item',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Container py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="2xl">
            Media Gallery
          </Heading>
          <Text variant="secondary" mt={2}>
            Share and view media from our adventures
          </Text>
        </Box>

        {user && (
          <ScaleFade in={isFormVisible} initialScale={0.9}>
            <Box
              as="form"
              onSubmit={handleSubmit}
              p={6}
              bg={bgColor}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              position="relative"
              overflow="hidden"
            >
              {submitStatus === 'success' && (
                <Fade in={submitStatus === 'success'}>
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg="green.500"
                    color="white"
                    opacity={0.9}
                  >
                    <VStack spacing={4}>
                      <Icon as={FaCheckCircle} boxSize={12} />
                      <Text fontSize="xl" fontWeight="bold">
                        Successfully Uploaded!
                      </Text>
                    </VStack>
                  </Box>
                </Fade>
              )}

              {submitStatus === 'error' && (
                <Fade in={submitStatus === 'error'}>
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    bottom={0}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg="red.500"
                    color="white"
                    opacity={0.9}
                  >
                    <VStack spacing={4}>
                      <Icon as={FaExclamationCircle} boxSize={12} />
                      <Text fontSize="xl" fontWeight="bold">
                        Error Occurred
                      </Text>
                    </VStack>
                  </Box>
                </Fade>
              )}

              <VStack spacing={6}>
                <FormControl>
                  <FormLabel fontSize="md" fontWeight="medium">Select Image</FormLabel>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    display="none"
                    ref={fileInputRef}
                  />
                  <Button
                    leftIcon={<FaCloudUploadAlt />}
                    onClick={() => fileInputRef.current?.click()}
                    width="full"
                    variant="outline"
                    disabled={isSubmitting}
                  >
                    Choose File
                  </Button>
                </FormControl>

                {previewUrl && (
                  <Box
                    position="relative"
                    width="100%"
                    height="300px"
                    borderRadius="lg"
                    overflow="hidden"
                    bg="background.tertiary"
                  >
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      objectFit="contain"
                      width="100%"
                      height="100%"
                      loading="lazy"
                      fallback={
                        <Box
                          width="100%"
                          height="100%"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Progress
                            isIndeterminate
                            size="sm"
                            width="80%"
                            colorScheme="blue"
                          />
                        </Box>
                      }
                    />
                  </Box>
                )}

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <Box width="100%">
                    <Text fontSize="sm" mb={2} color="text.secondary">
                      Uploading: {Math.round(uploadProgress)}%
                    </Text>
                    <Progress
                      value={uploadProgress}
                      size="sm"
                      colorScheme="blue"
                      width="100%"
                      borderRadius="full"
                      hasStripe
                      isAnimated
                    />
                  </Box>
                )}

                <Button
                  type="submit"
                  colorScheme="blue"
                  width="full"
                  size="lg"
                  isLoading={isSubmitting}
                  loadingText="Uploading..."
                  disabled={!selectedFile || isSubmitting}
                >
                  Upload Image
                </Button>
              </VStack>
            </Box>
          </ScaleFade>
        )}

        <Divider borderColor={borderColor} />

        <Box>
          <Heading as="h2" size="xl" mb={6}>
            Gallery
          </Heading>
          <MediaGallery
            images={mediaItems.map(item => ({
              url: item.url,
              title: item.title,
            }))}
            columns={3}
          />
        </Box>
      </VStack>
    </Container>
  );
};

export default Media; 