import { TelegramProvider } from "@/components/TelegramProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TelegramProvider>
      <div className="mx-auto w-full max-w-xl px-4 py-5">{children}</div>
    </TelegramProvider>
  );
}
