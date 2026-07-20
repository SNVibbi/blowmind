import type { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { useDocument } from "../../hooks/useDocument";
import Footer from "../../components/Footer";
import BlogNavbar from "../../components/BlogNavbar";
import PostComment from "../../components/PostComment";
import Reaction from "../../components/Reaction";
import PostDetails from "@/components/PostDetails";
import { useState, useEffect } from "react";
import { Post } from "../../Types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../utils/firebaseConfig";
import { toPlainText } from "../../lib/text";

interface PostMeta {
  title: string;
  description: string;
  image: string | null;
  url: string;
  author: string;
  publishedTime: string | null;
}

interface PostPageProps {
  meta: PostMeta;
}

const PostPage: React.FC<PostPageProps> = ({ meta }) => {
  const router = useRouter();
  const { postId } = router.query;

  const [screenWidth, setScreenWidth] = useState<number>(0);
  const [mobileMenu, setMobileMenu] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { document: post, error, isPending } = useDocument<Post>(
    "posts",
    typeof postId === "string" ? postId : undefined
  );

  return (
    <>
      <Head>
        <title>{`${meta.title} · BlowMind`}</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical" href={meta.url} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:url" content={meta.url} />
        <meta property="og:image" content={meta.image ?? "/og-image.png"} />
        {meta.author && <meta property="article:author" content={meta.author} />}
        {meta.publishedTime && (
          <meta property="article:published_time" content={meta.publishedTime} />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={meta.title} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={meta.image ?? "/og-image.png"} />
      </Head>

      <BlogNavbar
        screenWidth={screenWidth}
        mobileMenu={mobileMenu}
        setMobileMenu={setMobileMenu}
      />

      <div className="max-w-3xl mx-auto p-4">
        {isPending && <p role="status">Loading post…</p>}
        {error && <p className="text-red-500" role="alert">Error: {error}</p>}
        {!isPending && !error && !post && (
          <p className="text-gray-500">This post is no longer available.</p>
        )}
        {post && (
          <>
            <PostDetails post={post} />
            <Reaction post={post} />
            <PostComment post={post} />
          </>
        )}
      </div>
      <Footer />
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PostPageProps> = async (
  ctx
) => {
  const postId = ctx.params?.postId;
  if (typeof postId !== "string") return { notFound: true };

  try {
    const snap = await getDoc(doc(db, "posts", postId));
    if (!snap.exists()) return { notFound: true };

    const data = snap.data() as Partial<Post> & {
      moderationStatus?: string;
      createdAt?: { seconds: number };
    };

    // Don't surface moderator-removed posts to crawlers.
    if (data.moderationStatus === "removed") return { notFound: true };

    const proto =
      (ctx.req.headers["x-forwarded-proto"] as string) ?? "https";
    const host = ctx.req.headers.host ?? "";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;

    const authorName = data.author
      ? `${data.author.firstName ?? ""} ${data.author.lastName ?? ""}`.trim()
      : "";

    const meta: PostMeta = {
      title: data.title || "Untitled post",
      description:
        toPlainText(data.content ?? "") ||
        "Read this post on BlowMind.",
      image: data.imageURL || null,
      url: `${siteUrl}/posts/${postId}`,
      author: authorName,
      publishedTime: data.createdAt
        ? new Date(data.createdAt.seconds * 1000).toISOString()
        : null,
    };

    return { props: { meta } };
  } catch {
    // If the server-side read fails, still render the page; the client
    // fetch will retry. Fall back to generic meta.
    const proto = (ctx.req.headers["x-forwarded-proto"] as string) ?? "https";
    const host = ctx.req.headers.host ?? "";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;
    return {
      props: {
        meta: {
          title: "Post",
          description: "Read this post on BlowMind.",
          image: null,
          url: `${siteUrl}/posts/${postId}`,
          author: "",
          publishedTime: null,
        },
      },
    };
  }
};

export default PostPage;
