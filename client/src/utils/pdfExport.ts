import jsPDF from 'jspdf';

interface PDFExportOptions {
  title: string;
  subtitle?: string;
  data: any;
  type: 'politician' | 'bill' | 'dashboard' | 'petition';
  includeCharts?: boolean;
}

export class PDFExporter {
  private doc: jsPDF;
  private yPosition: number = 20;
  private pageWidth: number = 210;
  private margin: number = 20;

  constructor() {
    this.doc = new jsPDF();
  }

  private addTitle(text: string, size: number = 16) {
    this.doc.setFontSize(size);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(text, this.margin, this.yPosition);
    this.yPosition += size + 5;
  }

  private addSubtitle(text: string, size: number = 12) {
    this.doc.setFontSize(size);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(text, this.margin, this.yPosition);
    this.yPosition += size + 3;
  }

  private addText(text: string, size: number = 10) {
    this.doc.setFontSize(size);
    this.doc.setFont('helvetica', 'normal');
    
    // Handle text wrapping
    const maxWidth = this.pageWidth - (2 * this.margin);
    const lines = this.doc.splitTextToSize(text, maxWidth);
    
    for (const line of lines) {
      if (this.yPosition > 280) {
        this.doc.addPage();
        this.yPosition = 20;
      }
      this.doc.text(line, this.margin, this.yPosition);
      this.yPosition += 5;
    }
    this.yPosition += 3;
  }

  private addSection(title: string, content: string) {
    this.addSubtitle(title, 12);
    this.addText(content, 10);
  }

  private addTable(headers: string[], rows: string[][]) {
    const startX = this.margin;
    const colWidth = (this.pageWidth - (2 * this.margin)) / headers.length;
    
    // Add headers
    this.doc.setFont('helvetica', 'bold');
    headers.forEach((header, index) => {
      this.doc.text(header, startX + (index * colWidth), this.yPosition);
    });
    this.yPosition += 8;
    
    // Add rows
    this.doc.setFont('helvetica', 'normal');
    rows.forEach(row => {
      if (this.yPosition > 280) {
        this.doc.addPage();
        this.yPosition = 20;
      }
      row.forEach((cell, index) => {
        this.doc.text(cell, startX + (index * colWidth), this.yPosition);
      });
      this.yPosition += 6;
    });
    this.yPosition += 5;
  }

  public generatePoliticianReport(data: any): void {
    this.addTitle(`${data.name} - Political Profile`, 18);
    this.addSubtitle(`Generated on ${new Date().toLocaleDateString()}`, 10);
    
    this.addSection('Basic Information', 
      `Party: ${data.party || 'Unknown'}\nConstituency: ${data.constituency || 'Unknown'}\nPosition: ${data.position || 'Unknown'}`
    );
    
    if (data.bio) {
      this.addSection('Biography', data.bio);
    }
    
    if (data.votingRecord && data.votingRecord.length > 0) {
      this.addSection('Recent Voting Record', '');
      const headers = ['Bill', 'Vote', 'Date'];
      const rows = data.votingRecord.slice(0, 10).map((vote: any) => [
        vote.billTitle || 'Unknown',
        vote.vote || 'Unknown',
        new Date(vote.date).toLocaleDateString()
      ]);
      this.addTable(headers, rows);
    }
    
    if (data.trustScore) {
      this.addSection('Trust Score', `Current trust score: ${data.trustScore}%`);
    }
  }

  public generateBillReport(data: any): void {
    this.addTitle(`Bill ${data.title}`, 18);
    this.addSubtitle(`Generated on ${new Date().toLocaleDateString()}`, 10);
    
    this.addSection('Bill Details', 
      `Sponsor: ${data.sponsorName || 'Unknown'}\nStatus: ${data.status || 'Unknown'}\nType: ${data.billType || 'Unknown'}`
    );
    
    if (data.description) {
      this.addSection('Description', data.description);
    }
    
    if (data.summary) {
      this.addSection('Summary', data.summary);
    }
    
    if (data.voteStats) {
      this.addSection('Voting Statistics', 
        `Total Votes: ${data.voteStats.total_votes || 0}\nSupport: ${data.voteStats.yes_votes || 0}\nOppose: ${data.voteStats.no_votes || 0}`
      );
    }
  }

  public generateDashboardReport(data: any): void {
    this.addTitle('CivicOS Dashboard Report', 18);
    this.addSubtitle(`Generated on ${new Date().toLocaleDateString()}`, 10);
    
    this.addSection('User Statistics', 
      `Civic Points: ${data.civicPoints || 0}\nTrust Score: ${data.trustScore || 0}%\nVotes Cast: ${data.voteCount || 0}`
    );
    
    if (data.recentActivity && data.recentActivity.length > 0) {
      this.addSection('Recent Activity', '');
      const headers = ['Activity', 'Date', 'Points'];
      const rows = data.recentActivity.slice(0, 10).map((activity: any) => [
        activity.type || 'Unknown',
        new Date(activity.timestamp).toLocaleDateString(),
        activity.pointsEarned?.toString() || '0'
      ]);
      this.addTable(headers, rows);
    }
  }

  public generatePetitionReport(data: any): void {
    this.addTitle(`Petition: ${data.title}`, 18);
    this.addSubtitle(`Generated on ${new Date().toLocaleDateString()}`, 10);
    
    this.addSection('Petition Details', 
      `Creator: ${data.creatorName || 'Unknown'}\nTarget Signatures: ${data.targetSignatures || 0}\nCurrent Signatures: ${data.currentSignatures || 0}`
    );
    
    if (data.description) {
      this.addSection('Description', data.description);
    }
    
    if (data.signatures && data.signatures.length > 0) {
      this.addSection('Recent Signatures', '');
      const headers = ['Name', 'Date', 'Location'];
      const rows = data.signatures.slice(0, 10).map((signature: any) => [
        signature.name || 'Anonymous',
        new Date(signature.signedAt).toLocaleDateString(),
        signature.location || 'Unknown'
      ]);
      this.addTable(headers, rows);
    }
  }

  public export(options: PDFExportOptions): void {
    this.yPosition = 20;
    
    switch (options.type) {
      case 'politician':
        this.generatePoliticianReport(options.data);
        break;
      case 'bill':
        this.generateBillReport(options.data);
        break;
      case 'dashboard':
        this.generateDashboardReport(options.data);
        break;
      case 'petition':
        this.generatePetitionReport(options.data);
        break;
    }
    
    this.doc.save(`${options.title.replace(/[^a-zA-Z0-9]/g, '_')}_report.pdf`);
  }
}

// Convenience function for quick exports
export function exportToPDF(options: PDFExportOptions): void {
  const exporter = new PDFExporter();
  exporter.export(options);
} 