# Document Creator Skill

**Trigger phrases:** "create a document", "make a docx", "generate a Word file", "create a spreadsheet", "make an Excel file", "create an xlsx", "create a PowerPoint", "make a presentation", "pptx", "create a PDF", "generate a PDF", "convert markdown to docx", "convert markdown to PDF", "convert between formats"

---

## Tools Available

All tools live in `C:\Users\bryan\.openclaw\workspace\tools\`

| Format | Tool | Library | Capabilities |
|--------|------|---------|-------------|
| Word | `docx_create.py` | `python-docx` | Headings, paragraphs, bold/italic/underline, lists, tables, images, hyperlinks |
| Excel | `xlsx_create.py` | `openpyxl` | Multiple sheets, formulas, styling, charts, freeze panes, cell formats |
| PowerPoint | `pptx_create.py` | `python-pptx` | Slides, titles, text boxes, bullet lists, images, shapes |
| PDF | `pdf_create.py` | `reportlab` | Rich text, tables, drawing primitives, page templates |
| Markdown converter | `md_to_docx.py` | `markdown-it-py` + `python-docx` | Full markdown → Word conversion |
| Markdown converter | `md_to_pdf.py` | `markdown-it-py` + `reportlab` | Full markdown → PDF conversion |
| Universal converter | `convert.py` | `pandoc` (if installed) | Any format to any format |

---

## Usage

### Create a Word document
```
python C:\Users\bryan\.openclaw\workspace\tools\docx_create.py ^
  --output "C:\path\to\output.docx" ^
  --title "My Document" ^
  --content "Heading 1|Bold intro paragraph||Heading 2|Normal text here||Bullet|Item 1|Bullet|Item 2"
```

**Special markers in --content:**
- `||` = new block (heading, paragraph, or list item)
- `|` within a block = list items (when prefix is `Bullet|`, `Number|`, or `Roman|`)

**Inline formatting:** `**bold**`, `*italic*`, `__underline__`

**Add a table:**
```
--table "Header 1,Header 2,Header 3|Row1 Col1,Row1 Col2,Row1 Col3"
```

**Add an image:**
```
--image "C:\path\to\image.png,width=200,alignment=center"
```

**Add a hyperlink:**
```
--hyperlink "Click here|https://example.com"
```

---

### Create an Excel spreadsheet
```
python C:\Users\bryan\.openclaw\workspace\tools\xlsx_create.py ^
  --output "C:\path\to\output.xlsx" ^
  --sheets "Sheet1,Sheet2" ^
  --data "Sheet1,A1:C3,Header Row|Col A,Col B,Col C|Data1,100,=SUM(B1:B3)|Data2,200"
```

**Cell types:** `text`, `number`, `formula`, `date`, `currency`, `percentage`

**Styling:** `--style "Sheet1!A1:C3,header=true,bold=true,bg=4472C4,fg=FFFFFF"`

---

### Create a PowerPoint
```
python C:\Users\bryan\.openclaw\workspace\tools\pptx_create.py ^
  --output "C:\path\to\output.pptx" ^
  --slides "Slide 1,Slide 2,Slide 3" ^
  --content "Slide 1:My Title|This is the slide body text|Bullet|Point 1|Bullet|Point 2||Slide 2:Second Slide|More content here"
```

**Add an image to a slide:**
```
--image "Slide 2,C:\path\to\image.png,center,width=5"
```

---

### Create a PDF directly
```
python C:\Users\bryan\.openclaw\workspace\tools\pdf_create.py ^
  --output "C:\path\to\output.pdf" ^
  --title "My PDF" ^
  --content "This is a paragraph.||**Bold text** and *italic text*.||Bullet|Item 1|Bullet|Item 2"
```

---

### Convert Markdown to Word
```
python C:\Users\bryan\.openclaw\workspace\tools\md_to_docx.py ^
  --input "C:\path\to\source.md" ^
  --output "C:\path\to\output.docx"
```

**Options:**
- `--styles` = apply heading styles (Heading 1, 2, 3)
- `--toc` = auto-generate table of contents
- `--cover "Title|Author|Date"` = add cover page

---

### Convert Markdown to PDF
```
python C:\Users\bryan\.openclaw\workspace\tools\md_to_pdf.py ^
  --input "C:\path\to\source.md" ^
  --output "C:\path\to\output.pdf"
```

**Options:**
- `--page-size A4|Letter` (default: A4)
- `--margin 20` (mm, default: 20)
- `--cover "Title|Author|Date"` = add cover page

---

### Universal format conversion (requires pandoc)
```
python C:\Users\bryan\.openclaw\workspace\tools\convert.py ^
  --input "C:\path\to\source.docx" ^
  --output "C:\path\to\output.md"
```

Pandoc must be installed separately: `winget install JohnMacFarlane.Pandoc`

---

## Design Principles

- **Zero external API calls** — all generation is local
- **Factual content only** — never hallucinate names, numbers, or dates
- **Structured output** — use tables for data, headings for hierarchy
- **Brand-consistent** — PRISMAL-mint (#00D4A1) accent colour for headers in PDFs
- **Memory** — after any creation task, note what was produced in the daily memory file

---

## Architecture

```
tools/
  docx_create.py       -- Word document generator
  xlsx_create.py       -- Excel spreadsheet generator
  pptx_create.py       -- PowerPoint generator
  pdf_create.py        -- PDF generator (ReportLab)
  md_to_docx.py        -- Markdown → Word converter
  md_to_pdf.py         -- Markdown → PDF converter
  convert.py           -- Universal format converter (pandoc)
  docx_library.py      -- Shared docx utilities
  pdf_styles.py        -- Shared PDF styles/layouts
```

---

## Dependencies

```
python-docx>=1.2.0
openpyxl>=3.1.5
python-pptx>=1.0.2
reportlab>=4.4.10
markdown-it-py>=4.0.0
```
