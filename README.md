# deep-read

## ローカル開発環境でのメール送信テスト

ローカルでメール送信機能をテストする場合、MailHogのようなローカルSMTPサーバーを利用すると便利です。
MailHogを利用するには、以下の環境変数を設定します。

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=mailhog
EMAIL_PORT=1025
EMAIL_USE_TLS=False
EMAIL_USE_SSL=False
# EMAIL_HOST_USER と EMAIL_HOST_PASSWORD はMailHogの場合、通常不要です。
```

これらの設定は、`.env` ファイルに記述するか、Docker Composeの環境変数として設定してください。
`app/settings/development.py` では、デフォルトでコンソールへのメール出力が設定されていますが、上記のように環境変数を設定することでMailHog経由でのテストが可能です。