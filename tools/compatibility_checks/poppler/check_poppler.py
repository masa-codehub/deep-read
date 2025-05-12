from pdf2image.exceptions import PDFInfoNotInstalledError
from pdf2image import pdfinfo_from_path
import os
import subprocess

# テスト用の簡単なPDFファイルのパス
dummy_pdf_path = "test.pdf"  # 実際に小さなPDFを配置してテストするのが望ましい

try:
    # Popplerが見つかるか確認
    print("Attempting to check if Poppler is installed in PATH...")
    
    # コマンドラインでpdftopmをチェック
    try:
        pdftoppm_path = subprocess.check_output(["which", "pdftoppm"], 
                                                universal_newlines=True).strip()
        print(f"Found pdftoppm at: {pdftoppm_path}")
        
        # バージョン情報を取得
        pdftoppm_version = subprocess.check_output(["pdftoppm", "-v"], 
                                                   stderr=subprocess.STDOUT,
                                                   universal_newlines=True).strip()
        print(f"Poppler version: {pdftoppm_version}")
        
        print("Poppler is correctly installed and accessible in PATH.")
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("Error: pdftoppm command not found in PATH.")
        print("Please ensure poppler-utils is properly installed.")

    # テスト用PDFファイルがある場合は、実際に変換を試す
    if os.path.exists(dummy_pdf_path):
        print(f"\nTesting with PDF file: {dummy_pdf_path}")
        info = pdfinfo_from_path(dummy_pdf_path)
        print(f"Successfully accessed Poppler. PDF has {info['Pages']} pages.")
        
        # 実際に変換を試す
        from pdf2image import convert_from_path
        images = convert_from_path(dummy_pdf_path)
        if images:
            print(f"Successfully converted PDF into {len(images)} image(s).")
        else:
            print("Conversion seemed to succeed but no images were returned.")
    else:
        print(f"Note: Test PDF file '{dummy_pdf_path}' not found. Skipping actual conversion test.")

except PDFInfoNotInstalledError:
    print("Error: Poppler (pdfinfo) is not installed or not found in PATH.")
    print("Please ensure 'poppler-utils' is installed and pdftoppm/pdfinfo are in the PATH.")
except Exception as e:
    print(f"An unexpected error occurred: {e}")
    print("This might be due to a missing test PDF or other issues.")