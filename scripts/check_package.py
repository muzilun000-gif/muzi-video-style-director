#!/usr/bin/env python3
"""Package integrity checks; does not claim browser/model/render verification."""
from pathlib import Path
import json
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
for svg in (skill/'assets/basic-studies').glob('*.svg'): ET.parse(svg)
assert len(list((skill/'assets/basic-studies').glob('*.svg')))==19
gallery=(root/'examples/basic-demo.html').read_text()
assert '/*__SCENES__*/' not in gallery
assert '<script src=' not in gallery
assert 'type="module"' not in gallery
refs=json.loads((skill/'references/showcase.json').read_text())
assert len(refs)==18 and len({x['id'] for x in refs})==18
assert len({x['image_url'] for x in refs})==18,'Repeated reference image'
for p in (root/'examples/gallery.html',skill/'assets/gallery.html'):
    page=p.read_text()
    assert page.count('<article id=')==18
    assert page.count('<img src=')==18
    assert '<script' not in page
    assert 'renderSVG' not in page
    for x in refs:
        assert f'id="{x["id"]}"' in page
        assert x['source_url'].replace('&','&amp;') in page
    assert (p.parent/'basic-demo.html').exists()
readme=(root/'README.md').read_text()
assert 'style-atlas.png' not in readme
assert '完整 6 组' not in readme
for name in ('kinetic','launch','editorial','data','paper','ink','spatial','rhythm','terminal','isometric','pixel','blueprint','risograph','monoline','comic','timeline','map','collage'):
    assert (skill/'assets/basic-studies'/f'{name}.svg').exists()
print('PASS: skill structure, local links, 18 distinct external references, both 18-card galleries, preserved basic demo.')
