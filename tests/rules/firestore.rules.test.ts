import { describe, it, beforeAll, afterAll, beforeEach, expect } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
} from "firebase/firestore";

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
  tags: ["tech"],
  share: "",
  commentCount: 0,
  likeCount: 0,
  bookmarkCount: 0,
  viewCount: 0,
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

function moderatorDb(uid: string) {
  return testEnv.authenticatedContext(uid, { moderator: true }).firestore();
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

  it("denies creating a post with pre-inflated counters", async () => {
    await assertFails(
      setDoc(doc(db(ALICE), "posts", "p3b"), { ...alicePost, likeCount: 9999 })
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

  it("allows anyone to bump expands (low-stakes counter)", async () => {
    await seedAlicePost();
    await assertSucceeds(
      updateDoc(doc(db(BOB), "posts", "post1"), {
        expands: increment(1),
      })
    );
  });

  it("denies clients writing interaction counters (Functions own them)", async () => {
    await seedAlicePost();
    await assertFails(
      updateDoc(doc(db(BOB), "posts", "post1"), { likeCount: increment(1) })
    );
    await assertFails(
      updateDoc(doc(db(ALICE), "posts", "post1"), { commentCount: increment(1) })
    );
  });

  it("denies another user writing legacy interaction arrays", async () => {
    await seedAlicePost();
    await assertFails(
      updateDoc(doc(db(BOB), "posts", "post1"), {
        likes: [{ uid: BOB }],
      })
    );
  });

  it("denies another user editing the title", async () => {
    await seedAlicePost();
    await assertFails(
      updateDoc(doc(db(BOB), "posts", "post1"), { title: "defaced" })
    );
  });

  it("denies the owner writing their own post's counters", async () => {
    await seedAlicePost();
    await assertFails(
      updateDoc(doc(db(ALICE), "posts", "post1"), {
        title: "New title",
        likeCount: increment(5),
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

describe("comments subcollection", () => {
  beforeEach(async () => {
    await seedAlicePost();
  });

  it("allows anyone to read comments", async () => {
    await assertSucceeds(
      getDoc(doc(db(null), "posts", "post1", "comments", "c1"))
    );
  });

  it("allows a signed-in user to comment as themselves", async () => {
    await assertSucceeds(
      setDoc(doc(db(BOB), "posts", "post1", "comments", "c1"), {
        userId: BOB,
        displayName: "Bob",
        photoURL: "",
        content: "Nice post!",
        createdAt: new Date(),
      })
    );
  });

  it("denies commenting as someone else", async () => {
    await assertFails(
      setDoc(doc(db(BOB), "posts", "post1", "comments", "c2"), {
        userId: ALICE,
        displayName: "Alice",
        photoURL: "",
        content: "impersonated",
        createdAt: new Date(),
      })
    );
  });

  it("denies comments over 2000 characters", async () => {
    await assertFails(
      setDoc(doc(db(BOB), "posts", "post1", "comments", "c3"), {
        userId: BOB,
        displayName: "Bob",
        photoURL: "",
        content: "x".repeat(2001),
        createdAt: new Date(),
      })
    );
  });

  it("denies editing a comment (immutable)", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "posts", "post1", "comments", "c4"), {
        userId: BOB,
        displayName: "Bob",
        photoURL: "",
        content: "original",
        createdAt: new Date(),
      });
    });
    await assertFails(
      updateDoc(doc(db(BOB), "posts", "post1", "comments", "c4"), {
        content: "edited",
      })
    );
  });

  it("allows the author to delete their own comment", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "posts", "post1", "comments", "c5"), {
        userId: BOB,
        displayName: "Bob",
        photoURL: "",
        content: "to delete",
        createdAt: new Date(),
      });
    });
    await assertSucceeds(
      deleteDoc(doc(db(BOB), "posts", "post1", "comments", "c5"))
    );
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "posts", "post1", "comments", "c6"), {
        userId: BOB,
        displayName: "Bob",
        photoURL: "",
        content: "not yours",
        createdAt: new Date(),
      });
    });
    await assertFails(
      deleteDoc(doc(db(ALICE), "posts", "post1", "comments", "c6"))
    );
  });
});

