import { useEffect, useState } from "react";

const useDebounce = (initialValue, delay) => {
	const [value, setValue] = useState(initialValue);
	const [debouncedValue, setDebouncedValue] = useState(value);
	useEffect(
		() => {
			const handler = setTimeout(() => {
				setDebouncedValue(value);
			}, delay);
			return () => {
				clearTimeout(handler);
			};
		},
		[value, delay]
	);
	return {
		value,
		debouncedValue,
		setValue
	};
};

export default useDebounce;
