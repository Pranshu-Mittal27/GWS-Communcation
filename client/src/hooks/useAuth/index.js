
import React, { createContext, useState, useContext, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { config } from "../../config";
import {
	onAuthStateChanged,
	signOut,
	signInWithPopup,
	getAuth
} from "firebase/auth";
import { auth, provider } from "../../firebase-config";

const authContext = createContext();

function useAuth () {
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [userData, setUserData] = useState({});
	const [loading, setLoading] = useState(false);
	const [checkedIfLoggedIn, setCheckedIfLoggedIn] = useState(false);

	// Loader for MailBox
	const [loader, setLoader] = useState(false);

	const logIn = async () => {
		try {
			await signInWithPopup(auth, provider);
		} catch (error) {
			console.log(error);
		}
	};

	const logOut = async () => {
		await signOut(auth);
	};

	const fetchUserDetails = async (user) => {
		const auth = getAuth();
		const currentUser = auth.currentUser;
		const response = await currentUser.getIdToken().then((idToken) => {
			return axios.post(config.urls.auth.logIn(), {
				idToken
			});
		});
		setUserData({
			...user,
			role: response.data,
			email: user.email
		});
		setLoading(false);
	};

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
			setCheckedIfLoggedIn(true);
			if (currentUser) {
				setLoading(true);
				if (!loading && !isLoggedIn) await fetchUserDetails(currentUser);
				setIsLoggedIn(true);
			} else {
				setLoading(true);
				setIsLoggedIn(false);
				setUserData({});
				setLoading(false);
			}
		});

		return () => {
			unsubscribe();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const toggleLoading = (value) => {
		setLoading(value);
	};

	return {
		isLoggedIn,
		userData,
		loading,
		checkedIfLoggedIn,
		logIn,
		logOut,
		toggleLoading,
		loader,
		setLoader
	};
}

export function AuthProvider ({ children }) {
	const auth = useAuth();

	return <authContext.Provider value={auth}>{children}</authContext.Provider>;
}

AuthProvider.propTypes = {
	children: PropTypes.element.isRequired
};

export function AuthConsumer () {
	return useContext(authContext);
}

export async function getUserIdToken () {
	const auth = getAuth();
	const idToken = await auth.currentUser.getIdToken(true);
	return idToken;
}