describe("likes subcollection", () => {
  beforeEach(async () => {
    await seedAlicePost();
  });

  it("allows liking under your own uid", async () => {
    await assertSucceeds(
      setDoc(doc(db(BOB), "posts", "post1", "likes", BOB), {
        uid: BOB,
        displayName: "Bob",
        photoURL: "",
        createdAt: new Date(),
      })
    );
  });

  it("denies liking under someone else's uid", async () => {
    await assertFails(
      setDoc(doc(db(BOB), "posts", "post1", "likes", ALICE), {
        uid: ALICE,
        displayName: "Alice",
        photoURL: "",
        createdAt: new Date(),
      })
    );
  });

  it("denies a like doc whose uid field mismatches its ID", async () => {
    await assertFails(
      setDoc(doc(db(BOB), "posts", "post1", "likes", BOB), {
        uid: ALICE,
        displayName: "Bob",
        photoURL: "",
        createdAt: new Date(),
      })
    );
  });

  it("allows unliking (deleting your own like)", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "posts", "post1", "likes", BOB), {
        uid: BOB,
        displayName: "Bob",
        photoURL: "",
        createdAt: new Date(),
      });
    });
    await assertSucceeds(deleteDoc(doc(db(BOB), "posts", "post1", "likes", BOB)));
  });

  it("denies deleting someone else's like", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "posts", "post1", "likes", BOB), {
        uid: BOB,
        displayName: "Bob",
        photoURL: "",
        createdAt: new Date(),
      });
    });
    await assertFails(deleteDoc(doc(db(ALICE), "posts", "post1", "likes", BOB)));
  });
});

describe("views subcollection", () => {
  beforeEach(async () => {
    await seedAlicePost();
  });

  it("allows recording your own view once", async () => {
    await assertSucceeds(
      setDoc(doc(db(BOB), "posts", "post1", "views", BOB), {
        uid: BOB,
        createdAt: new Date(),
      })
    );
  });

  it("denies recording a view for someone else", async () => {
    await assertFails(
      setDoc(doc(db(BOB), "posts", "post1", "views", ALICE), {
        uid: ALICE,
        createdAt: new Date(),
      })
    );
  });

  it("denies deleting views (write-once)", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "posts", "post1", "views", BOB), {
        uid: BOB,
        createdAt: new Date(),
      });
    });
    await assertFails(deleteDoc(doc(db(BOB), "posts", "post1", "views", BOB)));
  });
});

describe("bookmarks collection", () => {
  it("allows creating a bookmark for yourself with the ID convention", async () => {
    await assertSucceeds(
      setDoc(doc(db(BOB), "bookmarks", `${BOB}_post1`), {
        userId: BOB,
        postId: "post1",
        createdAt: new Date(),
      })
    );
  });

  it("denies creating a bookmark as someone else", async () => {
    await assertFails(
      setDoc(doc(db(BOB), "bookmarks", `${ALICE}_post1`), {
        userId: ALICE,
        postId: "post1",
        createdAt: new Date(),
      })
    );
  });

  it("denies a bookmark whose ID breaks the uid_postId convention", async () => {
    await assertFails(
      setDoc(doc(db(BOB), "bookmarks", "random-id"), {
        userId: BOB,
        postId: "post1",
        createdAt: new Date(),
      })
    );
  });

  it("denies reading another user's bookmarks", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "bookmarks", `${ALICE}_post1`), {
        userId: ALICE,
        postId: "post1",
        createdAt: new Date(),
      });
    });
    await assertFails(getDoc(doc(db(BOB), "bookmarks", `${ALICE}_post1`)));
  });

  it("denies deleting another user's bookmark", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "bookmarks", `${ALICE}_post1`), {
        userId: ALICE,
        postId: "post1",
        createdAt: new Date(),
      });
    });
    await assertFails(deleteDoc(doc(db(BOB), "bookmarks", `${ALICE}_post1`)));
  });
});

describe("moderation on posts", () => {
  it("hides removed posts from the public but shows them to the owner", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "posts", "removed1"), {
        ...alicePost,
        moderationStatus: "removed",
      });
    });
    await assertFails(getDoc(doc(db(BOB), "posts", "removed1")));
    await assertSucceeds(getDoc(doc(db(ALICE), "posts", "removed1")));
  });

  it("lets moderators read and soft-remove any post", async () => {
    await seedAlicePost();
    await assertSucceeds(
      updateDoc(doc(moderatorDb("mod-uid"), "posts", "post1"), {
        moderationStatus: "removed",
      })
    );
  });

  it("denies a normal user setting moderationStatus", async () => {
    await seedAlicePost();
    await assertFails(
      updateDoc(doc(db(ALICE), "posts", "post1"), {
        moderationStatus: "removed",
      })
    );
  });
});

