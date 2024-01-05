import { useCallback, useEffect, useState } from "react";
import { BasicCard, ContentHeader, SearchBar, RoleCard } from "../../components";
import { config } from "../../config";
import { AuthConsumer, ModalConsumer, useSearch } from "../../hooks";
import Lottie from "lottie-react";
import { Grid, Container } from "@mui/material";
import { getAuth, signOut } from "firebase/auth";

import searchingGif from "../../assets/img/illustrations/searching.json";
import noResultsGif from "../../assets/img/illustrations/no-results-found.json";
import emptyTableGif from "../../assets/img/illustrations/empty-table.json";
import axios from "axios";
import notify from "../../components/Toast";
import { getUserRole } from "../../helpers";

const useSelectedUser = () => {
	const [selectedUser, setSelectedUser] = useState(undefined);
	const [selectedUserData, setSelectedUserData] = useState(undefined);

	useEffect(() => {
		if (selectedUser === undefined) {
			return;
		}
		console.log("selectedUser", selectedUser);
		const controller = new AbortController();
		axios
			.get(config.urls.users.getUser(selectedUser?.email), {
				signal: controller.signal
			})
			.then((response) => {
				if (response.status !== 200) {
					console.log("rrrrr", response);
					// code to be written
					notify.warning("Internal Error");
					return undefined;
				}
				response = response.data;

				setSelectedUserData({ ...selectedUser, role: response.role, disabled: response.disabled });
			});
		return () => {
			controller.abort();
		};
	}, [selectedUser]);

	return {
		selectedUser,
		setSelectedUser,
		selectedUserData,
		setSelectedUserData
	};
};

