import { useCallback, useEffect, useState } from "react";

const useData = ({ user, fetchFunction, dataSearch, filterState }) => {
	const [items, setItems] = useState([]);
	const [autoSync, setAutoSync] = useState(true);
	const [driveAutoMove, setDriveAutoMove] = useState(true);
	const [domainDriveStatus, setDomainDriveStatus] = useState(true);
	// const [isParent, setIsParent] = useState(false);
	// all the items to sync
	const [selectedItems, setSelectedItems] = useState({});

	const resetSelectedItems = () => {
		setSelectedItems({
			userEmail: user?.email,
			contactList: [],
			calendarList: [],
			resourceList: []
		});
	};

	const refetchFunction = useCallback(() => {
		if (user === undefined) {
			return;
		}
		fetchFunction(user)
			.then((data) => {
				console.log("data", data);
				setDomainDriveStatus(data.domainDriveAutoMove);
				setAutoSync(data.autoSync);
				setDriveAutoMove(data.driveAutoMove);
				// setIsParent(data.isParent);
				if (Array.isArray(data.response) && (data.response.length > 0)) {
					setItems(data.response);
				}
			});
	}, [fetchFunction, user]);

	useEffect(() => {
		refetchFunction();
	}, [refetchFunction]);

	// To filter the items
	const filterByKey = (items, filters) => {
		if (filters.length === 0) {
			return items;
		}
		return items.filter((item) => {
			let shouldAdd = true;
			filters.forEach((filterItem) => {
				if (item[filterItem.key] !== filterItem.value) {
					shouldAdd = false;
					return false;
				}
			});
			return shouldAdd;
		});
	};

	// To search the items
	const searchByKey = (items, { key, query }) => {
		if ((key === undefined) || (query === "")) {
			return items;
		}
		return items.filter((item) => {
			return item[key].includes(query);
		});
	};

	useEffect(() => {
		resetSelectedItems();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?.email, filterState, dataSearch]);

	const addDomainToList = (domain, resource) => {
		setSelectedItems({
			...selectedItems,
			[resource]: [...selectedItems[resource], domain]
		});
	};

	const removeDomainFromList = (domain, resource) => {
		setSelectedItems({
			...selectedItems,
			[resource]: selectedItems[resource].filter((item) => item !== domain)
		});
	};

	return {
		items,
		autoSync,
		driveAutoMove,
		domainDriveStatus,
		searchByKey,
		filterByKey,
		selectedItems,
		refetchFunction,
		addDomainToList,
		removeDomainFromList,
		resetSelectedItems
		// isParent
	};
};

export default useData;
