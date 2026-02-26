import { db } from "../db";
import * as schema from "./schema";
import { eq } from "drizzle-orm";
import { scryptSync, randomBytes } from "crypto";

// Hash password using scrypt with BetterAuth's exact parameters
function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

async function main() {
  console.log("🌱 Starting database seeding...");

  // Get or create Institution
  let institution = await db
    .select()
    .from(schema.institutions)
    .where(eq(schema.institutions.domain, "university.edu"))
    .limit(1);

  if (institution.length === 0) {
    const [newInst] = await db
      .insert(schema.institutions)
      .values({
        name: "University of Example",
        domain: "university.edu",
      })
      .returning();
    institution = [newInst];
  }

  console.log("✅ Using institution:", institution[0].name);

  // Create a lecturer user for course management (students will self-register)
  let lecturerUser = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, "lecturer@university.edu"))
    .limit(1);

  if (lecturerUser.length === 0) {
    const [user] = await db
      .insert(schema.users)
      .values({
        email: "lecturer@university.edu",
        name: "Dr. Carol Lecturer",
        role: "LECTURER",
        institutionId: institution[0].id,
        emailVerified: true,
      })
      .returning();

    // Create account with password
    await db.insert(schema.accounts).values({
      userId: user.id,
      accountId: "lecturer@university.edu",
      providerId: "credential",
      password: hashPassword("password123"),
    });

    lecturerUser = [user];
    console.log("✅ Created lecturer: lecturer@university.edu");
  } else {
    console.log("⚠️  Lecturer already exists, skipping...");
  }

  // Create Courses
  const [csCourse] = await db
    .insert(schema.courses)
    .values({
      institutionId: institution[0].id,
      code: "CS101",
      name: "Introduction to Programming",
      semester: "Spring 2026",
      lecturerId: lecturerUser[0].id,
      aiGuidelines: `# AI Usage Guidelines for CS101

## Permitted AI Tools
- GitHub Copilot for code completion
- ChatGPT for concept explanation (not solution generation)

## Restrictions
- No AI-generated complete solutions for assignments
- All AI usage must be logged and documented
- Citations required for AI-assisted code`,
    })
    .returning();

  const [advCourse] = await db
    .insert(schema.courses)
    .values({
      institutionId: institution[0].id,
      code: "CS201",
      name: "Data Structures",
      semester: "Spring 2026",
      lecturerId: lecturerUser[0].id,
      aiGuidelines: `# AI Usage Guidelines for CS201

## Permitted Uses
- Debugging assistance
- Algorithm explanations
- Code optimization suggestions

## Prohibited
- Direct implementation from AI without understanding
- Using AI during exams`,
    })
    .returning();

  console.log("✅ Created courses:", csCourse.code, advCourse.code);

  // Create assignments
  const assignments = await db
    .insert(schema.assignments)
    .values([
      {
        courseId: csCourse.id,
        name: "Hello World Program",
        description: "Create a basic Hello World program in Python",
        dueDate: new Date("2026-03-15"),
      },
      {
        courseId: csCourse.id,
        name: "Calculator App",
        description:
          "Build a command-line calculator supporting basic operations",
        dueDate: new Date("2026-03-22"),
      },
      {
        courseId: advCourse.id,
        name: "Binary Search Tree",
        description:
          "Implement a BST with insert, delete, and search operations",
        dueDate: new Date("2026-03-20"),
      },
      {
        courseId: advCourse.id,
        name: "Graph Traversal",
        description: "Implement BFS and DFS algorithms",
        dueDate: new Date("2026-04-05"),
      },
      {
        courseId: advCourse.id,
        name: "Sorting Algorithms",
        description:
          "Compare performance of quicksort, mergesort, and heapsort",
        dueDate: new Date("2026-04-15"),
      },
    ])
    .returning();
  console.log("✅ Created assignments");

  console.log("\n🎉 Database seeding completed!\n");
  console.log("📝 Mock Data Created:");
  console.log("   Institution: University of Example");
  console.log("   Courses: CS101, CS201");
  console.log("   Assignments: 5 assignments created");
  console.log("   Lecturer: lecturer@university.edu / password123");
  console.log("\n📝 Students can now register their own accounts!\n");
}

main()
  .catch((error) => {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