const UserManagement = () => {
	const { userData } = AuthConsumer();

	const { query, setQuery, results, isSearching } = useSearch({
		fetchFunction: useCallback(async (query) => {
			let response = await axios.get(config.urls.users.get(userData.email, query));
			if (response.status === 404) {
				return Promise.resolve([]);
			}
			response = response.data;
			console.log("resres", response);
			return Promise.resolve(response);
		}, [userData.email]),
		searchDelay: 500
	});

	const { selectedUser, setSelectedUser, selectedUserData, setSelectedUserData } = useSelectedUser();

	const { dispatch: dispatchModal } = ModalConsumer();

	const toggleUserDisableStatus = (e, disableStatus) => {
		e.preventDefault();
		dispatchModal({
			type: "open",
			payload: {
				title: disableStatus ? "Disable User" : "Enable User",
				content: disableStatus ? "Do you want to disable user?" : "Do you want to enable user?",
				onSuccess: toggleUserStatus
			}
		});
	};

	const changeUserType = (userType) => {
		axios.put(config.urls.users.updateUser(), {
			email: selectedUserData?.email,
			role: userType,
			// always enable the user when changing its user role
			disabled: false
		})
			.then(response => {
				if (response.status === 200) {
					const auth = getAuth();
					if (response.data.email === auth.currentUser.email) {
						signOut(auth);
					}
					setSelectedUserData({ ...selectedUserData, ...response.data });
				}
			})
			.catch((error) => notify.warning(error));
	};

	const toggleUserStatus = useCallback(() => {
		axios.put(config.urls.users.updateUser(), {
			email: selectedUserData?.email,
			role: selectedUserData?.role,
			disabled: !(selectedUserData?.disabled)
		})
			.then(response => {
				setSelectedUserData({ ...selectedUserData, ...response.data });
			})
			.catch((error) => notify.warning(error))
			.finally(() => dispatchModal({ type: "close" }));
	}, [dispatchModal, selectedUserData, setSelectedUserData]);

	useEffect(() => {
		setIsUserRoleModalOpen(false);
	}, [selectedUser]);

	const [isUserRoleModalOpen, setIsUserRoleModalOpen] = useState(false);

	return (
		<div className="flex-grow flex overflow-x-hidden h-full">
			<div className="xl:w-72 w-48 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 lg:block">
				<h1 className="text-center pt-3 pb-3 pageTitle bg-blue-500 text-white">User Management</h1>
				<div className="px-5 pt-2">
					<div className="text-xs text-gray-400 tracking-wider">Users</div>
					<SearchBar
						query={query}
						setQuery={(e) => {
							e.preventDefault();
							setQuery(e.target.value);
						}}
						placeHolderForSearchBar={"Search Users..."}
					/>
				</div>
				<div className="space-y-4 px-5 pt-1 overflow-y-auto h-80">
					{
						isSearching
							? <div className="mt-15 flex justify-center items-center pl-8">
								<Lottie style={{ height: 250 }} animationData={searchingGif} loop={true} rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }} />
							</div>
							: (
								(results.length > 0)
									? results.map((result, index) => {
										return (
											<BasicCard
												key={index}
												cardTitle={result?.name}
												cardContent={result?.email}
												userImgUrl={result?.photo}
												isSelected={(!(selectedUser === undefined)) && (selectedUser?.name === result?.name) && (selectedUser?.email === result?.email) && (selectedUser?.photo === result?.photo)}
												setSelectedUser={(e) => {
													e.preventDefault();
													setSelectedUser(result);
												}}
												className="btnEffect"
											/>
										);
									})
									: (query.length > 0
										? <div className="flex" style={{ overflow: "hidden" }}>
											<Lottie style={{ height: 350 }} animationData={noResultsGif} loop={true}
												rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
											/>
										</div>
										: <div className="flex mt-15 pl-8" style={{ overflow: "hidden" }}>
											<Lottie style={{ height: 250 }} animationData={searchingGif} autoplay={false}
												rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
											/>
										</div>
									)
							)
					}
				</div>
			</div>
			{
				selectedUserData
					? (
						<div className="flex-grow bg-gray-900 overflow-y-auto">
							<div className="syncPageTopBar p-4 py-4 px-5 flex flex-col w-full border-b border-gray-200 bg-gray-900 dark:text-white dark:border-gray-800 sticky top-0">
								<ContentHeader
									headerAvatar={selectedUserData?.photo}
									headerName={selectedUserData?.name}
									headerContent={selectedUserData?.email}
								>
									<div
										className="flex items-center"
										style={{ gap: "1rem" }}
									>
										<p className="p-1 px-4 bg-green-100 border border-green-500 rolePill"><b>Role</b>: {getUserRole(selectedUserData?.role) ?? "Unassigned"}</p>
										<img
											src={require("../../assets/img/icons/unicons/editUser.png")}
											alt="sync"
											className="h-4 inline-block cursor-pointer btnEffect rounded-md"
											width={28}
											height={28}
											onClick={() => setIsUserRoleModalOpen(toggle => !toggle)}
										/>
									</div>
								</ContentHeader>
							</div>
							<div
								className="flex justify-between items-center p-3 my-2 bg-blue-100"
							>
								{
									selectedUserData?.disabled ? "Do you want to enable the user? User will be able to log in to the system." : "Do you want to disable the user? User won't be able to log in to the system."
								}
								<button
									className="bg-blue-500 text-white border-none outline-none py-2 px-4 rounded-md"
									onClick={(e) => toggleUserDisableStatus(e, !selectedUserData?.disabled)}
								>
									{selectedUserData?.disabled ? "Enable" : "Disable"}
								</button>
							</div>
							{
								isUserRoleModalOpen
									? <Container maxWidth={false} sx={{
										marginTop: 3
									}}>
										<Grid spacing={2} container>
											{
												config
													.accessRights
													.map((accessRight, i) => {
														return (
															<Grid item key={i} xs={12} sm={6} md={4}>
																<RoleCard
																	title={accessRight.label}
																	content={accessRight.rights}
																	avatar={accessRight.icon}
																	onClick={(e) => {
																		e.preventDefault();
																		dispatchModal({
																			type: "open",
																			payload: {
																				title: "Assign User Role",
																				content: `Do you want to change user role from ${getUserRole(selectedUserData?.role)} to ${getUserRole(accessRight.role)}?. Also changing user role will enable the user.`,
																				onSuccess: () => changeUserType(accessRight.role)
																			}
																		});
																	}}
																	assigned={accessRight.role === selectedUserData?.role}
																/>
															</Grid>
														);
													})
											}
										</Grid>
									</Container>
									: null
							}
						</div >
					)
					: <div className="flex items-center justify-center w-full">
						<Lottie style={{ height: 700 }} animationData={emptyTableGif} loop={true}
							rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
						/>
					</div>
			}
		</div >
	);
};

export default UserManagement;
