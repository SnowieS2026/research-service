"""
md_to_pdf.py -- Convert Markdown files to PDF documents.
Usage:
  python md_to_pdf.py --input "source.md" --output "out.pdf"
  python md_to_pdf.py --input "source.md" --output "out.pdf" --page-size A4 --margin 20 --accent 00D4A1

Options:
  --input              Input markdown file (required)
  --output             Output .pdf path (required)
  --page-size          A4|Letter (default: A4)
  --margin             Margin in mm (default: 20)
  --accent             Accent colour hex (default: 00D4A1)
  --title              Document title (for metadata + optional cover)
  --author             Author name (for metadata)
  --toc                Generate table of contents from headings
  --cover              Add cover page with title/author/date
  --body-font-size     Body font size in pt (default: 11)
"""

import argparse
import re
import sys
from pathlib import Path
from io import BytesIO

try:
    from markdown_it import MarkdownIt
    from reportlab.lib.pagesizes import A4, letter
    from reportlab.lib.units import mm
    from reportlab.lib.colors import HexColor, black, white
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        HRFlowable, PageBreak, Image, KeepTogether, ListFlowable, ListItem
    )
    from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
except ImportError:
    print("ERROR: Missing dependencies. Run: pip install markdown-it-py reportlab")
    sys.exit(1)


ACCENT_COLOR = HexColor('#00D4A1')
DARK_BG = HexColor('#0A0F1C')
TEXT_COLOR = HexColor('#1A1A2E')
CODE_BG = HexColor('#F5F5F5')


def fix_encoding(text):
    """Fix encoding for ReportLab PDF rendering."""
    if not text:
        return text
    # Replace pound sign with HTML entity
    text = text.replace('\xc2\xa3', '&#163;')
    # Replace other problematic chars
    text = text.replace('\ufffd', '')
    # Smart quotes -> ASCII
    text = text.replace('\xe2\x80\x98', "'")
    text = text.replace('\xe2\x80\x99', "'")
    text = text.replace('\xe2\x80\x9c', '"')
    text = text.replace('\xe2\x80\x9d', '"')
    text = text.replace('\xe2\x80\x94', '--')
    text = text.replace('\xe2\x80\x93', '-')
    # Clear any remaining control chars
    text = ''.join(c for c in text if ord(c) >= 32 or c in '\n\r\t')
    return text


def parse_inline(text):
    """Parse inline **bold**, *italic*, `code`, __underline__ formatting."""
    if not text:
        return []
    parts = []
    # Match **bold**, *italic*, `code`, __underline__
    pattern = re.compile(r'(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|__[^_]+__)')
    last_end = 0
    for match in pattern.finditer(text):
        if match.start() > last_end:
            parts.append(('normal', text[last_end:match.start()]))
        content = match.group()[2:-2] if match.group().startswith('**') else match.group()[1:-1]
        if match.group().startswith('**'):
            parts.append(('bold', content))
        elif match.group().startswith('*'):
            parts.append(('italic', content))
        elif match.group().startswith('`'):
            parts.append(('code', content))
        elif match.group().startswith('__'):
            parts.append(('underline', content))
        last_end = match.end()
    if last_end < len(text):
        parts.append(('normal', text[last_end:]))
    return parts if parts else [('normal', text)]


def build_paragraph(text, style):
    """Build a ReportLab Paragraph with inline formatting."""
    if not text:
        return Paragraph('', style)
    parts = parse_inline(text)
    frags = []
    for style_name, content in parts:
        content = fix_encoding(content)
        content = content.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
        if style_name == 'bold':
            frags.append(f'<b>{content}</b>')
        elif style_name == 'italic':
            frags.append(f'<i>{content}</i>')
        elif style_name == 'underline':
            frags.append(f'<u>{content}</u>')
        elif style_name == 'code':
            frags.append(f'<font name="Courier">{content}</font>')
        else:
            frags.append(content)
    full_text = ''.join(frags)
    return Paragraph(full_text, style)


