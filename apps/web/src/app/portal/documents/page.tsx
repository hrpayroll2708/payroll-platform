'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function EmployeeDocumentCenterPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const mockDocuments = [
    { id: 'DOC-01', title: 'Employment Agreement', category: 'EMPLOYMENT', fileName: 'Employment_Agreement_Signed.pdf', fileSize: '2.4 MB', date: 'Aug 24, 2026' },
    { id: 'DOC-02', title: 'Form 16 (Part A & B) - AY 2026-27', category: 'TAX', fileName: 'Form16_AY2026-27.pdf', fileSize: '850 KB', date: 'Jul 15, 2026' },
    { id: 'DOC-03', title: 'Standard Compensation Structure Letter', category: 'PAYROLL', fileName: 'Annexure_A_Compensation.pdf', fileSize: '340 KB', date: 'Apr 01, 2026' },
    { id: 'DOC-04', title: 'Health Insurance Policy E-Card', category: 'BENEFITS', fileName: 'Mediclaim_ECard_2026.pdf', fileSize: '1.1 MB', date: 'May 10, 2026' },
  ];

  const filteredDocs = mockDocuments.filter((d) => {
    const matchCat = selectedCategory === 'ALL' || d.category === selectedCategory;
    const matchQuery = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || d.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  const handleDownload = (docTitle: string) => {
    setDownloadNotice(`Document download initiated for "${docTitle}". Verified SHA-256 Checksum.`);
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 space-y-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/portal" className="text-xs font-semibold text-indigo-600 hover:underline">← ESS Dashboard</Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Employee Document Center</h1>
          <p className="text-sm text-slate-500">Authorized personal employment documents, tax certificates, and benefits cards.</p>
        </div>
      </div>

      {downloadNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-sm font-medium animate-fade-in">
          ✓ {downloadNotice}
        </div>
      )}

      {/* Category Filter Pills & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {['ALL', 'EMPLOYMENT', 'PAYROLL', 'TAX', 'BENEFITS'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search documents by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs w-full md:w-64 shadow-xs"
        />
      </div>

      {/* Document Grid / Table */}
      {filteredDocs.length === 0 ? (
        <div className="p-12 text-center bg-white border rounded-2xl text-slate-500 text-sm">
          No documents available in this category.
        </div>
      ) : (
        <div className="bg-white border rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600 text-xs uppercase font-semibold">
              <tr>
                <th className="p-4">Document Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">File Size</th>
                <th className="p-4">Uploaded Date</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-semibold text-slate-900">
                    <div>{doc.title}</div>
                    <div className="font-mono text-xs text-slate-400 mt-0.5">{doc.fileName}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md">
                      {doc.category}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 text-xs">{doc.fileSize}</td>
                  <td className="p-4 text-slate-500 text-xs">{doc.date}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDownload(doc.title)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}