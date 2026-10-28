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
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  UserGroupIcon,
  CheckIcon,
} from '../components/ui/icons';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { avatarFor } from '../config/brand';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const isUserActive = (user) =>
  !(user?.status === 'deactivated' || user?.is_active === false);

const Avatar = ({ initials, className, active = true, size = 'md' }) => {
  const tone = avatarFor(initials || '');
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-9 w-9 text-xs';
  return (
    <div
      style={{
        backgroundColor: tone.tint,
        color: tone.ink,
        boxShadow: `inset 0 0 0 1px ${tone.color}40`,
      }}
      className={cn(
        'relative grid place-items-center rounded-lg font-display font-semibold',
        sizeClass,
        !active && 'opacity-55 grayscale',
        className
      )}
    >
      {initials}
      {!active && (
        <span className="absolute -end-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-brand-red ring-2 ring-white" />
      )}
    </div>
  );
};

const UserStatusBadge = ({ active }) => {
  const { t } = useTranslation();
  if (active) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-[#EAF7EC] px-1.5 py-0.5 text-[10px] font-semibold text-[#17802a] ring-1 ring-inset ring-[#BFE5C5]">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-green" aria-hidden="true" />
        {t('users.status.active')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-inset ring-red-200">
      <ExclamationTriangleIcon className="h-3 w-3" />
      {t('users.status.deactivated')}
    </span>
  );
};

const AvatarStack = ({ users, max = 4 }) => {
  const { t } = useTranslation();
  const active = users.filter(isUserActive);
  const hasDeactivated = users.some((u) => !isUserActive(u));
  const shown = active.slice(0, max);
  const overflow = active.length - max;

  if (users.length === 0) {
    return (
      <span className="text-xs text-slate-400">{t('projects.noMembers')}</span>
    );
  }

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2 rtl:space-x-reverse">
        {shown.map((u) => (
          <div
            key={u._id}
            className="relative"
            title={`${u.first_name} ${u.last_name}`}
          >
            <Avatar
              initials={`${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`}
              className="ring-2 ring-white"
              active
            />
          </div>
        ))}
        {overflow > 0 && (
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 ring-2 ring-white">
            +{overflow}
          </div>
        )}
        {hasDeactivated && (
          <div
            className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-700 ring-2 ring-white"
            title={t('projects.hasDeactivatedUsers')}
          >
            <ExclamationTriangleIcon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// Project Card
// ============================================

const ProjectCard = ({ project, userRole, users, onRemoveUser, onAssignSubmit, index = 0 }) => {
  const { t } = useTranslation();
  const [teamOpen, setTeamOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [assignUserId, setAssignUserId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [memberQuery, setMemberQuery] = useState('');

  const assignedUsers = project.assigned_users || [];

  const availableUsers = useMemo(() => {
    const assignedIds = new Set(assignedUsers.map((a) => a._id));
    return (users || []).filter(
      (u) =>
        !assignedIds.has(u._id) &&
        u.role === 'employee' &&
        isUserActive(u)
    );
  }, [users, assignedUsers]);

  const filteredAvailable = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) return availableUsers;
    return availableUsers.filter((u) =>
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(q)
    );
  }, [availableUsers, memberQuery]);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignUserId) return;
    setAssignLoading(true);
    try {
      await onAssignSubmit(project._id, assignUserId);
      setAssignUserId('');
      setShowAssign(false);
      setMemberQuery('');
      setTeamOpen(true);
    } finally {
      setAssignLoading(false);
    }
  };

  const description = project.description || t('projects.noDescription');
  const hasRealDescription = Boolean(project.description?.trim());
  const canExpand = (project.description || '').length > 140;
  const canManage = userRole !== 'employee';

  return (
    <article
      className="group surface relative flex flex-col overflow-hidden transition-shadow duration-200 hover:shadow-md"
      style={{ '--i': index }}
    >
      <span
        className="absolute inset-y-0 start-0 w-[3px] bg-primary"
        aria-hidden="true"
      />

      <div className="flex flex-1 flex-col p-5 ps-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="kicker mb-1.5">{t('projects.status.active')}</p>
            <h3 className="truncate font-display text-2xl font-medium leading-tight text-slate-900">
              {project.name}
            </h3>
          </div>
          <span className="shrink-0 rounded-md bg-primary-50 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-primary ring-1 ring-inset ring-primary-100">
            #{project._id?.slice(-6)}
          </span>
        </div>

        {/* Description */}
        <div className="mt-3 min-h-[2.75rem]">
          <p
            className={cn(
              'text-sm leading-relaxed text-slate-600',
              !hasRealDescription && 'italic text-slate-400',
              !descExpanded && 'line-clamp-2'
            )}
          >
            {description}
          </p>
          {canExpand && (
            <button
              type="button"
              onClick={() => setDescExpanded((v) => !v)}
              className="mt-1 text-xs font-semibold text-primary hover:underline"
            >
              {descExpanded ? t('common.seeLess') : t('common.seeMore')}
            </button>
          )}
        </div>

        {/* Team summary row */}
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <AvatarStack users={assignedUsers} />
          <button
            type="button"
            onClick={() => setTeamOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            aria-expanded={teamOpen}
          >
            <UsersIcon className="h-3.5 w-3.5" />
            <span className="font-mono tabular-nums">{assignedUsers.length}</span>
            <ChevronDownIcon
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200',
                teamOpen && 'rotate-180'
              )}
            />
          </button>
        </div>

        {/* Expandable team panel */}
        {teamOpen && (
          <div className="mt-3 space-y-2 animate-fadeIn">
            <p className="kicker">{t('projects.teamMembers')}</p>

            {assignedUsers.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-4 text-center text-sm text-slate-500">
                {t('projects.noMembers')}
              </p>
            ) : (
              <ul className="max-h-48 space-y-1 overflow-y-auto pe-0.5">
                {assignedUsers.map((user) => {
                  const active = isUserActive(user);
                  return (
                    <li
                      key={user._id}
                      className={cn(
                        'flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 transition-colors',
                        active
                          ? 'border-slate-100 bg-white hover:bg-slate-50'
                          : 'border-red-100 bg-red-50/40'
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar
                          initials={`${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`}
                          size="sm"
                          active={active}
                        />
                        <div className="min-w-0 leading-tight">
                          <p
                            className={cn(
                              'truncate text-sm font-semibold',
                              active ? 'text-slate-900' : 'text-red-700 line-through'
                            )}
                          >
                            {user.first_name} {user.last_name}
                          </p>
                          <div className="mt-0.5">
                            <UserStatusBadge active={active} />
                          </div>
                        </div>
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => onRemoveUser(project._id, user._id)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label={t('projects.removeMember')}
                          title={t('projects.removeMember')}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {canManage && (
              <div className="pt-1">
                {!showAssign ? (
                  <button
                    type="button"
                    onClick={() => setShowAssign(true)}
                    disabled={availableUsers.length === 0}
                    className="btn-secondary w-full border-dashed disabled:opacity-50"
                  >
                    <UserPlusIcon className="h-4 w-4" />
                    {availableUsers.length === 0
                      ? t('projects.form.allAssigned')
                      : t('projects.form.assignMember')}
                  </button>
                ) : (
                  <form
                    onSubmit={handleAssignSubmit}
                    className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3"
                  >
                    {availableUsers.length > 6 && (
                      <div className="relative">
                        <MagnifyingGlassIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="search"
                          value={memberQuery}
                          onChange={(e) => setMemberQuery(e.target.value)}
                          placeholder={t('projects.searchEmployees')}
                          className="field ps-9"
                        />
                      </div>
                    )}
                    <div className="relative">
                      <select
                        value={assignUserId}
                        onChange={(e) => setAssignUserId(e.target.value)}
                        className="field appearance-none pe-10"
                        required
                      >
                        <option value="">{t('projects.form.selectEmployee')}</option>
                        {filteredAvailable.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.first_name} {u.last_name}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={assignLoading || !assignUserId}
                        className="btn-primary flex-1"
                      >
                        {assignLoading ? t('common.loading') : t('projects.form.assign')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAssign(false);
                          setAssignUserId('');
                          setMemberQuery('');
                        }}
                        className="btn-ghost"
                        aria-label={t('common.cancel')}
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

// ============================================
// Create Project Form
// ============================================

const AddProjectForm = ({ onAdd, users, onCancel }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employeeQuery, setEmployeeQuery] = useState('');

  const employees = useMemo(
    () => (users || []).filter((u) => u.role === 'employee' && isUserActive(u)),
    [users]
  );

  const filteredEmployees = useMemo(() => {
    const q = employeeQuery.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((u) =>
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(q)
    );
  }, [employees, employeeQuery]);

  const toggleUser = (id) => {
    setAssignedUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning(t('projects.validation.nameRequired'));
      return;
    }
    setLoading(true);
    try {
      await onAdd({ name: name.trim(), description: description.trim(), assigned_users: assignedUsers });
      setName('');
      setDescription('');
      setAssignedUsers([]);
      setEmployeeQuery('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="surface overflow-hidden animate-fadeIn">
      <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-r from-[#190E32] via-[#241448] to-primary px-5 py-4">
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-white/60">
              {t('projects.newProject')}
            </p>
            <h2 className="mt-1 font-display text-xl font-medium text-white">
              {t('projects.form.newProject')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={t('common.cancel')}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="pointer-events-none absolute -bottom-12 -end-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </div>

      <form onSubmit={submit} className="space-y-5 p-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                {t('projects.form.projectName')} *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field"
                placeholder={t('projects.form.projectNamePlaceholder')}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                {t('projects.form.projectDescription')}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="field resize-none"
                placeholder={t('projects.form.projectDescriptionPlaceholder')}
              />
              <p className="mt-1.5 text-xs text-slate-400">
                {t('projects.form.descriptionTips')}
              </p>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-700">
                {t('projects.form.assignMembers')}
              </label>
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-semibold text-white">
                {assignedUsers.length} {t('projects.form.selected')}
              </span>
            </div>

            {employees.length === 0 ? (
              <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                {t('projects.form.noEmployees')}
              </div>
            ) : (
              <div className="flex min-h-[210px] flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
                <div className="relative border-b border-slate-100 p-2">
                  <MagnifyingGlassIcon className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={employeeQuery}
                    onChange={(e) => setEmployeeQuery(e.target.value)}
                    placeholder={t('projects.searchEmployees')}
                    className="field border-0 bg-transparent ps-9 shadow-none focus:shadow-none"
                  />
                </div>
                <ul className="flex-1 space-y-0.5 overflow-y-auto p-2">
                  {filteredEmployees.length === 0 ? (
                    <li className="px-3 py-6 text-center text-sm text-slate-400">
                      {t('projects.noSearchResults')}
                    </li>
                  ) : (
                    filteredEmployees.map((u) => {
                      const selected = assignedUsers.includes(u._id);
                      const initials = `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`;
                      return (
                        <li key={u._id}>
                          <button
                            type="button"
                            onClick={() => toggleUser(u._id)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-start transition-colors',
                              selected
                                ? 'bg-primary-50 ring-1 ring-primary-100'
                                : 'hover:bg-slate-50'
                            )}
                          >
                            <Avatar initials={initials} size="sm" />
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                              {u.first_name} {u.last_name}
                            </span>
                            <span
                              className={cn(
                                'grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors',
                                selected
                                  ? 'border-primary bg-primary text-white'
                                  : 'border-slate-300 bg-white text-transparent'
                              )}
                            >
                              <CheckIcon className="h-3 w-3" strokeWidth={2.5} />
                            </span>
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
          <button type="submit" disabled={loading} className="btn-primary flex-1 sm:flex-none sm:min-w-[180px]">
            {loading ? t('projects.form.creating') : t('projects.form.createButton')}
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
};

// ============================================
// Main page
// ============================================

const Projects = () => {
  const { t } = useTranslation();
  const { user: utilisateur } = useAuth();
  const toast = useToast();
  const { confirm } = useConfirm();

  const [projets, setProjets] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | withMembers | unassigned

  const canManage = utilisateur.role !== 'employee';

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
    } catch {
      toast.error(t('projects.errors.loadFailed'));
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    toutCharger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const total = projets.length;
    const memberIds = new Set();
    let withTeam = 0;
    projets.forEach((p) => {
      const members = p.assigned_users || [];
      if (members.length > 0) withTeam += 1;
      members.forEach((m) => {
        if (isUserActive(m)) memberIds.add(m._id);
      });
    });
    return {
      total,
      activeMembers: memberIds.size,
      unassigned: total - withTeam,
    };
  }, [projets]);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projets.filter((p) => {
      const members = p.assigned_users || [];
      if (filter === 'withMembers' && members.length === 0) return false;
      if (filter === 'unassigned' && members.length > 0) return false;
      if (!q) return true;
      const hay = `${p.name || ''} ${p.description || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [projets, search, filter]);

  const ajouterProjet = async (donnees) => {
    try {
      const response = await projectAPI.createProject({
        ...donnees,
        company_id: utilisateur.company_id,
      });
      setProjets((prev) => [response.data.project, ...prev]);
      setAfficherFormulaire(false);
      toast.success(t('projects.success.created'));
    } catch {
      toast.error(t('projects.errors.createFailed'));
    }
  };

  const assignerUtilisateur = async (pid, uid) => {
    try {
      const response = await projectAPI.assignUser(pid, uid);
      if (response.data.success) {
        const userToAssign = utilisateurs.find((u) => u._id === uid);
        if (userToAssign) {
          setProjets((prev) =>
            prev.map((project) => {
              if (project._id !== pid) return project;
              const already = project.assigned_users.some((u) => u._id === uid);
              if (already) return project;
              return {
                ...project,
                assigned_users: [...project.assigned_users, userToAssign],
              };
            })
          );
        }
        toast.success(t('projects.success.userAssigned'));
      }
    } catch {
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
      setProjets((prev) =>
        prev.map((p) =>
          p._id === pid
            ? { ...p, assigned_users: p.assigned_users.filter((u) => u._id !== uid) }
            : p
        )
      );
      toast.success(t('projects.success.userRemoved'));
    } catch {
      toast.error(t('projects.errors.removeFailed'));
    }
  };

  const filters = [
    { id: 'all', label: t('projects.filters.all') },
    { id: 'withMembers', label: t('projects.filters.withMembers') },
    { id: 'unassigned', label: t('projects.filters.unassigned') },
  ];

  const hasActiveFilters = search.trim() !== '' || filter !== 'all';

  if (chargement) {
    return <LoadingSpinner message={t('projects.loading')} />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <PageHeader
        icon={BriefcaseIcon}
        kicker={t('projects.status.active')}
        title={canManage ? t('projects.title') : t('projects.myProjects')}
        subtitle={canManage ? t('projects.subtitle') : t('projects.subtitleEmployee')}
        meta={
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand-green" aria-hidden="true" />
            <span className="font-mono tabular-nums text-slate-700">{stats.total}</span>
            {t('projects.totalProjects')}
          </span>
        }
        actions={
          canManage && (
            <button
              type="button"
              onClick={() => setAfficherFormulaire((v) => !v)}
              className="btn-primary"
            >
              {afficherFormulaire ? (
                <XMarkIcon className="h-5 w-5" />
              ) : (
                <PlusIcon className="h-5 w-5" />
              )}
              {afficherFormulaire ? t('projects.hideForm') : t('projects.newProject')}
            </button>
          )
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 stagger">
        <div style={{ '--i': 0 }}>
          <StatCard
            title={t('projects.totalProjects')}
            value={stats.total}
            icon={BriefcaseIcon}
            color="purple"
            subtitle={t('projects.active_projects')}
          />
        </div>
        <div style={{ '--i': 1 }}>
          <StatCard
            title={t('projects.activeMembers')}
            value={stats.activeMembers}
            icon={UsersIcon}
            color="green"
          />
        </div>
        <div style={{ '--i': 2 }}>
          <StatCard
            title={t('projects.unassignedProjects')}
            value={stats.unassigned}
            icon={UserGroupIcon}
            color="yellow"
          />
        </div>
      </div>

      {afficherFormulaire && canManage && (
        <AddProjectForm
          onAdd={ajouterProjet}
          users={utilisateurs}
          onCancel={() => setAfficherFormulaire(false)}
        />
      )}

      {/* Toolbar */}
      {projets.length > 0 && (
        <div className="surface flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <MagnifyingGlassIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('projects.searchPlaceholder')}
              className="field ps-9"
              aria-label={t('common.search')}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label={t('projects.filters.all')}>
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                  filter === f.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid / empty */}
      {projets.length === 0 ? (
        <div className="surface px-6 py-16 text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-primary-50 text-primary">
            <BriefcaseIcon className="h-8 w-8" strokeWidth={1.5} />
          </div>
          <h3 className="font-display text-xl font-medium text-slate-900">
            {canManage
              ? t('projects.emptyState.noProjects')
              : t('projects.emptyState.noAssignedProjects')}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {canManage
              ? t('projects.emptyState.noProjectsSubtitle')
              : t('projects.emptyState.noAssignedSubtitle')}
          </p>
          {canManage && (
            <button
              type="button"
              onClick={() => setAfficherFormulaire(true)}
              className="btn-primary mt-6"
            >
              <PlusIcon className="h-5 w-5" />
              {t('projects.emptyState.createFirst')}
            </button>
          )}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="surface px-6 py-14 text-center">
          <MagnifyingGlassIcon className="mx-auto h-8 w-8 text-slate-300" />
          <h3 className="mt-4 font-display text-lg font-medium text-slate-900">
            {t('projects.noSearchResults')}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {t('projects.noSearchResultsSubtitle')}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setFilter('all');
              }}
              className="btn-secondary mt-5"
            >
              {t('projects.clearFilters')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 stagger">
          {filteredProjects.map((project, i) => (
            <ProjectCard
              key={project._id}
              project={project}
              userRole={utilisateur.role}
              users={utilisateurs}
              onAssignSubmit={assignerUtilisateur}
              onRemoveUser={retirerUtilisateur}
              index={i}
            />
          ))}
        </div>
      )}

      {projets.length > 0 && (
        <p className="text-center text-xs text-slate-400">
          {canManage
            ? t('projects.footer.managerNote', { count: stats.total })
            : t('projects.footer.employeeNote')}
        </p>
      )}
    </div>
  );
};

export default Projects;
