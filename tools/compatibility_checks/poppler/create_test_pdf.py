from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

def create_test_pdf(output_path):
    """シンプルなテストPDFを作成する"""
    c = canvas.Canvas(output_path, pagesize=A4)
    
    # 1ページ目
    c.setFont("Helvetica", 24)
    c.drawString(100, 700, "テストPDF - 1ページ目")
    c.setFont("Helvetica", 16)
    c.drawString(100, 650, "Popplerテスト用PDFファイル")
    
    # 2ページ目
    c.showPage()
    c.setFont("Helvetica", 24)
    c.drawString(100, 700, "テストPDF - 2ページ目")
    
    # PDFを保存
    c.save()
    print(f"テストPDFを作成しました: {output_path}")

if __name__ == "__main__":
    create_test_pdf("test.pdf")