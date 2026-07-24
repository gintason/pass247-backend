from django.apps import AppConfig


class ExamsConfig(AppConfig):
    name = 'exams'

    def ready(self):
        import signals.admin_signals  # noqa
