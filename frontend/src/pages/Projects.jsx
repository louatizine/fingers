import React, { useEffect, useMemo, useState } from 'react';
import { projectAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { useTranslation } from 'react-i18next';
import {
  PlusIcon,
  XMarkIcon,
  UserPlusIcon,
  TrashIcon,
  BriefcaseIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

// ============================================
// Small UI Helpers
// ============================================

const cn = (...classes) => classes.filter(Boolean).join(' ');

const GlassCard = ({ children, className }) => (
  <div
    className={cn(
      'relative overflow-hidden rounded-2xl border border-black/5 bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.06)]',
      'transition-all duration-300 hover:shadow-[0_10px_40px_rgba(0,0,0,0.10)]',
      className
    )}
  >
    {children}
  </div>
);

const SoftBadge = ({ children }) => (
  <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
    {children}
  </span>
);

const PrimaryBtn = ({ className, ...props }) => (
  <button
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-xl bg-[#0078d4] px-4 py-2 text-sm font-semibold text-white',
      'shadow-[0_10px_20px_rgba(0,120,212,0.25)] transition-all duration-200',
      'hover:bg-[#0562b2] hover:shadow-[0_12px_26px_rgba(0,120,212,0.33)] active:scale-[0.98]',
      'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none',
      className
    )}
    {...props}
  />
);

const SecondaryBtn = ({ className, ...props }) => (
  <button
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[#323130]',
      'transition-all hover:bg-black/[0.03] active:scale-[0.98]',
      className
    )}
    {...props}
  />
);

const GhostDangerBtn = ({ className, ...props }) => (
  <button
    className={cn(
      'inline-flex items-center justify-center rounded-xl p-2 text-[#605e5c]',
      'transition-all hover:bg-red-50 hover:text-red-700 active:scale-[0.98]',
      className
    )}
    {...props}
  />
);

const Avatar = ({ initials, className }) => (
  <div
    className={cn(
      'grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#deecf9] to-white text-[#0078d4]',
      'text-xs font-bold ring-1 ring-black/5',
      className
    )}
  >
    {initials}
  </div>
);

// ============================================
// Redesigned Project Card Component
// ============================================

