import { Router, type IRouter } from "express";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import {
  CreateCatalogItemBody,
  CreateCatalogItemResponse,
  DeleteAdminUserParams,
  DeleteCatalogItemParams,
  GetCatalogResponse,
  GetAdminCatalogResponse,
  GetAdminUsersResponse,
  GetLessonParams,
  GetLessonResponse,
  GetSettingsResponse,
  GetSubscriptionResponse,
  LoginBody,
  RegisterBody,
  SubmitSubscriptionBody,
  UpdateAdminUserBody,
  UpdateAdminUserParams,
  UpdateAdminUserResponse,
  UpdateCatalogItemBody,
  UpdateCatalogItemParams,
  UpdateCatalogItemResponse,
  UpdateSettingsBody,
  UpdateSubscriptionStatusBody,
  UpdateSubscriptionStatusParams,
} from "@workspace/api-zod";

type SubscriptionStatus = "none" | "pending" | "active" | "rejected" | "expired";
type User = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  subscriptionStatus: SubscriptionStatus;
  passwordHash: string;
};
type Subscription = {
  id: string;
  user: User;
  status: Exclude<SubscriptionStatus, "none">;
  plan: "monthly" | "yearly";
  amount: number;
  receiptName: string | null;
  submittedAt: string;
};

const router: IRouter = Router();
const users: User[] = [];
const subscriptions: Subscription[] = [];
type Session = { userId: string; expiresAt: number };
const sessions = new Map<string, Session>();
const sessionCookieName = "lntaalam_session";
const sessionTtlMs = 1000 * 60 * 60 * 24 * 14;
let settings = {
  monthlyPrice: 30,
  yearlyPrice: 299,
  bankName: "Urpay",
  accountName: "خالد العتيبي",
  iban: "SA7280206153985222121018",
};

let demoCatalog: any = {
  stages: [
    {
      id: "primary",
      name: "المرحلة الابتدائية",
      description: "أساس قوي يبدأ من الفضول وينمو بالثقة.",
      color: "#e6a536",
      grades: [
        {
          id: "p1",
          name: "الصف الأول الابتدائي",
          subjects: [
            {
              id: "letters-p1",
              name: "الحروف",
              icon: "أ",
              lessonCount: 28,
              sections: [
                { id: "p1-letters", type: "explanations", title: "دروس الحروف", count: 28 },
                { id: "p1-letters-practice", type: "exams", title: "تدريب الحروف", count: 28 },
              ],
            },
            {
              id: "math-p1",
              name: "الرياضيات",
              icon: "∑",
              lessonCount: 31,
              sections: [
                { id: "p1-numbers", type: "explanations", title: "الأرقام", count: 11 },
                { id: "p1-addition", type: "explanations", title: "الجمع", count: 10 },
                { id: "p1-subtraction", type: "explanations", title: "الطرح", count: 10 },
              ],
            },
          ],
        },
        {
          id: "p4",
          name: "الصف الرابع",
          subjects: [
            {
              id: "math-p4",
              name: "الرياضيات",
              icon: "∑",
              lessonCount: 24,
              sections: [
                { id: "p4-e", type: "explanations", title: "شرح الدروس", count: 24 },
                { id: "p4-h", type: "homework", title: "الواجبات", count: 18 },
                { id: "p4-x", type: "exams", title: "الاختبارات", count: 12 },
                { id: "p4-q", type: "qiyas", title: "تدريب قياس", count: 8 },
              ],
            },
            { id: "arabic-p4", name: "لغتي الجميلة", icon: "ع", lessonCount: 19, sections: [] },
          ],
        },
        { id: "p6", name: "الصف السادس", subjects: [{ id: "science-p6", name: "العلوم", icon: "ع", lessonCount: 28, sections: [] }] },
      ],
    },
    {
      id: "middle",
      name: "المرحلة المتوسطة",
      description: "فهم أعمق، أسئلة أذكى، وخطوة أقرب لهدفك.",
      color: "#2e8a78",
      grades: [
        { id: "m1", name: "الأول المتوسط", subjects: [{ id: "math-m1", name: "الرياضيات", icon: "∑", lessonCount: 34, sections: [] }] },
        { id: "m3", name: "الثالث المتوسط", subjects: [{ id: "science-m3", name: "العلوم", icon: "ع", lessonCount: 27, sections: [] }] },
      ],
    },
    {
      id: "secondary",
      name: "المرحلة الثانوية",
      description: "استعداد مركز للمدرسة والقدرات والجامعة.",
      color: "#36738a",
      grades: [
        { id: "s1", name: "الأول الثانوي", subjects: [{ id: "math-s1", name: "رياضيات 1", icon: "∑", lessonCount: 36, sections: [] }] },
        { id: "s2", name: "الثاني الثانوي", subjects: [{ id: "math-s2", name: "رياضيات 2", icon: "∑", lessonCount: 46, sections: [] }] },
        { id: "s3", name: "الثالث الثانوي", subjects: [{ id: "qiyas-s3", name: "القدرات والتحصيلي", icon: "ق", lessonCount: 55, sections: [] }] },
      ],
    },
  ],
};

