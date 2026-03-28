"""
convert.py -- Universal format converter using pandoc.
Converts between any two formats pandoc supports.

Supported formats include:
  markdown, plain text, docx, xlsx (via pandas), pptx, odt,
  html, pdf, rtf, epub, reStructuredText, mediawiki, latex,
  and many more.

Requires pandoc to be installed: winget install JohnMacFarlane.Pandoc
Or: https://pandoc.org/installing.html

Usage:
  python convert.py --input "document.docx" --output "document.md"
  python convert.py --input "notes.md" --output "notes.html" --standalone
  python convert.py --input "report.docx" --output "report.pdf" --pdf-engine wkhtmltopdf
"""

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path


PANDOC_FORMATS = {
    'markdown', 'plain', 'docx', 'xlsx', 'pptx', 'odt', 'html',
    'rtf', 'epub', 'latex', 'rst', 'mediawiki', 'textile',
    'gfm', 'commonmark', 'org', 'asciidoc', 'pdf',
}


def check_pandoc():
    """Check if pandoc is installed."""
    try:
        result = subprocess.run(['pandoc', '--version'],
                               capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            version_line = result.stdout.split('\n')[0]
            print(f"  {version_line}")
            return True
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    return False


def convert_file(input_path, output_path, extra_args=None):
    """Convert a file using pandoc."""
    input_ext = Path(input_path).suffix.lstrip('.').lower()
    output_ext = Path(output_path).suffix.lstrip('.').lower()

    cmd = ['pandoc', str(input_path), '-o', str(output_path)]

    if extra_args:
        cmd.extend(extra_args)

    # PDF output needs a PDF engine
    if output_ext == 'pdf':
        # Check for available PDF engines
        for engine in ['pdflatex', 'lualatex', 'xelatex', 'wkhtmltopdf', 'weasyprint']:
            if shutil.which(engine):
                cmd.extend(['--pdf-engine', engine])
                break

    # Markdown output: use gfm for GitHub-flavoured
    if output_ext in ('md', 'markdown') and input_ext != 'md':
        cmd.append('--wrap=none')

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if result.returncode != 0:
        print(f"  Pandoc error: {result.stderr}")
        return False
    return True


def main():
    parser = argparse.ArgumentParser(
        description='Universal file format converter using pandoc',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python convert.py --input report.docx --output report.md
  python convert.py --input notes.md --output notes.html --standalone
  python convert.py --input data.csv --output data.xlsx
  python convert.py --input presentation.pptx --output slides.html

Install pandoc: winget install JohnMacFarlane.Pandoc
        '''
    )
    parser.add_argument('--input', '-i', required=True, help='Input file')
    parser.add_argument('--output', '-o', required=True, help='Output file')
    parser.add_argument('--standalone', action='store_true',
                        help='For HTML: produce standalone output with header')
    parser.add_argument('--pdf-engine', choices=['pdflatex', 'lualatex', 'xelatex', 'wkhtmltopdf', 'weasyprint'],
                        help='PDF engine to use (default: auto-detect)')
    parser.add_argument('--reference-doc', help='Reference .docx for styling')
    parser.add_argument('--check', action='store_true', help='Check pandoc installation only')
    args = parser.parse_args()

    if args.check:
        print("Checking pandoc...", end=' ')
        if check_pandoc():
            print("OK")
            sys.exit(0)
        else:
            print("NOT FOUND")
            print("Install: winget install JohnMacFarlane.Pandoc")
            sys.exit(1)

    input_path = Path(args.input)
    output_path = Path(args.output)

    if not input_path.exists():
        print(f"ERROR: Input file not found: {input_path}")
        sys.exit(1)

    print(f"Converting: {input_path.name} -> {output_path.name}")

    # Check pandoc
    if not check_pandoc():
        print("ERROR: pandoc is not installed.")
        print("Install: winget install JohnMacFarlane.Pandoc")
        sys.exit(1)

    extra = []
    if args.standalone:
        extra.append('--standalone')
    if args.reference_doc:
        extra.extend(['--reference-doc', args.reference_doc])
    if args.pdf_engine:
        extra.extend(['--pdf-engine', args.pdf_engine])

    output_path.parent.mkdir(parents=True, exist_ok=True)

    if convert_file(input_path, output_path, extra):
        size = output_path.stat().st_size
        print(f"  OK: {output_path} ({size:,} bytes)")
    else:
        print(f"  FAILED")
        sys.exit(1)


if __name__ == '__main__':
    main()
