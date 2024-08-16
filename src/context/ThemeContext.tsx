import React, { createContext, ReactNode, useEffect, useReducer } from "react"

export interface ThemeState {
    color: string;
    mode: "light" | "dark";
}

export interface ThemeAction {
    type: "CHANGE_COLOR" | "CHANGE_MODE";
    payload: string
}

type ThemeContextProviderProps = {
    children: ReactNode;
};

const initialState: ThemeState = {
    color: "#4f46e5", 
    mode: "light"
};

export const ThemeContext = createContext<{
    state: ThemeState;
    changeColor: (color: string) => void;
    changeMode: (mode: "light" | "dark") => void;
}>({
    state: initialState,
    changeColor: () => {},
    changeMode: () => {},
});

const themeReducer = (state: ThemeState, action: ThemeAction): ThemeState => {
    switch (action.type) {
        case "CHANGE_COLOR":
            return { ...state, color: action.payload};
        case "CHANGE_MODE":
            return { ...state, mode: action.payload as "light" | "dark"};
        default:
            return state;
    }
};

export const ThemeProvider = ({ children }: ThemeContextProviderProps) => {
    const [state, dispatch] = useReducer(themeReducer, initialState);

    useEffect(() => {
        const storedMode = localStorage.getItem("mode");
        const storedColor = localStorage.getItem("color");

        if (storedMode) {
            dispatch({ type: "CHANGE_MODE", payload: storedMode });
            document.documentElement.classList.add(storedMode);
        }

        if (storedColor) {
            dispatch({ type: "CHANGE_COLOR", payload: storedColor});
        }
    }, []);

    const changeColor = (color: string) => {
        dispatch({ type: "CHANGE_COLOR", payload: color});
        localStorage.setItem("color", color);
    };

    const changeMode = (mode: "light" | "dark") => {
        dispatch({ type: "CHANGE_MODE", payload: mode});
        localStorage.setItem("mode", mode);
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(mode);
    };

    return (
        <ThemeContext.Provider value={{ state, changeColor, changeMode }}>
            {children}
        </ThemeContext.Provider>
    )
}