const adminEmail = process.env.ADMIN_EMAIL ?? "Kmskms653@gmail.com";
const adminPassword = process.env.ADMIN_PASSWORD;

type ManagedCatalogItem = { id: string; type: "stage" | "grade" | "subject" | "lesson"; name: string; parentId: string | null };
const catalogExtras: ManagedCatalogItem[] = [];

function flattenCatalog(): ManagedCatalogItem[] {
  const items: ManagedCatalogItem[] = [];
  for (const stage of demoCatalog.stages) {
    items.push({ id: stage.id, type: "stage", name: stage.name, parentId: null });
    for (const grade of stage.grades) {
      items.push({ id: grade.id, type: "grade", name: grade.name, parentId: stage.id });
      for (const subject of grade.subjects) {
        items.push({ id: subject.id, type: "subject", name: subject.name, parentId: grade.id });
      }
    }
  }
  return [...items, ...catalogExtras];
}

function findCatalogItem(id: string) {
  return flattenCatalog().find((item) => item.id === id);
}

function addCatalogItem(input: { type: ManagedCatalogItem["type"]; name: string; parentId?: string | null }) {
  const id = `catalog-${randomBytes(6).toString("hex")}`;
  const parentId = input.parentId ?? null;
  if (input.type === "stage") {
    demoCatalog.stages.push({ id, name: input.name, description: "مسار تعليمي جديد.", color: "#36738a", grades: [] });
  } else if (input.type === "grade") {
    const stage = demoCatalog.stages.find((item: any) => item.id === parentId);
    if (!stage) return null;
    stage.grades.push({ id, name: input.name, subjects: [] });
  } else if (input.type === "subject") {
    const grade = demoCatalog.stages.flatMap((item: any) => item.grades).find((item: any) => item.id === parentId);
    if (!grade) return null;
    grade.subjects.push({ id, name: input.name, icon: "م", lessonCount: 0, sections: [] });
  } else {
    catalogExtras.push({ id, type: input.type, name: input.name, parentId });
  }
  return { id, type: input.type, name: input.name, parentId };
}

function renameCatalogItem(id: string, name: string) {
  const extra = catalogExtras.find((item) => item.id === id);
  if (extra) {
    extra.name = name;
    return extra;
  }
  for (const stage of demoCatalog.stages) {
    if (stage.id === id) { stage.name = name; return findCatalogItem(id); }
    for (const grade of stage.grades) {
      if (grade.id === id) { grade.name = name; return findCatalogItem(id); }
      const subject = grade.subjects.find((item: any) => item.id === id);
      if (subject) { subject.name = name; return findCatalogItem(id); }
    }
  }
  return null;
}

