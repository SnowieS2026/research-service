"""
pdf_create.py -- Create PDF documents directly using ReportLab.
Usage:
  python pdf_create.py --output "out.pdf" --title "My PDF" --content "Text here||**Bold** text||Bullet|Item 1|Bullet|Item 2"

Block types:
  Heading 1|text    -> Large heading
  Heading 2|text    -> Medium heading
  Heading 3|text    -> Small heading
  Bold|text          -> Bold paragraph
  para|text          -> Normal paragraph
  Bullet|item1|item2 -> Bulleted list
  Number|item1|item2 -> Numbered list
  Roman|item1|item2  -> Roman numeral list
  HR                  -> Horizontal rule
  Image|path         -> Insert image
  PageBreak           -> New page

Inline: **bold**, *italic*, __underline__

Options:
  --output             Output .pdf path (required)
  --title              Document title
  --author             Author name
  --content            Pipe-delimited blocks
  --page-size          A4|Letter (default: A4)
  --margin             Margin in mm (default: 20)
  --accent             Accent colour hex (default: 00D4A1 = PRISMAL mint)
  --font               Font: Helvetica|DejaVu (default: Helvetica)
"""

import argparse
import re
import sys
from pathlib import Path

try:
    from reportlab.lib.pagesizes import A4, letter
    from reportlab.lib.units import mm
    from reportlab.lib.colors import HexColor, black, white
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        HRFlowable, PageBreak, Image, KeepTogether
    )
    from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
except ImportError:
    print("ERROR: reportlab not installed. Run: pip install reportlab")
    sys.exit(1)


# Accent colour
ACCENT_COLOR = HexColor('#00D4A1')
DARK_BG = HexColor('#0A0F1C')
TEXT_COLOR = HexColor('#1A1A2E')


def parse_inline(text):
    """Parse inline formatting markers."""
    if not text:
        return []
    parts = []
    pattern = re.compile(r'(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__)')
    last_end = 0
    for match in pattern.finditer(text):
        if match.start() > last_end:
            parts.append(('normal', text[last_end:match.start()]))
        content = match.group()[2:-2]
        if match.group().startswith('**'):
            parts.append(('bold', content))
        elif match.group().startswith('*'):
            parts.append(('italic', content))
        elif match.group().startswith('__'):
            parts.append(('underline', content))
        last_end = match.end()
    if last_end < len(text):
        parts.append(('normal', text[last_end:]))
    return parts if parts else [('normal', text)]


def make_styles(page_width, accent=ACCENT_COLOR):
    """Create paragraph styles."""
    margin = 20 * mm
    body_width = page_width - 2 * margin

    styles = {
        'h1': ParagraphStyle(
            'H1', fontName='Helvetica-Bold', fontSize=24,
            textColor=DARK_BG, spaceAfter=12, spaceBefore=20,
            leading=30
        ),
        'h2': ParagraphStyle(
            'H2', fontName='Helvetica-Bold', fontSize=16,
            textColor=DARK_BG, spaceAfter=8, spaceBefore=14,
            leading=22
        ),
        'h3': ParagraphStyle(
            'H3', fontName='Helvetica-Bold', fontSize=13,
            textColor=DARK_BG, spaceAfter=6, spaceBefore=10,
            leading=18
        ),
        'body': ParagraphStyle(
            'Body', fontName='Helvetica', fontSize=11,
            textColor=TEXT_COLOR, spaceAfter=8, leading=16,
            alignment=TA_JUSTIFY
        ),
        'bold_para': ParagraphStyle(
            'BoldPara', fontName='Helvetica-Bold', fontSize=11,
            textColor=TEXT_COLOR, spaceAfter=8, leading=16
        ),
        'bullet': ParagraphStyle(
            'Bullet', fontName='Helvetica', fontSize=11,
            textColor=TEXT_COLOR, spaceAfter=4, leading=15,
            leftIndent=20, firstLineIndent=-15,
            bulletIndent=5
        ),
        'number': ParagraphStyle(
            'Number', fontName='Helvetica', fontSize=11,
            textColor=TEXT_COLOR, spaceAfter=4, leading=15,
            leftIndent=24, firstLineIndent=-18
        ),
        'quote': ParagraphStyle(
            'Quote', fontName='Helvetica-Oblique', fontSize=11,
            textColor=HexColor('#555555'), spaceAfter=8, leading=16,
            leftIndent=30, rightIndent=30, alignment=TA_CENTER
        ),
        'accent_bar': ParagraphStyle(
            'AccentBar', fontName='Helvetica-Bold', fontSize=11,
            textColor=accent, spaceAfter=0, leading=16
        ),
    }
    return styles


