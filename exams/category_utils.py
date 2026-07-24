"""
Exam-category resolution.

The frontend refers to exam categories in several inconsistent ways depending
on entry point:

  * PracticeHome.getExamTitle() and Careers.jsx use URL slugs:
        jssce, waec, jamb, post-utme, aptitude, promotion, civil
  * Exams.jsx sometimes passes the numeric category id (cat.id)
  * ExamCategory.name (the DB value) is:
        JSS, WASSCE, UTME, POST_UTME, APTITUDE, PROMOTION, CIVIL
  * ExamCategory.display_name is:
        JSSCE, WAEC/NECO, UTME/JAMB, Post-UTME, Aptitude Tests, ...

Several of these cannot be derived from one another by normalisation
(waec -> WASSCE, jamb -> UTME, jssce -> JSS), so an explicit slug map is
required. get_past_questions() previously filtered with
`exam_category__name__iexact=<slug>`, which silently matched nothing for
WAEC/JAMB/JSSCE - the direct cause of "No Past Questions Available" even
when questions existed. (Study Notes was unaffected because it never filters
on exam category.)

resolve_exam_category() returns the ExamCategory instance for any of the
accepted forms, or None if nothing matches.
"""

# URL slug -> ExamCategory.name. Only the non-obvious ones strictly need to be
# here, but listing all of them keeps the intent explicit and self-documenting.
SLUG_TO_NAME = {
    'jssce': 'JSS',
    'jss': 'JSS',
    'waec': 'WASSCE',
    'neco': 'WASSCE',
    'wassce': 'WASSCE',
    'jamb': 'UTME',
    'utme': 'UTME',
    'post-utme': 'POST_UTME',
    'post_utme': 'POST_UTME',
    'postutme': 'POST_UTME',
    'aptitude': 'APTITUDE',
    'promotion': 'PROMOTION',
    'civil': 'CIVIL',
}


def resolve_exam_category(identifier):
    """
    Resolve any frontend exam-category identifier to an ExamCategory, or None.

    Accepts: numeric id (int or digit string), URL slug, ExamCategory.name,
    or ExamCategory.display_name. Matching is case-insensitive.
    """
    # Imported lazily to avoid a circular import at app-load time.
    from .models import ExamCategory

    if identifier is None:
        return None

    value = str(identifier).strip()
    if not value:
        return None

    # 1. Numeric primary key
    if value.isdigit():
        return ExamCategory.objects.filter(id=int(value)).first()

    lowered = value.lower()

    # 2. Known URL slug
    if lowered in SLUG_TO_NAME:
        match = ExamCategory.objects.filter(name=SLUG_TO_NAME[lowered]).first()
        if match:
            return match

    # 3. Exact name or display_name (case-insensitive)
    return (
        ExamCategory.objects.filter(name__iexact=value).first()
        or ExamCategory.objects.filter(display_name__iexact=value).first()
    )
