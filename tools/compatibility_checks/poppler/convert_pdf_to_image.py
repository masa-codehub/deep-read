#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDFファイルをJPGまたはPNG画像に変換するスクリプト
"""

import os
import argparse
from pdf2image import convert_from_path
from datetime import datetime

def convert_pdf_to_images(pdf_path, output_dir=None, format='jpg', dpi=200):
    """
    PDFファイルを指定した形式の画像に変換する

    Parameters:
    -----------
    pdf_path : str
        変換するPDFファイルのパス
    output_dir : str, optional
        出力先ディレクトリ。指定がなければPDFと同じディレクトリ
    format : str, optional
        出力形式 ('jpg' または 'png')
    dpi : int, optional
        解像度 (DPI)

    Returns:
    --------
    list
        生成された画像ファイルのパスのリスト
    """
    if output_dir is None:
        output_dir = os.path.dirname(os.path.abspath(pdf_path))
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # PDFのファイル名（拡張子なし）を取得
    pdf_filename = os.path.splitext(os.path.basename(pdf_path))[0]
    
    # 現在時刻をファイル名に含めて一意にする
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # PDFを画像に変換
    print(f"PDFファイル '{pdf_path}' を {format.upper()} 形式に変換中...")
    images = convert_from_path(
        pdf_path,
        dpi=dpi,
        fmt=format.lower()
    )
    
    # 変換した画像を保存
    image_paths = []
    for i, image in enumerate(images):
        # ページ番号は1から始める
        page_num = i + 1
        image_filename = f"{pdf_filename}_page{page_num}_{timestamp}.{format.lower()}"
        image_path = os.path.join(output_dir, image_filename)
        
        image.save(image_path)
        image_paths.append(image_path)
        print(f"ページ {page_num}/{len(images)} を保存しました: {image_path}")
    
    return image_paths

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='PDFファイルを画像に変換します')
    parser.add_argument('pdf_path', help='変換するPDFファイルのパス')
    parser.add_argument('--output-dir', '-o', help='出力先ディレクトリ')
    parser.add_argument('--format', '-f', choices=['jpg', 'png'], default='jpg',
                      help='出力画像形式 (jpg または png)')
    parser.add_argument('--dpi', '-d', type=int, default=200,
                      help='出力画像の解像度 (DPI)')
    
    args = parser.parse_args()
    
    output_images = convert_pdf_to_images(
        args.pdf_path,
        args.output_dir,
        args.format,
        args.dpi
    )
    
    print(f"\n変換完了: {len(output_images)}ページの画像を生成しました")
    print(f"出力形式: {args.format.upper()}, 解像度: {args.dpi} DPI")