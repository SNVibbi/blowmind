import Image from "next/image";
import React from "react";

type CardProps = {
    image: string;
    title: string;
    body: string;
}

const Card: React.FC<CardProps> = ({ image, title, body }) => {
    return (
        <li className="border border-gray-200 rounded-lg p-4 bg-white dark:bg-gray-800 ">
            <div className="card-img mb-4">
                <Image src={image} alt="card preview" className="w-12 h-12 rounded-full" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-indigo-600 dark:text-white">{title}</h3>
            <div className="card-body text-gray-700 dark:text-gray-300">{body}</div>
        </li>
    );
};

export default Card;