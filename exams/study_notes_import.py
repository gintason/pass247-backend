"""
Study notes import — turns an uploaded .docx / .md / .txt file into the
Markdown dialect the frontend StudyNotesViewer renders as colour-coded
panels.

Output conventions (understood by StudyNotesViewer.jsx):
    # 📘 TOPIC 1 | NUMBER AND NUMERATION     -> coloured topic banner
    ## 1.1 Types of Numbers                  -> sub-heading
    > [!DEFINITION] / [!KEY FACT] / [!KEY RULE] / [!FORMULA] /
    > [!WORKED EXAMPLE] / [!EXAM TIP] / [!SUMMARY]  -> coloured panels
    | GFM | tables |                         -> striped tables

The .docx parser is written against the "PASS 24/7 Study Notes" Word
template (shaded single-cell tables for panels, a two-cell numbered table
for each topic header, bold "1.1  Title" paragraphs for sub-headings), but
falls back sensibly for ordinary Word documents (Heading 1/2/3 styles,
bullet lists, plain tables). Only the standard library is used.
"""
import re
import zipfile
from xml.etree import ElementTree as ET

W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
W = '{%s}' % W_NS

TOPIC_ICONS = ['📘', '📗', '📙', '📕']

# Shading colours used by the PASS 24/7 Word template
FILL_BANNER = '1E3A5F'      # dark navy banner rows / table headers
FILL_FORMULA = 'DBEAFE'     # light blue formula / rule boxes
FILL_WORKED = 'DCFCE7'      # light green worked examples / final tips
FILL_TIP = 'FEF3C7'         # light amber exam tips
FILL_INFO = 'F3F4F6'        # light grey info box

STEP_RE = re.compile(r'^\s*Step\s+(\d+)\s*[—–:\-]\s*', re.I)
SUBHEADING_RE = re.compile(r'^\s*(\d+\.\d+)\s+(\S.*)$')
DEFINITION_RE = re.compile(r'^([^—•◦:]{1,60}?)\s+—\s+(.+)$')
BULLET_RE = re.compile(r'^\s*[•●▪■]\s*')
SUB_BULLET_RE = re.compile(r'^\s*[◦○▫□-]\s*')

QUESTION_RE = re.compile(
    r'^(solve|find|evaluate|simplify|calculate|convert|express|round|divide|'
    r'work out|show|prove|an?\s)', re.I)

ALLOWED_EXTENSIONS = ('.docx', '.md', '.markdown', '.txt')


class StudyNotesImportError(ValueError):
    """Raised when an uploaded file cannot be converted."""


# ----------------------------------------------------------------------
# Public API
# ----------------------------------------------------------------------
def convert_uploaded_file(uploaded_file):
    """Return Markdown for an uploaded file object (Django UploadedFile)."""
    name = (getattr(uploaded_file, 'name', '') or '').lower()
    if not name.endswith(ALLOWED_EXTENSIONS):
        raise StudyNotesImportError(
            'Unsupported file type. Upload a .docx, .md or .txt file.'
        )

    if name.endswith('.docx'):
        try:
            return docx_to_markdown(uploaded_file)
        except (zipfile.BadZipFile, KeyError, ET.ParseError) as exc:
            raise StudyNotesImportError(
                'Could not read this Word document. Make sure it is a .docx '
                'file (not .doc) and is not password-protected.'
            ) from exc

    raw = uploaded_file.read()
    for encoding in ('utf-8-sig', 'utf-16', 'cp1252'):
        try:
            return raw.decode(encoding).replace('\r\n', '\n').strip() + '\n'
        except UnicodeDecodeError:
            continue
    raise StudyNotesImportError('Could not decode the text file as UTF-8.')


def docx_to_markdown(file_obj):
    """Convert a .docx file (path or file-like object) to Markdown."""
    with zipfile.ZipFile(file_obj) as zf:
        xml = zf.read('word/document.xml')
    body = ET.fromstring(xml).find(W + 'body')
    if body is None:
        return ''
    return _Converter().convert(body)


