import { getToken } from '@auth/core/jwt';
const ALLOWED_PARENT_ORIGIN = process.env.EXPO_WEB_PARENT_ORIGIN || '';
export async function GET(request) {
	if (!ALLOWED_PARENT_ORIGIN) {
		return new Response('EXPO_WEB_PARENT_ORIGIN belum diset', { status: 500 });
	}
	const [token, jwt] = await Promise.all([
		getToken({
			req: request,
			secret: process.env.AUTH_SECRET,
			secureCookie: process.env.AUTH_URL.startsWith('https'),
			raw: true,
		}),
		getToken({
			req: request,
			secret: process.env.AUTH_SECRET,
			secureCookie: process.env.AUTH_URL.startsWith('https'),
		}),
	]);

	if (!jwt) {
		return new Response(
			`
			<html>
				<body>
					<script>
						window.parent.postMessage({ type: 'AUTH_ERROR', error: 'Unauthorized' }, ALLOWED_PARENT_ORIGIN);
					</script>
				</body>
			</html>
			`,
			{
				status: 401,
				headers: {
					'Content-Type': 'text/html',
					'X-Frame-Options': 'DENY',
					'Content-Security-Policy': "frame-ancestors 'none'",
				},
			}
		);
	}

	const message = {
		type: 'AUTH_SUCCESS',
		jwt: token,
		user: {
			id: jwt.sub,
			email: jwt.email,
			name: jwt.name,
		},
	};

	return new Response(
		`
		<html>
			<body>
				<script>
					window.parent.postMessage(${JSON.stringify(message)}, ALLOWED_PARENT_ORIGIN);
				</script>
			</body>
		</html>
		`,
		{
			headers: {
				'Content-Type': 'text/html',
				'X-Frame-Options': 'DENY',
				'Content-Security-Policy': "frame-ancestors 'none'",
			},
		}
	);
}
