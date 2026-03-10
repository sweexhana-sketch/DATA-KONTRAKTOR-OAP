import {
	type RouteConfigEntry,
	index,
	route,
} from '@react-router/dev/routes';

// Use import.meta.glob to discover routes at build time.
// This works both in development and production (Vercel).
const pageFiles = import.meta.glob('./**/page.jsx');

function getRoutePath(path: string): string {
	// Remove './' and '/page.jsx'
	let routePath = path.replace(/^\.\//, '').replace(/\/page\.jsx$/, '');

	if (routePath === 'page.jsx') return ''; // Root page

	// Handle parameter segments
	const segments = routePath.split('/');
	const processedSegments = segments.map((segment) => {
		if (segment.startsWith('[') && segment.endsWith(']')) {
			const paramName = segment.slice(1, -1);

			// Handle catch-all parameters (e.g., [...ids] becomes *)
			if (paramName.startsWith('...')) {
				return '*';
			}
			// Handle optional parameters (e.g., [[id]] becomes :id?)
			if (paramName.startsWith('[') && paramName.endsWith(']')) {
				return `:${paramName.slice(1, -1)}?`;
			}
			// Handle regular parameters (e.g., [id] becomes :id)
			return `:${paramName}`;
		}
		return segment;
	});

	return processedSegments.join('/');
}

const routes: RouteConfigEntry[] = Object.keys(pageFiles).map((path) => {
	const routePath = getRoutePath(path);
	const componentPath = path; // The path relative to this file

	if (routePath === '') {
		return index(componentPath);
	}
	return route(routePath, componentPath);
});

// Add the 404 handler
const notFound = route('*', './__create/not-found.tsx');
const finalRoutes = [...routes, notFound];

// console.log('Generated routes:', finalRoutes.map(r => r.path));

export default finalRoutes;