const ProjectCard = ({ project, userRole, users, onRemoveUser, onAssignSubmit }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [expanded, setExpanded] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const assignedUsers = project.assigned_users || [];

  const availableUsers = useMemo(() => {
    const assignedIds = new Set(assignedUsers.map(a => a._id));
    return (users || []).filter(u => !assignedIds.has(u._id) && u.role === 'employee');
  }, [users, assignedUsers]);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignUserId) return;

    setAssignLoading(true);
    try {
      await onAssignSubmit(project._id, assignUserId);
      setAssignUserId('');
      setShowAssign(false);
    } finally {
      setAssignLoading(false);
    }
  };

  const description = project.description || t('projects.noDescription');
  const canExpand = (project.description || '').length > 120;

  return (
    <GlassCard className="group">
      {/* Accent strip */}
      <div
        className={cn(
          'absolute inset-y-0 w-1 bg-gradient-to-b from-[#0078d4] via-[#4aa3ff] to-[#002050]',
          isRTL ? 'right-0' : 'left-0'
        )}
      />

      <div className={cn('p-6', isRTL ? 'pr-7' : 'pl-7')}>
        {/* Header */}
        <div className={cn('flex items-start justify-between gap-4', isRTL && 'flex-row-reverse')}>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-[#111827]">
              {project.name}
            </h3>

            <div className={cn('mt-2 flex items-center gap-2 text-xs text-[#6b7280]', isRTL && 'flex-row-reverse')}>
              <span className="inline-flex items-center gap-2 rounded-full bg-black/[0.03] px-3 py-1 ring-1 ring-black/5">
                <BriefcaseIcon className="h-4 w-4" />
                <span>
                  {assignedUsers.length} {t('projects.members')}
                </span>
              </span>
            </div>
          </div>

          <SoftBadge>{t('projects.status.active')}</SoftBadge>
        </div>

        {/* Avatars */}
        <div className={cn('mt-5 flex items-center justify-between', isRTL && 'flex-row-reverse')}>
          <div className={cn('flex items-center', isRTL ? 'space-x-reverse -space-x-2' : '-space-x-2')}>
            {assignedUsers.slice(0, 4).map((u) => (
              <div
                key={u._id}
                className="relative"
                title={`${u.first_name} ${u.last_name}`}
              >
                <Avatar initials={`${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`} className="ring-2 ring-white" />
              </div>
            ))}

            {assignedUsers.length > 4 && (
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-black/[0.03] text-xs font-bold text-[#6b7280] ring-2 ring-white ring-black/5">
                +{assignedUsers.length - 4}
              </div>
            )}
          </div>

          <div className="text-xs text-[#9ca3af]">
            ID: <span className="font-semibold text-[#6b7280]">{project._id?.slice(-6)}</span>
          </div>
        </div>

        {/* Description */}
        <div className="mt-5 rounded-2xl border border-black/5 bg-gradient-to-b from-white to-[#f8fafc] p-4">
          <div className={cn('mb-2 flex items-center justify-between', isRTL && 'flex-row-reverse')}>
            <span className="text-xs font-semibold text-[#6b7280]">
              {t('projects.description')}
            </span>

            {canExpand && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs font-semibold text-[#0078d4] hover:underline"
              >
                {expanded ? t('common.seeLess') : t('common.seeMore')}
              </button>
            )}
          </div>

          <p className={cn('text-sm leading-relaxed text-[#1f2937]', expanded ? '' : 'line-clamp-2')}>
            {description}
          </p>
        </div>

        {/* Members list */}
        <div className="mt-5 space-y-2">
          <div className="max-h-44 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
            {assignedUsers.map(user => (
              <div
                key={user._id}
                className={cn(
                  'flex items-center justify-between rounded-xl border border-black/5 bg-white px-3 py-2',
                  'transition-all hover:bg-black/[0.02]',
                  isRTL && 'flex-row-reverse'
                )}
              >
                <div className={cn('flex items-center gap-3', isRTL && 'flex-row-reverse')}>
                  <Avatar initials={`${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`} className="h-8 w-8" />
                  <div className="leading-tight">
                    <div className="text-sm font-semibold text-[#111827]">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="text-xs text-[#6b7280]">
                      {t('projects.member')}
                    </div>
                  </div>
                </div>

                {userRole !== 'employee' && (
                  <GhostDangerBtn onClick={() => onRemoveUser(project._id, user._id)}>
                    <TrashIcon className="h-4 w-4" />
                  </GhostDangerBtn>
                )}
              </div>
            ))}
          </div>

          {/* Assign */}
          {userRole !== 'employee' && (
            <div className="pt-3">
              {!showAssign ? (
                <button
                  onClick={() => setShowAssign(true)}
                  className={cn(
                    'w-full rounded-2xl border border-dashed border-black/15 bg-white px-4 py-2 text-sm font-semibold text-[#374151]',
                    'transition-all hover:border-[#0078d4] hover:bg-[#0078d4]/[0.04] hover:text-[#0078d4]'
                  )}
                >
                  <span className={cn('inline-flex items-center justify-center gap-2', isRTL && 'flex-row-reverse')}>
                    <UserPlusIcon className="h-4 w-4" />
                    {t('projects.form.assignMember')}
                  </span>
                </button>
              ) : (
                <form onSubmit={handleAssignSubmit} className="flex flex-col gap-3 md:flex-row">
                  <div className="relative flex-1">
                    <select
                      value={assignUserId}
                      onChange={e => setAssignUserId(e.target.value)}
                      className={cn(
                        'w-full appearance-none rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm text-[#111827]',
                        'focus:border-[#0078d4] focus:outline-none focus:ring-2 focus:ring-[#0078d4]/30',
                        isRTL ? 'text-right' : 'text-left'
                      )}
                      required
                    >
                      <option value="">{t('projects.form.selectEmployee')}</option>
                      {availableUsers.map(u => (
                        <option key={u._id} value={u._id}>
                          {u.first_name} {u.last_name}
                        </option>
                      ))}
                    </select>

                    <ChevronDownIcon
                      className={cn(
                        'pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]',
                        isRTL ? 'left-4' : 'right-4'
                      )}
                    />
                  </div>

                  <div className={cn('flex gap-2', isRTL && 'flex-row-reverse')}>
                    <PrimaryBtn type="submit" disabled={assignLoading || !assignUserId}>
                      {assignLoading ? '...' : t('projects.form.assign')}
                    </PrimaryBtn>

                    <SecondaryBtn type="button" onClick={() => setShowAssign(false)}>
                      <XMarkIcon className="h-5 w-5" />
                    </SecondaryBtn>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

// ============================================
// Restored AddProjectForm Component
// ============================================

const AddProjectForm = ({ onAdd, users, onCancel }) => {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const isRTL = i18n.language === 'ar';

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning(t('projects.validation.nameRequired'));
      return;
    }
    setLoading(true);
    try {
      await onAdd({ name, description, assigned_users: assignedUsers });
      setName('');
      setDescription('');
      setAssignedUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const employees = users.filter(u => u.role === 'employee');

  return (
    <GlassCard className="mb-8">
      <div className="relative overflow-hidden rounded-t-2xl border-b border-black/5 bg-gradient-to-r from-[#002050] via-[#003b8e] to-[#0078d4] px-6 py-4">
        <div className={cn('flex items-center justify-between', isRTL && 'flex-row-reverse')}>
          <h2 className={cn('text-lg font-semibold text-white', isRTL && 'flex-row-reverse')}>
            <span className={cn('inline-flex items-center gap-2', isRTL && 'flex-row-reverse')}>
              <PlusIcon className="h-5 w-5" />
              {t('projects.form.newProject')}
            </span>
          </h2>

          <button
            onClick={onCancel}
            className="rounded-xl p-2 text-white/80 transition-all hover:bg-white/10 hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="absolute -bottom-10 -right-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
      </div>

      <form onSubmit={submit} className="space-y-6 p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#374151]">
                {t('projects.form.projectName')} *
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm text-[#111827] focus:border-[#0078d4] focus:outline-none focus:ring-2 focus:ring-[#0078d4]/30"
                placeholder={t('projects.form.projectNamePlaceholder')}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#374151]">
                {t('projects.form.projectDescription')}
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows="5"
                className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm text-[#111827] focus:border-[#0078d4] focus:outline-none focus:ring-2 focus:ring-[#0078d4]/30"
                placeholder={t('projects.form.projectDescriptionPlaceholder')}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#374151]">
              {t('projects.form.assignMembers')}
            </label>

            <div className="relative">
              <select
                multiple
                value={assignedUsers}
                onChange={e => setAssignedUsers([...e.target.selectedOptions].map(o => o.value))}
                className="h-[240px] w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-[#111827] focus:border-[#0078d4] focus:outline-none focus:ring-2 focus:ring-[#0078d4]/30"
              >
                {employees.map(u => (
                  <option key={u._id} value={u._id} className="py-2 px-3">
                    {u.first_name} {u.last_name}
                  </option>
                ))}
              </select>

              <div className="absolute bottom-3 right-3 rounded-full bg-[#0078d4] px-3 py-1 text-xs font-semibold text-white shadow-md">
                {assignedUsers.length} {t('projects.form.selected')}
              </div>
            </div>
          </div>
        </div>

        <div className={cn('flex gap-3 border-t border-black/5 pt-4', isRTL && 'flex-row-reverse')}>
          <PrimaryBtn type="submit" disabled={loading} className="flex-1">
            {loading ? t('common.loading') : t('projects.form.createButton')}
          </PrimaryBtn>

          <SecondaryBtn type="button" onClick={onCancel}>
            {t('common.cancel')}
          </SecondaryBtn>
        </div>
      </form>
    </GlassCard>
  );
};

// ============================================
// Main Projects Component
// ============================================

const Projects = () => {
  const { t, i18n } = useTranslation();
  const { user: utilisateur } = useAuth();
  const toast = useToast();
  const { confirm } = useConfirm();

  const [projets, setProjets] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const isRTL = i18n.language === 'ar';

  const toutCharger = async () => {
    setChargement(true);
    try {
      if (utilisateur.role === 'employee') {
        const p = await projectAPI.getProjects();
        setProjets(p.data.projects || []);
      } else {
        const [p, u] = await Promise.all([projectAPI.getProjects(), userAPI.getUsers()]);
        setProjets(p.data.projects || []);
        setUtilisateurs(u.data.users || []);
      }
    } catch (err) {
      toast.error(t('projects.errors.loadFailed'));
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    toutCharger();
  }, []);

  const ajouterProjet = async (donnees) => {
    try {
      await projectAPI.createProject({ ...donnees, company_id: utilisateur.company_id });
      await toutCharger();
      setAfficherFormulaire(false);
      toast.success(t('projects.success.created'));
    } catch (err) {
      toast.error(t('projects.errors.createFailed'));
    }
  };

  const assignerUtilisateur = async (pid, uid) => {
    try {
      const response = await projectAPI.assignUser(pid, uid);
      if (response.data.success) {
        await toutCharger();
        toast.success(t('projects.success.userAssigned'));
      }
    } catch (err) {
      toast.error(t('projects.errors.assignFailed'));
    }
  };

  const retirerUtilisateur = async (pid, uid) => {
    const confirmed = await confirm({
      title: t('common.confirm'),
      message: t('projects.confirmRemoveUser'),
      type: 'danger',
    });
    if (!confirmed) return;

    try {
      await projectAPI.removeEmployee(pid, uid);
      setProjets(prev =>
        prev.map(p => {
          if (p._id === pid) {
            return { ...p, assigned_users: p.assigned_users.filter(u => u._id !== uid) };
          }
          return p;
        })
      );
      toast.success(t('projects.success.userRemoved'));
    } catch (err) {
      toast.error(t('projects.errors.removeFailed'));
    }
  };

  if (chargement)
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#f3f4f6]">
        <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#0078d4] border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-[#6b7280]">Loading...</p>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <GlassCard className="p-6">
        <div className={cn('flex flex-col justify-between gap-4 md:flex-row md:items-center', isRTL && 'md:flex-row-reverse')}>
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">
              {utilisateur.role === 'employee' ? t('projects.myProjects') : t('projects.title')}
            </h1>
            <p className="mt-1 text-sm text-[#6b7280]">
              {utilisateur.role === 'employee' ? t('projects.subtitleEmployee') : t('projects.subtitle')}
            </p>
          </div>

          {utilisateur.role !== 'employee' && (
            <PrimaryBtn
              onClick={() => setAfficherFormulaire(!afficherFormulaire)}
              className={cn(isRTL && 'flex-row-reverse')}
            >
              {afficherFormulaire ? <XMarkIcon className="h-5 w-5" /> : <PlusIcon className="h-5 w-5" />}
              {afficherFormulaire ? t('projects.hideForm') : t('projects.newProject')}
            </PrimaryBtn>
          )}
        </div>
      </GlassCard>

      {/* Create Form */}
      {afficherFormulaire && (
        <div className="animate-in fade-in slide-in-from-top-3 duration-500">
          <AddProjectForm onAdd={ajouterProjet} users={utilisateurs} onCancel={() => setAfficherFormulaire(false)} />
        </div>
      )}

      {/* Projects Grid */}
      {projets.length === 0 ? (
        <GlassCard className="p-16 text-center">
          <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-2xl bg-black/[0.03]">
            <BriefcaseIcon className="h-10 w-10 text-[#c7c7c7]" />
          </div>
          <h3 className="text-lg font-bold text-[#111827]">{t('projects.emptyState.noProjects')}</h3>
          <p className="mt-1 text-sm text-[#6b7280]">{t('projects.emptyState.noProjectsSubtitle')}</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {projets.map(project => (
            <ProjectCard
              key={project._id}
              project={project}
              userRole={utilisateur.role}
              users={utilisateurs}
              onAssignSubmit={assignerUtilisateur}
              onRemoveUser={retirerUtilisateur}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;
