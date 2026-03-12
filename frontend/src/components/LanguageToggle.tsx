import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';

export default function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggle = () => {
    const next = i18n.language === 'hi' ? 'en' : 'hi';
    i18n.changeLanguage(next);
  };

  const isHindi = i18n.language === 'hi';

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      className="flex items-center gap-1.5 font-semibold text-xs px-2 py-1 h-8 border border-border/50 hover:bg-muted"
      title={isHindi ? 'Switch to English' : 'हिंदी में बदलें'}
    >
      <Languages className="h-3.5 w-3.5" />
      {isHindi ? 'EN' : 'हिं'}
    </Button>
  );
}
