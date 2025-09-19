import React from 'react';

// Next.js App Router: dynamic route must be async to await params
export default async function RoleDetailPage({ params }: { params: { id: string } }) {
	// params is always available, but must be awaited in async function for dynamic routes
	const id = params.id ?? 'unknown';
	return (
		<section className="space-y-4">
			<h1 className="text-2xl font-bold">Role: {id}</h1>
			<p className="text-sm text-zinc-600">Role details and permissions will be shown here.</p>
		</section>
	);
}
