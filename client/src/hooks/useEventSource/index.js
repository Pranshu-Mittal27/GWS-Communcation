/* eslint-disable no-tabs */
import { useEffect, useState } from "react";
import axios from "axios";

const useEventSource = (url, shouldUpdate, initialValue) => {
	const [results, setResults] = useState(initialValue);

	useEffect(() => {
		async function myFunction () {
			try {
				const response = await axios.get(url);
				const results = response.data;
				setResults(results);
			} catch (err) {
				console.log("Inside catch");
			}
		}
		let interval;
		if (shouldUpdate) {
			myFunction();
			interval = setInterval(async () => {
				myFunction();
			}, 10 * 1000);
		} else { clearInterval(interval); }

		return () => {
			console.log("remove");
			clearInterval(interval);
		};
		// const response = axios.get(url);
		// console.log("result-data", response);
	}, [url, shouldUpdate]);
	// useEffect(() => {
	// 	let connection;
	// 	const messageFun = (response) => {
	// 		const results = JSON.parse(response.data);
	// 		// const updateArray = (array, update) => {
	// 		// if (array.length === 0) {
	// 		// return update;
	// 		// }
	// 		// const updated = array.map((item) => {
	// 		// const updateItem = update.find((u) => (u.from === item.from) && (u.to === item.to) && (u.key === item.key));
	// 		// return updateItem ? { ...item, ...updateItem } : item;
	// 		// });
	// 		// return updated;
	// 		// };
	// 		setResults(results);
	// 	};
	// 	if (shouldUpdate) {
	// 		connection = new EventSource(url);
	// 		connection.addEventListener("message", messageFun);
	// 	}
	// 	return () => {
	// 		if (connection !== undefined) {
	// 			connection.removeEventListener("message", messageFun);
	// 			connection.close();
	// 		}
	// 	};
	// }, [url, shouldUpdate]);

	return [results, setResults];
};

export default useEventSource;
