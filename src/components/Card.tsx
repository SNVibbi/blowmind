import Image from "next/image";
import React from "react";

type CardProps = {
    image: string;
    title: string;
    body: string;
}

const Card: React.FC<CardProps> = ({ image, title, body }) => {
    return (
        <li className="card list-none">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/40">
                <Image src={image} alt="" className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-gray-600 dark:text-gray-300">{body}</p>
        </li>
    );
};

export default Card;