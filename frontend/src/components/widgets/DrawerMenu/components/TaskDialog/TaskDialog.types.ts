export interface ITaskDialogProps {
	setIsOpen: (value: boolean) => void;
	taskIndex: number | null;
	setTaskIndex: (value: number | null) => void;
}

export interface ITaskDialogFormData {
	name: string;
	address: string;
	level: 'standard' | 'vip';
	workStart: string;
	workEnd: string;
	lunchStart: string;
	lunchEnd: string;
}

