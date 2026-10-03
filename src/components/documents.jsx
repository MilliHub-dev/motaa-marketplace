// Preview a checkout document (PDF) and sign it.
// Backend contract (listings/api/views.py CheckoutDocumentView):
//   GET  /listings/checkout/documents/?doc_type=order-slip|inspection-slip&order_id=<order or listing uuid>
//        -> { data: { file_id, url, signed, order_id } }
//   POST /listings/checkout/documents/ { file_id, signature: 'data:image/png;base64,…' } -> same shape, signed: true
import { useEffect, useRef, useState } from 'react';
import { Box, Button, Flex, FormControl, FormLabel, HStack, Input, Radio, RadioGroup, Text, VStack } from '@chakra-ui/react';
import SignaturePad from 'react-signature-canvas';
import { useApiMutation, useApiQuery } from '../hooks/useApi';
import { ErrorState, LoadingState } from './states';

const DOCUMENTS_ENDPOINT = '/listings/checkout/documents/';

/**
 * Download the PDF and hand back a local blob: URL for the preview frame.
 * Framing the file's own URL is unreliable: servers commonly forbid it
 * (X-Frame-Options / CSP) and the frame then shows "refused to connect".
 * status: 'loading' | 'ready' | 'failed'
 */
function usePdfPreview(url) {
  const [state, setState] = useState({ status: 'loading', src: '' });
  useEffect(() => {
    if (!url) return undefined;
    let cancelled = false;
    let objectUrl = '';
    setState({ status: 'loading', src: '' });
    fetch(url)
      .then((res) => (res.ok ? res.blob() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        setState({ status: 'ready', src: objectUrl });
      })
      .catch(() => { if (!cancelled) setState({ status: 'failed', src: '' }); });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);
  return state;
}

export const PreviewWithSignature = ({ docType, orderId, onSignatureComplete }) => {
  const [sigMode, setSigMode] = useState('type'); // 'type' | 'draw'
  const [typedSig, setTypedSig] = useState('');
  const [sigError, setSigError] = useState('');
  const sigPadRef = useRef(null);

  const query = useApiQuery(
    (api, signal) => api.get(`${DOCUMENTS_ENDPOINT}?${new URLSearchParams({ doc_type: docType, order_id: orderId })}`, { signal }),
    [docType, orderId],
    { enabled: Boolean(orderId), select: (body) => body?.data }
  );
  const document = query.data;
  const preview = usePdfPreview(document?.url);

  const sign = useApiMutation((api, signature) => api.post(DOCUMENTS_ENDPOINT, { file_id: document.file_id, signature }), {
    successMessage: 'Your document has been signed.',
    errorTitle: "Couldn't sign your document",
    // bust the cache so the preview shows the signed copy
    onSuccess: (body) => body?.data && query.setData({ ...body.data, url: `${body.data.url}?signed=${Date.now()}` }),
  });

  function getSignature() {
    if (sigMode === 'type') {
      if (!typedSig.trim()) return null;
      const c = window.document.createElement('canvas');
      c.width = 440; c.height = 120;
      const ctx = c.getContext('2d');
      ctx.font = 'italic 40px "Brush Script MT", "Segoe Script", cursive';
      ctx.fillStyle = '#1C3D5A';
      ctx.fillText(typedSig.trim(), 10, 75);
      return c.toDataURL('image/png');
    }
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) return null;
    return sigPadRef.current.toDataURL('image/png');
  }

  function applySignature() {
    const signature = getSignature();
    if (!signature) {
      setSigError(sigMode === 'type' ? 'Type your full name to sign.' : 'Draw your signature in the box.');
      return;
    }
    setSigError('');
    sign.mutate(signature);
  }

  if (!orderId) {
    return <ErrorState error={{ message: 'This document link is missing its order. Open it again from your order.' }} title="Document unavailable" />;
  }
  if (query.loading && !document) return <LoadingState label="Preparing your document…" minH="320px" />;
  if (query.error && !document) return <ErrorState error={query.error} onRetry={query.reload} title="Document unavailable" />;

  return (
    <Flex direction="column" align="center" px={4}>
      <Box w="100%" maxW="560px" h={{ base: '60vh', md: '70vh' }} maxH="720px" rounded="20px" border="1px solid" borderColor="gray.200" mb={4} overflow="hidden">
        {preview.status === 'ready' ? (
          <iframe title="Document preview" src={preview.src} width="100%" height="100%" style={{ border: 'none' }} />
        ) : preview.status === 'loading' ? (
          <LoadingState label="Loading your document…" minH="100%" />
        ) : (
          <Flex direction="column" align="center" justify="center" h="100%" px={6} textAlign="center" gap={2} bg="gray.50">
            <Text className="bold">Preview unavailable</Text>
            <Text color="gray.600" fontSize="sm">Open the PDF in a new tab to read it, then sign below.</Text>
          </Flex>
        )}
      </Box>
      <Button as="a" href={document.url} target="_blank" rel="noopener noreferrer" variant="link" color="primary" mb={4}>
        Open the PDF in a new tab
      </Button>

      {document.signed ? (
        <VStack spacing={3} w="100%" maxW="560px">
          <Text color="green.600" className="bold">Signed</Text>
          <Button as="a" href={document.url} target="_blank" rel="noopener noreferrer" download bg="primary" color="white" _hover={{ bg: 'secondary' }} size="lg" w="full">
            Download signed document
          </Button>
          {onSignatureComplete && <Button variant="ghost" w="full" onClick={() => onSignatureComplete(document)}>Done</Button>}
        </VStack>
      ) : (
        <VStack spacing={4} w="100%" maxW="560px" align="stretch">
          <RadioGroup onChange={(mode) => { setSigMode(mode); setSigError(''); }} value={sigMode}>
            <HStack spacing={6} justify="center">
              <Radio value="type">Type signature</Radio>
              <Radio value="draw">Draw signature</Radio>
            </HStack>
          </RadioGroup>

          {sigMode === 'type' ? (
            <FormControl isInvalid={Boolean(sigError)}>
              <FormLabel htmlFor="typed-signature">Your full name</FormLabel>
              <Input id="typed-signature" placeholder="e.g. Ada Obi" value={typedSig} onChange={(e) => setTypedSig(e.target.value)} />
            </FormControl>
          ) : (
            <Box border="1px dashed" borderColor="gray.300" p={2} rounded="md">
              <Text fontSize="sm" color="gray.600" mb={2}>Draw your signature below</Text>
              <SignaturePad
                ref={sigPadRef}
                canvasProps={{ width: 320, height: 150, 'aria-label': 'Signature pad', style: { border: '1px solid #ccc', maxWidth: '100%', touchAction: 'none' } }}
              />
              <Button size="sm" variant="outline" mt={2} onClick={() => sigPadRef.current?.clear()}>Clear</Button>
            </Box>
          )}
          {sigError && <Text color="red.600" fontSize="sm" role="alert">{sigError}</Text>}
          <Button bg="primary" color="white" _hover={{ bg: 'secondary' }} width="full" size="lg" onClick={applySignature} isLoading={sign.loading} loadingText="Signing">
            Sign document
          </Button>
        </VStack>
      )}
    </Flex>
  );
};