def make_styles(body_size=11, accent=ACCENT_COLOR):
    """Create paragraph styles."""
    styles = {
        'h1': ParagraphStyle('H1', fontName='Helvetica-Bold', fontSize=22,
            textColor=DARK_BG, spaceAfter=10, spaceBefore=18, leading=28),
        'h2': ParagraphStyle('H2', fontName='Helvetica-Bold', fontSize=16,
            textColor=DARK_BG, spaceAfter=8, spaceBefore=14, leading=22),
        'h3': ParagraphStyle('H3', fontName='Helvetica-Bold', fontSize=13,
            textColor=DARK_BG, spaceAfter=6, spaceBefore=10, leading=18),
        'body': ParagraphStyle('Body', fontName='Helvetica', fontSize=body_size,
            textColor=TEXT_COLOR, spaceAfter=7, leading=body_size + 5,
            alignment=TA_JUSTIFY),
        'bullet': ParagraphStyle('Bullet', fontName='Helvetica', fontSize=body_size,
            textColor=TEXT_COLOR, spaceAfter=4, leading=body_size + 3,
            leftIndent=20, firstLineIndent=-15),
        'number': ParagraphStyle('Number', fontName='Helvetica', fontSize=body_size,
            textColor=TEXT_COLOR, spaceAfter=4, leading=body_size + 3,
            leftIndent=24, firstLineIndent=-18),
        'quote': ParagraphStyle('Quote', fontName='Helvetica-Oblique', fontSize=body_size,
            textColor=HexColor('#555555'), spaceAfter=8, leading=body_size + 5,
            leftIndent=25, rightIndent=25, alignment=TA_CENTER),
        'code': ParagraphStyle('Code', fontName='Courier', fontSize=9,
            textColor=HexColor('#333333'), spaceAfter=6, leading=13,
            backColor=CODE_BG, leftIndent=10, rightIndent=10),
        'h1_toc': ParagraphStyle('H1TOC', fontName='Helvetica-Bold', fontSize=14,
            textColor=DARK_BG, spaceAfter=6, spaceBefore=12, leading=18),
        'h2_toc': ParagraphStyle('H2TOC', fontName='Helvetica-Bold', fontSize=12,
            textColor=DARK_BG, spaceAfter=4, spaceBefore=8, leading=15,
            leftIndent=15),
        'h3_toc': ParagraphStyle('H3TOC', fontName='Helvetica-Bold', fontSize=11,
            textColor=HexColor('#444444'), spaceAfter=3, spaceBefore=6, leading=14,
            leftIndent=30),
    }
    return styles


