import { Box, Button, IconButton, Stack, Tooltip } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthConsumer } from "../../hooks";
import { config } from "../../config";
import { Login } from "@mui/icons-material";

const NavBar = () => {
	const { isLoggedIn, userData, logOut } = AuthConsumer();
	const navigate = useNavigate();
	const location = useLocation();

	const handleLogout = () => {
		logOut();
	};

	return (
		<div className="h-16 flex w-full border-b border-gray-200 dark:border-gray-800 px-5 items-center bg-white">
			<img
				src={config.appLogo}
				placeholder="company logo"
				className="cursor-pointer h-full inline-flex items-center"
				onClick={() => {
					if (["admin", "superadmin"].includes(userData.role)) {
						navigate("admin/dashboard");
					}
				}}
			/>
			<div className="flex h-full text-gray-600 dark:text-gray-400 ml-auto">
				{
					isLoggedIn &&
					config
						.navlinks
						.map((navlink, index) => {
							if (!navlink.roles.includes(userData?.role)) {
								return null;
							}
							return (
								<Tooltip key={index} title={navlink.description} className="btnEffect">
									<Link
										to={navlink.pathname}
										className={
											"cursor-pointer h-full border-b-2 inline-flex items-center p-4 " + ((location.pathname === navlink.pathname) ? "border-blue-500 text-blue-500 dark:text-white dark:border-white" : "border-transparent")
										}
									>
										<div >{navlink.icon}</div>
									</Link>
								</Tooltip>
							);
						})
				}
				{/* <div className="flex items-center space-x-7">
					{
						((userData.role === "admin") || (userData.role === "superadmin")) &&
						<button
							className="h-8 px-3 rounded-md shadow text-white bg-blue-500"
							onClick={() => navigate((location.pathname === "/mailBox") ? "/admin" : "/mailBox")}
						>
							{(location.pathname === "/mailBox") ? "Admin Panel" : "Customer Panel"}
						</button>
					}
				</div> */}
				<div className="flex items-center">
					{isLoggedIn
						? (
							<>
								<Box className="ml-2" display={{
									xs: "none",
									md: "block"
								}}
								>
									{userData.email}
								</Box>
								<Tooltip title="Logout">
									<IconButton
										variant="contained"
										sx={{
											marginLeft: "0.5rem"
										}}
										onClick={handleLogout}
										className="btnEffect"
									>
										<LogoutIcon />
									</IconButton>
								</Tooltip>
							</>)
						: (<>
							<Button variant="contained" sx={{ backgroundColor: "#0064ff" }}>
								<Stack direction="row">
									<Box paddingX={1}>
										Login
									</Box>
									<Login />
								</Stack>
							</Button>
						</>)}
				</div>
			</div>
		</div >
	);
};

export default NavBar;
