// PreviewWithSignature.jsx
import { useState, useRef, useContext, useEffect } from 'react';
import {
  Box, Button, Flex, HStack, Input, Radio, RadioGroup, Stack, Textarea, VStack
} from '@chakra-ui/react';
import SignaturePad from 'react-signature-canvas';
import {GlobalStore} from '../App';

export const PreviewWithSignature = ({ docType, params }) => {
  const [sigMode, setSigMode] = useState('type');      // 'type' or 'draw'
  const [typedSig, setTypedSig] = useState('');
  const sigPadRef = useRef(null);
  const downloader = useRef(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const { axios } = useContext(GlobalStore);

  // Fetch unsigned PDF on mount or when params change
  useEffect(() => {
    const query = new URLSearchParams(params).toString();
    fetch(`http://localhost:8000/${docType}?${query}`)
      .then(res => res.blob())
      .then(blob => {
        setPdfUrl(URL.createObjectURL(blob))
      });
  }, [docType, params]);

  const handleApplySignature = async () => {
    let signatureData = null;
    if (sigMode === 'type' && typedSig) {
      // render typed text onto a small canvas
      const c = document.createElement('canvas');
      c.width = 300; c.height = 100;
      const ctx = c.getContext('2d');
      ctx.font = '24px serif';
      ctx.fillText(typedSig, 10, 50);
      signatureData = c.toDataURL('image/png');
    } else if (sigMode === 'draw' && sigPadRef.current) {
      signatureData = sigPadRef.current.toDataURL();
    }

    const payload = JSON.stringify({ ...params, signature: signatureData });
    const res = await axios.post(`http://localhost:8000/${docType}/`, payload, {
      responseType: 'blob',
    });
    const signedBlob = new Blob([res.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(signedBlob);
    setPdfUrl(url);
    setTimeout(() => downloader.current.click(), 1200)
  };

  return (
    <Flex direction="column" align="center">
      <Box w="100%" maxW="500px" h="100vh" maxH="700px" rounded="20px" border="1px solid" mb={4}>
        {pdfUrl && (
          <iframe
            src={pdfUrl}
            width="100%" height="100%"
            style={{ border: 'none', borderRadius: '20px' }}
          />
        )}
      </Box>

      <VStack spacing={4}>
        <RadioGroup onChange={setSigMode} value={sigMode}>
          <HStack spacing={6}>
            <Radio value="type">Type Signature</Radio>
            <Radio value="draw">Draw Signature</Radio>
          </HStack>
        </RadioGroup>

        {sigMode === 'type' ? (
          <Input
            placeholder="Type your signature"
            value={typedSig}
            onChange={e => setTypedSig(e.target.value)}
          />
        ) : (
          <Box
            border="1px dashed"
            p={2}
          >
            <SignaturePad
              ref={sigPadRef}
              canvasProps={{ width: 300, height: 150, style: { border: '1px solid #ccc' } }}
            />
            <Button colorScheme="yellow" bg="tertiary" mt={2} onClick={() => sigPadRef.current.clear()}>
              Clear Signature
            </Button>
          </Box>
        )}
        <a href={pdfUrl} target="_new" download style={{display: 'none'}} ref={downloader}> Download </a>
        <Button colorScheme="blue" width="full" size="lg" onClick={handleApplySignature}>
          Apply & Download
        </Button>
      </VStack>
    </Flex>
  );
}
