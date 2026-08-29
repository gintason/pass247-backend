from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("exams", "0004_studynotes_pastquestioncollection"),
    ]

    operations = [
        migrations.AddField(
            model_name="question",
            name="diagram_url",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Optional image URL or file path for questions that include a diagram/figure.",
                max_length=500,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="question",
            name="essay_paragraph",
            field=models.TextField(
                blank=True,
                default="",
                help_text="Optional comprehension passage / essay paragraph body for passage-based questions.",
            ),
            preserve_default=False,
        ),
    ]
