/* eslint-disable no-tabs */
import appLogo from "../assets/img/logo/appLogo.png";
import appIcon from "../assets/img/logo/appIcon.png";
import domainWideDelegation from "../assets/img/references/domainWideDelegation.png";
import addScopes from "../assets/img/references/addScopes.png";
import addClientId from "../assets/img/references/addClientId.png";
import cloudStorage from "../assets/img/references/cloudStorage.png";
import domainAdded from "../assets/img/animations/domainAdded.json";
import AddDomain from "../assets/img/icons/unicons/addDomain.png";
import user from "../assets/img/icons/unicons/user.png";
import admin from "../assets/img/icons/unicons/admin.png";
import superAdmin from "../assets/img/icons/unicons/superadmin.png";
import gmailIcon from "../assets/img/icons/unicons/gmailIcon.png";
import driveIcon from "../assets/img/icons/unicons/driveIcon.png";
import chatIcon from "../assets/img/icons/unicons/chatIcon.png";
import groupIcon from "../assets/img/icons/unicons/groupIcon.png";
import bulkBackupImage from "../assets/img/references/bulkBackup.png";

import { lazy, Suspense } from "react";
import { Loader, ProtectedRoute } from "../components";
import { Navigate, Outlet } from "react-router-dom";
import { MainLayout } from "../layouts";

// components
const NotFound = lazy(() => import("../pages/NotFound"));
const MailBox = lazy(() => import("../pages/MailBox"));
const AddNewDomain = lazy(() => import("../pages/AddNewDomain"));
const SyncPage = lazy(() => import("../pages/SyncUsers"));
const LogIn = lazy(() => import("../pages/LogIn"));
const SyncDomains = lazy(() => import("../pages/SyncDomains"));
const Unauthorized = lazy(() => import("../pages/Unauthorized"));
const UserManagement = lazy(() => import("../pages/UserManagement"));
const DashBoard = lazy(() => import("../pages/Dashboard"));
const LeftUserBackup = lazy(() => import("../pages/LeftUserBackup"));

