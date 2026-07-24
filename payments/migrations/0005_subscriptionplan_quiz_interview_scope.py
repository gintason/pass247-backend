from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0004_userplansubscription_delete_usersubscription'),
        ('quiz', '0001_initial'),
        ('pasApp', '0004_alter_category_options_alter_contactmessage_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='subscriptionplan',
            name='quiz_categories',
            field=models.ManyToManyField(blank=True, help_text='Quiz categories included in this plan', to='quiz.category'),
        ),
        migrations.AddField(
            model_name='subscriptionplan',
            name='interview_products',
            field=models.ManyToManyField(blank=True, help_text='Interview products included in this plan', to='pasApp.product'),
        ),
    ]
