/* eslint-disable */
import { useCallback, useMemo } from "react";
import { config } from "../../config";
import { AuthConsumer, ModalConsumer } from "../../hooks";
import { AdminLayout } from "../../layouts";
import axios from "axios";

const SyncUsers = () => {
	const { userData } = AuthConsumer();
	const { dispatch: dispatchModal } = ModalConsumer();
	const searchFetch = useCallback(async (query) => {
		let response = await axios.get(config.urls.users.get(userData.email, query));

		if (response.status === 404) {
			return Promise.resolve([]);
		}

		response = response.data;

		return Promise.resolve(response);
	}, [userData.email]);

	const syncUser = async (syncObject, refetchData, unSync) => {
		syncObject["insert"] = !unSync;
		// const response = "hello";
		let body = "";
		const prefix = unSync ? "-" : "+";
		const response = await axios.post(config.urls.calendar.user.post(), syncObject);

		// const date = new Date().toISOString();
		// const arr1 = syncObject.calendarList.map((val) => {
		// 	return {
		// 		domainName: val,
		// 		calendar: prefix + date
		// 	};
		// });

		// const arr2 = syncObject.contactList.map((val) => {
		// 	return {
		// 		domainName: val,
		// 		contact: prefix + date
		// 	};
		// });

		// const map = new Map();
		// arr1.forEach(item => map.set(item.domainName, item));
		//arr2.forEach(item => map.set(item.domainName, { ...map.get(item.domainName), ...item }));
		// const arr3 = Array.from(map.values());
		// console.log("arr3", arr3);
		body = {
			email: syncObject.userEmail,
			syncStatus: {
				calendarList: syncObject.calendarList,
				contactList: syncObject.contactList
			},
			prefix
		};

		console.log("body", body);
		await axios.put(config.urls.users.updateSyncStatus(), body);
		refetchData();
		return response;
	};

	const contentHeaderSyncButtonAction = (syncObject, refetchData, unSync) => {
		dispatchModal({
			type: "open",
			payload: {
				title: `${!unSync ? "Sync" : "Un-sync"} User`,
				content: `Do you want to ${!unSync ? "sync" : "un-sync"} user with all the selected domains?`,
				onSuccess: () => syncUser(syncObject, refetchData, unSync)
			}
		});
	};

	// const unSyncUser = async (syncObject, refetchData) => {
	// 	console.log("UnSync user clicked");
	// 	console.log("syncObject: ", syncObject);
	// 	// const response = await axios.post(config.urls.domains.unSyncUserWithDomains(), syncObject);
	// 	refetchData();
	// 	return response;
	// };
	// const contentHeaderUnSyncButtonAction = (syncObject, refetchData) => {
	// 	dispatchModal({
	// 		type: "open",
	// 		payload: {
	// 			title: "Un-Sync User",
	// 			content: "Do you want to un-sync user with all the selected domains?",
	// 			onSuccess: () => unSyncUser(syncObject, refetchData)
	// 		}
	// 	});
	// };

	const tableDataFetch = useCallback(async (user) => {
		let response = await axios.get(config.urls.users.syncStatus(user.email));

		response = response.data;

		response = {
			response: response.output,
			driveAutoMove: response.driveAutoMove,
			domainDriveAutoMove: response.domainDriveAutoMove
		};
		console.log("user response", response);

		return response;
	}, []);

	const resources = useMemo(() => {
		return [
			{
				key: "calendarStatus",
				value: "Calendar",
				defaultSelection: 1,
				states: [
					{
						filter: {
							key: "calendarStatus",
							value: true
						},
						label: "synced",
						icon: {
							enabled: <img src={require("../../assets/img/icons/unicons/sync-enabled.png")} alt="filter" style={{ width: "24rem", cursor: "pointer" }} />,
							disabled: <img src={require("../../assets/img/icons/unicons/sync-disabled.png")} alt="filter" style={{ width: "24rem", cursor: "pointer", opacity: 0.3 }} />
						}
					},
					{
						filter: {
							key: "calendarStatus",
							value: "all"
						},
						label: "all",
						icon: {
							enabled: <img src={require("../../assets/img/icons/brands/google-calendar.png")} alt="filter" style={{ width: "24rem", cursor: "pointer" }} />,
							disabled: <img src={require("../../assets/img/icons/brands/google-calendar.png")} alt="filter" style={{ width: "24rem", cursor: "pointer", opacity: 0.3 }} />
						}
					},
					{
						filter: {
							key: "calendarStatus",
							value: false
						},
						label: "not-synced",
						icon: {
							enabled: <img src={require("../../assets/img/icons/unicons/un-sync-enabled.png")} alt="filter" style={{ width: "24rem", cursor: "pointer" }} />,
							disabled: <img src={require("../../assets/img/icons/unicons/un-sync-disabled.png")} alt="filter" style={{ width: "24rem", cursor: "pointer", opacity: 0.3 }} />
						}
					}
				]
			},
			{
				key: "contactStatus",
				value: "Contacts",
				defaultSelection: 1,
				states: [
					{
						filter: {
							key: "contactStatus",
							value: true
						},
						label: "synced",
						icon: {
							enabled: <img src={require("../../assets/img/icons/unicons/sync-enabled.png")} alt="filter" style={{ width: "24rem", cursor: "pointer" }} />,
							disabled: <img src={require("../../assets/img/icons/unicons/sync-disabled.png")} alt="filter" style={{ width: "24rem", cursor: "pointer", opacity: 0.3 }} />
						}
					},
					{
						filter: {
							key: "contactStatus",
							value: "all"
						},
						label: "all",
						icon: {
							enabled: <img src={require("../../assets/img/icons/brands/google-contacts.png")} alt="filter" style={{ width: "16px", cursor: "pointer" }} />,
							disabled: <img src={require("../../assets/img/icons/brands/google-contacts.png")} alt="filter" style={{ width: "16px", cursor: "pointer", opacity: 0.3 }} />
						}
					},
					{
						filter: {
							key: "contactStatus",
							value: false
						},
						label: "not-synced",
						icon: {
							enabled: <img src={require("../../assets/img/icons/unicons/un-sync-enabled.png")} alt="filter" style={{ width: "24rem", cursor: "pointer" }} />,
							disabled: <img src={require("../../assets/img/icons/unicons/un-sync-disabled.png")} alt="filter" style={{ width: "24rem", cursor: "pointer", opacity: 0.3 }} />
						}
					}
				]
			}
		];
	}, []);

	const getCurrentProgress = useCallback(() => { }, []);

	return (
		<AdminLayout
			pageName="Users"
			searchFetch={searchFetch}
			contentHeaderSyncButtonAction={contentHeaderSyncButtonAction}
			// contentHeaderUnSyncButtonAction={contentHeaderUnSyncButtonAction}
			placeHolderForSearchBar={"Search Users..."}
			tableDataFetch={tableDataFetch}
			keyToSearchBy={"name"}
			resources={resources}
			showProgress={false}
			getCurrentProgress={getCurrentProgress}
		/>
	);
};

export default SyncUsers;
