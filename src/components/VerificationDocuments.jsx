// "Upload documents": business owners verify their business by uploading files (CAC certificate, TIN, owner's ID…),
// beside the Dojah "Complete verification" flow. Staff review them in the admin.
//   GET/POST /accounts/verify-business/documents/   DELETE /accounts/verify-business/documents/<id>/
//   GET <file_url> (with the auth header) streams the file: opened as a blob, it isn't a public link.
import { useContext, useRef, useState } from 'react';
import {
  Alert, AlertDescription, AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay,
  AlertIcon, Badge, Box, Button, Flex, FormControl, FormErrorMessage, FormHelperText, FormLabel, HStack, Icon, Modal, ModalBody,
  ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Progress, Select, Skeleton, Stack, Text, VStack,
} from '@chakra-ui/react';
import { FileText, Image as ImageIcon, Paperclip, Upload } from 'lucide-react';
import { GlobalStore } from '../App';
import { toApiError } from '../api/client';
import { useApiQuery } from '../hooks/useApi';
import { DOCUMENT_ACCEPT, apiPath, documentFileProblem, documentStatus, formatFileSize } from '../utils/verification';

function DocumentRow({ doc, onView, onRemove, viewing }) {
  const { naturalDate } = useContext(GlobalStore);
  const status = documentStatus(doc);
  const uploaded = doc.uploaded_at ? new Date(doc.uploaded_at) : null;
  const isImage = String(doc.content_type || '').startsWith('image/');
  return (
    <Box as="li" borderWidth="1px" borderColor="gray.200" borderRadius="md" p={3}>
      <Flex gap={3} align="start">
        <Icon as={isImage ? ImageIcon : FileText} boxSize={5} color="primary" mt={0.5} flexShrink={0} aria-hidden="true" />
        <Box flex={1} minW={0}>
          <Flex gap={2} align="center" flexWrap="wrap">
            <Text fontWeight="600" fontSize="sm">{doc.kind_label || doc.kind}</Text>
            <Badge colorScheme={status.color} textTransform="none" borderRadius="full" px={2}>{status.label}</Badge>
          </Flex>
          <Text fontSize="sm" color="gray.600" noOfLines={1} wordBreak="break-all" title={doc.name}>{doc.name}</Text>
          <Text fontSize="xs" color="gray.500">
            {[formatFileSize(doc.size), uploaded && !Number.isNaN(uploaded.getTime()) ? `uploaded ${naturalDate(uploaded)}` : ''].filter(Boolean).join(' · ')}
          </Text>
          {doc.status === 'rejected' && doc.note && (
            <Text fontSize="sm" color="red.700" bg="red.50" borderRadius="md" px={2} py={1} mt={2}>{doc.note}</Text>
          )}
        </Box>
        <HStack spacing={1} flexShrink={0}>
          <Button size="xs" variant="ghost" color="primary" onClick={() => onView(doc)} isLoading={viewing} loadingText="Opening"
            aria-label={`View ${doc.kind_label || 'document'} ${doc.name || ''}`}>
            View
          </Button>
          {doc.can_delete && (
            <Button size="xs" variant="ghost" colorScheme="red" onClick={() => onRemove(doc)} aria-label={`Remove ${doc.kind_label || 'document'} ${doc.name || ''}`}>
              Remove
            </Button>
          )}
        </HStack>
      </Flex>
    </Box>
  );
}

