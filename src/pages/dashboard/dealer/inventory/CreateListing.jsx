import {
  Box,
  Container,
  VStack,
  Flex,
  Text,
  SimpleGrid,
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
import { Link as RLink, useNavigate } from "react-router-dom";
import { BackButton } from '../../../../components/nav';
import {
  StepIndicator,
  ImageUploader,
  MAX_VEHICLE_IMAGE_MB,
  ListingDetailsForm,
  ListingReviewCard,
  emptyListingForm,
  listingToForm,
  imagesFromListing,
  validateListingForm,
  listingPayload,
  useRevokePreviews,
  optionLabel,
  MAX_LISTING_IMAGES,
} from '../../../../components/forms';
import { AiQuickStart, applyDraft } from '../../../../components/dashboard/AiTools';
import { DASH, PageHeader } from '../../../../components/dashboard/ui';
import { Checklist, ChoiceCards, FormActions, FormSection, FormWithAside, PreviewCard } from '../../../../components/dashboard/FormLayout';
import { ArrowLeft, ArrowRight, Camera, ClipboardCheck, KeyRound, Tag } from 'lucide-react';
import { GlobalStore } from '../../../../App';
import { toApiError } from '../../../../api/client';

// a 15 MB photo can take a couple of minutes on a slow mobile connection
const PHOTO_UPLOAD_TIMEOUT_MS = 5 * 60 * 1000;
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
  const [uploadNote, setUploadNote] = useState('');
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
      // one photo per request: big photos on a slow connection would time out together, and a photo that
      // has gone up isn't sent again if a later one fails and the dealer tries again
      const fresh = current.filter((i) => i.file);
      let latest = null;
      for (const [index, item] of fresh.entries()) {
        const label = fresh.length > 1 ? `Uploading photo ${index + 1} of ${fresh.length}` : 'Uploading photo';
        setUploadNote(`${label}…`);
        const payload = new FormData();
        payload.append('action', 'upload-images');
        payload.append('image', item.file, item.file.name);
        latest = await api.post(`/admin/dealership/listings/${uuid}/`, payload, {
          timeout: PHOTO_UPLOAD_TIMEOUT_MS,
          onUploadProgress: (event) => {
            if (event.total) setUploadNote(`${label} · ${Math.min(99, Math.round((event.loaded / event.total) * 100))}%`);
          },
        });
        URL.revokeObjectURL(item.previewUrl);
        current = [...imagesFromListing(latest?.data), ...fresh.slice(index + 1)];
        setImages(current);
      }
      if (!latest) latest = await api.get(`/admin/dealership/listings/${uuid}/`);
      setImages(imagesFromListing(latest?.data));
      goTo(2);
    } catch (error) {
      const apiError = reportError(error, "Couldn't save the photos");
      setImageError(apiError.fieldErrors?.images || apiError.message);
    } finally {
      setBusy(null);
      setUploadNote('');
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

  const kept = images.filter((i) => !i.removed);
  const cover = kept[0]?.previewUrl || kept[0]?.url;
  const preview = (
    <PreviewCard
      label="How buyers see it"
      image={cover}
      title={form.title}
      price={form.price ? `₦${Number(form.price).toLocaleString('en-NG')}${isRental ? ` ${optionLabel('payment_cycle', form.payment_cycle).toLowerCase()}` : ''}` : ''}
      facts={[isRental ? 'Rental' : 'For sale', !isRental && form.condition && optionLabel('condition', form.condition),
        form.transmission && optionLabel('transmission', form.transmission), form.fuel_system && optionLabel('fuel_system', form.fuel_system),
        !isRental && form.mileage && `${Number(form.mileage).toLocaleString('en-NG')} km`]}
    />
  );
  const checklist = (
    <Checklist title="Ready to publish?" items={[
      { label: 'Title', done: Boolean(form.title?.trim()) },
      { label: 'Make and model', done: Boolean(form.brand && form.model?.trim()) },
      { label: 'Price', done: Number(form.price) > 0 },
      { label: isRental ? 'Rental period' : 'Condition and mileage', done: isRental ? Boolean(form.payment_cycle) : Boolean(form.condition && form.mileage !== '') },
      { label: 'Body, fuel and transmission', done: Boolean(form.vehicle_type && form.fuel_system && form.transmission) },
      { label: 'At least one photo', done: kept.length > 0 },
      { label: '4 or more photos (recommended)', done: kept.length >= 4 },
    ]} />
  );
  const primary = { h: '52px', px: 8, borderRadius: 'full', bg: DASH.ink, color: 'white', _hover: { bg: '#1F2937' } };
  const secondary = { h: '52px', px: 6, borderRadius: 'full', variant: 'outline', borderColor: '#D6DBE3' };

  return (
    <Box ref={topRef} scrollMarginTop="120px">
      <BackButton
        to={step === 0 ? '/inventory' : undefined}
        onClick={step > 0 ? () => goTo(step - 1) : undefined}
        isDisabled={Boolean(busy)}
      />
      <PageHeader
        title={isEdit ? 'Edit car' : 'Add a car'}
        subtitle={isEdit ? 'Update the details and photos, then review.' : 'Three quick steps: details, photos, then review and publish.'}
      />
      <StepIndicator currentStep={step} steps={STEPS} onStep={busy ? undefined : goTo} />

      {step === 0 && (
        <Box as="form" noValidate onSubmit={(e) => { e.preventDefault(); saveDetails(); }}>
          <FormWithAside aside={<>{preview}{checklist}</>}>
            {!isEdit && (
              <AiQuickStart
                kind="car"
                onApply={(fields) => {
                  const [next, filled] = applyDraft('car', form, fields);
                  setForm(next);
                  setErrors({});
                  return filled;
                }}
                onPhotos={(files) => setImages((prev) => {
                  const known = new Set(prev.map((item) => item.file && `${item.file.name}-${item.file.size}`));
                  const room = Math.max(0, MAX_LISTING_IMAGES - prev.filter((item) => !item.removed).length);
                  const added = files.filter((file) => !known.has(`${file.name}-${file.size}`)).slice(0, room)
                    .map((file) => ({ key: `ai-${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`, file, previewUrl: URL.createObjectURL(file) }));
                  return [...prev, ...added];
                })}
              />
            )}
            <ListingDetailsForm
              form={form}
              errors={errors}
              onChange={onChange}
              typePicker={(
                <FormControl as="fieldset" isRequired>
                  <FormLabel as="legend">Listing type</FormLabel>
                  <ChoiceCards label="Listing type" value={form.listing_type} onChange={(value) => onChange('listing_type', value)} options={[
                    { value: 'sale', label: 'For sale', description: 'Buyers pay in full or after inspection.', icon: Tag },
                    { value: 'rental', label: 'For rent', description: 'Customers book it by the day, week or month.', icon: KeyRound },
                  ]} />
                </FormControl>
              )}
            />
            {Object.values(errors).some(Boolean) && (
              <Alert status="error" borderRadius="16px">
                <AlertIcon />
                <AlertDescription>Please fix the highlighted fields.</AlertDescription>
              </Alert>
            )}
            <FormActions>
              <Button {...secondary} as={RLink} to="/inventory" isDisabled={Boolean(busy)}>Cancel</Button>
              <Button type="submit" {...primary} isLoading={busy === 'details'} loadingText="Saving…" rightIcon={<ArrowRight size={18} />}>Save and continue</Button>
            </FormActions>
          </FormWithAside>
        </Box>
      )}

      {step === 1 && (
        <FormWithAside aside={<>{preview}{checklist}</>}>
          <FormSection icon={Camera} title="Photos" description="The first photo is the cover buyers see in search.">
            <ImageUploader items={images} onChange={(next) => { setImages(next); setImageError(''); }} error={imageError} maxMb={MAX_VEHICLE_IMAGE_MB} aiTool="enhance" />
            <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={3} mt={5}>
              {[['Daylight', 'Shoot outside in daylight, not at night.'], ['All angles', 'Front, back, both sides, interior and dashboard.'], ['Clean car', 'Wash it first. Clean cars sell faster.']].map(([title, body]) => (
                <Box key={title} p={3} borderRadius="14px" bg={DASH.page}><Text fontWeight="600" fontSize="sm">{title}</Text><Text fontSize="xs" color={DASH.muted}>{body}</Text></Box>
              ))}
            </SimpleGrid>
          </FormSection>
          <FormActions>
            <Button {...secondary} onClick={() => goTo(0)} isDisabled={Boolean(busy)} leftIcon={<ArrowLeft size={18} />}>Back</Button>
            <Button {...primary} onClick={savePhotos} isLoading={busy === 'photos'} loadingText={uploadNote || 'Uploading…'}
              isDisabled={!images.some((i) => !i.removed)} rightIcon={<ArrowRight size={18} />}>
              Save photos and continue
            </Button>
          </FormActions>
        </FormWithAside>
      )}

      {step === 2 && (
        <FormWithAside aside={checklist}>
          <FormSection icon={ClipboardCheck} title="Review" description="Check everything looks right before you publish.">
            <ListingReviewCard form={form} images={images} />
          </FormSection>
          {!published && !canPublish && (
            <Alert status="warning" borderRadius="16px">
              <AlertIcon />
              <AlertDescription fontSize="sm">
                Your listing is saved as a draft. Complete your business verification (see the banner at the top) to publish it.
              </AlertDescription>
            </Alert>
          )}
          <FormActions>
            <Button {...secondary} onClick={() => goTo(1)} isDisabled={Boolean(busy)} leftIcon={<ArrowLeft size={18} />}>Back</Button>
            {published ? (
              <Button {...primary} onClick={finish}>Done</Button>
            ) : (
              <>
                <Button {...secondary} onClick={finish} isDisabled={Boolean(busy)}>Save as draft</Button>
                <Button {...primary} bg={DASH.blue} _hover={{ bg: '#00539A' }} onClick={publish} isLoading={busy === 'publish'} loadingText="Publishing…" isDisabled={!canPublish}>
                  {isRental ? 'Publish rental' : 'Publish car'}
                </Button>
              </>
            )}
          </FormActions>
        </FormWithAside>
      )}
    </Box>
  );
}

export default function AddListing() {
  return <ListingWizard />;
}
