import React from 'react';

export default function RoleDetailPage(props: any) {
	const id = props?.params?.id ?? 'unknown';
	return (
		<section className="space-y-4">
			<h1 className="text-2xl font-bold">Role: {id}</h1>
			<p className="text-sm text-zinc-600">Role details and permissions will be shown here.</p>
		</section>
	);
}
