import { ref } from 'vue'

export const isLoggedIn = ref(false)

export function useAuth() {
	function setLoggedIn(val: boolean) {
		isLoggedIn.value = val
	}

	function toggleLogin() {
		isLoggedIn.value = !isLoggedIn.value
	}

	return {
		isLoggedIn,
		setLoggedIn,
		toggleLogin
	}
}
