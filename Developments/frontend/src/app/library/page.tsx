"use client";

import React, { useMemo, useState, useEffect } from 'react';
import BookCard from '@/components/BookCard';
import { demoBooks } from '@/data/demoBooks';
import { productsAPI } from '@/lib/api';

// The Books library page displays a grid of books with basic
// filtering and sorting controls. It relies on demo data until
// real APIs are hooked up. Categories and sort options are derived
// dynamically from the book list.

export default function LibraryPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'Popular' | 'Newest' | 'Title'>('Popular');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await productsAPI.getAll({ limit: 100 });
        const items = resp.data?.data?.data || resp.data?.data || [];
        const bs = items.filter((i: any) => (i.type || '').toLowerCase() === 'ebook' || (i.type || '').toLowerCase() === 'book');
        if (mounted) setBooks(bs);
      } catch (err) {
        if (mounted) setBooks(demoBooks as any[]);
      }
    })();
    return () => { mounted = false };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    (books.length ? books : demoBooks).forEach((b: any) => {
      if (b.category) set.add(b.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [books]);

  const filteredBooks = useMemo(() => {
    let list = books.length ? books : demoBooks;
    if (selectedCategory !== 'ALL') {
      list = list.filter((b: any) => b.category === selectedCategory);
    }
    const sorted = [...list];
    switch (sortBy) {
      case 'Title':
        sorted.sort((a: any, b: any) => a.title.localeCompare(b.title));
        break;
      case 'Newest':
        sorted.sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
        break;
      case 'Popular':
      default:
        break;
    }
    return sorted;
  }, [books, selectedCategory, sortBy]);

  return (
    <section className="space-y-8">
      <h1 className="text-3xl font-bold">Books Library</h1>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-3">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          const btnClasses = isSelected
            ? 'bg-[color:var(--brand-500)] text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300';
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-sm transition ${btnClasses}`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-3 text-sm">
        <label htmlFor="sort" className="font-medium">Sort by:</label>
        <select
          id="sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border rounded"
        >
          <option value="Popular">Popular</option>
          <option value="Newest">Newest</option>
          <option value="Title">Title</option>
        </select>
      </div>

      {/* Book Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredBooks.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </section>
  );
}