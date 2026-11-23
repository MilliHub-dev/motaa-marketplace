// Motaa AI for businesses listing on Motaa:
// - AiQuickStart: pick a few photos and the AI fills in the listing form (the seller checks it before posting).
// - PhotoAiAction: on each new photo, "Enhance" (cars: light/colour/sharpness, nothing added or removed) or
//   "White background" (parts: the part cut out onto clean white), with undo.
import { useContext, useEffect, useRef, useState } from 'react';
import { Box, Button, Flex, HStack, Image, List, ListIcon, ListItem, Spinner, Text, Tooltip, Wrap, WrapItem } from '@chakra-ui/react';
import { AlertCircle, CheckCircle2, ImagePlus, Sparkles, Undo2, Wand2 } from 'lucide-react';
import { GlobalStore } from '../../App';

// Which AI tools the server has switched on (white background needs a photo-editing key). Asked once per page load.
let statusPromise = null;
export function useAiStatus() {
  const { api } = useContext(GlobalStore);
  const [status, setStatus] = useState(null);
  useEffect(() => {
    let alive = true;
    statusPromise = statusPromise || api.get('/assistant/status/').then((body) => body?.data || {}).catch(() => ({}));
    statusPromise.then((value) => { if (alive) setStatus(value); });
    return () => { alive = false; };
  }, [api]);
  return status;
}

export function dataUrlToFile(dataUrl, name) {
  const [head, body] = String(dataUrl).split(',', 2);
  const mime = (head.match(/data:([^;]+)/) || [])[1] || 'image/png';
  const bytes = atob(body);
  const array = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) array[i] = bytes.charCodeAt(i);
  return new File([array], name, { type: mime, lastModified: Date.now() });
}

const CAR_LABELS = { brand: 'Make', model: 'Model', color: 'Colour', vehicle_type: 'Body type', fuel_system: 'Fuel', transmission: 'Gearbox',
  drivetrain: 'Drivetrain', doors: 'Doors', seats: 'Seats', features: 'Features', title: 'Title', notes: 'Description' };
const PART_LABELS = { name: 'Name', brand: 'Brand', part_number: 'Part number', category: 'Category', condition: 'Condition',
  universal: 'Fits any car', description: 'Description', fitments: 'Cars it fits' };

/** Merge AI suggestions into a form without overwriting what the seller already typed. Returns [nextForm, filledKeys]. */
export function applyDraft(kind, form, fields) {
  const next = { ...form };
  const filled = [];
  const empty = (value) => value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length);
  if (kind === 'part') {
    ['name', 'brand', 'part_number', 'category', 'description'].forEach((key) => {
      if (fields[key] && empty(form[key])) { next[key] = fields[key]; filled.push(key); }
    });
    if (fields.condition && (empty(form.condition) || form.condition === 'new')) { next.condition = fields.condition; filled.push('condition'); }
    if (fields.universal && !form.universal) { next.universal = true; filled.push('universal'); }
    const noFitments = !(form.fitments || []).some((row) => row.make);
    if (fields.fitments?.length && noFitments && !next.universal) { next.fitments = fields.fitments; filled.push('fitments'); }
    return [next, filled];
  }
  ['brand', 'model', 'color', 'vehicle_type', 'fuel_system', 'transmission', 'drivetrain', 'title', 'notes'].forEach((key) => {
    if (fields[key] && empty(form[key])) { next[key] = fields[key]; filled.push(key); }
  });
  ['doors', 'seats'].forEach((key) => {
    if (fields[key] && String(fields[key]) !== String(form[key])) { next[key] = String(fields[key]); filled.push(key); }
  });
  const features = Array.from(new Set([...(form.features || []), ...(fields.features || [])]));
  if (features.length > (form.features || []).length) { next.features = features; filled.push('features'); }
  return [next, filled];
}

/**
 * The "Let AI fill this in" card. kind: 'car' | 'part'. onApply(fields) gets the cleaned suggestions;
 * onPhotos(files) receives the chosen photos so they can be added to the listing too.
 */
