import { NavBar } from "../../components";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
	return (
		<div className="bg-gray-100 dark:bg-gray-900 dark:text-white text-gray-600 h-screen flex overflow-hidden text-sm">
			<div className="flex-grow overflow-hidden h-full flex flex-col">
				<NavBar />
				<Outlet />
			</div>
			{/* <div className="layout-overlay layout-menu-toggle"></div> */}
		</div >
	);
};

export default MainLayout;
