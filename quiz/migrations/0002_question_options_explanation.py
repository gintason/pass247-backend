from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("quiz", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="question",
            name="options",
            field=models.TextField(
                blank=True,
                default="",
                help_text="Optional choices/options, e.g. pipe- or comma-separated.",
            ),
        ),
        migrations.AddField(
            model_name="question",
            name="explanation",
            field=models.TextField(
                blank=True,
                default="",
                help_text="Optional explanation / answer details shown after submission.",
            ),
        ),
    ]