def build_paragraph(text, style):
    """Build a ReportLab Paragraph with inline formatting."""
    parts = parse_inline(text)
    if len(parts) == 1 and parts[0][0] == 'normal':
        return Paragraph(text, style)
    # Build rich text string
    frags = []
    for style_name, content in parts:
        if style_name == 'bold':
            frags.append(f'<b>{content}</b>')
        elif style_name == 'italic':
            frags.append(f'<i>{content}</i>')
        elif style_name == 'underline':
            frags.append(f'<u>{content}</u>')
        else:
            # Escape XML special chars
            esc = content.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            frags.append(esc)
    full_text = ''.join(frags)
    return Paragraph(full_text, style)


def process_blocks(content_str):
    """Parse content string into structured blocks."""
    blocks = []
    raw_blocks = content_str.split('||')
    for raw in raw_blocks:
        raw = raw.strip()
        if not raw:
            continue
        if raw.startswith('Heading 1|') or raw.startswith('H1|'):
            _, *parts = raw.split('|')
            blocks.append(('h1', '|'.join(parts)))
        elif raw.startswith('Heading 2|') or raw.startswith('H2|'):
            _, *parts = raw.split('|')
            blocks.append(('h2', '|'.join(parts)))
        elif raw.startswith('Heading 3|') or raw.startswith('H3|'):
            _, *parts = raw.split('|')
            blocks.append(('h3', '|'.join(parts)))
        elif raw.startswith('Bold|'):
            _, *parts = raw.split('|')
            blocks.append(('bold', '|'.join(parts)))
        elif raw.startswith('para|'):
            _, *parts = raw.split('|')
            blocks.append(('para', '|'.join(parts)))
        elif raw.startswith('Bullet|'):
            items = raw.split('|')[1:]
            blocks.append(('bullet', items))
        elif raw.startswith('Number|'):
            items = raw.split('|')[1:]
            blocks.append(('number', items))
        elif raw.startswith('Roman|'):
            items = raw.split('|')[1:]
            blocks.append(('roman', items))
        elif raw.startswith('Quote|'):
            _, *parts = raw.split('|')
            blocks.append(('quote', '|'.join(parts)))
        elif raw == 'HR':
            blocks.append(('hr', ''))
        elif raw == 'PageBreak':
            blocks.append(('pagebreak', ''))
        elif raw.startswith('Image|'):
            parts = raw.split('|')[1:]
            blocks.append(('image', parts[0]))
        else:
            blocks.append(('para', raw))
    return blocks