function removeCatalogItem(id: string) {
  const extraIndex = catalogExtras.findIndex((item) => item.id === id);
  if (extraIndex >= 0) {
    catalogExtras.splice(extraIndex, 1);
    return true;
  }
  for (let stageIndex = 0; stageIndex < demoCatalog.stages.length; stageIndex += 1) {
    const stage = demoCatalog.stages[stageIndex];
    if (stage.id === id) { demoCatalog.stages.splice(stageIndex, 1); return true; }
    for (let gradeIndex = 0; gradeIndex < stage.grades.length; gradeIndex += 1) {
      const grade = stage.grades[gradeIndex];
      if (grade.id === id) { stage.grades.splice(gradeIndex, 1); return true; }
      const subjectIndex = grade.subjects.findIndex((item: any) => item.id === id);
      if (subjectIndex >= 0) { grade.subjects.splice(subjectIndex, 1); return true; }
    }
  }
  return false;
}

function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, encodedHash] = storedHash.split(":");
  if (!salt || !encodedHash) return false;
  const expected = Buffer.from(encodedHash, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function readCookie(req: any, name: string) {
  const header = typeof req.headers.cookie === "string" ? req.headers.cookie : "";
  const pair = header.split(";").map((item: string) => item.trim()).find((item: string) => item.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : null;
}

export function getCurrentUser(req: any): User | null {
  const token = readCookie(req, sessionCookieName);
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return users.find((user) => user.id === session.userId) ?? null;
}

function startSession(res: any, user: User) {
  const token = randomBytes(32).toString("hex");
  sessions.set(token, { userId: user.id, expiresAt: Date.now() + sessionTtlMs });
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `${sessionCookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionTtlMs / 1000}${secure}`);
}

export function hasActiveSubscription(user: User | null) {
  return Boolean(user?.isAdmin || user?.subscriptionStatus === "active");
}

export function hasAdminSession(user: User | null) {
  return Boolean(user?.isAdmin);
}

function requireActiveSubscription(req: any, res: any) {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: "سجّل الدخول أولاً للوصول إلى محتوى المنصة." });
    return null;
  }
  if (!hasActiveSubscription(user)) {
    res.status(402).json({ error: "يتطلب هذا المحتوى اشتراكاً فعالاً." });
    return null;
  }
  return user;
}

function requireAdmin(req: any, res: any) {
  const user = getCurrentUser(req);
  if (!user) {
    res.status(401).json({ error: "سجّل الدخول أولاً." });
    return null;
  }
  if (!hasAdminSession(user)) {
    res.status(403).json({ error: "لا تملك صلاحية الوصول إلى لوحة الإدارة." });
    return null;
  }
  return user;
}

function responseUser(user: User) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

function getOrCreateAdmin() {
  const existing = users.find((item) => item.email.toLowerCase() === adminEmail.toLowerCase());
  if (existing) {
    existing.isAdmin = true;
    existing.subscriptionStatus = "active";
    if (adminPassword) existing.passwordHash = hashPassword(adminPassword);
    return existing;
  }
  const admin: User = {
    id: "admin-khaled",
    name: "خالد العتيبي",
    email: adminEmail,
    isAdmin: true,
    subscriptionStatus: "active",
    passwordHash: adminPassword ? hashPassword(adminPassword) : "",
  };
  users.push(admin);
  return admin;
}

router.get("/auth/session", (_req, res) => {
  const currentUser = getCurrentUser(_req);
  if (!currentUser) {
    res.status(401).json({ error: "لا توجد جلسة نشطة." });
    return;
  }
  res.json({ user: responseUser(currentUser) });
});

router.post("/auth/register", (req, res) => {
  const input = RegisterBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "بيانات التسجيل غير صحيحة." });
    return;
  }
  const existing = users.find((item) => item.email.toLowerCase() === input.data.email.toLowerCase());
  if (existing) {
    res.status(409).json({ error: "البريد الإلكتروني مستخدم مسبقاً." });
    return;
  }
  const user: User = {
    id: `user-${users.length + 1}`,
    name: input.data.name,
    email: input.data.email,
    isAdmin: false,
    subscriptionStatus: "none",
    passwordHash: hashPassword(input.data.password),
  };
  users.push(user);
  startSession(res, user);
  res.status(201).json({ user: responseUser(user) });
});

