#!/usr/bin/env python3
"""Regenerate the inline Shorts preview from its downloadable DOCX."""
from pathlib import Path
import html
import re
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets/pinky-saver/shorts'
NS = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
with zipfile.ZipFile(ASSETS / 'english-script.docx') as document:
    tree = ET.fromstring(document.read('word/document.xml'))
text = '\n'.join(''.join('\n' if node.tag == NS + 'br' else node.text or ''
                        for node in paragraph.iter() if node.tag in (NS + 't', NS + 'br'))
                 for paragraph in tree.iter(NS + 'p'))
page = ROOT / 'projects/pinky-saver.html'
source = page.read_text()
source = re.sub(r'(<pre id="ps-script-text">).*?(</pre>)',
                lambda match: match[1] + re.sub(r' +(?=\n|$)', lambda m: '&#32;' * len(m[0]), html.escape(text)) + match[2], source, flags=re.S)
blocks = text.split('\n\n')[:2]
index = iter(blocks)
source = re.sub(r'(<pre class="ps-block">).*?(</pre>)',
                lambda match: match[1] + html.escape(next(index)) + match[2], source, count=2, flags=re.S)
page.write_text(source)
