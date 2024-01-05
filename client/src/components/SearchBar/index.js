import PropTypes from "prop-types";

const SearchBar = ({ query, setQuery, placeHolderForSearchBar = "Search" }) => {
	return (
		<div className="relative mt-2 mb-2">
			<input
				type="text"
				className="pl-8 h-9 border border-gray-300 dark:border-gray-700 dark:text-white w-full rounded-md text-sm"
				placeholder={placeHolderForSearchBar}
				value={query}
				onChange={(e) => setQuery(e)}
			/>
			<svg viewBox="0 0 24 24" className="w-4 absolute text-gray-400 top-1/2 transform translate-x-0.5 -translate-y-1/2 left-2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
				<circle cx="11" cy="11" r="8"></circle>
				<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
			</svg>
		</div>
	);
};

SearchBar.propTypes = {
	query: PropTypes.string.isRequired,
	setQuery: PropTypes.func.isRequired,
	placeHolderForSearchBar: PropTypes.string
};

export default SearchBar;
