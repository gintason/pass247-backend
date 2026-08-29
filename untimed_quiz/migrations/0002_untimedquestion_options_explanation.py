from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("untimed_quiz", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="untimedquestion",
            name="options",
            field=models.TextField(
                blank=True,
                default="",
                help_text="Optional choices/options, e.g. pipe- or comma-separated.",
            ),
        ),
        migrations.AddField(
            model_name="untimedquestion",
            name="explanation",
            field=models.TextField(
                blank=True,
                default="",
                help_text="Optional explanation / answer details.",
            ),
        ),
    ]
