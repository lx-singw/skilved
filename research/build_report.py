from pathlib import Path
import re, json, html
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT=Path(__file__).resolve().parent
OUT=ROOT.parent/'output'/'research'
OUT.mkdir(parents=True, exist_ok=True)
FONT=Path('C:/Windows/Fonts')
for name,file in [('Report','calibri.ttf'),('ReportBold','calibrib.ttf'),('ReportItalic','calibrii.ttf')]:
    pdfmetrics.registerFont(TTFont(name,str(FONT/file)))
pdfmetrics.registerFontFamily('Report',normal='Report',bold='ReportBold',italic='ReportItalic',boldItalic='ReportBold')
sources=json.loads((ROOT/'report_sources.json').read_text(encoding='utf-8'))
md=(OUT/'vertical-unbundling-report.md').read_text(encoding='utf-8')
W,H=595.276,841.89
LEFT=54; RIGHT=54; WIDTH=W-LEFT-RIGHT
styles={
 'body':ParagraphStyle('body',fontName='Report',fontSize=11,leading=14.3,spaceAfter=7,textColor=colors.HexColor('#202020')),
 'title':ParagraphStyle('title',fontName='ReportBold',fontSize=24,leading=28,spaceAfter=15),
 'h1':ParagraphStyle('h1',fontName='ReportBold',fontSize=18,leading=22,spaceAfter=12),
 'h2':ParagraphStyle('h2',fontName='ReportBold',fontSize=12.3,leading=16,spaceBefore=5,spaceAfter=6),
 'note':ParagraphStyle('note',fontName='Report',fontSize=8,leading=10.2,spaceAfter=3,textColor=colors.HexColor('#444444')),
 'cell':ParagraphStyle('cell',fontName='Report',fontSize=9.1,leading=11.6),
 'headcell':ParagraphStyle('headcell',fontName='ReportBold',fontSize=9.1,leading=11.6,textColor=colors.white),
 'source':ParagraphStyle('source',fontName='Report',fontSize=10,leading=13,spaceAfter=8),
}
def rich(s):
    s=html.escape(s)
    s=re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',s)
    s=re.sub(r'\[\^(\d+)\]',lambda m:f'<super><link href="{html.escape(sources[m[1]]["url"],quote=True)}" color="#222222">{m[1]}</link></super>',s)
    return s

def blocks(text):
    lines=text.strip().splitlines(); result=[]; i=0
    while i<len(lines):
        line=lines[i].strip()
        if not line: i+=1;continue
        if line.startswith('|'):
            rows=[]
            while i<len(lines) and lines[i].strip().startswith('|'):
                r=[v.strip() for v in lines[i].strip().strip('|').split('|')]
                if not all(re.match(r'^[-: ]+$',v) for v in r): rows.append(r)
                i+=1
            n=len(rows[0]); widths={3:[.25,.36,.39],4:[.24,.24,.24,.28],5:[.27,.19,.18,.18,.18]}.get(n,[1/n]*n)
            data=[[Paragraph(rich(v),styles['headcell' if j==0 else 'cell']) for v in row] for j,row in enumerate(rows)]
            t=Table(data,colWidths=[WIDTH*x for x in widths],hAlign='LEFT')
            t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#333333')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f4f4f4')]),('GRID',(0,0),(-1,-1),.4,colors.HexColor('#d9d9d9')),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
            result.append((t,0,10)); continue
        if line.startswith('# '): style='title';line=line[2:]
        elif line.startswith('## '): style='h1';line=line[3:]
        elif line.startswith('### '): style='h2';line=line[4:]
        else:
            style='body'
            if line.startswith('- '):line='&#8226; '+html.escape(line[2:]);line=html.unescape(line)
            while i+1<len(lines) and lines[i+1].strip() and not lines[i+1].strip().startswith(('#','|','- ')):
                i+=1;line+=' '+lines[i].strip()
        p=Paragraph(rich(line),styles[style]);result.append((p,styles[style].spaceBefore,styles[style].spaceAfter));i+=1
    return result

pdf=OUT/'vertical-unbundling-report.pdf'
c=canvas.Canvas(str(pdf),pagesize=(W,H))
c.setTitle('Vertical Unbundling Opportunities Beyond Skilved')
c.setAuthor('')
layout=[]
pages=md.split('<!-- PAGE -->')
for page_no,part in enumerate(pages,1):
    refs=list(dict.fromkeys(re.findall(r'\[\^(\d+)\]',part)))
    notes=[]
    for num in refs:
        s=sources[num]
        p=Paragraph(f'{num}. <link href="{html.escape(s["url"],quote=True)}">{html.escape(s["short"])}</link>. {html.escape(s["date"])}.',styles['note'])
        _,height=p.wrap(WIDTH,1000);notes.append((p,height))
    nh=sum(h+3 for _,h in notes)
    min_y=52+nh+(13 if refs else 0)
    y=H-51
    for b,before,after in blocks(part):
        _,height=b.wrap(WIDTH,2000)
        y-=before+height
        if y<min_y:
            raise RuntimeError(f'Page {page_no} overflow by {min_y-y:.1f} pt; body ends {y:.1f}, limit {min_y:.1f}')
        b.drawOn(c,LEFT,y); y-=after
    note_y=52+nh
    for p,height in notes:
        note_y-=height;p.drawOn(c,LEFT,note_y);note_y-=3
    c.setFont('Report',8);c.setFillColor(colors.HexColor('#666666'));c.drawRightString(W-RIGHT,30,str(page_no))
    layout.append({'page':page_no,'body_bottom':round(y,1),'footnote_top':round(52+nh,1),'references':refs})
    c.showPage()

# Full source inventory, grouped across as many pages as required.
y=0
source_pages=0
for num,s in sources.items():
    label=f'<b>{num}. {html.escape(s["publisher"])}</b>. <link href="{html.escape(s["url"],quote=True)}" color="#222222">{html.escape(s["title"])}</link>. {html.escape(s["date"])}. Accessed 14 September 2026.'
    p=Paragraph(label,styles['source']);_,ph=p.wrap(WIDTH,1000)
    if y-ph<60:
        if source_pages:
            c.setFont('Report',8);c.drawRightString(W-RIGHT,30,str(len(pages)+source_pages));c.showPage()
        source_pages+=1
        h=Paragraph('Sources' if source_pages==1 else 'Sources continued',styles['h1']);_,hh=h.wrap(WIDTH,100);h.drawOn(c,LEFT,H-51-hh);y=H-51-hh-17
    y-=ph;p.drawOn(c,LEFT,y);y-=9
c.setFont('Report',8);c.drawRightString(W-RIGHT,30,str(len(pages)+source_pages));c.showPage();c.save()
(ROOT/'report_layout.json').write_text(json.dumps(layout,indent=2),encoding='utf-8')
# Supply exact source URLs in the editable report as standard Markdown footnotes.
with (OUT/'vertical-unbundling-report.md').open('a',encoding='utf-8') as f:
    f.write('\n\n## Sources\n\n')
    for num,s in sources.items():
        f.write(f'[^'+num+']: '+s['publisher']+'. ['+s['title']+']('+s['url']+'). '+s['date']+'. Accessed 14 September 2026.\n\n')
print(json.dumps({'pdf':str(pdf),'content_pages':len(pages),'source_pages':source_pages,'words':len(md.split())}))
