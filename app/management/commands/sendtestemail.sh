#!/bin/bash
python manage.py sendtestemail test@example.com --subject "開発環境テスト" --message "これは開発環境からのテストメールです。"
python manage.py sendtestemail user@example.com --subject "開発環境テスト" --message "これは開発環境からのテストメールです。"