# ----------------------------------------------------------------------
# XML helpers
# ----------------------------------------------------------------------
def _para_text(p):
    """Plain text of a <w:p>, honouring tabs and line breaks."""
    parts = []
    for node in p.iter():
        if node.tag == W + 't' and node.text:
            parts.append(node.text)
        elif node.tag == W + 'tab':
            parts.append('    ')
        elif node.tag in (W + 'br', W + 'cr'):
            parts.append('\n')
    return ''.join(parts)


def _para_style(p):
    style = p.find('./%spPr/%spStyle' % (W, W))
    return style.get(W + 'val', '') if style is not None else ''


def _para_is_list(p):
    return p.find('./%spPr/%snumPr' % (W, W)) is not None


def _para_is_bold(p):
    runs = [r for r in p.findall(W + 'r') if (r.findtext(W + 't') or '').strip()]
    if not runs:
        return False
    return all(r.find('./%srPr/%sb' % (W, W)) is not None for r in runs)


def _cell_fill(tc):
    shd = tc.find('./%stcPr/%sshd' % (W, W))
    return (shd.get(W + 'fill', '') if shd is not None else '').upper()


def _cell_lines(tc):
    """List of text lines inside a table cell (one per paragraph/break)."""
    lines = []
    for p in tc.iter(W + 'p'):
        lines.extend(_para_text(p).split('\n'))
    return lines


def _escape(text):
    """Escape characters Markdown would otherwise interpret."""
    text = text.replace('\\', '\\\\')
    text = re.sub(r'([*_`$<>\[\]])', r'\\\1', text)
    # Block-level markers at the very start of a line
    text = re.sub(r'^(\s*)([#+])', r'\1\\\2', text)
    text = re.sub(r'^(\s*)(\d+)([.)])(\s)', r'\1\2\\\3\4', text)
    return text


def _escape_cell(text):
    return _escape(text).replace('|', '\\|').replace('\n', ' ')


