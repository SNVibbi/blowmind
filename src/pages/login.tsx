'use client'

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useLogin from "../hooks/useLogin";
import useGoogle from "../hooks/useGoogle";
import GoogleButton from "../components/GoogleButton";
import BG from "../../public/img/bg.jpg";
import '@fortawesome/fontawesome-free/css/all.min.css';
import Footer from "../components/Footer";
import MainNavbar from "../components/MainNavbar";

const Login: React.FC = () => {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [textType, setTextType] = useState<boolean>(false);
    const { login, isPending, message } = useLogin();
    const { googleSignIn, error: signinError, isPending: signinPending } = useGoogle();

    const togglePasswordVisibility = (e: React.MouseEvent<HTMLButtonElement>) => {
        setTextType(!textType);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        login(email, password);
    };

    return (
        <>
            <MainNavbar />
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-200 dark:bg-gray-900 py-4">
                <form 
                    onSubmit={handleSubmit} 
                    className="bg-gray-200 dark:bg-gray-800 shadow-lg rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 w-full max-w-4xl"
                >
                    <div className="relative w-full h-64 md:h-auto">
                        <Image
                            src={BG}
                            alt="intro"
                            fill
                            style={{ objectFit: "cover" }}
                            className="rounded-lg"
                            priority
                        />
                        <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-4 bg-opacity-50 bg-black rounded-lg">
                            <h1 className="text-2xl md:text-4xl font-bold text-white">
                                Blowmind
                            </h1>
                            <p className="mt-2 text-sm md:text-lg font-semibold text-gray-200">
                                Unleash the Power of Words, Connect with Like-minded Readers and Writers
                            </p>
                        </div>
                    </div>

                    <div className="p-6 flex flex-col justify-between">
                        <div>
                           {message && (
                            <div 
                                className={`mt-4${
                                    message.type === "Error" ? "text-red-600" : "text-green-600"
                                }`}
                            >
                                {message.message}
                            </div>
                           )} 
                           { signinError && (
                            <div className="text-red-600">
                                {signinError}
                            </div>
                           )}
                            <div className="flex justify-between mb-4">
                                <Link href="/signup">
                                    <button className="text-indigo-600 hover:text-indigo-800 dark:text-white dark:hover:text-gray-300">Register</button>
                                </Link>
                                <Link href="/login">
                                    <button className="text-indigo-600 font-bold border-b-2 border-indigo-600">Login</button>
                                </Link>
                            </div>

                            <h3 className="text-2xl font-bold mb-4">Welcome back!</h3>

                            <div className="flex items-center border-2 border-gray-300 dark:border-gray-700 rounded-lg mb-4 p-2">
                                <label htmlFor="email" className="text-gray-600 dark:text-gray-400 mr-2">
                                    <i className="fas fa-envelope"></i>
                                </label>
                                <input 
                                    id="email"
                                    required
                                    type="email"
                                    onChange={(e) => setEmail(e.target.value)}
                                    value={email}
                                    placeholder="Email Address"
                                    className="flex-grow bg-transparent outline-none text-gray-800 dark:text-gray-200" 
                                />
                            </div>

                            <div className="flex items-center border-2 border-gray-300 dark:border-gray-700 rounded-lg mb-4 p-2">
                                <label htmlFor="password" className="text-gray-600 dark:text-gray-400 mr-2">
                                    <i className="fas fa-lock"></i>
                                </label>
                                <input 
                                    id="password"
                                    required
                                    type={textType ? "text" : "password"}
                                    onChange={(e) => setPassword(e.target.value)}
                                    value={password}
                                    placeholder="Password"
                                    className="flex-grow bg-transparent outline-none text-gray-800 dark:text-gray-200" 
                                />
                                <button 
                                    type="button" 
                                    onClick={togglePasswordVisibility} 
                                    className="text-gray-600 dark:text-gray-400 ml-2"
                                >
                                    <i 
                                        className={textType ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                </button>
                            </div>
                            
                            {!isPending && (
                                <button className="bg-indigo-600 mb-2 text-white w-full py-2 rounded-lg hover:bg-indigo-700">
                                Login
                                </button>
                            )}
                            {isPending && (
                                <button className="bg-indigo-600 text-white w-full py-2 rounded-lg" disabled>
                                    Logging In...
                                </button>
                            )}

                            <GoogleButton 
                                handleSign={googleSignIn}
                                error={signinError}
                                isPending={signinPending}
                                text="Sign in with Google"
                            />
                        </div>
                    </div>
                </form>
            </div>
            <Footer />
        </>
    );
};

export default Login;
