#!/usr/bin/env python3
"""Package integrity checks; does not claim browser/model/render verification."""
from pathlib import Path
import re
import xml.etree.ElementTree as ET

root=Path(__file__).resolve().parents[1]
skill=root/'skills/muzi-video-style-director'
entry=(skill/'SKILL.md').read_text()
assert entry.startswith('---\n')
assert 'name: muzi-video-style-director\n' in entry
assert re.search(r'^description: .+',entry,re.M)
for md in root.rglob('*.md'):
    text=md.read_text()
    for path in re.findall(r'!?\[[^\]]*\]\(([^)]+)\)',text):
        if '://' in path or path.startswith('#'): continue
        assert (md.parent/path.split('#')[0]).exists(),f'Broken link: {md}: {path}'
for svg in (skill/'assets').glob('*.svg'): ET.parse(svg)
assert len(list((skill/'assets').glob('*.svg')))==19
gallery=(root/'examples/gallery.html').read_text()
assert '/*__SCENES__*/' not in gallery
assert '<script src=' not in gallery
assert 'type="module"' not in gallery
for name in ('kinetic','launch','editorial','data','paper','ink','spatial','rhythm','terminal','isometric','pixel','blueprint','risograph','monoline','comic','timeline','map','collage'):
    assert (skill/'assets'/f'{name}.svg').exists()
print('PASS: frontmatter, local links, 19 valid SVGs, self-contained gallery.')
