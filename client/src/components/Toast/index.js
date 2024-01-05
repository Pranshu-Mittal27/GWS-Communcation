import { toast } from "react-toastify";

const notify = {
	success: (message) =>
		toast.success(message, {
			className: "toast-position",
			toastId: "success",
			position: "top-right",
			autoClose: 3000,
			hideProgressBar: true,
			closeOnClick: true,
			pauseOnHover: false,
			draggable: true,
			progress: undefined,
			theme: "light"
		}),
	error: (message) =>
		toast.error(message, {
			className: "toast-position",
			toastId: "error",
			position: "top-right",
			autoClose: 3000,
			hideProgressBar: true,
			closeOnClick: true,
			pauseOnHover: false,
			draggable: true,
			progress: undefined,
			theme: "light"
		}),
	info: (message) =>
		toast.info(message, {
			className: "toast-position",
			toastId: "info",
			position: "top-right",
			autoClose: 3000,
			hideProgressBar: true,
			closeOnClick: true,
			pauseOnHover: false,
			draggable: true,
			progress: undefined,
			theme: "light"
		}),
	warning: (message) =>
		toast.warning(message, {
			className: "toast-position",
			toastId: "warning",
			position: "top-right",
			autoClose: 3000,
			hideProgressBar: true,
			closeOnClick: true,
			pauseOnHover: false,
			draggable: true,
			progress: undefined,
			theme: "light"
		}),
	default: (message) =>
		toast(message, {
			className: "toast-position",
			toastId: "default",
			position: "top-right",
			autoClose: 3000,
			hideProgressBar: true,
			closeOnClick: true,
			pauseOnHover: false,
			draggable: true,
			progress: undefined,
			theme: "light"
		})
};

export default notify;
