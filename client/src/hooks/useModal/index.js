
import { createContext, useContext, useReducer } from "react";
import PropTypes from "prop-types";

const useConfirmationModal = () => {
	const [state, dispatch] = useReducer((state, action) => {
		switch (action.type) {
		case "open": {
			return {
				...state,
				isOpen: true,
				title: action.payload.title,
				content: action.payload.content,
				onSuccess: action.payload.onSuccess
			};
		}
		case "close": {
			return {
				...state,
				isOpen: false
				// onSuccess: () => { }
			};
		}
		case "success": {
			state.onSuccess();
			return {
				...state,
				isOpen: false,
				onSuccess: () => { }
			};
		}
		default:
			return state;
		}
	}
	, {
		isOpen: false,
		title: "Confirmation Modal",
		content: "Do you want to proceed?",
		onSuccess: () => { }
	});

	return {
		state,
		dispatch
	};
};

const modalContext = createContext();

export function ModalProvider ({ children }) {
	const modal = useConfirmationModal();
	return <modalContext.Provider value={modal}>{children}</modalContext.Provider>;
};

ModalProvider.propTypes = {
	children: PropTypes.element.isRequired
};

export function ModalConsumer () {
	return useContext(modalContext);
};
