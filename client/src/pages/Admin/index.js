// import { NavBar } from "../../components";
import { AdminLayout } from "../../layouts";
import "../../vendor.css";

const AdminPage = () => {
	return (
		<AdminLayout pageName="Users" searchFetch={() => {}} placeHolderForSearchBar={"Users"} tableDataFetch={() => {}} columnsLayout={[]} filterValue={[]} />
	);
};

export default AdminPage;
