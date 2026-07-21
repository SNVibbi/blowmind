import Link from "next/link";

const DEFAULT_AVATAR = "/img/default-avatar.png";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  /** Sizing classes, e.g. "h-11 w-11". Defaults to a small avatar. */
  className?: string;
  /** If set, the avatar links to that user's public profile. */
  uid?: string;
}

/**
 * Bulletproof avatar: a plain <img> (not next/image) so any user-provided
 * photo URL renders regardless of host allowlist, with an automatic
 * fallback to the default avatar if the image fails to load.
 */
const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "User avatar",
  className = "h-9 w-9",
  uid,
}) => {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || DEFAULT_AVATAR}
      alt={alt}
      loading="lazy"
      onError={(e) => {
        const el = e.currentTarget;
        if (!el.src.endsWith(DEFAULT_AVATAR)) el.src = DEFAULT_AVATAR;
      }}
      className={`${className} shrink-0 rounded-full bg-gray-100 object-cover dark:bg-gray-700`}
    />
  );

  if (uid) {
    return (
      <Link href={`/users/${uid}`} aria-label="View profile" className="shrink-0">
        {img}
      </Link>
    );
  }
  return img;
};

export default Avatar;
