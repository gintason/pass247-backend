"""
Practice Portal API.

Separates the two engines:

* Practice mode - free for every signed-up student. Questions whose `usage`
  is PRACTICE or BOTH, grouped by PracticeCategory, with instant feedback.
* Main Exam mode - the timed exam engine. Questions whose `usage` is EXAM or
  BOTH. Requires an active paid plan (or a bank subscription / admin).

Also serves the pickers the portal needs: exam bodies, subjects (with what is
available for each), exam years and exam syllabuses.
"""
import random

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .category_utils import category_slug, resolve_exam_category
from .models import (
    ExamCategory, ExamSyllabus, ExamYear, PastQuestionCollection,
    PracticeCategory, PracticeSession, Question, QuestionBank, StudyNotes,
    Subject,
)
from .serializers import ExamSyllabusDetailSerializer, ExamSyllabusSerializer

MAX_PRACTICE_QUESTIONS = 200
DEFAULT_MAIN_EXAM_QUESTIONS = 40
MAX_MAIN_EXAM_QUESTIONS = 100


# ----------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------
def _error(message, code, http_status, **extra):
    """Uniform error body: {'error': ..., 'code': ...} (+ extra keys)."""
    body = {'error': message, 'code': code}
    body.update(extra)
    return Response(body, status=http_status)


def has_main_exam_access(user):
    """Paid plan, bank subscription, premium profile or admin."""
    # Imported lazily: views.py imports this module's neighbours at load time.
    from .views import _get_user_full_access
    return bool(user and user.is_authenticated and _get_user_full_access(user))


def upgrade_required_response():
    """402 body the frontend turns into the 'Upgrade Plan' prompt."""
    plans = []
    try:
        from payments.models import SubscriptionPlan
        for plan in SubscriptionPlan.objects.all().order_by('price'):
            plans.append({
                'id': plan.id,
                'name': plan.name,
                'plan_type': plan.plan_type,
                'price': plan.price,
                'discounted_price': plan.get_discounted_price(),
                'duration_days': plan.duration_days,
                'is_popular': plan.is_popular,
            })
    except Exception:  # payments app unavailable - prompt still works
        plans = []
    return _error(
        'Main Exam Mode (timed, exam-standard papers) is part of a paid plan. '
        'Upgrade to unlock it - practice questions and study notes stay free.',
        'upgrade_required',
        status.HTTP_402_PAYMENT_REQUIRED,
        upgrade_url='/payment-plans',
        plans=plans,
    )


def _resolve_subject(value):
    if value in (None, ''):
        return None
    value = str(value).strip()
    qs = Subject.objects.filter(is_active=True)
    if value.isdigit():
        return qs.filter(id=int(value)).first()
    return (qs.filter(name__iexact=value).first()
            or qs.filter(code__iexact=value).first())


def _parse_int(value, default=None):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _shuffled_ids(questions, limit=None):
    ids = list(questions.values_list('id', flat=True))
    random.shuffle(ids)
    return ids[:limit] if limit else ids


def _start_session(user, bank, session_type, question_ids):
    return PracticeSession.objects.create(
        user=user,
        question_bank=bank,
        session_type=session_type,
        total_questions=len(question_ids),
        questions_order=question_ids,
        show_explanation_on_wrong=session_type == 'PRACTICE',
        allow_review=True,
    )


def _session_payload(session, **extra):
    bank = session.question_bank
    data = {
        'session_id': session.id,
        'session_type': session.session_type,
        'total_questions': session.total_questions,
        'duration_minutes': bank.duration_minutes if session.session_type == 'EXAM' else None,
        'subject_id': bank.subject_id,
        'subject_name': bank.subject.name,
        'exam_category': category_slug(bank.exam_category),
        'bank_id': bank.id,
    }
    data.update(extra)
    return data


