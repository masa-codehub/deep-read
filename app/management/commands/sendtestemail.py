"""Management command for sending test emails to verify email configuration.

This module provides a Django management command to send test emails,
which is useful for verifying that email functionality is working correctly.
"""
from django.core.management.base import BaseCommand, CommandError
from django.core.mail import send_mail
from django.conf import settings


class Command(BaseCommand):
    """Command for sending test emails to verify email configuration."""
    help = 'Sends a test email to a specified recipient.'

    def add_arguments(self, parser):
        """Add command line arguments to the parser.

        Args:
            parser: The argument parser instance
        """
        parser.add_argument('recipient_email', type=str, help='The email address of the recipient.')
        parser.add_argument(
            '--subject',
            type=str,
            default='Test Email from Django Application',
            help='The subject of the email.'
        )
        parser.add_argument(
            '--message',
            type=str,
            default='This is a test email sent from the Django application configured with TASK-INFRA-01.',
            help='The body of the email.'
        )

    def handle(self, *args, **options):
        """Execute the command to send a test email.

        Args:
            *args: Variable length argument list
            **options: Arbitrary keyword arguments from command line

        Raises:
            CommandError: If email settings are not configured or if sending fails
        """
        recipient_email = options['recipient_email']
        subject = options['subject']
        message = options['message']

        # settings.DEFAULT_FROM_EMAIL が設定されていない場合や空の場合のフォールバック
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None)
        if not from_email:
            # settings.SERVER_EMAIL も試す (エラーメール用だが、送信元として使える場合がある)
            from_email = getattr(settings, 'SERVER_EMAIL', None)

        if not from_email:
            raise CommandError("DEFAULT_FROM_EMAIL (or SERVER_EMAIL as fallback) is not set or is empty in settings. Please configure it.")

        try:
            send_mail(subject, message, from_email, [recipient_email], fail_silently=False)
            self.stdout.write(self.style.SUCCESS(f"Successfully sent test email to {recipient_email} from {from_email}"))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Error sending email: {e}"))
            # 追加情報として、使用されたEMAIL_BACKENDも表示するとデバッグに役立つ
            email_backend = getattr(settings, 'EMAIL_BACKEND', 'Not configured')
            self.stderr.write(self.style.NOTICE(f"Using EMAIL_BACKEND: {email_backend}"))
            # fail_silently=False なので、ここで例外を再送出する必要はないが、
            # CommandErrorでラップして終了ステータスを制御するのも一般的
            raise CommandError(f"Failed to send email. Check settings and error message above. Using backend: {email_backend}")
