import React from 'react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { BlogPost } from '@shared/schema';
import { formatDate } from '@/lib/date-utils';

interface DownloadPDFButtonProps {
  post: BlogPost;
  className?: string;
}

export default function DownloadPDFButton({ post, className = "" }: DownloadPDFButtonProps) {
  const [isGenerating, setIsGenerating] = React.useState(false);

  const generatePDF = async () => {
    try {
      setIsGenerating(true);

      // Create a temporary container for PDF content
      const pdfContainer = document.createElement('div');
      pdfContainer.style.position = 'absolute';
      pdfContainer.style.left = '-9999px';
      pdfContainer.style.width = '794px'; // A4 width in pixels
      pdfContainer.style.padding = '40px';
      pdfContainer.style.backgroundColor = 'white';
      pdfContainer.style.fontFamily = 'Arial, sans-serif';
      
      // Create PDF content
      pdfContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #3B82F6;">
          <h1 style="color: #3B82F6; font-size: 24px; margin: 0; font-weight: bold;">Evolvo.uz</h1>
          <p style="color: #6B7280; margin: 10px 0 0 0; font-size: 14px;">AI Powered Business Solutions</p>
        </div>

        <div style="margin-bottom: 30px;">
          <div style="background: #F3F4F6; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-bottom: 15px;">
            <span style="color: #3B82F6; font-size: 12px; font-weight: 600;">${post.category}</span>
          </div>
          <h1 style="color: #1F2937; font-size: 28px; margin: 0 0 20px 0; line-height: 1.3;">${post.title}</h1>
          <div style="color: #6B7280; font-size: 14px; margin-bottom: 20px;">
            <span>${post.publishedAt ? formatDate(post.publishedAt) : 'Bugun'}</span> • 
            <span>${post.readTime} daqiqa o'qish</span> • 
            <span>Evolvo.uz jamoasi</span>
          </div>
          <p style="color: #4B5563; font-size: 16px; line-height: 1.6; font-style: italic; margin: 0;">${post.excerpt}</p>
        </div>

        ${post.imageUrl ? `<div style="margin-bottom: 30px; text-align: center;">
          <img src="${post.imageUrl}" alt="${post.title}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
        </div>` : ''}

        <div style="color: #374151; font-size: 14px; line-height: 1.7; text-align: justify;">
          ${post.content.split('\n\n').map(paragraph => 
            `<p style="margin: 0 0 15px 0;">${paragraph}</p>`
          ).join('')}
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
          <h3 style="color: #1F2937; font-size: 16px; margin: 0 0 10px 0;">Teglar:</h3>
          <div style="margin-bottom: 20px;">
            ${post.keywords.split(',').map(tag => 
              `<span style="background: #F3F4F6; color: #6B7280; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 8px;">#${tag.trim().replace(/\s+/g, '')}</span>`
            ).join('')}
          </div>
          <div style="text-align: center; margin-top: 30px; padding: 20px; background: #F8FAFC; border-radius: 8px;">
            <h3 style="color: #3B82F6; font-size: 18px; margin: 0 0 10px 0;">Bizning xizmatlarimizdan foydalaning</h3>
            <p style="color: #6B7280; font-size: 14px; margin: 0 0 15px 0;">AI texnologiyalari yordamida biznesingizni rivojlantiring</p>
            <p style="color: #3B82F6; font-size: 14px; font-weight: 600; margin: 0;">
              🌐 https://evolvo.uz | 📱 @evolvoaiuz_bot | 📧 info@evolvo.uz
            </p>
          </div>
        </div>
      `;

      document.body.appendChild(pdfContainer);

      // Convert to canvas and then to PDF
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        backgroundColor: '#ffffff',
        allowTaint: true,
        useCORS: true
      });

      // Remove temporary container
      document.body.removeChild(pdfContainer);

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content is longer
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save PDF
      const filename = `evolvo-${post.slug}.pdf`;
      pdf.save(filename);

    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF yaratishda xato yuz berdi. Iltimos, qayta urinib ko\'ring.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generatePDF}
      disabled={isGenerating}
      className={`${className}`}
      data-testid="download-pdf-button"
    >
      <i className={`${isGenerating ? 'fas fa-spinner fa-spin' : 'fas fa-download'} mr-2`}></i>
      {isGenerating ? 'PDF yaratilmoqda...' : 'PDF yuklab olish'}
    </Button>
  );
}