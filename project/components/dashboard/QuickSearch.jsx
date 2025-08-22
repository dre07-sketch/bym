// components/dashboard/QuickSearch.jsx

"use client"; // ✨ IMPORTANT: Mark this as a Client Component

import { useState, useEffect } from 'react';
import { Search, CornerDownLeft } from 'lucide-react';

export default function QuickSearch({ isOpen, setIsOpen, navigation, setActiveTab }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  // Flatten the navigation for searching
  const searchableItems = navigation.flatMap(item => 
    item.children ? [item, ...item.children] : [item]
  );

  // Keyboard shortcut to open/close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  // Filter logic
  useEffect(() => {
    if (isOpen) {
        if (query.trim() === '') {
          // Show top-level items and children when search is empty
          setResults(searchableItems); 
        } else {
          setResults(
            searchableItems.filter(item =>
              item.label.toLowerCase().includes(query.toLowerCase())
            )
          );
        }
    }
  }, [query, isOpen, searchableItems]);

  const handleSelect = (id) => {
    // If the selected item is a parent, you might not want to navigate away
    // or you might want to open its submenu. Here we just set it active.
    const selectedItem = searchableItems.find(item => item.id === id);
    if (selectedItem) {
        setActiveTab(id);
        setIsOpen(false);
        setQuery('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-start pt-20" onClick={() => setIsOpen(false)}>
      <div className="w-full max-w-lg bg-slate-900/80 border border-slate-700 rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-slate-800 flex items-center space-x-3">
          <Search className="text-slate-400" />
          <input
            type="text"
            placeholder="Search for pages or actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none"
            autoFocus
          />
        </div>
        <ul className="p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
          {results.length > 0 ? (
            results.map(item => (
              <li key={item.id}>
                <button
                  onClick={() => handleSelect(item.id)}
                  className="w-full text-left flex justify-between items-center p-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <div className="flex items-center space-x-3">
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </div>
                  <CornerDownLeft size={16} className="text-slate-500" />
                </button>
              </li>
            ))
          ) : (
            <p className="p-4 text-center text-slate-500">No results found.</p>
          )}
        </ul>
      </div>
    </div>
  );
}