def build_pdf(output_path, content_str, title=None, author=None,
              page_size='A4', margin=20, accent_color=None, font='Helvetica'):
    """Build a PDF from content blocks."""
    if accent_color:
        accent = HexColor(accent_color)
    else:
        accent = ACCENT_COLOR

    if page_size == 'Letter':
        pagesize = letter
    else:
        pagesize = A4

    page_width = pagesize[0]

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=pagesize,
        leftMargin=margin * mm,
        rightMargin=margin * mm,
        topMargin=margin * mm,
        bottomMargin=margin * mm,
        title=title or '',
        author=author or '',
    )

    styles = make_styles(page_width, accent)
    blocks = process_blocks(content_str)
    story = []

    # Title page
    if title:
        story.append(Spacer(1, 50 * mm))
        title_style = ParagraphStyle(
            'TitlePage', fontName='Helvetica-Bold', fontSize=32,
            textColor=DARK_BG, alignment=TA_CENTER, leading=40,
            spaceAfter=10
        )
        story.append(Paragraph(title, title_style))
        if author:
            author_style = ParagraphStyle(
                'Author', fontName='Helvetica-Oblique', fontSize=14,
                textColor=HexColor('#666666'), alignment=TA_CENTER
            )
            story.append(Paragraph(author, author_style))
        story.append(Spacer(1, 15 * mm))
        # Accent line
        story.append(HRFlowable(width='100%', thickness=3, color=accent))
        story.append(PageBreak())

    for block_type, block_data in blocks:
        if block_type == 'h1':
            story.append(Paragraph(block_data, styles['h1']))
        elif block_type == 'h2':
            story.append(Paragraph(block_data, styles['h2']))
        elif block_type == 'h3':
            story.append(Paragraph(block_data, styles['h3']))
        elif block_type == 'bold':
            story.append(build_paragraph(block_data, styles['bold_para']))
        elif block_type == 'para':
            story.append(build_paragraph(block_data, styles['body']))
        elif block_type == 'bullet':
            for item in block_data:
                story.append(build_paragraph(f'• {item}', styles['bullet']))
        elif block_type == 'number':
            for i, item in enumerate(block_data):
                story.append(build_paragraph(f'{i+1}. {item}', styles['number']))
        elif block_type == 'roman':
            for i, item in enumerate(block_data):
                roman = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'][min(i, 9)]
                story.append(build_paragraph(f'{roman}. {item}', styles['number']))
        elif block_type == 'quote':
            story.append(build_paragraph(f'"{block_data}"', styles['quote']))
        elif block_type == 'hr':
            story.append(Spacer(1, 4 * mm))
            story.append(HRFlowable(width='100%', thickness=1, color=accent))
            story.append(Spacer(1, 4 * mm))
        elif block_type == 'pagebreak':
            story.append(PageBreak())
        elif block_type == 'image':
            img_path = Path(block_data)
            if img_path.exists():
                story.append(Spacer(1, 5 * mm))
                story.append(Image(str(img_path), width=80 * mm, kind='proportional'))
                story.append(Spacer(1, 5 * mm))
            else:
                print(f"  WARNING: Image not found: {img_path}")

    doc.build(story)
    print(f"Created: {output_path} ({Path(output_path).stat().st_size:,} bytes)")


def main():
    parser = argparse.ArgumentParser(description='Create PDF documents')
    parser.add_argument('--output', '-o', required=True, help='Output .pdf path')
    parser.add_argument('--title', '-t', help='Document title')
    parser.add_argument('--author', '-a', help='Author name')
    parser.add_argument('--content', '-c', help='Pipe-delimited content blocks')
    parser.add_argument('--file', '-f', help='Load content from text file')
    parser.add_argument('--page-size', default='A4', choices=['A4', 'Letter'], help='Page size')
    parser.add_argument('--margin', type=float, default=20, help='Margin in mm')
    parser.add_argument('--accent', help='Accent colour hex (e.g. 00D4A1)')
    parser.add_argument('--font', default='Helvetica', choices=['Helvetica', 'DejaVu'], help='Font family')
    args = parser.parse_args()

    if args.file:
        content = Path(args.file).read_text(encoding='utf-8')
    elif args.content:
        content = args.content
    else:
        content = ''

    build_pdf(
        args.output,
        content,
        title=args.title,
        author=args.author,
        page_size=args.page_size,
        margin=args.margin,
        accent_color=args.accent,
        font=args.font,
    )


if __name__ == '__main__':
    main()
