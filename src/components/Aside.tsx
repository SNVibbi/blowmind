import { useDocument } from "../hooks/useDocument";
import { useAuthContext } from "../context/AuthContext";
import { ReactElement } from "react";
import Avatar from "./Avatar";
import '@fortawesome/fontawesome-free/css/all.min.css';
import CustomSkeleton from "./CustomSkeleton";

interface User {
    uid: string;
    photoURL: string | null;
    firstName: string;
    lastName: string;
    email: string;
    headline?: string;
    interests: string[];
}


const Aside = (): ReactElement => {
    const { user } = useAuthContext();
    const { error, document: currentUser, isPending } = useDocument<User>("users", user?.uid || "");


    if (error) return <div className="text-red-600">{error}</div>;


    return (
        <aside className="w-72 p-6 text-sm">
            {isPending ? (
                <div className="fixed w-72 pr-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md text-center">
                        <div className="relative h-20 bg-gradient-to-r from-yellow-300 to-pink-300 rounded-t-lg flex items-center justify-center">
                            <CustomSkeleton circle={true} width={64} height={64} className="absolute -top-8" />
                        </div>
                        <div className="bg-whit dark:bg-gray-800 p-4 rounded-b-lg">
                            <CustomSkeleton width="50%" height={20}className="mb-2" />
                            <CustomSkeleton width="80%" height={15} />
                            <div className="flex justify-center gap-2 mt-2">
                                <CustomSkeleton width={30} height={15} />
                                <span className="text-gray-600 dark:text-gray-400">.</span>
                                <CustomSkeleton width={100} height={15} />
                                <span className="text-gray-600 dark:text-gray-400">.</span>
                                <CustomSkeleton width={80} height={15} />
                            </div>
                        </div>
                    </div>
                </div>
            ) : currentUser ? (
                <div className="fixed w-72 pr-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md text-center">
                        <div className="relative h-20 bg-gradient-to-r from-yellow-300 to-pink-300 rounded-t-lg flex items-center justify-center">
                            <Avatar src={currentUser.photoURL ?? "/path/to/default/avatar.png"} className="absolute to-1/2 translate-y-1/2 w-16 h-16 bg-white rounded-full border-white" />
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-b-lg">
                            <h2 className="text-lg font-semibold">{currentUser.firstName} {currentUser.lastName}</h2>
                            <p className="text-gray-600 dark:text-gray-400">Sierra Leone</p>
                            <ul className="flex flex-wrap justify-center gap-2 mt-2">
                                <li className="text-gray-600 dark:text-gray-400">@{currentUser.firstName.toLowerCase()}</li>
                                <span className="text-gray-600 dark:text-gray-400">.</span>
                                <li className="text-gray-600 dark:text-gray-400">{currentUser.email}</li>
                                <span>.</span>
                                <li className="text-gray-600 dark:text-gray-400">{currentUser.headline || "What do you do?"}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            ) : null}
        </aside>
    );
};


export default Aside;