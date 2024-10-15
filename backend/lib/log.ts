const logCache: { message: string; level: number }[] = [];
let timeout = false;
const print = [
	console.debug,
	console.log,
	console.warn,
	console.error,
	console.error,
];

function submitLog(message: string, level: number) {
	if (
		!Deno.env.has('CRASH_COURSE_URL') ||
		!Deno.env.has('CRASH_COURSE_TELEMETRY_KEY')
	) {
		print[level]?.(message);
		return Promise.resolve();
	}

	return fetch(Deno.env.get('CRASH_COURSE_URL') + '/telemetry/logs', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Telemetry-Key': Deno.env.get(
				'CRASH_COURSE_TELEMETRY_KEY',
			) as string, // Safe because of the check above
		},
		body: JSON.stringify({
			level,
			message,
		}),
	}).catch((err) => console.warn('Failed to send log:', err));
}

function log(message: string, level: number) {
	logCache.push({ message, level });

	const submit = async () => {
		const log = logCache.shift();
		if (!log) {
			return; // Should never get here but TS complains without this check
		}

		await submitLog(log.message, log.level).then(() => {
			logCache.length && setTimeout(submit, 16);
			timeout = !!logCache.length;
		});
	};

	return timeout ? Promise.resolve() : submit();
}

export default {
	debug: (message: string) => log(message, 0),
	log: (message: string) => log(message, 1),
	warn: (message: string) => log(message, 2),
	error: (message: string) => log(message, 3),
	critical: (message: string) => log(message, 4),
};
