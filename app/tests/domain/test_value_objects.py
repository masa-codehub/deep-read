"""値オブジェクトのテスト。

ドメイン値オブジェクトの機能をテストします。
"""
from django.test import TestCase, override_settings

from app.domain.value_objects import Email, Password


class TestEmailValueObject(TestCase):
    """Email値オブジェクトのテストケース"""

    def test_valid_email(self):
        """有効なメールアドレスの場合、エラーなく作成できることをテスト"""
        valid_emails = [
            "test@example.com",
            "user.name@domain.co.jp",
            "user+tag@example.org"
        ]

        for email in valid_emails:
            email_vo = Email(email)
            self.assertEqual(str(email_vo), email)

    def test_invalid_email(self):
        """無効なメールアドレスの場合、ValueErrorが発生することをテスト"""
        invalid_emails = [
            "test",  # @がない
            "test@",  # ドメインがない
            "@example.com",  # ローカル部がない
            "test@example",  # TLDがない
            "te st@example.com",  # スペースを含む
        ]

        for email in invalid_emails:
            with self.assertRaises(ValueError):
                Email(email)


@override_settings(AUTH_PASSWORD_VALIDATORS=[
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
])
class TestPasswordValueObject(TestCase):
    """Password値オブジェクトのテストケース"""

    def test_valid_password(self):
        """有効なパスワードの場合、エラーなく作成できることをテスト"""
        # 一般的でない複雑なパスワード
        valid_passwords = [
            "Uncomm0n!P@ssw0rd",
            "Very!Complex#P4ss",
            "N0nC0mm0n!P@ss123"
        ]

        for password in valid_passwords:
            password_vo = Password(password)
            self.assertEqual(password_vo.value, password)

    def test_password_too_short(self):
        """短すぎるパスワードの場合、ValueErrorが発生することをテスト"""
        with self.assertRaises(ValueError) as context:
            Password("Sh0rt!")
        self.assertIn("must contain at least 8 characters",
                      str(context.exception))

    def test_password_common(self):
        """一般的なパスワードの場合、ValueErrorが発生することをテスト"""
        with self.assertRaises(ValueError) as context:
            # より一般的なパスワードを試す
            Password("password123")
        self.assertIn("一般的すぎ", str(context.exception))

    def test_password_numeric(self):
        """数字のみのパスワードの場合、ValueErrorが発生することをテスト"""
        with self.assertRaises(ValueError) as context:
            Password("12345678")
        self.assertIn("数字しか使われていません", str(context.exception))

    def test_password_matches(self):
        """パスワード確認が一致するかテスト"""
        password = Password("Uncomm0n!P@ssw0rd")
        self.assertTrue(password.matches("Uncomm0n!P@ssw0rd"))
        self.assertFalse(password.matches("DifferentP@ss123"))
