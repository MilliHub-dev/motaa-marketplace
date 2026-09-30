import {
  Box,
  Container,
  VStack,
  Flex,
  Text,
  Button,
  ButtonGroup,
  FormControl,
  FormLabel,
  Heading,
  Alert,
  AlertIcon,
  AlertDescription,
} from "@chakra-ui/react";
import { useContext, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackButton } from '../../../../components/nav';
import {
  StepIndicator,
  ImageUploader,
  ListingDetailsForm,
  ListingReviewCard,
  emptyListingForm,
  listingToForm,
  imagesFromListing,
  validateListingForm,
  listingPayload,
  useRevokePreviews,
} from '../../../../components/forms';
import { GlobalStore } from '../../../../App';
import { toApiError } from '../../../../api/client';
import { DealershipContext } from '../Layout';

const STEPS = ['Details', 'Photos', 'Review'];

/**
 * Three-step listing wizard shared by "Add a listing" and "Edit listing".
 * Step 1 creates the listing (or updates it once it exists, so going back never
 * creates duplicates), step 2 syncs photos, step 3 publishes it for review.
 */
export function ListingWizard({ listing = null }) {
  const isEdit = Boolean(listing?.uuid);
  const { api, notify, notifyError } = useContext(GlobalStore);
  const { dealership } = useContext(DealershipContext);
  const navigate = useNavigate();
  const topRef = useRef(null);

  const [step, setStep] = useState(0);
  const [uuid, setUuid] = useState(listing?.uuid || null);
  const [published, setPublished] = useState(Boolean(listing?.verified));
  const [form, setForm] = useState(() => (listing ? listingToForm(listing) : emptyListingForm()));
  const [errors, setErrors] = useState({});
  const [images, setImages] = useState(() => imagesFromListing(listing));
  const [imageError, setImageError] = useState('');
  const [busy, setBusy] = useState(null); // 'details' | 'photos' | 'publish'
  useRevokePreviews(images);

  const canPublish = Boolean(dealership?.verified_business);

  function reportError(error, title) {
    const apiError = toApiError(error);
    // offline / 5xx are already announced by the API client
    if (!apiError.isNetworkError && !(apiError.status >= 500)) notifyError(apiError, title);
    return apiError;
  }

  function goTo(next) {
    setStep(next);
    topRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }

  function onChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function saveDetails() {
    const found = validateListingForm(form);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = document.querySelector(`[name="${Object.keys(found)[0]}"]`);
      first?.focus?.();
      return;
    }
    setBusy('details');
    try {
      const payload = listingPayload(form);
      const body = uuid
        ? await api.post(`/admin/dealership/listings/${uuid}/`, { action: 'edit-listing', ...payload })
        : await api.post('/admin/dealership/listings/create/', { action: 'create-listing', ...payload });
      if (body?.data?.uuid) setUuid(body.data.uuid);
      notify({ title: 'Details saved', body: 'Next, add photos of the car.' });
      goTo(1);
    } catch (error) {
      const apiError = reportError(error, "Couldn't save the listing details");
      setErrors(apiError.fieldErrors || {});
    } finally {
      setBusy(null);
    }
  }

  async function savePhotos() {
    const kept = images.filter((i) => !i.removed);
    if (!kept.length) {
      setImageError('Add at least one photo of the car.');
      return;
    }
    setImageError('');
    setBusy('photos');
    let current = images;
    try {
      for (const item of images.filter((i) => i.removed && i.uuid)) {
        await api.post(`/admin/dealership/listings/${uuid}/`, { action: 'remove-image', image_id: item.uuid });
        current = current.filter((i) => i.key !== item.key);
        setImages(current);
      }
      const fresh = current.filter((i) => i.file);
      let latest = null;
      if (fresh.length) {
        const payload = new FormData();
        payload.append('action', 'upload-images');
        for (const item of fresh) payload.append('image', item.file, item.file.name);
        latest = await api.post(`/admin/dealership/listings/${uuid}/`, payload);
      } else {
        latest = await api.get(`/admin/dealership/listings/${uuid}/`);
      }
      for (const item of fresh) URL.revokeObjectURL(item.previewUrl);
      setImages(imagesFromListing(latest?.data));
      goTo(2);
    } catch (error) {
      const apiError = reportError(error, "Couldn't save the photos");
      setImageError(apiError.fieldErrors?.images || apiError.message);
    } finally {
      setBusy(null);
    }
  }

  async function publish() {
    setBusy('publish');
    try {
      await api.post(`/admin/dealership/listings/${uuid}/`, { action: 'publish-listing' });
      setPublished(true);
      notify({ title: 'Submitted for review', body: "We'll let you know once your listing is live." });
      navigate('/inventory');
    } catch (error) {
      reportError(error, "Couldn't publish the listing");
    } finally {
      setBusy(null);
    }
  }

  function finish() {
    notify({
      title: published ? 'Listing updated' : 'Saved as draft',
      body: published ? 'Your changes have been saved.' : 'You can publish it from your inventory at any time.',
    });
    navigate('/inventory');
  }

  const isRental = form.listing_type === 'rental';

  return (
    <Box ref={topRef} scrollMarginTop="80px">
      <Container maxW="container.lg" px={0} pb={16} pt={4}>
        <BackButton
          to={step === 0 ? '/inventory' : undefined}
          onClick={step > 0 ? () => goTo(step - 1) : undefined}
          isDisabled={Boolean(busy)}
        />

        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Heading as="h1" size="lg" className="bold">{isEdit ? 'Edit listing' : 'Add a listing'}</Heading>
            <Text color="gray.600">
              {isEdit ? 'Update the details, photos, then review.' : 'List your car in 3 steps: details, photos, then review.'}
            </Text>
          </Box>

          <StepIndicator currentStep={step} steps={STEPS} />

          {step === 0 && (
            <Box as="form" noValidate onSubmit={(e) => { e.preventDefault(); saveDetails(); }} w="full" maxW="820px" mx="auto">
              <VStack spacing={8} align="stretch">
                <FormControl as="fieldset" isRequired>
                  <FormLabel as="legend">Listing type</FormLabel>
                  <ButtonGroup isAttached w="full" role="radiogroup" aria-label="Listing type">
                    {[['sale', 'Direct sale'], ['rental', 'Rental']].map(([value, label]) => {
                      const on = form.listing_type === value;
                      return (
                        <Button
                          key={value}
                          role="radio"
                          aria-checked={on}
                          flex={1}
                          py={6}
                          variant={on ? 'solid' : 'outline'}
                          bg={on ? 'primary' : 'white'}
                          color={on ? 'white' : 'primary'}
                          borderColor="primary"
                          _hover={{ bg: on ? 'secondary' : 'blue.50' }}
                          onClick={() => onChange('listing_type', value)}
                        >
                          {label}
                        </Button>
                      );
                    })}
                  </ButtonGroup>
                </FormControl>

                <ListingDetailsForm form={form} errors={errors} onChange={onChange} />

                {Object.values(errors).some(Boolean) && (
                  <Alert status="error" borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>Please fix the highlighted fields.</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" bg="primary" color="white" _hover={{ bg: 'secondary' }} size="lg" isLoading={busy === 'details'} loadingText="Saving…">
                  Save and continue
                </Button>
              </VStack>
            </Box>
          )}

          {step === 1 && (
            <VStack spacing={8} w="full" maxW="820px" mx="auto" align="stretch">
              <ImageUploader items={images} onChange={(next) => { setImages(next); setImageError(''); }} error={imageError} />
              <Flex gap={3} direction={{ base: 'column-reverse', sm: 'row' }}>
                <Button variant="outline" size="lg" flex={{ sm: 1 }} onClick={() => goTo(0)} isDisabled={Boolean(busy)}>Back</Button>
                <Button
                  bg="primary" color="white" _hover={{ bg: 'secondary' }} size="lg" flex={{ sm: 2 }}
                  onClick={savePhotos} isLoading={busy === 'photos'} loadingText="Uploading…"
                  isDisabled={!images.some((i) => !i.removed)}
                >
                  Save photos and continue
                </Button>
              </Flex>
            </VStack>
          )}

          {step === 2 && (
            <VStack spacing={6} w="full" align="stretch">
              <ListingReviewCard form={form} images={images} />
              {!published && !canPublish && (
                <Alert status="warning" borderRadius="md" maxW="640px" mx="auto">
                  <AlertIcon />
                  <AlertDescription fontSize="sm">
                    Your listing is saved as a draft. Complete your business verification (see the banner at the top) to publish it.
                  </AlertDescription>
                </Alert>
              )}
              <Flex gap={3} direction={{ base: 'column-reverse', sm: 'row' }} maxW="640px" mx="auto" w="full">
                <Button variant="outline" flex={{ sm: 1 }} onClick={() => goTo(1)} isDisabled={Boolean(busy)}>Back</Button>
                {published ? (
                  <Button flex={{ sm: 2 }} bg="primary" color="white" _hover={{ bg: 'secondary' }} onClick={finish}>Done</Button>
                ) : (
                  <>
                    <Button flex={{ sm: 1 }} variant="outline" borderColor="primary" color="primary" onClick={finish} isDisabled={Boolean(busy)}>
                      Save as draft
                    </Button>
                    <Button
                      flex={{ sm: 2 }} bg="primary" color="white" _hover={{ bg: 'secondary' }}
                      onClick={publish} isLoading={busy === 'publish'} loadingText="Publishing…" isDisabled={!canPublish}
                    >
                      {isRental ? 'Publish rental' : 'Publish listing'}
                    </Button>
                  </>
                )}
              </Flex>
            </VStack>
          )}
        </VStack>
      </Container>
    </Box>
  );
}

export default function AddListing() {
  return <ListingWizard />;
}
