import { useAuthContext } from "../context/AuthContext"


const useAuth = () => {
    const context = useAuthContext()

    if (!context) {
        throw new Error("useAuth must be used inside an AuthProvider")
    }

    return context;
}

export default useAuth;