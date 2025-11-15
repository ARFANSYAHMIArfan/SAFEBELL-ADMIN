import { Report } from '../types';

// These libraries are loaded from CDN in index.html
declare const jspdf: any;
declare const docx: any;
declare const saveAs: any;

export const downloadAsPdf = (report: Report) => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Laporan Kecemasan S.A.F.E", 14, 22);

    doc.setFontSize(12);
    doc.text(`ID Laporan: ${report.id}`, 14, 32);
    doc.text(`Tarikh: ${new Date(report.timestamp).toLocaleString()}`, 14, 39);

    doc.setLineWidth(0.5);
    doc.line(14, 45, 196, 45);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Butiran Laporan:", 14, 55);
    
    doc.setFont('helvetica', 'normal');
    const contentLines = doc.splitTextToSize(report.content, 182);
    doc.text(contentLines, 14, 62);
    
    const contentHeight = (contentLines.length * 7) + 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Analisis AI:", 14, 62 + contentHeight);
    
    doc.setFont('helvetica', 'normal');
    const analysisLines = doc.splitTextToSize(report.analysis, 182);
    doc.text(analysisLines, 14, 69 + contentHeight);

    doc.save(`Laporan-${report.id}.pdf`);
};

export const downloadAsDocx = (report: Report) => {
    const doc = new docx.Document({
        sections: [{
            children: [
                new docx.Paragraph({
                    children: [new docx.TextRun({ text: "Laporan Kecemasan S.A.F.E", bold: true, size: 36 })],
                }),
                new docx.Paragraph({ text: `ID Laporan: ${report.id}` }),
                new docx.Paragraph({ text: `Tarikh: ${new Date(report.timestamp).toLocaleString()}` }),
                new docx.Paragraph({ text: "" }), // Spacer
                new docx.Paragraph({
                    children: [new docx.TextRun({ text: "Butiran Laporan:", bold: true, size: 28 })],
                }),
                ...report.content.split('\n').map(line => new docx.Paragraph({ text: line })),
                new docx.Paragraph({ text: "" }), // Spacer
                new docx.Paragraph({
                    children: [new docx.TextRun({ text: "Analisis AI:", bold: true, size: 28 })],
                }),
                ...report.analysis.split('\n').map(line => new docx.Paragraph({ text: line })),
            ],
        }],
    });

    docx.Packer.toBlob(doc).then((blob: Blob) => {
        saveAs(blob, `Laporan-${report.id}.docx`);
    });
};