describe("reports collection", () => {
  it("allows a user to report content with the ID convention", async () => {
    await assertSucceeds(
      setDoc(doc(db(BOB), "reports", `${BOB}_post_post1`), {
        reporterUid: BOB,
        targetType: "post",
        targetId: "post1",
        postId: "post1",
        reason: "spam",
        details: "",
        status: "open",
        createdAt: new Date(),
      })
    );
  });

  it("denies reporting under a spoofed reporter uid", async () => {
    await assertFails(
      setDoc(doc(db(BOB), "reports", `${ALICE}_post_post1`), {
        reporterUid: ALICE,
        targetType: "post",
        targetId: "post1",
        postId: "post1",
        reason: "spam",
        details: "",
        status: "open",
        createdAt: new Date(),
      })
    );
  });

  it("denies creating a report already marked resolved", async () => {
    await assertFails(
      setDoc(doc(db(BOB), "reports", `${BOB}_post_post1`), {
        reporterUid: BOB,
        targetType: "post",
        targetId: "post1",
        postId: "post1",
        reason: "spam",
        details: "",
        status: "resolved",
        createdAt: new Date(),
      })
    );
  });

  it("denies a normal user reading someone else's report", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "reports", `${ALICE}_post_post1`), {
        reporterUid: ALICE,
        targetType: "post",
        targetId: "post1",
        postId: "post1",
        reason: "spam",
        status: "open",
        createdAt: new Date(),
      });
    });
    await assertFails(getDoc(doc(db(BOB), "reports", `${ALICE}_post_post1`)));
  });

  it("allows a moderator to read and triage reports", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "reports", `${ALICE}_post_post1`), {
        reporterUid: ALICE,
        targetType: "post",
        targetId: "post1",
        postId: "post1",
        reason: "spam",
        status: "open",
        createdAt: new Date(),
      });
    });
    await assertSucceeds(
      getDoc(doc(moderatorDb("mod-uid"), "reports", `${ALICE}_post_post1`))
    );
    await assertSucceeds(
      updateDoc(doc(moderatorDb("mod-uid"), "reports", `${ALICE}_post_post1`), {
        status: "resolved",
      })
    );
  });

  it("denies a normal user triaging a report", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "reports", `${ALICE}_post_post1`), {
        reporterUid: ALICE,
        targetType: "post",
        targetId: "post1",
        postId: "post1",
        reason: "spam",
        status: "open",
        createdAt: new Date(),
      });
    });
    await assertFails(
      updateDoc(doc(db(ALICE), "reports", `${ALICE}_post_post1`), {
        status: "resolved",
      })
    );
  });
});

describe("blocks collection", () => {
  it("allows a user to block someone with the ID convention", async () => {
    await assertSucceeds(
      setDoc(doc(db(ALICE), "blocks", `${ALICE}_${BOB}`), {
        userId: ALICE,
        targetUid: BOB,
        type: "block",
        createdAt: new Date(),
      })
    );
  });

  it("denies blocking yourself", async () => {
    await assertFails(
      setDoc(doc(db(ALICE), "blocks", `${ALICE}_${ALICE}`), {
        userId: ALICE,
        targetUid: ALICE,
        type: "block",
        createdAt: new Date(),
      })
    );
  });

  it("denies creating a block entry for another user", async () => {
    await assertFails(
      setDoc(doc(db(BOB), "blocks", `${ALICE}_${BOB}`), {
        userId: ALICE,
        targetUid: BOB,
        type: "block",
        createdAt: new Date(),
      })
    );
  });

  it("denies an ID that breaks the uid_targetUid convention", async () => {
    await assertFails(
      setDoc(doc(db(ALICE), "blocks", "nope"), {
        userId: ALICE,
        targetUid: BOB,
        type: "block",
        createdAt: new Date(),
      })
    );
  });

  it("denies an invalid block type", async () => {
    await assertFails(
      setDoc(doc(db(ALICE), "blocks", `${ALICE}_${BOB}`), {
        userId: ALICE,
        targetUid: BOB,
        type: "shadowban",
        createdAt: new Date(),
      })
    );
  });

  it("keeps a user's block list private and deletable by the owner", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "blocks", `${ALICE}_${BOB}`), {
        userId: ALICE,
        targetUid: BOB,
        type: "block",
        createdAt: new Date(),
      });
    });
    await assertFails(getDoc(doc(db(BOB), "blocks", `${ALICE}_${BOB}`)));
    await assertSucceeds(getDoc(doc(db(ALICE), "blocks", `${ALICE}_${BOB}`)));
    await assertFails(deleteDoc(doc(db(BOB), "blocks", `${ALICE}_${BOB}`)));
    await assertSucceeds(deleteDoc(doc(db(ALICE), "blocks", `${ALICE}_${BOB}`)));
  });
});

describe("server-only collections", () => {
  it("denies clients any access to rateLimits and rateLimitEvents", async () => {
    // These are written only by Cloud Functions (Admin SDK bypasses rules).
    await assertFails(getDoc(doc(db(ALICE), "rateLimits", ALICE)));
    await assertFails(
      setDoc(doc(db(ALICE), "rateLimits", ALICE), { post_count: 0 })
    );
    await assertFails(
      setDoc(doc(db(ALICE), "rateLimitEvents", "e1"), { uid: ALICE })
    );
  });
});

describe("unknown collections", () => {
  it("denies reads and writes to unmatched collections", async () => {
    await assertFails(getDoc(doc(db(ALICE), "admin-secrets", "s1")));
    await assertFails(setDoc(doc(db(ALICE), "roles", ALICE), { admin: true }));
  });
});