export function AiQuickStart({ kind = 'car', onApply, onPhotos }) {
  const { api } = useContext(GlobalStore);
  const input = useRef(null);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const labels = kind === 'part' ? PART_LABELS : CAR_LABELS;

  async function run(chosen) {
    const photos = chosen.filter((f) => f.type?.startsWith('image/')).slice(0, 4);
    if (!photos.length) return;
    setFiles(photos);
    setBusy(true);
    setError('');
    setResult(null);
    const form = new FormData();
    form.append('kind', kind);
    photos.forEach((file) => form.append('images', file));
    try {
      const body = await api.post('/assistant/listing-draft/', form, { timeout: 180000 });
      const fields = body?.data?.fields || {};
      const filled = onApply(fields) || [];
      onPhotos?.(photos);
      setResult({ filled, check: fields.check || [] });
    } catch (err) {
      setError(err?.message || "The AI couldn't read those photos. Try again.");
    }
    setBusy(false);
  }

  return (
    <Box position="relative" overflow="hidden" borderRadius={{ base: '18px', md: '24px' }} color="white" p={{ base: 4, md: 6 }}
      bg="linear-gradient(120deg, #0B1220 0%, #0B2D55 55%, #0065B5 100%)">
      <Box position="absolute" w="260px" h="260px" borderRadius="full" bg="#4C9BE0" opacity={0.3} filter="blur(70px)" right="-80px" top="-120px" aria-hidden="true" />
      <Flex position="relative" gap={4} align={{ base: 'flex-start', md: 'center' }} direction={{ base: 'column', md: 'row' }}>
        <Flex w={12} h={12} borderRadius="16px" bg="rgba(255,255,255,0.14)" border="1px solid rgba(255,255,255,0.2)" align="center" justify="center" flexShrink={0}>
          <Sparkles size={22} />
        </Flex>
        <Box flex={1} minW={0}>
          <Text fontWeight="700" fontSize="lg">Let Motaa AI fill this in</Text>
          <Text fontSize="sm" color="whiteAlpha.800">
            {kind === 'part'
              ? 'Add 1–4 photos of the part (include the label or part number). AI suggests the name, brand, category and a description.'
              : 'Add 1–4 photos of the car (front, side, interior). AI suggests the make, model, body, colour, features and a description.'}
            {' '}You check everything before it goes live.
          </Text>
        </Box>
        <Button leftIcon={busy ? <Spinner size="sm" /> : <ImagePlus size={18} />} bg="white" color="#0B1220" _hover={{ bg: 'whiteAlpha.900' }}
          borderRadius="full" h="46px" px={5} onClick={() => input.current?.click()} isDisabled={busy} flexShrink={0}>
          {busy ? 'Reading photos…' : result ? 'Try other photos' : 'Choose photos'}
        </Button>
        <input ref={input} type="file" hidden multiple accept="image/jpeg,image/png,image/webp"
          onChange={(e) => { run(Array.from(e.target.files || [])); e.target.value = ''; }} />
      </Flex>

      {(files.length > 0 || error) && (
        <Box position="relative" mt={4} bg="rgba(255,255,255,0.08)" borderRadius="16px" p={3}>
          <HStack spacing={2} mb={result || error ? 3 : 0}>
            {files.map((file) => (
              <Image key={file.name + file.lastModified} src={URL.createObjectURL(file)} alt="" boxSize="48px" objectFit="cover" borderRadius="10px" />
            ))}
            {busy && <Text fontSize="sm" color="whiteAlpha.800" pl={2}>Looking at your photos…</Text>}
          </HStack>
          {error && <HStack color="#FECACA" fontSize="sm"><AlertCircle size={16} /><Text>{error}</Text></HStack>}
          {result && (
            <>
              <Text fontSize="sm" fontWeight="600" mb={2}>
                {result.filled.length ? `Filled in ${result.filled.length} field${result.filled.length === 1 ? '' : 's'}:` : 'Nothing new to fill in: your answers are kept.'}
              </Text>
              <Wrap spacing={1.5}>
                {result.filled.map((key) => (
                  <WrapItem key={key}><HStack spacing={1} px={2.5} py={1} borderRadius="full" bg="rgba(52,211,153,0.18)" fontSize="xs">
                    <CheckCircle2 size={12} /><Text>{labels[key] || key}</Text></HStack></WrapItem>
                ))}
              </Wrap>
              {result.check.length > 0 && (
                <List mt={3} spacing={1} fontSize="sm" color="whiteAlpha.900">
                  <Text fontSize="xs" textTransform="uppercase" letterSpacing="wider" color="whiteAlpha.700">Please check</Text>
                  {result.check.map((item) => <ListItem key={item} display="flex" alignItems="flex-start"><ListIcon as={AlertCircle} mt={1} color="#FDD153" />{item}</ListItem>)}
                </List>
              )}
              {onPhotos && <Text fontSize="xs" color="whiteAlpha.700" mt={2}>These photos were added to your listing too.</Text>}
            </>
          )}
        </Box>
      )}
    </Box>
  );
}

