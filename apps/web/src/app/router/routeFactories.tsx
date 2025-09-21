import React from 'react';
import type { AppRouteObject, RouteMeta } from './meta';

type ChildDef = {
	path?: string;
	index?: boolean;
	element: React.ReactElement;
	meta?: Partial<RouteMeta>;
};

export function createFeatureErrorBoundary(
	layout: React.ComponentType<any>,
	message: string
): React.ReactElement {
	const Layout = layout;
	return (
		<Layout>
			<div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
				<h2 className="text-lg font-semibold text-white">{message}</h2>
				<p className="text-sm text-white/60">잠시 후 다시 시도해 주세요.</p>
			</div>
		</Layout>
	);
}

export function createFeatureNotFound(
	layout: React.ComponentType<any>,
	message: string
): React.ReactElement {
	const Layout = layout as any;
	return (
		<Layout detail>
			<div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
				<h2 className="text-lg font-semibold text-white/90">{message}</h2>
				<p className="text-sm text-white/60">목록으로 돌아가 다시 시도해 주세요.</p>
			</div>
		</Layout>
	);
}

export function createFeatureRoute(
	config: {
		id: string;
		path: string;
		meta: RouteMeta;
		layout?: React.ComponentType<any>;
		errorBoundary?: React.ReactElement;
		children: ChildDef[];
		catchAll?: { element: React.ReactElement; meta?: Partial<RouteMeta> };
	}
): AppRouteObject {
	const { id, path, meta, layout, errorBoundary, children, catchAll } = config;

	const toChildMeta = (parent: RouteMeta, overrides?: Partial<RouteMeta>): RouteMeta => {
		const base = {
			hideBottomNav: overrides?.hideBottomNav ?? parent.hideBottomNav,
			requiresAuth: overrides?.requiresAuth ?? parent.requiresAuth,
			breadcrumb: overrides?.breadcrumb ?? parent.breadcrumb,
			title: (overrides as any)?.title ?? (parent as any)?.title,
			icon: (overrides as any)?.icon ?? (parent as any)?.icon,
			navPath: (overrides as any)?.navPath ?? (parent as any)?.navPath,
			isRoot: false as const,
		};
		return base as RouteMeta;
	};

	const routeChildren = children.map((c) => ({
		...(c.index ? { index: true as const } : { path: c.path ?? '' }),
		element: c.element,
		handle: { meta: toChildMeta(meta, c.meta) },
	}));
	if (catchAll) {
		routeChildren.push({
			path: '*',
			element: catchAll.element,
			handle: { meta: toChildMeta(meta, catchAll.meta) },
		});
	}
	return {
		id,
		path,
		handle: { meta },
		errorElement: errorBoundary,
		children: routeChildren,
	};
}


