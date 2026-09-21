import { Translation } from '@openng/optimus-ui/api';
import { AppLocale } from './locale';

/**
 * Strings Optimus renders itself (empty lists, ARIA labels on overlays, filter menus).
 * They are not in the app catalogue because Optimus wants them as one object handed to
 * `Optimus.setTranslation`.
 */
const FR: Translation = {
  emptyMessage: 'Aucun résultat',
  emptyFilterMessage: 'Aucun résultat',
  emptySelectionMessage: 'Aucun élément sélectionné',
  emptySearchMessage: 'Aucun résultat',
  searchMessage: '{0} résultats disponibles',
  selectionMessage: '{0} éléments sélectionnés',
  clear: 'Effacer',
  apply: 'Appliquer',
  cancel: 'Annuler',
  accept: 'Oui',
  reject: 'Non',
  choose: 'Choisir',
  upload: 'Envoyer',
  today: "Aujourd'hui",
  weekHeader: 'Sem',
  aria: {
    selectAll: 'Tout sélectionner',
    unselectAll: 'Tout désélectionner',
    close: 'Fermer',
    previous: 'Précédent',
    next: 'Suivant',
    trueLabel: 'Vrai',
    falseLabel: 'Faux',
    nullLabel: 'Non renseigné',
    removeLabel: 'Retirer',
    listLabel: 'Liste de choix',
    selectRow: 'Sélectionner la ligne',
    unselectRow: 'Désélectionner la ligne',
  },
};

const EN: Translation = {
  emptyMessage: 'No results found',
  emptyFilterMessage: 'No results found',
  emptySelectionMessage: 'No selected item',
  emptySearchMessage: 'No results found',
  searchMessage: '{0} results are available',
  selectionMessage: '{0} items selected',
  clear: 'Clear',
  apply: 'Apply',
  cancel: 'Cancel',
  accept: 'Yes',
  reject: 'No',
  choose: 'Choose',
  upload: 'Upload',
  today: 'Today',
  weekHeader: 'Wk',
  aria: {
    selectAll: 'Select all',
    unselectAll: 'Unselect all',
    close: 'Close',
    previous: 'Previous',
    next: 'Next',
    trueLabel: 'True',
    falseLabel: 'False',
    nullLabel: 'Not selected',
    removeLabel: 'Remove',
    listLabel: 'Option list',
    selectRow: 'Select row',
    unselectRow: 'Unselect row',
  },
};

export const OPTIMUS_TRANSLATIONS: Record<AppLocale, Translation> = { fr: FR, en: EN };
