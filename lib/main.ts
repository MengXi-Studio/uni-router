import { someUtilFunction } from './utils'

export function setupCounter(element: HTMLButtonElement) {
	let counter = 0
	const setCounter = (count: number) => {
		counter = count
		element.innerHTML = `count is ${counter}`
	}
	element.addEventListener('click', () => setCounter(++counter))
	setCounter(0)

	console.log(someUtilFunction())
}
