import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CubeBar } from '../components/ui/CubeBar';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12 text-center">
      <img src="/cube.png" alt="" className="h-20 w-auto opacity-90 animate-float" />
      <p className="mt-8 font-display text-[9rem] font-light italic leading-none tracking-tight text-primary sm:text-[12rem]">
        404
      </p>
      <CubeBar width="w-8" className="mt-4" />
      <h1 className="mt-8 font-display text-3xl font-medium text-slate-900">{t('notFound.title')}</h1>
      <p className="mt-3 max-w-md text-[15px] text-slate-600">{t('notFound.description')}</p>
      <Link to="/dashboard" className="btn-primary mt-8">
        {t('notFound.goBackDashboard')}
      </Link>
    </div>
  );
}
