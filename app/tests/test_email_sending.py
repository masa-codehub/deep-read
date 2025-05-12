"""Test module for email sending functionality in the application."""
from django.core import mail
from django.test import TestCase
from django.conf import settings
from django.core.management import call_command  # 管理コマンドをテスト内で呼び出す場合


class MockEmailSendingTests(TestCase):
    """Test case for verifying email sending functionality."""

    def test_send_mail_directly(self):
        """Test direct invocation of django.core.mail.send_mail."""
        subject = "本番モックテスト (直接呼び出し)"
        message = "これは本番環境を想定したモックテストメールです（直接）。"
        from_email = settings.DEFAULT_FROM_EMAIL  # settingsから取得
        recipient_list = ["mock_recipient@example.com"]

        mail.send_mail(subject, message, from_email, recipient_list, fail_silently=False)

        # 1通のメールが送信されたことを確認
        self.assertEqual(len(mail.outbox), 1)

        # 送信されたメールの内容を確認
        sent_email = mail.outbox[0]
        self.assertEqual(sent_email.subject, subject)
        self.assertEqual(sent_email.body, message)
        self.assertEqual(sent_email.from_email, from_email)
        self.assertEqual(sent_email.to, recipient_list)

    def test_send_test_email_command(self):
        """Test the sendtestemail management command."""
        recipient = "command_recipient@example.com"
        subject = "管理コマンド経由テスト"
        message_body = "管理コマンドからのモックテストメール。"

        # settings.DEFAULT_FROM_EMAIL がテスト環境で利用可能であることを確認
        expected_from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'fallback@example.com')

        call_command('sendtestemail', recipient, f'--subject={subject}', f'--message={message_body}')

        self.assertEqual(len(mail.outbox), 1)
        sent_email = mail.outbox[0]
        self.assertEqual(sent_email.subject, subject)
        # コマンドのデフォルトメッセージは 'This is a test email sent from the Django application configured with TASK-INFRA-01.'
        # 引数で渡した message_body が使われることを確認
        self.assertEqual(sent_email.body, message_body)
        self.assertEqual(sent_email.from_email, expected_from_email)
        self.assertEqual(sent_email.to, [recipient])

    def setUp(self):
        """Clear outbox before each test method execution."""
        mail.outbox = []