router.post("/auth/login", (req, res) => {
  const input = LoginBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "بيانات الدخول غير صحيحة." });
    return;
  }
  if (input.data.email.toLowerCase() === adminEmail.toLowerCase()) {
    if (!adminPassword) {
      res.status(503).json({ error: "تسجيل دخول المدير غير مهيأ بأمان." });
      return;
    }
    const admin = getOrCreateAdmin();
    if (!verifyPassword(input.data.password, admin.passwordHash)) {
      res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." });
      return;
    }
    startSession(res, admin);
    res.json({ user: responseUser(admin) });
    return;
  }
  const user = users.find((item) => item.email.toLowerCase() === input.data.email.toLowerCase());
  if (!user || !verifyPassword(input.data.password, user.passwordHash)) {
    res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." });
    return;
  }
  startSession(res, user);
  res.json({ user: responseUser(user) });
});

router.get("/catalog", (_req, res) => {
  res.json(GetCatalogResponse.parse(demoCatalog));
});

router.get("/catalog/lessons/:lessonId", (req, res) => {
  const params = GetLessonParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "معرّف الدرس غير صحيح." });
    return;
  }
  if (!requireActiveSubscription(req, res)) return;
  const unlocked = true;
  const lesson = {
    id: params.data.lessonId,
    title: "المتجهات في المستوى",
    subjectName: "رياضيات 2",
    content: "نتعلم في هذا الدرس تمثيل المتجهات، جمعها، وتحليلها إلى خطوات واضحة مع أمثلة تطبيقية.",
    locked: !unlocked,
  };
  res.json(GetLessonResponse.parse(lesson));
});

router.get("/subscriptions", (_req, res) => {
  const currentUser = getCurrentUser(_req);
  const own = currentUser && subscriptions.find((item) => item.user.id === currentUser?.id);
  res.json(GetSubscriptionResponse.parse(own ? own : {
    status: currentUser?.subscriptionStatus ?? "none",
    plan: "monthly",
    amount: settings.monthlyPrice,
    receiptName: null,
    submittedAt: null,
  }));
});

router.post("/subscriptions", (req, res) => {
  const input = SubmitSubscriptionBody.safeParse(req.body);
  const currentUser = getCurrentUser(req);
  if (!input.success || !currentUser || !input.data.receiptName.trim()) {
    res.status(400).json({ error: "سجّل الدخول وأكمل بيانات الاشتراك." });
    return;
  }
  const amount = input.data.plan === "yearly" ? settings.yearlyPrice : settings.monthlyPrice;
  const subscription: Subscription = {
    id: `subscription-${subscriptions.length + 1}`,
    user: currentUser,
    status: "pending",
    plan: input.data.plan,
    amount,
    receiptName: input.data.receiptName.trim(),
    submittedAt: new Date().toISOString(),
  };
  subscriptions.push(subscription);
  currentUser.subscriptionStatus = "pending";
  res.status(201).json(GetSubscriptionResponse.parse(subscription));
});

router.get("/admin/overview", (_req, res) => {
  if (!requireAdmin(_req, res)) return;
  const active = subscriptions.filter((item) => item.status === "active").length;
  const pending = subscriptions.filter((item) => item.status === "pending").length;
  res.json({ students: Math.max(users.length, 1), activeSubscriptions: active, pendingRequests: pending, lessons: 684 });
});

router.get("/admin/subscriptions", (_req, res) => {
  if (!requireAdmin(_req, res)) return;
  res.json(subscriptions);
});

router.patch("/admin/subscriptions/:subscriptionId/status", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const params = UpdateSubscriptionStatusParams.safeParse(req.params);
  const input = UpdateSubscriptionStatusBody.safeParse(req.body);
  if (!params.success || !input.success) {
    res.status(400).json({ error: "بيانات الحالة غير صحيحة." });
    return;
  }
  const subscription = subscriptions.find((item) => item.id === params.data.subscriptionId);
  if (!subscription) {
    res.status(404).json({ error: "طلب الاشتراك غير موجود." });
    return;
  }
  subscription.status = input.data.status;
  subscription.user.subscriptionStatus = input.data.status;
  res.json(GetSubscriptionResponse.parse(subscription));
});

router.get("/admin/users", (req, res) => {
  if (!requireAdmin(req, res)) return;
  res.json(GetAdminUsersResponse.parse(users.map(responseUser)));
});