def md_to_pdf(md_path, pdf_path, page_size='A4', margin=20, accent_color=None,
              title=None, author=None, add_toc=False, add_cover=False,
              body_font_size=11):
    """Convert a markdown file to PDF."""

    if accent_color:
        accent = HexColor(f'#{accent_color}')
    else:
        accent = ACCENT_COLOR

    if page_size == 'Letter':
        pagesize = letter
    else:
        pagesize = A4

    page_width = pagesize[0]

    md_text = Path(md_path).read_text(encoding='utf-8')
    md = MarkdownIt()
    tokens = md.parse(md_text)

    styles = make_styles(body_font_size, accent)
    story = []

    # Process tokens
    i = 0
    current_heading = None
    current_heading_level = None
    current_para = []
    in_bullet = False
    current_bullet = []
    in_code = False
    toc_entries = []

    def flush_para():
        nonlocal current_para
        if current_para:
            text = ' '.join(current_para)
            story.append(build_paragraph(text, styles['body']))
            current_para = []

    def flush_bullet():
        nonlocal current_bullet
        if current_bullet:
            for item in current_bullet:
                story.append(build_paragraph(f'\u2022 {item}', styles['bullet']))
            current_bullet = []

    while i < len(tokens):
        tok = tokens[i]

        if tok.type == 'heading_open':
            flush_para()
            flush_bullet()
            level = int(tok.tag[1])
            current_heading_level = level
        elif tok.type == 'heading_close':
            text = current_heading or ''
            if current_heading_level == 1:
                story.append(Paragraph(fix_encoding(text), styles['h1']))
                toc_entries.append((1, text))
            elif current_heading_level == 2:
                story.append(Paragraph(fix_encoding(text), styles['h2']))
                toc_entries.append((2, text))
            elif current_heading_level == 3:
                story.append(Paragraph(fix_encoding(text), styles['h3']))
                toc_entries.append((3, text))
            current_heading = None
            current_heading_level = None
        elif tok.type == 'inline':
            content = tok.content
            if current_heading_level is not None:
                current_heading = content
            elif in_bullet:
                current_bullet.append(content)
            else:
                current_para.append(content)
        elif tok.type == 'bullet_list_open':
            flush_para()
            flush_bullet()
            in_bullet = True
        elif tok.type == 'bullet_list_close':
            flush_bullet()
            in_bullet = False
        elif tok.type == 'ordered_list_open':
            flush_para()
            flush_bullet()
            in_bullet = True
        elif tok.type == 'ordered_list_close':
            flush_bullet()
            in_bullet = False
        elif tok.type == 'fence':
            flush_para()
            flush_bullet()
            code_text = fix_encoding(tok.info + '\n' + tok.content if tok.info else tok.content)
            story.append(build_paragraph(code_text, styles['code']))
        elif tok.type == 'code_block':
            flush_para()
            flush_bullet()
            code_text = fix_encoding(tok.content)
            story.append(build_paragraph(code_text, styles['code']))
        elif tok.type == 'hr':
            flush_para()
            flush_bullet()
            story.append(Spacer(1, 5 * mm))
            story.append(HRFlowable(width='100%', thickness=1.5, color=accent))
            story.append(Spacer(1, 5 * mm))
        elif tok.type == 'paragraph_open':
            flush_para()
            flush_bullet()
        elif tok.type == 'paragraph_close':
            flush_para()
        elif tok.type == 'blockquote_open':
            flush_para()
            flush_bullet()
        elif tok.type == 'blockquote_close':
            pass

        i += 1

    flush_para()
    flush_bullet()

    # Build PDF
    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=pagesize,
        leftMargin=margin * mm,
        rightMargin=margin * mm,
        topMargin=margin * mm,
        bottomMargin=margin * mm,
        title=title or Path(md_path).stem,
        author=author or '',
    )

    # Cover page
    if add_cover:
        story.insert(0, Spacer(1, 60 * mm))
        if title:
            story.insert(1, Paragraph(fix_encoding(title), ParagraphStyle(
                'CoverTitle', fontName='Helvetica-Bold', fontSize=36,
                textColor=DARK_BG, alignment=TA_CENTER, leading=44, spaceAfter=10
            )))
        if author:
            story.insert(2, Paragraph(fix_encoding(author), ParagraphStyle(
                'CoverAuthor', fontName='Helvetica-Oblique', fontSize=16,
                textColor=HexColor('#666666'), alignment=TA_CENTER
            )))
        story.insert(3, Spacer(1, 10 * mm))
        story.insert(4, HRFlowable(width='100%', thickness=3, color=accent))
        story.insert(5, PageBreak())

    # Table of contents
    if add_toc and toc_entries:
        story.append(PageBreak())
        story.append(Paragraph('Contents', ParagraphStyle(
            'TOCTitle', fontName='Helvetica-Bold', fontSize=20,
            textColor=DARK_BG, spaceAfter=15
        )))
        for level, text in toc_entries:
            if level == 1:
                story.append(Paragraph(fix_encoding(text), styles['h1_toc']))
            elif level == 2:
                story.append(Paragraph(fix_encoding(text), styles['h2_toc']))
            elif level == 3:
                story.append(Paragraph(fix_encoding(text), styles['h3_toc']))

    doc.build(story)
    size = Path(pdf_path).stat().st_size
    print(f"Converted: {md_path} -> {pdf_path} ({size:,} bytes)")


def main():
    parser = argparse.ArgumentParser(description='Convert Markdown to PDF')
    parser.add_argument('--input', '-i', required=True, help='Input markdown file')
    parser.add_argument('--output', '-o', required=True, help='Output .pdf path')
    parser.add_argument('--page-size', default='A4', choices=['A4', 'Letter'], help='Page size')
    parser.add_argument('--margin', type=float, default=20, help='Margin in mm')
    parser.add_argument('--accent', default='00D4A1', help='Accent colour hex (default: 00D4A1)')
    parser.add_argument('--title', help='Document title')
    parser.add_argument('--author', help='Author name')
    parser.add_argument('--toc', action='store_true', help='Generate table of contents')
    parser.add_argument('--cover', action='store_true', help='Add cover page')
    parser.add_argument('--body-font-size', type=int, default=11, help='Body font size in pt')
    args = parser.parse_args()

    md_to_pdf(
        args.input,
        args.output,
        page_size=args.page_size,
        margin=args.margin,
        accent_color=args.accent,
        title=args.title,
        author=args.author,
        add_toc=args.toc,
        add_cover=args.cover,
        body_font_size=args.body_font_size,
    )


if __name__ == '__main__':
    main()
