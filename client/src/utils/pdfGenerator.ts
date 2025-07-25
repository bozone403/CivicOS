import jsPDF from 'jspdf';

export interface PDFReportData {
  title: string;
  subtitle?: string;
  sections: {
    title: string;
    content: string[];
    data?: Record<string, any>;
  }[];
  metadata?: {
    generatedBy?: string;
    generatedAt?: string;
    source?: string;
  };
}

export class PDFReportGenerator {
  private doc: jsPDF;
  private yPosition: number = 20;
  private pageHeight: number;
  private margin: number = 20;

  constructor() {
    this.doc = new jsPDF();
    this.pageHeight = this.doc.internal.pageSize.height;
  }

  generateReport(data: PDFReportData): void {
    this.addHeader(data.title, data.subtitle);
    this.addMetadata(data.metadata);
    
    data.sections.forEach(section => {
      this.addSection(section.title, section.content, section.data);
    });

    this.addFooter();
  }

  private addHeader(title: string, subtitle?: string): void {
    // Title
    this.doc.setFontSize(20);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(title, this.margin, this.yPosition);
    this.yPosition += 10;

    // Subtitle
    if (subtitle) {
      this.doc.setFontSize(14);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(subtitle, this.margin, this.yPosition);
      this.yPosition += 8;
    }

    // Line separator
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.yPosition, 190, this.yPosition);
    this.yPosition += 15;
  }

  private addMetadata(metadata?: PDFReportData['metadata']): void {
    if (!metadata) return;

    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "italic");
    
    if (metadata.generatedAt) {
      this.doc.text(`Generated: ${new Date(metadata.generatedAt).toLocaleString()}`, this.margin, this.yPosition);
      this.yPosition += 5;
    }
    
    if (metadata.source) {
      this.doc.text(`Source: ${metadata.source}`, this.margin, this.yPosition);
      this.yPosition += 5;
    }
    
    if (metadata.generatedBy) {
      this.doc.text(`Generated by: ${metadata.generatedBy}`, this.margin, this.yPosition);
      this.yPosition += 10;
    }
  }

  private addSection(title: string, content: string[], data?: Record<string, any>): void {
    this.checkPageBreak(20);

    // Section title
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(title, this.margin, this.yPosition);
    this.yPosition += 10;

    // Section content
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "normal");
    
    content.forEach(line => {
      this.checkPageBreak(6);
      const splitText = this.doc.splitTextToSize(line, 170);
      this.doc.text(splitText, this.margin, this.yPosition);
      this.yPosition += splitText.length * 5;
    });

    // Add data table if provided
    if (data) {
      this.addDataTable(data);
    }

    this.yPosition += 5;
  }

  private addDataTable(data: Record<string, any>): void {
    this.checkPageBreak(30);
    
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    
    Object.entries(data).forEach(([key, value]) => {
      this.checkPageBreak(5);
      this.doc.text(`${key}:`, this.margin + 5, this.yPosition);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(String(value), this.margin + 50, this.yPosition);
      this.doc.setFont("helvetica", "bold");
      this.yPosition += 5;
    });
  }

  private addFooter(): void {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "normal");
      this.doc.text(
        `Page ${i} of ${pageCount} | Generated by CivicOS`,
        this.margin,
        this.pageHeight - 10
      );
      this.doc.text(
        new Date().toISOString().split('T')[0],
        190 - this.margin,
        this.pageHeight - 10,
        { align: 'right' }
      );
    }
  }

  private checkPageBreak(requiredSpace: number): void {
    if (this.yPosition + requiredSpace > this.pageHeight - 30) {
      this.doc.addPage();
      this.yPosition = 20;
    }
  }

  save(filename: string): void {
    this.doc.save(filename);
  }

  output(): string {
    return this.doc.output('datauristring');
  }
}

// Utility functions for specific report types
export function generatePoliticianReport(politician: any): void {
  const generator = new PDFReportGenerator();
  
  const reportData: PDFReportData = {
    title: `Politician Profile: ${politician.name}`,
    subtitle: `${politician.position} - ${politician.party}`,
    sections: [
      {
        title: "Basic Information",
        content: [
          `Position: ${politician.position}`,
          `Party: ${politician.party}`,
          `Constituency: ${politician.constituency || 'N/A'}`,
          `Trust Score: ${politician.trustScore || 'N/A'}/100`
        ]
      },
      {
        title: "Contact Information",
        content: [
          `Email: ${politician.email || 'Not available'}`,
          `Phone: ${politician.phone || 'Not available'}`,
          `Office: ${politician.officeAddress || 'Not available'}`
        ]
      }
    ],
    metadata: {
      generatedBy: "CivicOS Political Intelligence Platform",
      generatedAt: new Date().toISOString(),
      source: "Parliament of Canada Open Data"
    }
  };

  generator.generateReport(reportData);
  generator.save(`politician-${politician.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}

export function generateBillReport(bill: any): void {
  const generator = new PDFReportGenerator();
  
  const reportData: PDFReportData = {
    title: `Bill Analysis: ${bill.number}`,
    subtitle: bill.title,
    sections: [
      {
        title: "Bill Overview",
        content: [
          `Number: ${bill.number}`,
          `Title: ${bill.title}`,
          `Status: ${bill.status}`,
          `Category: ${bill.category}`
        ]
      },
      {
        title: "Summary",
        content: [bill.summary || "No summary available"]
      }
    ],
    metadata: {
      generatedBy: "CivicOS Political Intelligence Platform",
      generatedAt: new Date().toISOString(),
      source: "LEGISinfo Parliament Database"
    }
  };

  generator.generateReport(reportData);
  generator.save(`bill-${bill.number.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}