router.patch("/admin/users/:userId", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const params = UpdateAdminUserParams.safeParse(req.params);
  const input = UpdateAdminUserBody.safeParse(req.body);
  if (!params.success || !input.success) {
    res.status(400).json({ error: "بيانات المستخدم غير صحيحة." });
    return;
  }
  const user = users.find((item) => item.id === params.data.userId);
  if (!user) {
    res.status(404).json({ error: "المستخدم غير موجود." });
    return;
  }
  if (user.id === admin.id && input.data.isAdmin === false) {
    res.status(400).json({ error: "لا يمكن للمدير إزالة صلاحية نفسه." });
    return;
  }
  if (input.data.name !== undefined) user.name = input.data.name;
  if (input.data.isAdmin !== undefined) user.isAdmin = input.data.isAdmin;
  if (input.data.subscriptionStatus !== undefined) user.subscriptionStatus = input.data.subscriptionStatus;
  res.json(UpdateAdminUserResponse.parse(responseUser(user)));
});

router.delete("/admin/users/:userId", (req, res) => {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  const params = DeleteAdminUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "معرّف المستخدم غير صحيح." });
    return;
  }
  if (params.data.userId === admin.id) {
    res.status(400).json({ error: "لا يمكن للمدير حذف حسابه الحالي." });
    return;
  }
  const userIndex = users.findIndex((item) => item.id === params.data.userId);
  if (userIndex < 0) {
    res.status(404).json({ error: "المستخدم غير موجود." });
    return;
  }
  users.splice(userIndex, 1);
  for (const [token, session] of sessions) {
    if (session.userId === params.data.userId) sessions.delete(token);
  }
  res.status(204).send();
});

router.get("/admin/catalog", (req, res) => {
  if (!requireAdmin(req, res)) return;
  res.json(GetAdminCatalogResponse.parse(flattenCatalog()));
});

router.post("/admin/catalog", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const input = CreateCatalogItemBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "بيانات المحتوى غير صحيحة." });
    return;
  }
  const created = addCatalogItem(input.data);
  if (!created) {
    res.status(400).json({ error: "المعرّف الأب غير موجود لهذا النوع." });
    return;
  }
  res.status(201).json(CreateCatalogItemResponse.parse(created));
});

router.patch("/admin/catalog/:catalogItemId", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const params = UpdateCatalogItemParams.safeParse(req.params);
  const input = UpdateCatalogItemBody.safeParse(req.body);
  if (!params.success || !input.success) {
    res.status(400).json({ error: "بيانات المحتوى غير صحيحة." });
    return;
  }
  const existing = findCatalogItem(params.data.catalogItemId);
  if (!existing) {
    res.status(404).json({ error: "عنصر المحتوى غير موجود." });
    return;
  }
  if (input.data.type !== existing.type || (input.data.parentId ?? null) !== existing.parentId) {
    res.status(400).json({ error: "يمكن تعديل الاسم حالياً، أما نقل العنصر فيحتاج إنشاءه تحت الأب الجديد." });
    return;
  }
  const updated = renameCatalogItem(existing.id, input.data.name);
  res.json(UpdateCatalogItemResponse.parse(updated));
});

router.delete("/admin/catalog/:catalogItemId", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const params = DeleteCatalogItemParams.safeParse(req.params);
  if (!params.success || !removeCatalogItem(params.data.catalogItemId)) {
    res.status(404).json({ error: "عنصر المحتوى غير موجود." });
    return;
  }
  res.status(204).send();
});

router.get("/admin/settings", (_req, res) => {
  if (!requireAdmin(_req, res)) return;
  res.json(GetSettingsResponse.parse(settings));
});

router.patch("/admin/settings", (req, res) => {
  if (!requireAdmin(req, res)) return;
  const input = UpdateSettingsBody.safeParse(req.body);
  if (!input.success) {
    res.status(400).json({ error: "بيانات الإعدادات غير صحيحة." });
    return;
  }
  settings = input.data;
  res.json(GetSettingsResponse.parse(settings));
});

export default router;