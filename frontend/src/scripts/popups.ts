import {reactive, ref} from 'vue';

enum PopupType {
	Info = 'info',
	Notice = 'notice',
	Warning = 'warning'
}

type Alert = {
	id: number;
	title: string;
	details?: string;
	type: PopupType;
};

type Confirm = {
	title: string;
	details?: string;
	type: PopupType;
};

type Prompt = {
	title: string;
	details?: string;
	type: PopupType;
};

let lastID = 0;

export const activeAlerts = reactive<Alert[]>([]);
export const activeConfirm = ref<{
	confirm: Confirm;
	resolve: (boolean) => void;
} | null>(null);
export const activePrompt = ref<{
	prompt: Prompt;
	resolve: (string) => void;
} | null>(null);

export function alert(title: string, type: PopupType, details?: string): Promise<void> {
	return new Promise<void>((resolve) => {
		const id = ++lastID;

		setTimeout(() => {
			activeAlerts.splice(
				activeAlerts.findIndex((n) => n.id === id),
				1
			);
			resolve();
		}, 5000);

		const alert = {id, title, details, type} as Alert;

		activeAlerts.push(alert);
	});
}

export function confirm(title: string, type: PopupType, details?: string): Promise<boolean> {
	if (activeConfirm.value || activePrompt.value) {
		throw new Error('Only one popup is allowed at a time');
	}

	return new Promise<boolean>(
		(resolve) =>
			(activeConfirm.value = {
				confirm: {title, details, type},
				resolve: (result: boolean) => {
					resolve(result);
					activeConfirm.value = null;
				}
			})
	);
}

export function prompt(title: string, type: PopupType, details?: string) {
	if (activeConfirm.value || activePrompt.value) {
		throw new Error('Only one popup is allowed at a time');
	}

	return new Promise<string>((resolve) => {
		activePrompt.value = {
			prompt: {title, details, type},
			resolve: (result: string) => {
				resolve(result);
				activePrompt.value = null;
			}
		};
	});
}

export function clearPopups() {
	activeConfirm.value && activeConfirm.value.resolve(false);
	activePrompt.value && activePrompt.value.resolve('');

	activeAlerts.length = 0;
	activeConfirm.value = null;
	activePrompt.value = null;
}
