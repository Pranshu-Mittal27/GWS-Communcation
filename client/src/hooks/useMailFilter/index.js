import PropTypes from "prop-types";
import { createContext, useState, useContext } from "react";
const filterContext = createContext();

const useFilter = () => {
	const [filterValue, setFilterValue] = useState({
		// fromEmail: !userAction ? userData.email : selectedUser,
		toEmail: "",
		subject: "",
		hasWords: "",
		doesntHave: "",
		date1: "",
		date2: "",
		attachment: false
	});

	return {
		filterValue,
		setFilterValue
	};
};

export function FilterProvider ({ children }) {
	const filter = useFilter();
	return <filterContext.Provider value={filter}>{children}</filterContext.Provider>;
}
FilterProvider.propTypes = {
	children: PropTypes.element.isRequired
};
export function FilterConsumer () {
	return useContext(filterContext);
}
