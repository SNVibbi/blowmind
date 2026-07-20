import useLogout from "@/hooks/useLogout";
import Image from "next/image";
import Logo from "../../public/img/Blow-Mind.png"
import Searchbar from "./Searchbar";
import Link from "next/link";
import NavbarOption from "../components/NavbarOption";
import '@fortawesome/fontawesome-free/css/all.min.css';



interface OverviewItem {
    icon: string;
    name: string;
    to: string;
}

interface PersonalItem {
    icon: string;
    name: string;
    to: string;
}

const overviews: OverviewItem[] = [
    {icon: "circle",  name: "Feed", to: "/posts"},
    {icon: "bookmark",  name: "Bookmarks", to: "/bookmarks"},
    {icon: "users",  name: "Team Blogs", to: "/b"},
    {icon: "envelop",  name: "Draft", to: "/d"},
    {icon: "chart-bar",  name: "Analytics", to: "/analytics"},
];

const tags: string[] = [
    "Programming",
    "Data science",
    "Technology",
    "Machine Learning",
    "Politics",
];


const personal: PersonalItem[] = [
    { icon: "user", name: "Account", to: "/settings" },
    { icon: "bell", name: "Notification", to: "/bookmarks" },
];

interface SidebarProps {
    screenWidth: number;
    mobileMenu: boolean;
    setMobileMenu: React.Dispatch<React.SetStateAction<boolean>>;
}


export default function Sidebar({
    screenWidth,
    mobileMenu,
    setMobileMenu,
}: SidebarProps): JSX.Element {
    const {logout, isPending, error} = useLogout();

    return (
        <>
            {(mobileMenu || screenWidth > 550) && (
                <div className="border p-6 w-72 bg-white dark:bg-gray-800 h-screen overflow-y-scroll fixed lg:relative">
                    <div className="mb-8">
                        <div className="flex items-center gap-4 text-indigo-600 dark:text-white mb-8">
                            <i className="fas fa-comment"></i>
                            <Image src={Logo} alt="Logo" width={100} height={100} />
                        </div>
                        <Searchbar setMobileMenu={setMobileMenu} />
                    </div>

                    <ul className="mb-8">
                        <h4 className="text-lg font-semibold mb-4">Overview</h4>
                        {overviews.map((item: OverviewItem) => (
                            <li key={item.name} className="mb-4">
                               <Link 
                                    href={item.to} 
                                    onClick={() => setMobileMenu(false)} 
                                    className="flex items-center gap-4 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                    <i className={`fas fa-${item.icon}`}></i>
                                    <span>{item.name}</span>
                               </Link>
                            </li>
                        ))}
                    </ul>

                    <ul className="mb-8">
                        <h4 className="text-lg font-semibold mb-4 flex items-center">
                            Trending Tags <i className="fas-fa-arrow-trend-up"></i>
                        </h4>
                        {tags.map((item: string) => (
                            <li key={item} className="mb-2">
                                <Link 
                                    href={`/tags/${tags}`} 
                                    onClick={() => setMobileMenu(false)}
                                    className="block p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                    <span>{tags}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <ul className="mb-8">
                        <h4 className="text-lg font-semibold mb-4">Personal</h4>
                        {personal.map((item: PersonalItem) => (
                            <li key={item.name} className="mb-4">
                                <Link 
                                    onClick={() => setMobileMenu(false)} 
                                    href={item.to} 
                                    className="flex items-center gap-4 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                    <i className={`fas fa-${item.icon}`}></i>
                                    <span>{item.name}</span>
                                </Link>
                            </li>
                        ))}
                    </ul>

                    {error && <div className="text-red-600 mb-4">{error}</div>}
                    <div>
                        {!isPending && (
                            <button 
                                className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700" 
                                onClick={logout}
                            >
                                Logout
                            </button>
                        )}
                        {isPending && (
                            <button 
                                className="w-full py-2 bg-red-600 text-white rounded-lg" 
                                disabled
                            >
                                Logging out...
                            </button>
                        )}
                    </div>

                    {screenWidth < 404 && <NavbarOption />}   
                </div>
            )}
        </>
    );
}