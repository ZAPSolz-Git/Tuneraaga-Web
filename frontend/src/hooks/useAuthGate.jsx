import Auth from "../components/Auth";


export default function useAuthGate({
  icon: Icon,
  iconClassName = "text-white",
  title = "Login Required",
  message,
  pageGradient,
  cardShadow,
  blob1,
  blob2,
  iconGradient,
  iconShadow,
  buttonGradient,
  buttonShadow,
  showAuthModal,
  setShowAuthModal,
}) {
  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br ${pageGradient} p-4`}
    >
      <div
        className={`relative bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-xl ${cardShadow} px-8 py-12 md:px-14 md:py-16 max-w-md w-full text-center overflow-hidden`}
      >
        {/* Decorative blurred circles */}
        <div
          className={`absolute -top-10 -right-10 w-32 h-32 ${blob1} rounded-full blur-2xl`}
        />
        <div
          className={`absolute -bottom-10 -left-10 w-32 h-32 ${blob2} rounded-full blur-2xl`}
        />

        {/* Icon */}
        <div
          className={`relative w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${iconGradient} flex items-center justify-center shadow-lg ${iconShadow}`}
        >
          <Icon size={36} className={iconClassName} />
        </div>

        <h2 className="relative text-2xl md:text-3xl font-extrabold mb-2 text-slate-900 tracking-tight">
          {title}
        </h2>
        <p className="relative text-slate-500 mb-8 text-sm md:text-base leading-relaxed">
          {message}
        </p>

        <button
          onClick={() => setShowAuthModal(true)}
          className={`relative w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r ${buttonGradient} text-white px-8 py-3.5 rounded-full font-bold shadow-lg ${buttonShadow} hover:scale-105 active:scale-95 transition-all duration-300`}
        >
          Login / Sign Up
        </button>
      </div>

      {showAuthModal && <Auth onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}
