import { getToken } from '@auth/core/jwt';
import { getContext } from 'hono/context-storage';

export default function CreateAuth() {
	const auth = async () => {
		const c = getContext();
		const secret = process['env'].AUTH_SECRET || 'dev-secret-please-change';
		const authUrl = process['env'].AUTH_URL || '';
		const isSecure = authUrl.startsWith('https') || !!process['env'].VERCEL;
		const token = await getToken({
			req: c.req.raw,
			secret: secret,
			trustHost: true,
			secureCookie: isSecure,
		});
		if (token) {
			return {
				user: {
					id: token.sub,
					email: token.email,
					name: token.name,
					image: token.picture,
				},
				expires: token.exp.toString(),
			};
		}
	};
	return {
		auth,
	};
}
