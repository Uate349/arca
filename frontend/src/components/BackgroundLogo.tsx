import ArcaLogo from "../assets/arca-logo.png";

export default function BackgroundLogo() {
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
      <img
        src={ArcaLogo}
        alt="ARCA watermark"
        className="w-[70%] max-w-[700px] opacity-[0.035] blur-[1px]"
      />
    </div>
  );
}