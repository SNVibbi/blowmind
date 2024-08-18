import { auth } from "../utils/firebaseConfig";
import { User as FirebaseUser } from "firebase/auth";
import React, { createContext, ReactNode, useEffect, useReducer, Dispatch, useContext } from "react";
import { useAuthState } from "react-firebase-hooks/auth";

interface AuthState {
    user: FirebaseUser | null;
    authIsReady: boolean;
    loading: boolean;
    error: any | null;
}

interface LoginAction {
    type: "LOGIN" | "AUTH_IS_READY";
    payload: FirebaseUser | null
}

interface LogoutAction {
    type: "LOGOUT"
}

type AuthAction = LoginAction | LogoutAction;

interface AuthContextValue extends AuthState {
    dispatch: Dispatch<AuthAction>;
}

type AuthContextProviderProps = {
    children: ReactNode;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case "LOGIN":
        case "AUTH_IS_READY":
            return { ...state, user: action.payload, authIsReady: true, loading: false };
        case "LOGOUT":
            return { ...state, user: null, loading:false };
        default:
            return state;
    }
};

export const AuthContextProvider = ({ children }: AuthContextProviderProps) => {
    const [state, dispatch] = useReducer(authReducer, {
        user: null,
        authIsReady: false,
        loading: true,
        error: null,
    });

    const [user, loading, error] = useAuthState(auth);

    useEffect(() => {
        if (user !== undefined) {
            dispatch({ type: "AUTH_IS_READY", payload: user });
        }
    }, [user]);

    return (
        <AuthContext.Provider value={{ ...state, user: user || null, loading, error: error ? error : null, dispatch }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuthContext must be used inside an AuthContextProvider");
    }

    return context;
};
