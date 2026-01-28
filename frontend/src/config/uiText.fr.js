/**
 * Centralized French UI Text Configuration
 * Professional ERP/HR Context
 */

export const uiText = {
  // Common
  common: {
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    warning: 'Avertissement',
    confirm: 'Confirmer',
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    edit: 'Modifier',
    view: 'Afficher',
    search: 'Rechercher',
    filter: 'Filtrer',
    export: 'Exporter',
    import: 'Importer',
    refresh: 'Actualiser',
    close: 'Fermer',
    submit: 'Soumettre',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
    yes: 'Oui',
    no: 'Non',
    actions: 'Actions',
    details: 'Détails',
    noData: 'Aucune donnée disponible',
    loading_message: 'Chargement de vos données...',
  },

  // Navigation
  nav: {
    dashboard: 'Tableau de Bord',
    employees: 'Employés',
    leaves: 'Congés',
    projects: 'Projets',
    salary_advances: 'Avances sur Salaire',
    settings: 'Paramètres',
    profile: 'Profil',
    logout: 'Déconnexion',
  },

  // Dashboard
  dashboard: {
    title_employee: 'Mon Tableau de Bord',
    title_admin: 'Tableau de Bord Administrateur',
    title_supervisor: 'Tableau de Bord Superviseur',
    welcome: 'Bon retour, {name} !',
    subtitle_employee: 'Voici un aperçu de votre activité.',
    subtitle_admin: 'Surveillez les activités et métriques de l\'entreprise',
    subtitle_supervisor: 'Suivez les performances et demandes de votre équipe',
    
    request_leave: 'Demander un Congé',
    view_calendar: 'Voir le Calendrier',
    
    stats: {
      annual_leave: 'Congés Annuels',
      sick_leave: 'Congés Maladie',
      pending_requests: 'Demandes en Attente',
      approved_leaves: 'Congés Approuvés',
      total_employees: 'Total Employés',
      pending_leaves: 'Congés en Attente',
      pending_advances: 'Avances en Attente',
      active_projects: 'Projets Actifs',
      
      days_remaining: 'jours restants',
      days_available: 'jours disponibles',
      awaiting_approval: 'en attente d\'approbation',
      this_year: 'cette année',
      active_employees: 'employés actifs',
      in_progress: 'en cours',
    },
    
    charts: {
      leave_requests: 'Aperçu des Demandes de Congés',
      leave_requests_subtitle: 'Répartition par statut',
      salary_advances: 'Demandes d\'Avance sur Salaire',
      salary_advances_subtitle: 'Statut du mois en cours',
      leave_balance: 'Solde de Congés',
      recent_activity: 'Activité Récente',
      leave_trends: 'Tendances des Congés',
      upcoming_timeoff: 'Congés à Venir',
      system_health: 'Santé du Système',
    },
    
    recent: {
      leave_requests: 'Demandes de Congés Récentes',
      leave_requests_subtitle: 'Dernières soumissions',
      salary_advances: 'Avances sur Salaire Récentes',
      salary_advances_subtitle: 'Demandes financières',
    },
  },

  // Leaves
  leaves: {
    title: 'Demandes de Congés',
    new_request: 'Nouvelle Demande',
    your_balance: 'Votre Solde de Congés',
    annual_leave: 'Congés Annuels (Vacances)',
    sick_leave: 'Congé Maladie',
    unpaid_leave: 'Congé Sans Solde',
    calculated_from_settings: 'Calculé selon les paramètres',
    company_policy: 'Politique de l\'entreprise',
    insufficient_balance: 'Solde insuffisant',
    
    table: {
      employee: 'Employé',
      type: 'Type',
      dates: 'Dates',
      days: 'Jours',
      reason: 'Motif',
      status: 'Statut',
      actions: 'Actions',
    },
    
    modal: {
      title: 'Nouvelle Demande de Congé',
      leave_type: 'Type de Congé',
      start_date: 'Date de Début',
      end_date: 'Date de Fin',
      number_of_days: 'Nombre de Jours',
      reason: 'Motif',
      submit: 'Soumettre la Demande',
      cancel: 'Annuler',
    },
    
    messages: {
      insufficient_warning: '⚠️ Attention : Solde insuffisant ! Disponible : {available} jours, Demandé : {requested} jours. Votre demande a été soumise pour approbation.',
      success: 'Demande de congé soumise avec succès',
      approved: 'Demande de congé approuvée avec succès',
      rejected: 'Demande de congé rejetée',
      failed: 'Échec de la soumission de la demande',
      confirm_approve: 'Approuver cette demande de congé ?',
      rejection_reason: 'Entrez le motif du refus (optionnel) :',
    },
  },

  // Employees
  employees: {
    title: 'Gestion des Employés',
    subtitle: 'Gérez les membres de votre équipe et leurs informations',
    addButton: 'Ajouter un Employé',
    listView: 'Vue Liste',
    gridView: 'Vue Grille',
    noEmployees: 'Aucun employé trouvé',
    adjustFilters: 'Essayez d\'ajuster vos filtres',
    getStarted: 'Commencez par ajouter votre premier employé',
    confirmDeactivate: 'Êtes-vous sûr de vouloir désactiver cet employé ?',
    
    filters: {
      search: 'Rechercher',
      searchPlaceholder: 'Rechercher des employés...',
      department: 'Département',
      allDepartments: 'Tous les Départements',
      status: 'Statut',
      allStatus: 'Tous les Statuts',
      active: 'Actif',
      inactive: 'Inactif',
    },
    
    stats: {
      total: 'Total Employés',
      active: 'Actifs',
      departments: 'Départements',
      avgExperience: 'Expérience Moyenne',
    },
    
    departments: {
      engineering: 'Ingénierie',
      sales: 'Ventes',
      marketing: 'Marketing',
      hr: 'Ressources Humaines',
      finance: 'Finance',
      management: 'Direction',
      operations: 'Opérations',
    },
    
    roles: {
      admin: 'Administrateur',
      supervisor: 'Superviseur',
      employee: 'Employé',
    },
    
    employmentTypes: {
      fullTime: 'Temps Plein',
      partTime: 'Temps Partiel',
      contract: 'Contractuel',
      intern: 'Stagiaire',
    },
    
    modal: {
      title: 'Ajouter un Nouvel Employé',
      firstName: 'Prénom',
      lastName: 'Nom',
      email: 'Email',
      password: 'Mot de Passe',
      phone: 'Téléphone',
      role: 'Rôle',
      employmentType: 'Type d\'Emploi',
      birthday: 'Date de Naissance',
      hireDate: 'Date d\'Embauche',
      company: 'Entreprise',
      selectCompany: 'Sélectionner une Entreprise',
      department: 'Département',
      selectDepartment: 'Sélectionner un Département',
      position: 'Poste',
      address: 'Adresse',
      createButton: 'Créer l\'Employé',
    },
    
    detailView: {
      phone: 'Téléphone',
      department: 'Département',
      employeeId: 'ID Employé',
      employmentType: 'Type d\'Emploi',
      role: 'Rôle',
      additionalInfo: 'Informations Complémentaires',
      hireDate: 'Date d\'Embauche',
      birthday: 'Date de Naissance',
      yearsOfService: 'Années de Service',
      address: 'Adresse',
      teamMates: 'Coéquipiers',
    },
    
    messages: {
      createSuccess: 'Employé créé avec succès',
      createError: 'Échec de la création de l\'employé',
      deactivateSuccess: 'Employé désactivé avec succès',
      deactivateError: 'Échec de la désactivation de l\'employé',
    },
  },

  // Profile
  profile: {
    title: 'Mon Profil',
    personalInfo: 'Informations Personnelles',
    accountDetails: 'Détails de votre compte et informations',
    editButton: 'Modifier le Profil',
    saveButton: 'Enregistrer les Modifications',
    notProvided: 'Non renseigné',
    
    form: {
      firstName: 'Prénom',
      lastName: 'Nom',
      phone: 'Téléphone',
      department: 'Département',
      position: 'Poste',
    },
    
    fields: {
      employeeId: 'ID Employé',
      fullName: 'Nom Complet',
      email: 'Adresse Email',
      phone: 'Téléphone',
      role: 'Rôle',
      department: 'Département',
      position: 'Poste',
    },
    
    leaveBalance: {
      title: 'Solde de Congés',
      subtitle: 'Vos jours de congés disponibles',
      annual: 'Congés Annuels (Vacances)',
      sick: 'Congé Maladie',
      unpaid: 'Congé Sans Solde',
      basedOnTenure: 'Basé sur l\'ancienneté et les paramètres',
      companyPolicy: 'Politique de l\'entreprise',
    },
    
    messages: {
      updateSuccess: 'Profil mis à jour avec succès',
      updateError: 'Échec de la mise à jour du profil',
    },
  },

  // Settings
  settings: {
    title: 'Paramètres',
    subtitle: 'Gérez les configurations de l\'application',
    save_recalculate: 'Enregistrer et Recalculer Tous les Soldes',
    
    tabs: {
      holiday_balance: 'Solde de Vacances',
      language: 'Langue',
      companies: 'Entreprises',
    },
    
    holiday_balance: {
      title: 'Configuration du Solde de Vacances',
      subtitle: 'Paramétrez le calcul automatique des congés annuels',
      monthly_vacation: 'Jours de Vacances Mensuels',
      monthly_vacation_help: 'Nombre de jours de vacances accumulés par mois de service',
      probation_period: 'Période de Probation (Mois)',
      probation_help: 'Nombre de mois avant que les employés commencent à accumuler des vacances',
      include_weekends: 'Inclure les Week-ends',
      max_consecutive: 'Jours Consécutifs Maximum',
      max_consecutive_help: 'Nombre maximum de jours de vacances consécutifs autorisés',
      
      formula_title: 'Formule de Calcul des Vacances',
      formula: '(Mois de Service - Période de Probation) × Jours de Vacances Mensuels - Jours Utilisés',
      example: 'Exemple',
      example_calculation: 'Pour 12 mois de service avec 3 mois de probation et 2.5 jours/mois :',
      example_result: '(12 - 3) × 2.5 = 22.5 jours de vacances gagnés',
      
      employee_table: {
        title: 'Soldes de Vacances des Employés',
        employee: 'Employé',
        position: 'Poste',
        hire_date: 'Date d\'Embauche',
        earned: 'Gagné',
        used: 'Utilisé',
        balance: 'Solde',
      },
    },
    
    language: {
      title: 'Préférence de Langue',
      subtitle: 'Sélectionnez votre langue préférée',
      current: 'Langue Actuelle',
      select: 'Sélectionner la Langue',
    },
    
    companies: {
      title: 'Politiques des Entreprises',
      subtitle: 'Politiques de congés par entreprise',
      name: 'Nom',
      annual_days: 'Jours Annuels',
      sick_days: 'Jours Maladie',
      unpaid_days: 'Jours Sans Solde',
    },
    
    messages: {
      save_success: 'Paramètres enregistrés avec succès',
      recalculate_success: 'Tous les soldes recalculés avec succès',
      failed: 'Échec de l\'opération',
    },
  },

  // Projects
  projects: {
    title: 'Gestion des Projets',
    add_project: 'Ajouter un Projet',
    total_projects: 'Total des Projets',
    active_projects: 'Projets Actifs',
    
    form: {
      title: 'Créer un Nouveau Projet',
      projectName: 'Nom du Projet',
      projectNamePlaceholder: 'ex., Refonte du Site Web, Développement d\'Application Mobile',
    },
    
    messages: {
      nameRequired: 'Le nom du projet est requis',
    },
    
    table: {
      name: 'Nom du Projet',
      description: 'Description',
      company: 'Entreprise',
      start_date: 'Date de Début',
      end_date: 'Date de Fin',
      status: 'Statut',
      actions: 'Actions',
    },
    
    modal: {
      title_add: 'Ajouter un Nouveau Projet',
      title_edit: 'Modifier le Projet',
      name: 'Nom du Projet',
      description: 'Description',
      company: 'Entreprise',
      start_date: 'Date de Début',
      end_date: 'Date de Fin',
      status: 'Statut',
      select_company: 'Sélectionner une entreprise',
      select_status: 'Sélectionner un statut',
    },
    
    status: {
      active: 'Actif',
      completed: 'Terminé',
      on_hold: 'En Attente',
      cancelled: 'Annulé',
    },
    
    messages: {
      add_success: 'Projet ajouté avec succès',
      update_success: 'Projet mis à jour avec succès',
      delete_success: 'Projet supprimé avec succès',
      delete_confirm: 'Êtes-vous sûr de vouloir supprimer ce projet ?',
      failed: 'Opération échouée',
    },
  },

  // Salary Advances
  salaryAdvances: {
    title: 'Avances sur Salaire',
    new_request: 'Nouvelle Demande',
    total_requests: 'Total des Demandes',
    pending_requests: 'Demandes en Attente',
    
    table: {
      employee: 'Employé',
      amount: 'Montant',
      reason: 'Motif',
      request_date: 'Date de Demande',
      status: 'Statut',
      actions: 'Actions',
    },
    
    modal: {
      title: 'Nouvelle Demande d\'Avance',
      amount: 'Montant',
      reason: 'Motif',
      submit: 'Soumettre la Demande',
      cancel: 'Annuler',
    },
    
    messages: {
      success: 'Demande d\'avance soumise avec succès',
      approved: 'Demande d\'avance approuvée avec succès',
      rejected: 'Demande d\'avance rejetée',
      failed: 'Échec de la soumission',
      confirm_approve: 'Approuver cette demande d\'avance ?',
      rejection_reason: 'Entrez le motif du refus (optionnel) :',
    },
  },

  // Login
  login: {
    title: 'Gestion RH',
    subtitle: 'Système de Planification des Ressources d\'Entreprise',
    welcomeBack: 'Bon Retour',
    signInMessage: 'Connectez-vous pour accéder à votre compte',
    emailLabel: 'Adresse Email',
    emailPlaceholder: 'Entrez votre email',
    passwordLabel: 'Mot de Passe',
    passwordPlaceholder: 'Entrez votre mot de passe',
    signInButton: 'Se Connecter au Tableau de Bord',
    signingIn: 'Connexion en cours...',
    demoCredentials: 'Identifiants de Démonstration',
    footer: `© ${new Date().getFullYear()} Système de Gestion RH. Tous droits réservés.`,
    loginError: 'Échec de la connexion',
  },

  // Status
  status: {
    pending: 'En Attente',
    approved: 'Approuvé',
    rejected: 'Rejeté',
    cancelled: 'Annulé',
    processing: 'En Cours de Traitement',
    completed: 'Terminé',
    active: 'Actif',
    inactive: 'Inactif',
  },

  // Leave Types
  leaveTypes: {
    annual: 'Congés Annuels',
    sick: 'Congé Maladie',
    unpaid: 'Congé Sans Solde',
    maternity: 'Congé Maternité',
    paternity: 'Congé Paternité',
    medical: 'Congé Médical',
  },

  // Actions
  actions: {
    approve: 'Approuver',
    reject: 'Rejeter',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    view: 'Afficher',
    download: 'Télécharger',
    print: 'Imprimer',
  },

  // Time
  time: {
    days: 'jours',
    day: 'jour',
    hours: 'heures',
    hour: 'heure',
    minutes: 'minutes',
    minute: 'minute',
    years: 'ans',
    year: 'an',
    months: 'mois',
    month: 'mois',
    today: 'Aujourd\'hui',
    yesterday: 'Hier',
    tomorrow: 'Demain',
    this_week: 'Cette Semaine',
    this_month: 'Ce Mois',
    this_year: 'Cette Année',
  },
}

export default uiText
