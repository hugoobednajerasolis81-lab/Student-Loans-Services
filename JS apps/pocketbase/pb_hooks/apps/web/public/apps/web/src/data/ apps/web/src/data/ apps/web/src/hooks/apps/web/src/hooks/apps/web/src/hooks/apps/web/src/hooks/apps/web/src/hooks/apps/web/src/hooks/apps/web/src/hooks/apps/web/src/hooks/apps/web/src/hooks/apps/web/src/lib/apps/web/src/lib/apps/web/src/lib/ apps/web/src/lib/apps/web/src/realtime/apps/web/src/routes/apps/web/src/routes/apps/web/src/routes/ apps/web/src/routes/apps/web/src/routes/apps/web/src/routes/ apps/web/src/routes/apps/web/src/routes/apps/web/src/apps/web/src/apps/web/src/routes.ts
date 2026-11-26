import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
	index('routes/home.tsx'),
 route('login', 'routes/login.tsx'),
 route('crm', 'routes/crm.tsx'),
 route('privacy', 'routes/privacy.tsx'),
	route('sign/:token', 'routes/sign.tsx'),
	route('sitemap.xml', 'routes/sitemap.xml.ts'),
	route('robots.txt', 'routes/robots.txt.ts'),
	route('api/health', 'routes/api.health.ts'),
	route('api/request-password-reset', 'routes/api.request-password-reset.ts'),
	route('api/*', 'routes/api.$.ts'),
] satisfies RouteConfig;