/** The button on a new photo tile. tool: 'enhance' | 'background'. onReplace(nextItem) swaps the tile's photo. */
export function PhotoAiAction({ item, tool, onReplace }) {
  const { api, notify } = useContext(GlobalStore);
  const [busy, setBusy] = useState(false);
  const done = Boolean(item.original);
  const label = tool === 'background' ? 'White background' : 'Enhance';

  async function run() {
    setBusy(true);
    const form = new FormData();
    form.append('image', item.file);
    try {
      const body = await api.post(tool === 'background' ? '/assistant/remove-background/' : '/assistant/enhance-photo/', form, { timeout: 180000 });
      const name = (item.file.name || 'photo').replace(/\.[^.]+$/, '') + (tool === 'background' ? '-white.png' : '-enhanced.jpg');
      const file = dataUrlToFile(body.data.image, name);
      onReplace({ ...item, file, previewUrl: URL.createObjectURL(file), original: { file: item.file, previewUrl: item.previewUrl } });
    } catch (error) {
      notify?.({ title: tool === 'background' ? "Couldn't remove the background" : "Couldn't enhance the photo", body: error?.message, color: 'red' });
    }
    setBusy(false);
  }

  function undo() {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    onReplace({ ...item, file: item.original.file, previewUrl: item.original.previewUrl, original: undefined });
  }

  return (
    <Box position="absolute" left={2} right={2} bottom={2}>
      {done ? (
        <Tooltip label="Go back to the original photo">
          <Button size="xs" w="100%" leftIcon={<Undo2 size={12} />} bg="whiteAlpha.900" onClick={undo}>Undo {tool === 'background' ? 'background' : 'enhance'}</Button>
        </Tooltip>
      ) : (
        <Button size="xs" w="100%" leftIcon={tool === 'background' ? <Wand2 size={12} /> : <Sparkles size={12} />} isLoading={busy}
          loadingText={tool === 'background' ? 'Removing…' : 'Enhancing…'} bg="rgba(11,18,32,0.82)" color="white" _hover={{ bg: '#0B1220' }} onClick={run}>
          {label}
        </Button>
      )}
    </Box>
  );
}

/** "Enhance all" for the new photos in a list. */
export function EnhanceAllButton({ items, onChange }) {
  const { api, notify } = useContext(GlobalStore);
  const [busy, setBusy] = useState(false);
  const pending = items.filter((item) => item.file && !item.removed && !item.original);
  if (pending.length < 2) return null;
  async function run() {
    setBusy(true);
    let next = [...items];
    for (const item of pending) {
      const form = new FormData();
      form.append('image', item.file);
      try {
        const body = await api.post('/assistant/enhance-photo/', form, { timeout: 120000 });
        const file = dataUrlToFile(body.data.image, (item.file.name || 'photo').replace(/\.[^.]+$/, '') + '-enhanced.jpg');
        next = next.map((row) => (row.key === item.key ? { ...row, file, previewUrl: URL.createObjectURL(file), original: { file: item.file, previewUrl: item.previewUrl } } : row));
        onChange(next);
      } catch (error) {
        notify?.({ title: "Couldn't enhance a photo", body: error?.message, color: 'red' });
        break;
      }
    }
    setBusy(false);
  }
  return (
    <Button size="sm" leftIcon={<Sparkles size={14} />} onClick={run} isLoading={busy} loadingText="Enhancing…" borderRadius="full"
      bg="#0B1220" color="white" _hover={{ bg: '#1F2937' }}>
      Enhance all {pending.length} photos
    </Button>
  );
}