export const config = Object.freeze({
	companyName: "Searce",
	appName: "Workspace Searce",
	appLogo,
	appIcon,
	loader: <Loader />,
	// each route must have four properties
	// path, protected, roles, elements
	routes: (isLoggedIn, loading, userRole) => {
		return [
			// first route is where your app will route by default
			{
				path: "/",
				element: (
					<MainLayout />
				),
				children: [
					{
						index: true,
						element: <Navigate to={isLoggedIn && userRole && !loading ? (userRole === "user" ? "/mailBox" : "/admin") : "login"} />
						// element: <Navigate to={isLoggedIn && userRole && !loading ? "/admin" : "login"} />
					},
					{
						path: "mailBox",
						element: (
							<ProtectedRoute roles={["user", "admin", "superadmin"]}>
								<Suspense
									fallback={<Loader />}
								>
									<MailBox userAction={false} />
								</Suspense>
							</ProtectedRoute>
						)
					},
					{
						path: "admin",
						element: (
							<ProtectedRoute roles={["admin", "superadmin"]}>
								<Outlet />
							</ProtectedRoute>
						),
						// you don't need protected or roles
						// if the there are nested routes
						children: [
							{
								index: true,
								element: <Navigate to={"Dashboard"} />
							},
							{
								path: "Dashboard",
								element: (
									<Suspense
										fallback={<Loader />}
									>
										<DashBoard />
									</Suspense>
								)
							},
							// {
							// 	path: "mailBox",
							// 	element: (
							// 		<ProtectedRoute>
							// 			<Suspense
							// 				fallback={<Loader />}
							// 			>
							// 				<MailBox />
							// 			</Suspense>
							// 		</ProtectedRoute>
							// 	)
							// },
							{
								path: "AddDomain",
								element: (
									<ProtectedRoute roles={["superadmin"]}>
										<Suspense
											fallback={<Loader />}
										>
											<AddNewDomain />
										</Suspense>
									</ProtectedRoute>
								)
							},
							{
								path: "SyncUsers",
								element: (
									<Suspense
										fallback={<Loader />}
									>
										<SyncPage />
									</Suspense>
								)
							},
							{
								path: "SyncDomains",
								element: (
									<Suspense
										fallback={<Loader />}
									>
										<SyncDomains />
									</Suspense>
								)
							},
							{
								path: "userManagement",
								element: (
									<ProtectedRoute roles={["superadmin"]}>
										<Suspense
											fallback={<Loader />}
										>
											<UserManagement />
										</Suspense>
									</ProtectedRoute>
								)
							},
							{
								path: "LeftUserBackup",
								element: (
									<ProtectedRoute roles={["admin", "superadmin"]}>
										<Suspense
											fallback={<Loader />}
										>
											<LeftUserBackup />
										</Suspense>
									</ProtectedRoute>
								)
							}
						]
					}
				]
			},
			{
				path: "login",
				element: !isLoggedIn
					? (
						<Suspense
							fallback={<Loader />}
						>
							<LogIn />
						</Suspense>
					)
					: <Navigate to={"/"} />
			},
			{
				path: "unauthorized",
				element: (
					<Suspense
						fallback={<Loader />}
					>
						<Unauthorized />
					</Suspense>
				)
			},
			{
				path: "notFound",
				element: (
					<Suspense
						fallback={<Loader />}
					>
						<NotFound />
					</Suspense>
				)
			},
			{
				path: "*",
				element: <Navigate to={"/notFound"} />
			}
		];
	},
	navlinks: [
		{
			pathname: "/admin/AddDomain",
			name: "AddDomain",
			description: "Domains Available",
			roles: ["superadmin"],
			icon: <img src={require("../assets/img/icons/unicons/domains.png")} width={30} height={30} />
		},
		{
			pathname: "/admin/userManagement",
			name: "UserManagement",
			description: "User Management",
			roles: ["superadmin"],
			icon: <img src={require("../assets/img/icons/unicons/teamManagement.png")} width={30} height={30} />
		},
		{
			pathname: "/admin/SyncDomains",
			name: "SyncDomain",
			description: "Domain Action",
			roles: ["admin", "superadmin"],
			icon: <img src={require("../assets/img/icons/unicons/syncDomain.png")} width={30} height={30} />
		},
		{
			pathname: "/admin/SyncUsers",
			name: "SyncUsers",
			description: "User Action",
			roles: ["admin", "superadmin"],
			icon: <img src={require("../assets/img/icons/unicons/syncUser.png")} width={30} height={30} />
		},
		{
			pathname: "/admin/LeftUserBackup",
			name: "Suspended User Backup",
			description: "Suspended User Backup",
			roles: ["admin", "superadmin"],
			icon: <img src={require("../assets/img/icons/unicons/leftUser.png")} width={30} height={30} />
		},
		{
			pathname: "/mailBox",
			name: "MailBox",
			description: "Retrieve Mails",
			roles: ["user", "admin", "superadmin"],
			icon: <img src={require("../assets/img/icons/unicons/mailRecallIcon.png")} width={30} height={30} />
		}
	],
	api: "http://localhost:4000/api/v1",
	// api: "https://server-dot-jspl-workspace.el.r.appspot.com/api/v1",
	urls: {
		auth: {
			logIn: () => {
				return `${config.api}/auth/login`;
			}
		},
		mails: {
			get: () => {
				return `${config.api}/mail/getMails`;
			},
			delete: () => {
				return `${config.api}/mail/retractMail`;
			},
			filter: () => {
				return `${config.api}/mail/getMails`;
			}
		},
		users: {
			get: (userEmail, query) => {
				return `${config.api}/people/searchUsers/${userEmail}/${query}`;
			},
			updateUser: () => {
				return `${config.api}/auth/users`;
			},
			getUser: (email) => {
				return `${config.api}/auth/users/${email}`;
			},
			syncStatus: (userEmail) => {
				return `${config.api}/people/getUserSyncStatus/${userEmail}`;
			},
			updateSyncStatus: () => {
				return `${config.api}/people/updateUserSyncStatus`;
			},
			getuserRoleStats: () => {
				return `${config.api}/people/getAllUserTypeCount`;
			},
			getAllUserDisabled: () => {
				return `${config.api}/people/getAllUserDisabled`;
			},
			getSuspendedUsers: (query) => {
				return `${config.api}/domain/getSuspendedUsers/${query}`;
			}
		},
		domains: {
			get: (query) => {
				if (query === undefined) {
					return `${config.api}/domain/domains`;
				}
				return `${config.api}/domain/searchDomains/${query}`;
			},
			syncStatus: (domainName) => {
				return `${config.api}/domain/getDomainSyncStatus/${domainName}`;
			},
			verifyDomain: (adminEmail, domainName) => {
				return `${config.api}/people/verifyUser/${adminEmail}/${domainName}`;
			},
			addDomain: (domainName, adminEmail, creator) => {
				return `${config.api}/domain/addDomain/${domainName}/${adminEmail}/${creator}`;
			},
			syncDomainWithDomains: () => {
				return `${config.api}/domain/syncDomainWithDomains`;
			},
			changeAutoSyncStatus: (domain) => {
				return `${config.api}/domain/changeAutoSyncStatus/${domain}`;
			},
			getUserCountForAllDomains: () => {
				return `${config.api}/domain/getUserCountForAllDomainsFromDatabase`;
			},
			verifyBucket: (adminEmail, domainName) => {
				console.log("here config");
				return `${config.api}/people/verifyBucketPermission/${adminEmail}/${domainName}`;
			},
			resyncAllDomains: () => {
				return `${config.api}/domain/reSyncAllDomains`;
			}
		},
		calendar: {
			user: {
				post: () => {
					return `${config.api}/calendar/syncUserWithDomains`;
				}
			}
		},
		progresses: {
			get: () => {
				// return "http://localhost:8000/stream";
				return `${config.api}/progress/getProgress`;
			}
		},
		backup: {
			initiate: () => {
				return `${config.api}/backup/initiate`;
			},
			getMatterStatus: () => {
				return `${config.api}/backup/getMatterStatus`;
			},
			dashboard: () => {
				return `${config.api}/backup/dashboard`;
			},
			delete: () => {
				return `${config.api}/backup/delete`;
			},
			errorDashboard: () => {
				return `${config.api}/backup/errorDashboard`;
			},
			errorEntry: () => {
				return `${config.api}/backup/errorEntry`;
			}
		}
	},
	scopes: [
		"https://www.googleapis.com/auth/calendar",
		"https://www.googleapis.com/auth/admin.directory.user.readonly",
		"https://www.googleapis.com/auth/admin.directory.resource.calendar",
		"https://www.googleapis.com/auth/contacts",
		"https://www.google.com/m8/feeds",
		"https://www.googleapis.com/auth/directory.readonly",
		"https://www.googleapis.com/auth/admin.reports.audit.readonly",
		"https://mail.google.com/",
		"https://www.googleapis.com/auth/gmail.metadata",
		"https://www.googleapis.com/auth/gmail.modify",
		"https://www.googleapis.com/auth/gmail.readonly",
		"https://www.googleapis.com/auth/ediscovery",
		"https://www.googleapis.com/auth/cloud-platform",
		"https://www.googleapis.com/auth/devstorage.full_control",
		"https://www.googleapis.com/auth/drive",
		"https://www.googleapis.com/auth/admin.directory.domain",
		"https://www.googleapis.com/auth/admin.directory.domain.readonly",
		"https://www.googleapis.com/auth/admin.directory.group.readonly"
	],
	clientId: "112789392186530574852",
	// clientId: "-----",
	// domains: [
	// 	"searce.com",
	// 	"dev.searce.me",
	// 	"demo.searce.me"
	// ],
	referenceImages: {
		domainWideDelegation,
		addScopes,
		addClientId,
		cloudStorage,
		domainAdded,
		bulkBackupImage
	},
	icons: {
		AddDomain
	},
	bulkBackupCsvLink: "bucket/Bulk%20Backup%20Initiate.csv",
	accessRights: [
		{
			role: "user",
			label: "User",
			icon: <img src={user} className="aspect-ratio-1 w-20" />,
			rights: [
				"Access to Mail Recall."
			]
		},
		{
			role: "admin",
			label: "Admin",
			icon: <img src={admin} className="aspect-ratio-1 w-20" />,
			rights: [
				"Access to Mail Recall.",
				"Sync User of one domain to another.",
				"Sync One domain to another.",
				"Suspended user backup"
			]
		},
		{
			role: "superadmin",
			label: "Super Admin",
			icon: <img src={superAdmin} className="aspect-ratio-1 w-20" />,
			rights: [
				"Access to Mail Recall.",
				"Sync User of one domain to another.",
				"Sync One domain to another.",
				"Add New Domain to the application.",
				"User's Access rights management.",
				"Suspended user backup"
			]
		}
	],
	userBackupOptions: [
		{
			label: "Gmail",
			value: "gmail",
			icon: <img src={gmailIcon} className="aspect-ratio-1 w-20" />,
			description: "Gmail data backup"
		},
		{
			label: "Google Drive",
			value: "drive",
			icon: <img src={driveIcon} className="aspect-ratio-1 w-20" />,
			description: "Google Drive backup"
		},
		{
			label: "Google Chat",
			value: "chat",
			icon: <img src={chatIcon} className="aspect-ratio-1 w-20" />,
			description: "Google Chat backup"
		}
	],
	groupBackupOptions: [
		{
			label: "Google Groups",
			value: "groups",
			icon: <img src={groupIcon} className="aspect-ratio-1 w-20" />,
			description: "Google Groups backup"
		}
	]
});