/** The upload panel (a modal). `onChanged(event)` after an upload or a removal, e.g. to reload the business's status. */
export default function VerificationDocuments({ isOpen, onClose, onChanged }) {
  const { api, notify } = useContext(GlobalStore);
  const query = useApiQuery((client, signal) => client.get('/accounts/verify-business/documents/', { signal }), [isOpen],
    { enabled: isOpen, select: (body) => body?.data || {} });
  const data = query.data;
  const kinds = Array.isArray(data?.kinds) ? data.kinds : [];
  const documents = Array.isArray(data?.documents) ? data.documents : [];
  const maxMb = Number(data?.max_mb) || 10;
  const accepts = data?.accepts || 'PDF, JPG, PNG or WebP';

  const [kind, setKind] = useState('');
  const [file, setFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [progress, setProgress] = useState(null); // 0–100 while uploading
  const [refusal, setRefusal] = useState('');
  const [viewing, setViewing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const fileInput = useRef(null);
  const cancelRef = useRef(null);

  const kindError = submitted && !kind ? 'Choose what this document is.' : '';
  const fileError = file || submitted ? documentFileProblem(file, { maxMb, accepts }) : '';
  const uploading = progress !== null;

  function pick(e) {
    const picked = e.target.files?.[0] || null;
    setFile(picked);
    setRefusal('');
  }

  async function upload(e) {
    e.preventDefault();
    setSubmitted(true);
    if (!kind || documentFileProblem(file, { maxMb, accepts }) || uploading) return;
    const body = new FormData();
    body.append('kind', kind);
    body.append('file', file);
    setProgress(0);
    setRefusal('');
    try {
      const result = await api.post('/accounts/verify-business/documents/', body, {
        onUploadProgress: (event) => { if (event.total) setProgress(Math.round((event.loaded / event.total) * 100)); },
      });
      notify({ title: 'Document uploaded', body: result?.message || "We'll review it within 1–2 working days." });
      setFile(null);
      setKind('');
      setSubmitted(false);
      if (fileInput.current) fileInput.current.value = '';
      query.reload();
      onChanged?.('uploaded', result?.data);
    } catch (err) {
      setRefusal(toApiError(err).message);
    } finally {
      setProgress(null);
    }
  }

  // the file needs the auth header: fetch it, then open it (a tab is opened first so pop-up blockers allow it)
  async function view(doc) {
    const tab = window.open('', '_blank');
    setViewing(doc.id);
    try {
      const response = await api.http.get(apiPath(doc.file_url), { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      if (tab) tab.location.href = url;
      else {
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.name || 'document';
        link.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      tab?.close();
      setRefusal(toApiError(err).message || "We couldn't open this document.");
    } finally {
      setViewing(null);
    }
  }

  async function remove() {
    if (!removing) return;
    setRemoveBusy(true);
    try {
      const result = await api.delete(`/accounts/verify-business/documents/${encodeURIComponent(removing.id)}/`);
      notify({ title: 'Document removed', body: result?.message || `${removing.kind_label || 'The document'} was removed.` });
      query.reload();
      onChanged?.('removed', removing);
    } catch (err) {
      setRefusal(toApiError(err).message);
    } finally {
      setRemoveBusy(false);
      setRemoving(null);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={() => { if (!uploading) onClose(); }} size={{ base: 'full', sm: 'lg' }} scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent borderRadius={{ base: 0, sm: 'lg' }}>
        <ModalHeader pr={12}>Upload verification documents</ModalHeader>
        <ModalCloseButton isDisabled={uploading} />
        <ModalBody>
          <Text color="gray.700" fontSize="sm" mb={4}>
            Upload clear copies of your CAC certificate, TIN and owner's ID. We'll review them within 1–2 working days.
          </Text>

          {!data && query.loading ? (
            <Stack spacing={3} aria-busy="true"><Skeleton h="40px" /><Skeleton h="40px" /><Skeleton h="70px" /></Stack>
          ) : !data && query.error ? (
            <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription>{query.error.message}</AlertDescription></Alert>
          ) : (
            <VStack align="stretch" spacing={5}>
              {data?.can_upload === false ? (
                <Alert status="success" borderRadius="md"><AlertIcon /><AlertDescription>Your business is verified. There's nothing more to upload.</AlertDescription></Alert>
              ) : (
                <Box as="form" onSubmit={upload} noValidate borderWidth="1px" borderColor="gray.200" borderRadius="md" p={4}>
                  <Stack spacing={4}>
                    <FormControl isRequired isInvalid={Boolean(kindError)} isDisabled={uploading}>
                      <FormLabel htmlFor="verify-doc-kind">Document</FormLabel>
                      <Select id="verify-doc-kind" placeholder="Choose one" value={kind} onChange={(e) => { setKind(e.target.value); setRefusal(''); }}>
                        {kinds.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </Select>
                      <FormErrorMessage>{kindError}</FormErrorMessage>
                    </FormControl>
                    <FormControl isRequired isInvalid={Boolean(fileError)} isDisabled={uploading}>
                      <FormLabel htmlFor="verify-doc-file">File</FormLabel>
                      <input id="verify-doc-file" ref={fileInput} type="file" accept={DOCUMENT_ACCEPT} onChange={pick}
                        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }} />
                      <Flex gap={3} align="center" flexWrap="wrap">
                        <Button as="label" htmlFor="verify-doc-file" size="sm" variant="outline" leftIcon={<Paperclip size={14} />} cursor="pointer"
                          tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.current?.click(); } }}>
                          {file ? 'Choose another file' : 'Choose a file'}
                        </Button>
                        {file && <Text fontSize="sm" color="gray.700" noOfLines={1} wordBreak="break-all">{file.name} · {formatFileSize(file.size)}</Text>}
                      </Flex>
                      {fileError ? <FormErrorMessage>{fileError}</FormErrorMessage> : <FormHelperText>{accepts}, up to {maxMb} MB.</FormHelperText>}
                    </FormControl>
                    {uploading && <Progress value={progress} size="sm" borderRadius="full" colorScheme="blue" aria-label={`Uploading, ${progress}%`} />}
                    <Button type="submit" bg="primary" color="white" _hover={{ bg: 'secondary' }} leftIcon={<Upload size={16} />}
                      isLoading={uploading} loadingText={`Uploading ${progress ?? 0}%`} alignSelf={{ base: 'stretch', sm: 'flex-start' }}>
                      Upload
                    </Button>
                  </Stack>
                </Box>
              )}

              {refusal && <Alert status="error" borderRadius="md"><AlertIcon /><AlertDescription>{refusal}</AlertDescription></Alert>}

              <Box>
                <Text fontWeight="600" mb={2}>Your documents</Text>
                {documents.length ? (
                  <Stack as="ul" listStyleType="none" spacing={2}>
                    {documents.map((doc) => (
                      <DocumentRow key={doc.id} doc={doc} viewing={viewing === doc.id} onView={view} onRemove={setRemoving} />
                    ))}
                  </Stack>
                ) : (
                  <Text fontSize="sm" color="gray.600">Nothing uploaded yet.</Text>
                )}
              </Box>
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose} isDisabled={uploading}>Close</Button>
        </ModalFooter>
      </ModalContent>

      <AlertDialog isOpen={Boolean(removing)} leastDestructiveRef={cancelRef} onClose={() => { if (!removeBusy) setRemoving(null); }} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent mx={4}>
            <AlertDialogHeader fontSize="lg">Remove this document?</AlertDialogHeader>
            <AlertDialogBody>{removing?.kind_label}: {removing?.name}</AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={cancelRef} onClick={() => setRemoving(null)} isDisabled={removeBusy}>Keep it</Button>
              <Button colorScheme="red" onClick={remove} isLoading={removeBusy}>Remove</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Modal>
  );
}
