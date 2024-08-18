import Image, { StaticImageData } from "next/image";
import DefaultAvatar from "../../public/img/default-avatar.jpg"

interface AvatarProps {
    src: string| StaticImageData | null | undefined;
    className?: string;
    alt?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, alt= "User Avatar", className = "" }) => {
    return (
        <div className={`w-9 h-9 rounded-full overflow-hidden border dark:border-gray-600 ${className}`}>
            <Image 
                src={src || DefaultAvatar} 
                alt={alt} 
                className={`object-cover ${className}`} 
                width={50}
                height={50}
            />
        </div>
    );
};

export default Avatar;