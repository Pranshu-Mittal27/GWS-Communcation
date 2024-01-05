import { useLayoutEffect, useState } from "react";

export function ThemeProvider ({ children }) {
	/* Because you are setting the initial theme to non-dark,
    you can assume that your initial state should be dark only
    when the user's preference is set to dark. */
	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)")
		.matches;

	// True if preference is set to dark, false otherwise.
	const [dark, setDark] = useState(prefersDark);
	/* Note: Initial state is set upon mounting, hence is better
    to put the <ThemeProvider> up in your tree, close to the root <App>
    to avoid unmounting it with the result of reverting to the default user
    preference when and if re-mounting (unless you want that behaviour) */

	useLayoutEffect(() => {
		/* You end up here only when the user takes action
        to change the theme, hence you can just apply the new theme. */
		// applyTheme();
		setDark(true);
	}, [dark]);
};

export default ThemeProvider;