# ----------------------------------------------------------------------
# Pickers
# ----------------------------------------------------------------------
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def portal_exam_bodies(request):
    """Active exam bodies (JSSCE, WAEC/NECO, UTME/JAMB, ...) with URL slugs."""
    bodies = [{
        'id': c.id,
        'slug': category_slug(c),
        'name': c.name,
        'display_name': c.display_name,
        'description': c.description,
        'icon': c.icon,
    } for c in ExamCategory.objects.filter(is_active=True).order_by('order', 'name')]
    return Response({'exam_bodies': bodies})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def portal_subjects(request):
    """
    Subjects for an exam body, with what each one offers so the portal can
    show badges and hide empty sections:
    practice_questions, main_exam_questions, past_questions, has_notes, syllabuses.
    """
    category = resolve_exam_category(request.query_params.get('exam_category'))
    if request.query_params.get('exam_category') and not category:
        return _error('Unknown exam category', 'unknown_exam_category', status.HTTP_404_NOT_FOUND)

    subjects = Subject.objects.filter(is_active=True)
    question_filter = Q(questions__is_published=True)
    if category:
        # Resolve the subject ids first: filtering and counting across the
        # same multi-valued relation in one query would make the counts
        # depend on the filter's join.
        ids = Subject.objects.filter(
            Q(exam_categories=category) | Q(questions__exam_category=category)
        ).values_list('id', flat=True)
        subjects = subjects.filter(id__in=set(ids))
        question_filter &= Q(questions__exam_category=category)

    subjects = subjects.annotate(
        practice_count=Count(
            'questions', filter=question_filter & Q(questions__usage__in=Question.PRACTICE_USAGES),
            distinct=True),
        exam_count=Count(
            'questions', filter=question_filter & Q(questions__usage__in=Question.EXAM_USAGES)
            & Q(questions__question_type='OBJECTIVE'),
            distinct=True),
    ).order_by('order', 'name')

    notes_subjects = set(StudyNotes.objects.filter(is_active=True).values_list('subject_id', flat=True))
    syllabus_qs = ExamSyllabus.objects.filter(is_active=True)
    past_qs = PastQuestionCollection.objects.filter(is_active=True)
    if category:
        syllabus_qs = syllabus_qs.filter(exam_category=category)
        past_qs = past_qs.filter(exam_category=category)
    syllabus_counts = dict(
        syllabus_qs.exclude(subject=None).values_list('subject').annotate(n=Count('id')).values_list('subject', 'n'))
    general_syllabuses = syllabus_qs.filter(subject=None).count()
    past_counts = dict(
        past_qs.values_list('subject').annotate(n=Count('questions', distinct=True)).values_list('subject', 'n'))
    # Same fallback as get_past_questions(): year-tagged objective questions
    # count as past questions for subjects without a collection.
    year_tagged = Question.objects.filter(is_published=True, question_type='OBJECTIVE', exam_year__isnull=False)
    if category:
        year_tagged = year_tagged.filter(exam_category=category)
    year_counts = dict(
        year_tagged.values_list('subject').annotate(n=Count('id')).values_list('subject', 'n'))

    data = [{
        'id': s.id,
        'name': s.name,
        'code': s.code,
        'icon': s.icon,
        'practice_questions': s.practice_count,
        'main_exam_questions': s.exam_count,
        'past_questions': past_counts.get(s.id) or year_counts.get(s.id, 0),
        'has_notes': s.id in notes_subjects,
        'syllabuses': syllabus_counts.get(s.id, 0) + general_syllabuses,
    } for s in subjects]
    return Response({
        'exam_category': category_slug(category) if category else None,
        'subjects': data,
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def exam_years(request):
    """
    Years for the Year Picker (past questions and main exam). Union of the
    ExamYear rows an admin created and the years actually used by questions,
    newest first, each with its question count.
    """
    category = resolve_exam_category(request.query_params.get('exam_category'))
    subject = _resolve_subject(request.query_params.get('subject'))

    questions = Question.objects.filter(is_published=True, exam_year__isnull=False)
    years = ExamYear.objects.filter(is_active=True)
    if category:
        questions = questions.filter(exam_category=category)
        years = years.filter(exam_category=category)
    if subject:
        questions = questions.filter(subject=subject)

    counts = dict(questions.values_list('exam_year__year').annotate(n=Count('id')).values_list('exam_year__year', 'n'))
    all_years = set(counts) | set(years.values_list('year', flat=True))
    return Response({
        'years': [{'year': y, 'question_count': counts.get(y, 0)} for y in sorted(all_years, reverse=True)],
    })


# ----------------------------------------------------------------------
# Access
# ----------------------------------------------------------------------
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def portal_access(request):
    """What the current visitor can use - drives the lock icons and upgrade prompts."""
    from utils.access import free_question_status
    user = request.user
    signed_in = bool(user and user.is_authenticated)
    status_ = free_question_status(user) if signed_in else {
        'full_access': False, 'free_questions_limit': None,
        'free_questions_used': 0, 'free_questions_remaining': None}
    full = status_['full_access']
    return Response({
        'is_authenticated': signed_in,
        'full_access': full,
        'practice_unlocked': signed_in and (full or (status_['free_questions_remaining'] or 0) > 0),
        'main_exam_unlocked': full,
        'notes_unlocked': full,
        'syllabus_unlocked': full,
        'past_questions_unlocked': full,
        **{k: v for k, v in status_.items() if k != 'full_access'},
        'upgrade_url': '/payment-plans',
    })


# ----------------------------------------------------------------------
# Practice engine (free for signed-up students)
# ----------------------------------------------------------------------
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def practice_categories(request):
    """
    Practice sets for an exam body / subject. Practice questions that are not
    in any category are offered as one "All <subject> practice questions" set
    (id null) so nothing uploaded is hidden.
    """
    category = resolve_exam_category(request.query_params.get('exam_category'))
    subject = _resolve_subject(request.query_params.get('subject'))

    cats = PracticeCategory.objects.filter(is_active=True).select_related('subject', 'exam_category')
    loose = Question.objects.filter(
        is_published=True, usage__in=Question.PRACTICE_USAGES, practice_category__isnull=True)
    if category:
        cats = cats.filter(exam_category=category)
        loose = loose.filter(exam_category=category)
    if subject:
        cats = cats.filter(subject=subject)
        loose = loose.filter(subject=subject)

    cats = cats.annotate(question_count=Count(
        'questions', filter=Q(questions__is_published=True,
                              questions__usage__in=Question.PRACTICE_USAGES),
        distinct=True))

    data = [{
        'id': c.id,
        'name': c.name,
        'description': c.description,
        'subject_id': c.subject_id,
        'subject_name': c.subject.name,
        'exam_category': category_slug(c.exam_category),
        'question_count': c.question_count,
    } for c in cats if c.question_count > 0]

    for row in (loose.values('subject_id', 'subject__name')
                .annotate(n=Count('id')).order_by('subject__name')):
        data.append({
            'id': None,
            'name': f"All {row['subject__name']} practice questions",
            'description': 'Mixed practice across topics.',
            'subject_id': row['subject_id'],
            'subject_name': row['subject__name'],
            'exam_category': category_slug(category) if category else None,
            'question_count': row['n'],
        })
    return Response({'categories': data})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def start_practice(request):
    """
    Start an unrestricted practice session.

    Body: {"practice_category_id": 3}  or
          {"subject_id": 5, "exam_category": "jssce"}  (+ optional "limit")
    """
    data = request.data
    limit = _parse_int(data.get('limit'), 0) or None
    if limit:
        limit = max(1, min(limit, MAX_PRACTICE_QUESTIONS))

    practice_category = None
    category_id = data.get('practice_category_id')
    if category_id not in (None, '', 'null'):
        practice_category = PracticeCategory.objects.filter(
            id=_parse_int(category_id, -1), is_active=True
        ).select_related('subject', 'exam_category').first()
        if not practice_category:
            return _error('Practice set not found', 'practice_category_not_found',
                          status.HTTP_404_NOT_FOUND)
        subject = practice_category.subject
        category = practice_category.exam_category
        questions = practice_category.practice_questions()
    else:
        subject = _resolve_subject(data.get('subject_id') or data.get('subject'))
        if not subject:
            return _error('Choose a subject (subject_id) or a practice set (practice_category_id).',
                          'subject_required', status.HTTP_400_BAD_REQUEST)
        category = resolve_exam_category(data.get('exam_category'))
        questions = Question.objects.filter(
            subject=subject, is_published=True, usage__in=Question.PRACTICE_USAGES,
            practice_category__isnull=True)
        if category:
            questions = questions.filter(exam_category=category)
        else:
            category = subject.exam_categories.first() or (
                questions.first().exam_category if questions.exists() else None)

    # Free users: 10 questions in total across Practice and Exams; the session
    # holds at most the number of free questions they have left.
    from utils.access import has_full_access, free_questions_remaining, subscription_payload
    if not has_full_access(request.user, 'exams'):
        remaining = free_questions_remaining(request.user)
        if remaining <= 0:
            return Response(subscription_payload('questions'), status=status.HTTP_402_PAYMENT_REQUIRED)
        limit = min(limit or remaining, remaining)

    question_ids = _shuffled_ids(questions, limit or MAX_PRACTICE_QUESTIONS)
    if not question_ids or category is None:
        return _error('There are no practice questions here yet. Please pick another set.',
                      'no_questions', status.HTTP_400_BAD_REQUEST)

    bank, _ = QuestionBank.objects.get_or_create(
        bank_type=QuestionBank.BANK_TYPE_PRACTICE,
        is_auto_generated=True,
        subject=subject,
        exam_category=category,
        practice_category=practice_category,
        defaults={
            'name': f"Practice · {subject.name} · {practice_category.name if practice_category else 'All topics'}",
            'description': 'Created automatically by the Practice Portal.',
            'is_free': True,
            'has_free_trial': False,
        },
    )
    bank.questions.add(*question_ids)

    session = _start_session(request.user, bank, 'PRACTICE', question_ids)
    return Response(_session_payload(session), status=status.HTTP_201_CREATED)


# ----------------------------------------------------------------------
# Main exam engine (paid)
# ----------------------------------------------------------------------
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def start_main_exam(request):
    """
    Start a timed Main Exam session.

    Body: {"subject_id": 5, "exam_category": "waec", "year": 2023 (optional),
           "limit": 40 (optional)}
    Returns 402 {code: 'upgrade_required', plans: [...]} without a paid plan.
    """
    if not has_main_exam_access(request.user):
        return upgrade_required_response()

    data = request.data
    subject = _resolve_subject(data.get('subject_id') or data.get('subject'))
    if not subject:
        return _error('Choose a subject for the exam.', 'subject_required', status.HTTP_400_BAD_REQUEST)
    category = resolve_exam_category(data.get('exam_category'))
    if not category:
        return _error('Choose an exam body (e.g. WAEC, JAMB, JSSCE).', 'exam_category_required',
                      status.HTTP_400_BAD_REQUEST)

    year = _parse_int(data.get('year'))
    limit = _parse_int(data.get('limit'), DEFAULT_MAIN_EXAM_QUESTIONS)
    limit = max(1, min(limit, MAX_MAIN_EXAM_QUESTIONS))

    questions = Question.objects.filter(
        subject=subject, exam_category=category, is_published=True,
        usage__in=Question.EXAM_USAGES, question_type='OBJECTIVE')
    exam_year = None
    if year:
        questions = questions.filter(exam_year__year=year)
        exam_year = ExamYear.objects.filter(exam_category=category, year=year).first()

    question_ids = _shuffled_ids(questions, limit)
    if not question_ids:
        when = f' for {year}' if year else ''
        return _error(f'No {category.display_name} {subject.name} exam questions{when} yet. '
                      f'Try another year or subject.', 'no_questions', status.HTTP_400_BAD_REQUEST)

    # Use the admin's own exam bank for timing when one exists for this paper.
    admin_bank = QuestionBank.objects.filter(
        bank_type=QuestionBank.BANK_TYPE_EXAM, is_auto_generated=False, is_active=True,
        subject=subject, exam_category=category, exam_year=exam_year,
    ).first()
    duration = admin_bank.duration_minutes if admin_bank else max(10, len(question_ids))

    bank, _ = QuestionBank.objects.get_or_create(
        bank_type=QuestionBank.BANK_TYPE_EXAM,
        is_auto_generated=True,
        subject=subject,
        exam_category=category,
        exam_year=exam_year,
        defaults={
            'name': f"Main Exam · {category.display_name} · {subject.name} · {year or 'Mixed years'}",
            'description': 'Created automatically for Main Exam Mode.',
            'is_free': False,
            'has_free_trial': False,
            'duration_minutes': duration,
        },
    )
    if bank.duration_minutes != duration:
        bank.duration_minutes = duration
        bank.save(update_fields=['duration_minutes'])
    bank.questions.add(*question_ids)

    session = _start_session(request.user, bank, 'EXAM', question_ids)
    return Response(_session_payload(session, year=year), status=status.HTTP_201_CREATED)


# ----------------------------------------------------------------------
# Syllabuses
# ----------------------------------------------------------------------
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def syllabus_list(request):
    """?exam_category=waec&subject=5 - subject filter also returns general syllabuses."""
    qs = ExamSyllabus.objects.filter(is_active=True).select_related('exam_category', 'subject')
    raw_category = request.query_params.get('exam_category')
    if raw_category:
        category = resolve_exam_category(raw_category)
        if not category:
            return Response({'syllabuses': []})
        qs = qs.filter(exam_category=category)
    subject = _resolve_subject(request.query_params.get('subject'))
    if subject:
        qs = qs.filter(Q(subject=subject) | Q(subject__isnull=True))
    from utils.access import has_full_access
    unlocked = has_full_access(request.user, 'exams')
    data = ExamSyllabusSerializer(qs, many=True, context={'request': request}).data
    if not unlocked:
        # Students can see which syllabuses exist (the "button"), not open them.
        for item in data:
            item.update({'file_url': None, 'external_url': '', 'locked': True})
    return Response({'syllabuses': data, 'locked': not unlocked})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def syllabus_detail(request, pk):
    syllabus = ExamSyllabus.objects.filter(pk=pk, is_active=True).select_related(
        'exam_category', 'subject').first()
    if not syllabus:
        return _error('Syllabus not found', 'syllabus_not_found', status.HTTP_404_NOT_FOUND)
    from utils.access import has_full_access, subscription_payload
    if not has_full_access(request.user, 'exams'):
        return Response(subscription_payload(
            'exams', message='Syllabuses are for subscribers. Subscribe to view and download them.',
            title=syllabus.title), status=status.HTTP_402_PAYMENT_REQUIRED)
    return Response(ExamSyllabusDetailSerializer(syllabus, context={'request': request}).data)


def session_time_remaining(session):
    """Seconds left in a timed Main Exam session (None for untimed sessions)."""
    if session.session_type != 'EXAM':
        return None
    duration = (session.question_bank.duration_minutes or 0) * 60
    if not duration:
        return None
    elapsed = (timezone.now() - session.started_at).total_seconds()
    return max(0, int(duration - elapsed))
