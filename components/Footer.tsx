import Link from "next/link";
import { useLanguage } from "@/app/contexts/LanguageContext";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-50 border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex items-center space-x-2">
            <span className="text-gray-600">{t("footer.built_with")}</span>
            <span className="text-red-500">❤️</span>
            <span className="text-gray-600">{t("footer.by")}</span>
            <Link
              href="https://www.benjamibono.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors"
            >
              @benjamibono
            </Link>
          </div>
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} Recipe Master.{" "}
            {t("footer.rights_reserved")}
          </div>
        </div>
      </div>
    </footer>
  );
}
