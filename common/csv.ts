export function toCSV(data: object): string {
	let res = '';

	if (Array.isArray(data) && data.length) {
		const keys = Object.keys(data[0]);
		res += keys.map((k) => `"${k}"`).join(',') + '\n';

		for (const el of data) {
			res +=
				keys
					.map((key) => el[key])
					.map((val) => val && `"${val?.toString()?.replaceAll('"', '""')}"`)
					.join(',') + '\n';
		}
	} else if (typeof data === 'object' && data !== null) {
		const keys = Object.keys(data);
		res += keys.map((k) => k && `"${k}"`).join(',') + '\n';
		res +=
			keys
				.map((key) => data[key as keyof typeof data])
				.map((val) => val && `"${(val as unknown)?.toString()?.replaceAll('"', '""')}"`)
				.join(',') + '\n';
	}

	return res;
}
