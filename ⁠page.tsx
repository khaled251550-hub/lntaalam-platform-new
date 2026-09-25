import InstallButton from '@/components/InstallButton';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col items-center justify-between p-6">
      {/* رأس الصفحة أو الشعار */}
      <div className="w-full max-w-4xl mx-auto text-center pt-12">
        <h1 className="text-4xl font-extrabold mb-4 tracking-wide">
          منصة إنْتَالَم التعليمية
        </h1>
        <p className="text-lg text-slate-300 max-w-xl mx-auto leading-relaxed">
          منصة رقمية متكاملة تقدم أحدث المحتويات التعليمية والمهنية. تصفح محتوانا الآن وحمل التطبيق على هاتفك لتجربة سلسة وسريعة.
        </p>
      </div>

      {/* قسم عرض الميزات للزوار */}
      <div className="w-full max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 my-12">
        <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700 shadow-md">
          <h3 className="text-xl font-bold mb-2 text-blue-400">🚀 تصفح فوري وسريع</h3>
          <p className="text-slate-300 text-sm">
            يمكنك استعراض الأقسام والبرامج المتاحة بشكل كامل ودون الحاجة لتسجيل حساب مسبق.
          </p>
        </div>
        <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700 shadow-md">
          <h3 className="text-xl font-bold mb-2 text-blue-400">📱 تطبيق مخصص لجوالك</h3>
          <p className="text-slate-300 text-sm">
            ثبت التطبيق بضغطة زر واحدة واستمتع بوصول سريع ومباشر من شاشة هاتفك الرئيسية.
          </p>
        </div>
      </div>

      {/* تذييل الصفحة */}
      <footer className="w-full text-center py-6 text-slate-400 text-sm">
        جميع الحقوق محفوظة © منصة إنْتَالَم 2026
      </footer>

      {/* زر تثبيت التطبيق التلقائي للزوار */}
      <InstallButton />
    </main>
  );
}
