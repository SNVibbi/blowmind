'use client'

import React, { useState } from "react";
import { UserCategoryProps } from "../Types";
import useSignup from "../hooks/useSignup";
import useGoogle from "../hooks/useGoogle";
import Image from "next/image";
import BG from "../../public/img/bg.jpg";
import Link from "next/link";
import GoogleButton from "../components/GoogleButton";
import Select from "react-select"; 
import '@fortawesome/fontawesome-free/css/all.min.css';
import MainNavbar from "../components/MainNavbar";
import Footer from "../components/Footer";

const userCategories: UserCategoryProps[] = [
    { value: "writer", label: "Writer" },
    { value: "reader", label: "Reader" },
];

const Signup: React.FC = () => {
    const [firstName, setFirstName] = useState<string>("");
    const [lastName, setLastName] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [userCategory, setUserCategory] = useState<string>("");

    const [thumbnailError, setThumbnailError] = useState<string | null>(null);
    const [textType, setTextType] = useState<boolean>(false);

    const { signup, isPending, message } = useSignup();
    const {
        googleSignUp,
        error: signupError,
        isPending: signupPending,
    } = useGoogle();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!thumbnail) {
            setThumbnailError("Thumbnail is required")
            return
        }
        signup(firstName, lastName, email, password, thumbnail, userCategory);
    };

    const handleInputType = (e: React.MouseEvent<HTMLButtonElement>) => {
        setTextType(!textType);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setThumbnail(null);
        const selected = e.target.files?.[0];

        if (!selected) {
            setThumbnailError("Please select a file");
            return;
        }

        if (!selected.type.includes("image")) {
            setThumbnailError("Selected file must be an image");
            return;
        }
        if (selected.size > 1000000) {
            setThumbnailError("Image file size must be less than 1MB");
            return;
        }

        setThumbnailError(null);
        setThumbnail(selected);
    };

    const handleUserCategoryChange = (option: any) => {
        setUserCategory((option as UserCategoryProps).value);
    };

    return (
        <>
            <MainNavbar />
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-900 py-4">
                <form 
                    onSubmit={handleSubmit} className="bg-gray-200 dark:bg-gray-800 shadow-lg rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 w-full max-w-4xl"
                >
                    <div className="relative">
                        <Image 
                            src={BG} 
                            alt="intro" 
                            layout="fill" 
                            objectFit="cover" className="rounded-lg h-full" />
                    </div>

                    <div className="p-6 flex flex-col justify-between">
                        <div>
                            {message && (
                                <div 
                                    className={`mt-4 ${
                                        message.type === "Error" ? "text-red-600" : "text-green-600"
                                    }`}
                                >
                                    {message.message}
                                </div>
                            )}
                            <div className="flex justify-between mb-4">
                                <Link href="/signup">
                                    <button className="text-indigo-600 border-b-2 border-indigo-600">
                                        Register
                                    </button>
                                </Link>
                                <Link href="/login">
                                    <button className="text-indigo-600 hover:text-indigo-800 dark:text-gray-300">
                                        Login
                                    </button>
                                </Link>
                            </div>

                            <h3 className="text-2xl font-bold mb-4">
                                Register as a Writer/Reader
                            </h3>

                            <div className="mb-4">
                                <div className="flex items-center border-2 border-gray-300 rounded-lg p-2 dark:border-gray-700">
                                    <label 
                                        htmlFor="first-name" className="text-gray-600 dark:text-gray-400 mr-2"
                                    >
                                        <i className="fas fa-id-card-alt"></i>
                                    </label>
                                    <input 
                                        type="text" 
                                        id="first-name"
                                        required
                                        placeholder="First name" 
                                        value={firstName} 
                                        onChange={(e) => setFirstName(e.target.value)} 
                                        className="flex-grow bg-transparent outline-none px-2 py-1 text-gray-800 dark:text-gray-200" 
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="flex items-center border-2 border-gray-300 rounded-lg p-2 dark:border-gray-700">
                                    <label 
                                        htmlFor="last-name" 
                                        className="text-gray-600 dark:text-gray-400 mr-2"
                                    >
                                        <i className="fas fa-user"></i>
                                    </label>
                                    <input 
                                        type="text"
                                        id="last-name" 
                                        required
                                        placeholder="Last Name" 
                                        value={lastName} 
                                        onChange={(e) => setLastName(e.target.value)} 
                                        className="flex-grow bg-transparent outline-none px-2 py-1 text-gray-800 dark:text-gray-200" 
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label 
                                    className="block text-gray-600 dark:text-gray-400 mb-2"
                                >
                                    You are joining as?
                                </label>
                                <Select 
                                    options={userCategories} 
                                    value={userCategories.find((option) => option.value === userCategory
                                    )} 
                                    className="text-gray-800 dark:text-gray-200" 
                                    onChange={handleUserCategoryChange}
                                />
                            </div>

                            <div className="mb-4">
                                <div className="flex items-center border-2 border-gray-300 rounded-lg p-2 dark:border-gray-700">
                                    <label htmlFor="email" className="text-gray-600 dark:text-gray-400 mr-2">
                                        <i className="fas fa-envelope"></i>
                                    </label>
                                    <input 
                                        type="email" 
                                        id="email"
                                        required
                                        placeholder="Email Address" 
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)} 
                                        className="flex-grow bg-transparent outline-none px-2 py-1 text-gray-800 dark:text-gray-200" 
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="flex items-center border-2 border-gray-300 rounded-lg p-2 dark:border-gray-700">
                                    <label
                                         htmlFor="password" className="text-gray-600 dark:text-gray-400 mr-2"
                                    >
                                        <i className="fas fa-lock"></i>
                                    </label>
                                    <input 
                                        type={textType ? "text" : "password"} 
                                        id="password"
                                        required
                                        placeholder="Password" 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        className="flex-grow bg-transparent outline-none px-2 py-1 text-gray-800 dark:text-gray-200" 
                                    />
                                    <button 
                                        type="button" onClick={handleInputType} className="text-gray-600 dark:text-gray-400"
                                    >
                                        <i 
                                            className={`fas ${textType ? "fa-eye-slash" : "fa-eye"}`}
                                        ></i>
                                    </button>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="flex items-center border-2 border-gray-300 rounded-lg p-2 dark:border-gray-700">
                                    <label 
                                        htmlFor="file" className="text-gray-600 dark:text-gray-400 mr-2"
                                    >
                                        <i className="fas fa-image"></i>
                                    </label>
                                    <input 
                                        type="file"
                                        id="file"
                                        required 
                                        onChange={handleFileChange} 
                                        className="flex-grow bg-transparent outline-none px-2 py-1 text-gray-800 dark:text-gray-200" 
                                    />
                                </div>
                                {thumbnailError && (
                                    <div className="text-red-600 mt-2">{thumbnailError}</div>
                                )}
                            </div>

                            {!isPending && (
                                <button 
                                    className="w-full bg-indigo-600 text-white py-2 mt-4 rounded-lg hover:bg-indigo-700 mb-1">
                                        Sign up
                                </button>
                            )}
                            {isPending && (
                                <button 
                                    className="w-full bg-indigo-600 text-white py-2 mt-4 rounded" disabled
                                >
                                    Signing Up...
                                </button>
                            )}

                            <GoogleButton 
                                handleSign={googleSignUp} 
                                error={signupError} 
                                isPending={signupPending} 
                                text="Sign up with Google" 
                            />
                            {/* {message && <div className="text-red-600 mt-4">{message}</div>} */}
                        </div>
                    </div>
                </form>
            </div>
            <Footer />
        </>
    );
};

export default Signup;
