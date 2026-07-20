import { describe, it, beforeAll, afterAll, beforeEach, expect } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
import { resolve } from "path";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

const ALICE = "alice-uid";
const BOB = "bob-uid";

const alicePost = {
  title: "Hello world",
  content: "<p>My first post</p>",
  imageURL: "",
  userId: ALICE,
  author: { firstName: "Alice", lastName: "A", photoURL: "", id: ALICE, headline: "" },
  createdAt: new Date(),
  comments: [],
  likes: [],
  bookmarks: [],
  views: [],
  tags: ["tech"],
  share: "",
  expands: 0,
};

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-blowmind-rules",
    firestore: {
      rules: readFileSync(resolve(__dirname, "../../firestore.rules"), "utf8"),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

function db(uid: string | null) {
  return uid
    ? testEnv.authenticatedContext(uid).firestore()
    : testEnv.unauthenticatedContext().firestore();
}

async function seedAlicePost(postId = "post1") {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "posts", postId), alicePost);
  });
}

async function seedAliceProfile() {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "users", ALICE), {
      firstName: "Alice",
      lastName: "A",
      email: "alice@example.com",
      photoUrl: "",
      headline: "",
      interests: ["tech"],
      category: "tech",
      online: true,
    });
  });
}

describe("users collection", () => {
  it("denies unauthenticated reads of profiles", async () => {
    await seedAliceProfile();
    await assertFails(getDoc(doc(db(null), "users", ALICE)));
  });

  it("allows signed-in users to read profiles", async () => {
    await seedAliceProfile();
    await assertSucceeds(getDoc(doc(db(BOB), "users", ALICE)));
  });

  it("allows a user to create their own profile", async () => {
    await assertSucceeds(
      setDoc(doc(db(ALICE), "users", ALICE), {
        firstName: "Alice",
        lastName: "A",
        email: "alice@example.com",
        photoUrl: "",
        headline: "",
        interests: [],
        category: "",
        online: true,
      })
    );
  });

  it("denies creating a profile for someone else", async () => {
    await assertFails(
      setDoc(doc(db(BOB), "users", ALICE), {
        firstName: "Mallory",
        lastName: "M",
        email: "m@example.com",
        photoUrl: "",
        headline: "",
        interests: [],
        category: "",
        online: true,
      })
    );
  });

  it("denies profile creation with unexpected fields (mass assignment)", async () => {
    await assertFails(
      setDoc(doc(db(ALICE), "users", ALICE), {
        firstName: "Alice",
        role: "admin",
      })
    );
  });

  it("denies updating another user's profile", async () => {
    await seedAliceProfile();
    await assertFails(
      updateDoc(doc(db(BOB), "users", ALICE), { headline: "hacked" })
    );
  });

  it("denies changing the email via update", async () => {
    await seedAliceProfile();
    await assertFails(
      updateDoc(doc(db(ALICE), "users", ALICE), { email: "new@example.com" })
    );
  });

  it("denies profile deletion even by the owner", async () => {
    await seedAliceProfile();
    await assertFails(deleteDoc(doc(db(ALICE), "users", ALICE)));
  });
});

describe("posts collection", () => {
  it("allows anyone (even signed out) to read posts", async () => {
    await seedAlicePost();
    await assertSucceeds(getDoc(doc(db(null), "posts", "post1")));
  });

  it("allows a signed-in user to create their own post", async () => {
    await assertSucceeds(setDoc(doc(db(ALICE), "posts", "p2"), alicePost));
  });

  it("denies creating a post with a spoofed userId", async () => {
    await assertFails(
      setDoc(doc(db(BOB), "posts", "p3"), { ...alicePost, userId: ALICE })
    );
  });

  it("denies unauthenticated post creation", async () => {
    await assertFails(setDoc(doc(db(null), "posts", "p4"), alicePost));
  });

  it("denies posts with an empty title", async () => {
    await assertFails(
      setDoc(doc(db(ALICE), "posts", "p5"), { ...alicePost, title: "" })
    );
  });

  it("denies posts with unexpected fields", async () => {
    await assertFails(
      setDoc(doc(db(ALICE), "posts", "p6"), { ...alicePost, pinned: true })
    );
  });

  it("allows the owner to edit title and content", async () => {
    await seedAlicePost();
    await assertSucceeds(
      updateDoc(doc(db(ALICE), "posts", "post1"), {
        title: "Updated",
        content: "<p>edited</p>",
      })
    );
  });

  it("denies the owner changing the post's userId (ownership transfer)", async () => {
    await seedAlicePost();
    await assertFails(
      updateDoc(doc(db(ALICE), "posts", "post1"), { userId: BOB })
    );
  });

  it("allows another user to update only interaction fields (legacy model)", async () => {
    await seedAlicePost();
    await assertSucceeds(
      updateDoc(doc(db(BOB), "posts", "post1"), {
        likes: [{ uid: BOB, displayName: "Bob", photoURL: "", id: 1 }],
      })
    );
  });

  it("denies another user editing the title", async () => {
    await seedAlicePost();
    await assertFails(
      updateDoc(doc(db(BOB), "posts", "post1"), { title: "defaced" })
    );
  });

  it("denies another user editing title even alongside interaction fields", async () => {
    await seedAlicePost();
    await assertFails(
      updateDoc(doc(db(BOB), "posts", "post1"), {
        title: "defaced",
        likes: [],
      })
    );
  });

  it("denies another user deleting the post", async () => {
    await seedAlicePost();
    await assertFails(deleteDoc(doc(db(BOB), "posts", "post1")));
  });

  it("allows the owner to delete their post", async () => {
    await seedAlicePost();
    await assertSucceeds(deleteDoc(doc(db(ALICE), "posts", "post1")));
  });
});

describe("bookmarks collection", () => {
  it("allows creating a bookmark for yourself", async () => {
    await assertSucceeds(
      setDoc(doc(db(BOB), "bookmarks", "b1"), {
        userId: BOB,
        postId: "post1",
        id: "b1",
      })
    );
  });

  it("denies creating a bookmark as someone else", async () => {
    await assertFails(
      setDoc(doc(db(BOB), "bookmarks", "b2"), {
        userId: ALICE,
        postId: "post1",
        id: "b2",
      })
    );
  });

  it("denies deleting another user's bookmark", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "bookmarks", "b3"), {
        userId: ALICE,
        postId: "post1",
        id: "b3",
      });
    });
    await assertFails(deleteDoc(doc(db(BOB), "bookmarks", "b3")));
  });
});

describe("unknown collections", () => {
  it("denies reads and writes to unmatched collections", async () => {
    await assertFails(getDoc(doc(db(ALICE), "admin-secrets", "s1")));
    await assertFails(setDoc(doc(db(ALICE), "roles", ALICE), { admin: true }));
  });
});