# ----------------------------------------------------------------------
# Converter
# ----------------------------------------------------------------------
class _Converter:
    def __init__(self):
        self.out = []
        self.definitions = []
        self.title_lines = []
        self.seen_content = False

    # -- output helpers -------------------------------------------------
    def emit(self, block):
        self.flush_definitions()
        self.out.append(block.rstrip())

    def flush_definitions(self):
        if not self.definitions:
            return
        lines = ['> [!DEFINITION]']
        for term, desc in self.definitions:
            lines.append('> - **%s** — %s' % (_escape(term), _escape(desc)))
        self.out.append('\n'.join(lines))
        self.definitions = []

    def convert(self, body):
        for child in body:
            if child.tag == W + 'p':
                self.paragraph(child)
            elif child.tag == W + 'tbl':
                self.table(child)
        self.flush_definitions()
        self.flush_title()
        md = '\n\n'.join(b for b in self.out if b.strip())
        return re.sub(r'\n{3,}', '\n\n', md).strip() + '\n'

    def flush_title(self):
        """Cover-page banners collected before the first real content."""
        if not self.title_lines:
            return
        title = ' · '.join(self.title_lines)
        self.title_lines = []
        self.out.insert(0, '# 🎯 %s' % _escape(title))

    # -- paragraphs -----------------------------------------------------
    def paragraph(self, p):
        text = _para_text(p).strip()
        if not text:
            return
        self.seen_content = True
        style = _para_style(p).lower()

        heading = re.match(r'heading\s*(\d)', style) or re.match(r'title', style)
        if heading:
            level = int(heading.group(1)) if heading.groups() else 1
            level = min(max(level, 1), 4)
            self.heading(level, text)
            return

        sub = SUBHEADING_RE.match(text)
        if sub and _para_is_bold(p) and len(text) < 90:
            self.emit('## %s %s' % (sub.group(1), _escape(sub.group(2).strip())))
            return

        if BULLET_RE.match(text) or (_para_is_list(p) and not SUB_BULLET_RE.match(text)):
            item = BULLET_RE.sub('', text)
            self.emit('- %s' % self.inline(item))
            self.join_list()
            return

        if SUB_BULLET_RE.match(text) and text[:1] in '◦○▫□':
            item = SUB_BULLET_RE.sub('', text)
            self.emit('  - %s' % self.inline(item))
            self.join_list()
            return

        definition = DEFINITION_RE.match(text)
        if definition and not text.endswith(':'):
            self.definitions.append((definition.group(1).strip(), definition.group(2).strip()))
            return

        self.emit(self.inline(text))

    def join_list(self):
        """Keep consecutive list items in one Markdown list block."""
        if len(self.out) >= 2:
            prev, cur = self.out[-2], self.out[-1]
            prev_last = prev.split('\n')[-1]
            if re.match(r'^\s*- ', prev_last) and re.match(r'^\s*- ', cur):
                self.out[-2:] = [prev + '\n' + cur]

    def inline(self, text):
        """Escape and lightly emphasise 'Label: rest' style lines."""
        m = re.match(r'^([A-Z][^:]{1,40}):\s+(.+)$', text)
        if m and '=' not in m.group(1):
            return '**%s:** %s' % (_escape(m.group(1)), _escape(m.group(2)))
        return _escape(text)

    def heading(self, level, text):
        m = re.match(r'^(?:topic|unit|chapter)\s*(\d+)\s*[:|.\-—–]?\s*(.*)$', text, re.I)
        if level == 1 and m:
            self.topic_heading(int(m.group(1)), m.group(2) or text)
            return
        self.emit('%s %s' % ('#' * (level + 1 if level < 4 else 4), _escape(text)))

    def topic_heading(self, number, title):
        icon = TOPIC_ICONS[(number - 1) % len(TOPIC_ICONS)]
        self.flush_title()
        self.emit('# %s TOPIC %d | %s' % (icon, number, _escape(title.strip().upper())))

    # -- tables ---------------------------------------------------------
    def table(self, tbl):
        rows = tbl.findall(W + 'tr')
        if not rows:
            return
        cells = [r.findall(W + 'tc') for r in rows]

        # Topic header: one row, [number | title]
        if len(rows) == 1 and len(cells[0]) == 2:
            first = ' '.join(_cell_lines(cells[0][0])).strip()
            second = ' '.join(_cell_lines(cells[0][1])).strip()
            if first.isdigit() and second:
                self.topic_heading(int(first), second)
                return

        # Single-cell box -> banner or callout
        if len(rows) == 1 and len(cells[0]) == 1:
            self.box(cells[0][0])
            return

        self.grid(cells)

    def box(self, tc):
        fill = _cell_fill(tc)
        lines = [l.rstrip() for l in _cell_lines(tc)]
        lines = [l for l in lines if l.strip()]
        if not lines:
            return
        label = lines[0].strip()
        upper = label.upper()

        # Cover-page banners (before any real content) become the title
        if not self.seen_content and len(lines) == 1 and fill not in (
                FILL_FORMULA, FILL_WORKED, FILL_TIP, FILL_INFO):
            self.title_lines.append(label)
            return

        # Navy banners: section titles, footer
        if fill == FILL_BANNER and len(lines) == 1:
            if 'CONTENTS' in upper:
                self.emit('## 📑 TABLE OF CONTENTS')
            elif 'QUICK REFERENCE' in upper or 'FORMULA SHEET' in upper:
                self.emit('# 🧾 %s' % _escape(upper))
            else:
                self.emit('> [!SUMMARY]\n> **%s**' % _escape(label))
            return

        self.seen_content = True
        if fill == FILL_INFO and self.title_lines:
            self.flush_title()
            self.emit('> [!SUMMARY]\n' + '\n'.join(
                '> %s  ' % self.inline(l.strip()) for l in lines))
            return

        if upper in ('KEY FACT', 'KEY FACTS'):
            self.callout('KEY FACT', None, lines[1:], style='bullets')
        elif upper.startswith('WORKED EXAMPLE'):
            self.callout('WORKED EXAMPLE', None, lines[1:], style='steps')
        elif upper.startswith('EXAM TIP') or upper.startswith('COMMON PITFALL'):
            self.callout('EXAM TIP', None, lines[1:], style='bullets')
        elif 'TIPS' in upper and len(upper) < 40:
            self.callout('SUMMARY', label, lines[1:], style='steps')
        elif fill == FILL_TIP:
            self.callout('EXAM TIP', None, lines, style='bullets')
        elif fill == FILL_WORKED:
            self.callout('WORKED EXAMPLE', None, lines, style='steps')
        else:
            kind = 'KEY RULE' if 'RULE' in upper else 'FORMULA'
            self.callout(kind, label, lines[1:], style='formula')

    def callout(self, kind, title, lines, style):
        out = ['> [!%s]' % kind]
        if title:
            out.append('> **%s**' % _escape(title))
            out.append('>')

        if style == 'steps':
            out.extend(self.steps(lines))
        elif style == 'formula':
            for line in lines:
                indent = len(line) - len(line.lstrip())
                text = line.strip()
                # Deeper-indented lines (examples, "where" clauses) nest
                nested = indent >= 4 or re.match(r'^(e\.g\.|eg\b|where\b)', text, re.I)
                prefix = '>   - ' if nested and len(out) > 2 else '> - '
                out.append(prefix + _escape(text))
        else:
            for line in lines:
                text = re.sub(r'^\s*(\d+[.)]|[•◦-])\s*', '', line.strip())
                out.append('> - ' + _escape(text))
        self.emit('\n'.join(out))

    def steps(self, lines):
        """Worked example: question, numbered working, highlighted answer."""
        out = []
        n = 0
        for i, raw in enumerate(lines):
            text = raw.strip()
            numbered = re.match(r'^(\d+)[.)]\s+(.+)$', text)
            step = STEP_RE.match(text)
            if i == 0 and not step and not numbered and (
                    '=' not in text or QUESTION_RE.match(text)):
                out.append('> **❓ %s**' % _escape(text))
                out.append('>')
                continue
            if re.match(r'^(answer|check)\b', text, re.I):
                if out and out[-1] != '>':
                    out.append('>')
                out.append('> **✅ %s**' % _escape(text))
                out.append('>')
                n = 0
                continue
            if text.endswith(':') and not step and not numbered:
                if out and out[-1] != '>':
                    out.append('>')
                out.append('> **%s**' % _escape(text))
                out.append('>')
                n = 0
                continue
            if re.match(r'^\(?(note|compare)\b', text, re.I):
                if out and out[-1] != '>':
                    out.append('>')
                out.append('> *%s*' % _escape(text))
                out.append('>')
                n = 0
                continue
            if step:
                text = STEP_RE.sub('', text)
            elif numbered:
                text = numbered.group(2)
            n += 1
            out.append('> %d. %s' % (n, _escape(text)))
        while out and out[-1] == '>':
            out.pop()
        return out

    def grid(self, cells):
        width = max(len(r) for r in cells)

        def cell_md(tc):
            parts = [l.strip() for l in _cell_lines(tc) if l.strip()]
            if not parts:
                return ' '
            if len(parts) == 1:
                return _escape_cell(parts[0])
            return '**%s** — %s' % (_escape_cell(parts[0]),
                                    ' · '.join(_escape_cell(p) for p in parts[1:]))

        rows = [[cell_md(tc) for tc in r] + [' '] * (width - len(r)) for r in cells]

        header_is_banner = all(_cell_fill(tc) == FILL_BANNER for tc in cells[0])
        if header_is_banner:
            header, body = rows[0], rows[1:]
        else:
            header, body = (['Item', 'Details'] + ['—'] * (width - 2))[:width], rows

        # Table-of-contents grids: decorate the "Topic N" column
        if all(re.match(r'^Topic \d+$', r[0]) for r in body) and body:
            header = ['#', 'Topic']
            body = [
                ['%s\u00a0%s' % (TOPIC_ICONS[(int(r[0].split()[1]) - 1) % 4], r[0].split()[1])] + r[1:]
                for r in body
            ]

        lines = ['| ' + ' | '.join(header) + ' |',
                 '|' + '|'.join(['---'] * width) + '|']
        lines += ['| ' + ' | '.join(r) + ' |' for r in body]
        self.emit('\n'.join(lines))
