import React, { useState, useEffect } from 'react';
import { Library, Plus, Search, BookCheck, ArrowRightLeft, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { LibraryBook, BookLoan } from '../types';

export const LibraryManagement: React.FC = () => {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loans, setLoans] = useState<BookLoan[]>([]);
  const [activeTab, setActiveTab] = useState<'catalog' | 'loans'>('catalog');
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // New Book Modal
  const [showBookModal, setShowBookModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [category, setCategory] = useState<string>('Literature');
  const [copies, setCopies] = useState<number>(10);
  const [shelf, setShelf] = useState<string>('Shelf A-1');

  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    setIsLoading(true);
    try {
      const [bRes, lRes] = await Promise.all([
        api.get('/library/books'),
        api.get('/library/loans')
      ]);
      setBooks(bRes.data.books || []);
      setLoans(lRes.data.loans || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/library/books', {
        title,
        author,
        category,
        total_copies: copies,
        shelf_location: shelf
      });
      setShowBookModal(false);
      setTitle('');
      setAuthor('');
      fetchLibrary();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add book');
    }
  };

  const handleReturnBook = async (loanId: number) => {
    try {
      await api.post(`/library/loans/${loanId}/return`);
      alert('Book marked as returned successfully!');
      fetchLibrary();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to return book');
    }
  };

  const filteredBooks = books.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase()) ||
    b.book_code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Library className="w-5 h-5 text-teal-600" />
            <span>Library & Learning Resources</span>
          </h1>
          <p className="text-xs text-slate-500">Track book catalog, student borrowing records, and return deadlines</p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex rounded-lg border border-slate-200 bg-white p-1 text-xs font-semibold shadow-2xs">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'catalog' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-600'}`}
            >
              Book Catalog ({books.length})
            </button>
            <button
              onClick={() => setActiveTab('loans')}
              className={`px-3 py-1.5 rounded-md transition ${activeTab === 'loans' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-600'}`}
            >
              Active Loans ({loans.length})
            </button>
          </div>

          {activeTab === 'catalog' && (
            <button
              onClick={() => setShowBookModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Book</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search catalog by title, author, or code..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBooks.map(b => (
              <div key={b.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {b.book_code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">{b.title}</h3>
                    <p className="text-xs text-slate-500">By {b.author}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    {b.category}
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-600 pt-2 border-t border-slate-100">
                  <p><b>Shelf Location:</b> {b.shelf_location || 'General Stacks'}</p>
                  <p><b>Available Copies:</b> <span className="font-bold text-teal-700">{b.available_copies}</span> of {b.total_copies}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'loans' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Borrower Name</th>
                  <th className="py-3 px-4">Borrow Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Return Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-semibold text-slate-900">{l.book_title}</td>
                    <td className="py-3 px-4">{l.borrower_name} ({l.borrower_type})</td>
                    <td className="py-3 px-4 text-slate-600">{l.borrow_date}</td>
                    <td className="py-3 px-4 text-slate-600">{l.due_date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        l.status === 'RETURNED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {l.status !== 'RETURNED' && (
                        <button
                          onClick={() => handleReturnBook(l.id)}
                          className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white font-bold text-[11px]"
                        >
                          Mark Returned
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Book Modal */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Add Library Resource</h3>
            <form onSubmit={handleAddBook} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Book Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Cockcrow Anthology"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Author *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S.A. Amoah"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Total Copies</label>
                  <input
                    type="number"
                    min="1"
                    value={copies}
                    onChange={(e) => setCopies(Number(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Shelf Location</label>
                <input
                  type="text"
                  value={shelf}
                  onChange={(e) => setShelf(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowBookModal(false)} className="px-3 py-1.5 text-slate-600">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-teal-600 text-white rounded-lg font-bold">Save Book</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
