import { useEffect, useState } from "react";
import useDebounce from "../useDebounce";

const useSearch = ({ fetchFunction, searchDelay = 500 }) => {
	const { value: query, debouncedValue: deferredQuery, setValue: setQuery } = useDebounce("", searchDelay);
	const [isSearching, setIsSearching] = useState(false);
	const [results, setResults] = useState([]);

	useEffect(() => {
		if (query.length > 0) {
			setIsSearching(true);
		}
	}, [query]);

	useEffect(() => {
		// setIsSearching(false);
		setResults([]);
		if (deferredQuery.length < 1) {
			setIsSearching(false);
			setResults([]);
			return;
		}
		setIsSearching(true);
		fetchFunction(deferredQuery)
			.then((data) => {
				if (Array.isArray(data) && (data.length > 0)) {
					setResults(data);
				}
			})
			.finally(() => {
				setIsSearching(false);
			});
	}, [deferredQuery, fetchFunction]);

	return {
		query,
		setQuery,
		results,
		isSearching
	};
};

export default useSearch;
