"""Content and local-link audit against the approved step-2 Git baseline."""
from pathlib import Path
from html.parser import HTMLParser
import subprocess, re, hashlib, json
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parents[1]
class Document(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.stack=[]; self.prompts=[]; self.captures=[]; self.units=[]; self.links=[]; self.ids=[]; self.code=[]
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if 'id' in a: self.ids.append(a['id'])
        for key in ['href','src']:
            if key in a: self.links.append(a[key])
        if tag in ('p','li','figcaption') or (tag=='span' and a.get('class') in ('fig','cap')):
            self.captures.append([tag, len(self.stack), []])
        if tag=='pre' and a.get('class')=='prompt-text': self.captures.append(['prompt',len(self.stack),[]])
        if tag=='span' and a.get('class')=='l': self.captures.append(['code',len(self.stack),[]])
        if tag not in ('img','meta','link','br','hr','input','source'): self.stack.append(tag)
    def handle_endtag(self, tag):
        if tag in self.stack:
            while self.stack:
                t=self.stack.pop()
                finished=[c for c in self.captures if c[1]==len(self.stack)]
                for c in finished:
                    value=''.join(c[2]); self.captures.remove(c)
                    if c[0]=='prompt': self.prompts.append(value)
                    elif c[0]=='code': self.code.append(value)
                    else: self.units.append(re.sub(r'\s+',' ',value).strip())
                if t==tag: break
    def handle_data(self, data):
        for c in self.captures: c[2].append(data)

def baseline(path):
    return subprocess.check_output(['git','show','8cd08b6:'+path],cwd=ROOT).decode('utf-8')
files=['index.html','prompt-lab.html','projects/pinky-saver.html','projects/what-is-24-1.html','projects/eps-finder.html']
docs={p:Document((ROOT/p).read_text(encoding='utf-8-sig')) for p in files}
old=Document(baseline('index.html')).prompts
new=docs['prompt-lab.html'].prompts
assert len(old)==len(new)==5
assert old==new, 'Prompt text differs'
assert not docs['index.html'].prompts, 'Duplicate prompts on homepage'
report={'baseline':'8cd08b6','prompts':[],'cases':{},'local_links':'pass'}
for i,p in enumerate(new): report['prompts'].append({'index':i+1,'characters':len(p),'sha256':hashlib.sha256(p.encode()).hexdigest()})
for p in files[2:]:
    oldhtml=baseline(p); article=re.search(r'<article[\s\S]*?</article>',oldhtml)[0]
    olddoc=Document(article); current=docs[p]
    missing=[u for u in olddoc.units if u not in current.units]
    assert not missing, (p,missing)
    assert olddoc.code==current.code, 'Code listing changed: '+p
    report['cases'][p]={'original_paragraphs_items_metrics':len(olddoc.units),'all_preserved':True,'code_lines_unchanged':len(current.code)}
for p,d in docs.items():
    assert len(d.ids)==len(set(d.ids)), 'Duplicate id: '+p
    for link in d.links:
        u=urlsplit(link)
        if u.scheme or u.netloc: continue
        target=(ROOT/p).parent/unquote(u.path) if u.path else ROOT/p
        assert target.exists(), (p,link)
        if u.fragment and target.suffix=='.html':
            targetdoc=Document(target.read_text(encoding='utf-8-sig'))
            assert unquote(u.fragment) in targetdoc.ids, (p,link,'missing anchor')
for css in ('index.css','cloud-home.css','projects/project.css','prompt-lab.css'):
    for url in re.findall(r'url\([\'\"]?([^\)\'\"]+)',(ROOT/css).read_text(encoding='utf-8-sig')):
        if not url.startswith(('#','data:','http')): assert ((ROOT/css).parent/url).exists(),(css,url)
assert (24*60+48+10+4)//5*5 == 25*60
assert (19*60+59+10+4)//5*5 == 20*60+10
output=ROOT/'docs/design/cloud-b/CONTENT-AUDIT.json'
output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))
