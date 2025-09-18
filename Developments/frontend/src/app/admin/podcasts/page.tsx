// Admin Podcast Management page.  Lists available podcasts and allows future
// expansion for creating/editing/deleting.  At present it displays data
// either fetched from the backend or fallback demo data.
'use client';

import React, { useEffect, useState } from 'react';
import PodcastCard from '@/components/PodcastCard';
import { demoPodcasts } from '@/data/demoPodcasts';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeRole } from '@/lib/role';

interface Podcast {
  id: number;
  title: string;
  description?: string;
  image?: string;
}

export default function AdminPodcastsPage() {
  const { user, isLoading } = useAuth();
  const role = normalizeRole(user);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        // TODO: call your backend API to fetch podcast list.
        // const res = await fetch('/api/v1/admin/podcasts');
        // const data = await res.json();
        // if (data.success) {
        //   setPodcasts(data.data);
        // }
      } catch (err) {
        // If API fails, fallback to demo data
        setPodcasts([]);
      }
    }
    fetchData();
  }, []);

  if (!isLoading && role !== 'admin') {
    return <p className="p-4">You do not have permission to view this page.</p>;
  }

  // Use fallback demo data if API returns nothing
  const items = podcasts.length ? podcasts : demoPodcasts;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Podcast Management</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((p) => (
          <PodcastCard key={p.id} podcast={p as any} />
        ))}
      </div>
    </div>
  );
}
