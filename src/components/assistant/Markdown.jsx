// A tiny, safe markdown renderer for Motaa AI answers: headings, bold, italics, bullet and numbered lists and
// paragraphs. It builds React elements (never innerHTML), so nothing in an answer can run as code.
import { Fragment } from 'react';
import { Box, Heading, ListItem, OrderedList, Text, UnorderedList } from '@chakra-ui/react';

function inline(text, keyBase) {
  const parts = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g;
  let last = 0;
  let match;
  let n = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyBase}-${n++}`;
    parts.push(token.startsWith('**')
      ? <Text as="strong" key={key} fontWeight="700">{token.slice(2, -2)}</Text>
      : <Text as="em" key={key}>{token.slice(1, -1)}</Text>);
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.map((part, i) => <Fragment key={i}>{part}</Fragment>);
}

export function parseBlocks(source) {
  const lines = String(source || '').replace(/\r/g, '').split('\n');
  const blocks = [];
  let i = 0;
  const bullet = /^\s*[-*•]\s+/;
  const numbered = /^\s*\d+[.)]\s+/;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i += 1; continue; }
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) { blocks.push({ type: 'h', text: heading[2] }); i += 1; continue; }
    if (bullet.test(line) || numbered.test(line)) {
      const ordered = numbered.test(line);
      const test = ordered ? numbered : bullet;
      const items = [];
      while (i < lines.length && test.test(lines[i])) { items.push(lines[i].replace(test, '')); i += 1; }
      blocks.push({ type: ordered ? 'ol' : 'ul', items });
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4})\s/.test(lines[i]) && !bullet.test(lines[i]) && !numbered.test(lines[i])) {
      para.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: 'p', text: para.join(' ') });
  }
  return blocks;
}

export default function Markdown({ children }) {
  return (
    <Box sx={{ '& > * + *': { mt: 2.5 } }} fontSize="sm" lineHeight={1.6}>
      {parseBlocks(children).map((block, index) => {
        const key = `b${index}`;
        if (block.type === 'h') return <Heading key={key} as="h4" fontSize="sm" fontWeight="700">{inline(block.text, key)}</Heading>;
        if (block.type === 'ul' || block.type === 'ol') {
          const List = block.type === 'ul' ? UnorderedList : OrderedList;
          return <List key={key} spacing={1} pl={1}>{block.items.map((item, n) => <ListItem key={n}>{inline(item, `${key}-${n}`)}</ListItem>)}</List>;
        }
        return <Text key={key}>{inline(block.text, key)}</Text>;
      })}
    </Box>
  );
}
