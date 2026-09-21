/**
 * Reference catalogue. Every other locale is typed against these keys, so a missing or
 * stray translation is a compile error rather than a key leaking into the UI.
 *
 * A key ending in `.one` / `.other` is a plural form selected by `Intl.PluralRules`.
 * Placeholders are written `{name}`.
 */
export const MESSAGES_FR = {
  'app.name': 'Split',
  'app.tagline': 'Partagez les dépenses, soldez les comptes.',
  'app.skipToContent': 'Aller au contenu principal',
  'app.language': 'Langue',
  'app.footer': 'Les montants sont exprimés en euros.',

  'nav.home': 'Accueil',
  'nav.backToHome': 'Retour à l’accueil',
  'nav.source': 'Code source sur GitHub',

  'home.heading': 'Vos groupes',
  'home.intro':
    'Créez un groupe, ajoutez ses membres, saisissez les dépenses : Split calcule qui doit quoi et propose le plus petit nombre de virements.',
  'home.create.title': 'Créer un groupe',
  'home.create.nameLabel': 'Nom du groupe',
  'home.create.namePlaceholder': 'Week-end à Lyon',
  'home.create.submit': 'Créer le groupe',
  'home.open.title': 'Ouvrir un groupe existant',
  'home.open.idLabel': 'Identifiant du groupe',
  'home.open.submit': 'Ouvrir',
  'home.recent.title': 'Groupes consultés récemment',
  'home.recent.empty': 'Aucun groupe consulté pour le moment.',
  'home.recent.forget': 'Retirer {name} de la liste',
  'home.recent.clear': 'Vider la liste',

  'group.loading': 'Chargement du groupe…',
  'group.notFound': 'Ce groupe est introuvable. Vérifiez l’identifiant.',
  'group.createdOn': 'Créé le {date}',
  'group.identifier': 'Identifiant',
  'group.copyId': 'Copier l’identifiant',
  'group.idCopied': 'Identifiant copié dans le presse-papiers.',
  'group.retry': 'Réessayer',

  'members.title': 'Membres',
  'members.count.one': '{count} membre',
  'members.count.other': '{count} membres',
  'members.empty': 'Ce groupe n’a encore aucun membre. Ajoutez-en un pour commencer.',
  'members.nameLabel': 'Nom du membre',
  'members.namePlaceholder': 'Camille',
  'members.add': 'Ajouter le membre',

  'expenses.title': 'Dépenses',
  'expenses.count.one': '{count} dépense',
  'expenses.count.other': '{count} dépenses',
  'expenses.empty': 'Aucune dépense enregistrée.',
  'expenses.total': 'Total : {amount}',
  'expenses.column.description': 'Description',
  'expenses.column.amount': 'Montant',
  'expenses.column.payer': 'Payé par',
  'expenses.column.date': 'Date',

  'expenseForm.title': 'Nouvelle dépense',
  'expenseForm.needsMembers': 'Ajoutez au moins un membre avant d’enregistrer une dépense.',
  'expenseForm.description': 'Description',
  'expenseForm.descriptionPlaceholder': 'Courses du samedi',
  'expenseForm.amount': 'Montant',
  'expenseForm.payer': 'Payé par',
  'expenseForm.payerPlaceholder': 'Choisir un membre',
  'expenseForm.participants': 'Participants',
  'expenseForm.participantsHelp': 'Le montant est réparti à parts égales entre les participants.',
  'expenseForm.selectAll': 'Tout le groupe',
  'expenseForm.submit': 'Enregistrer la dépense',

  'balances.title': 'Soldes',
  'balances.empty': 'Rien à afficher : aucune dépense pour le moment.',
  'balances.settled': 'À jour',
  'balances.isOwed': 'On lui doit {amount}',
  'balances.owes': 'Doit {amount}',
  'balances.hint': 'Un solde positif signifie que le groupe doit de l’argent au membre.',

  'settlements.title': 'Remboursements',
  'settlements.empty': 'Tous les comptes sont soldés.',
  'settlements.count.one': '{count} virement suffit à tout solder.',
  'settlements.count.other': '{count} virements suffisent à tout solder.',
  'settlements.transfer': '{from} verse {amount} à {to}',
  'settlements.strategy.OPTIMAL': 'Optimal',
  'settlements.strategy.GREEDY': 'Approché',
  'settlements.strategyHint.OPTIMAL': 'Nombre de virements minimal garanti.',
  'settlements.strategyHint.GREEDY':
    'Le groupe est trop grand pour une résolution exacte : ce plan peut comporter quelques virements de plus que nécessaire.',

  'validation.required': 'Ce champ est obligatoire.',
  'validation.maxLength': 'Ce champ ne doit pas dépasser {max} caractères.',
  'validation.min': 'Le montant doit être supérieur ou égal à {min}.',
  'validation.number': 'Saisissez un montant valide.',
  'validation.participantsRequired': 'Sélectionnez au moins un participant.',
  'validation.uuid': 'Cet identifiant n’est pas valide.',

  'error.title': 'Erreur',
  'error.network': 'Le serveur est injoignable. Vérifiez votre connexion.',
  'error.notFound': 'Ressource introuvable.',
  'error.badRequest': 'La requête a été refusée.',
  'error.unprocessable': 'La requête ne peut pas être traitée en l’état.',
  'error.server': 'Une erreur est survenue côté serveur.',
  'error.unknown': 'Une erreur inattendue est survenue.',

  'toast.success': 'Succès',
  'toast.groupCreated': 'Groupe « {name} » créé.',
  'toast.memberAdded': '{name} a rejoint le groupe.',
  'toast.expenseAdded': 'Dépense « {description} » enregistrée.',
} as const;

export type MessageKey = keyof typeof MESSAGES_FR;

/** Every locale provides exactly the keys the French catalogue declares. */
export type MessageCatalogue = Record<MessageKey, string>;
