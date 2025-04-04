export interface AuthState {
	user: any | null;
	token: string | null;
	isLoading: boolean;
	error: string | null;
}

export interface ILoginPayload {
	email: string;
	password: string;
}

export interface IRegisterPayload {
	name: string;
	last_name: string;
	email: string;
	password: string;
}
