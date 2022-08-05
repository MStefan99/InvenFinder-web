import {reactive} from 'vue';

type Notification = {
	title: string;
	details?: string;
	type: 'info' | 'alert' | 'warning';
};

type Prompt = {
	title: string;
	details?: string;
};

export const notifications = reactive<{n: Notification; p: Promise<void>}[]>([]);
export const prompts = reactive<{n: Prompt; p: Promise<string>}[]>([]);

export function alert(notification: Notification): Promise<void> {
	const promise = new Promise<void>((resolve) =>
		setTimeout(() => {
			notifications.splice(
				notifications.findIndex((n) => n.n.title === notification.title),
				1
			);
			resolve();
		}, 1000)
	);

	notifications.push({n: notification, p: promise});
	return promise;
}

alert({title: 'title', details: 'details', type: 'info'});
