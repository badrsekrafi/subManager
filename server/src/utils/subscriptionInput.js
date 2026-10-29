const PAYMENT_METHODS = ['Espèces', 'Virement', 'D17', 'Autre'];
const roundMoney = value => Math.round(value * 1000) / 1000;

function invalid(message) {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
}

function numeric(value, message) {
  if ((typeof value !== 'number' && typeof value !== 'string') || String(value).trim() === '' || !Number.isFinite(Number(value))) invalid(message);
  return Number(value);
}

function subscriptionInput(input, defaults = {}) {
  const values = { ...defaults, ...input };
  const duration = typeof values.duration === 'object' && values.duration !== null
    ? values.duration : { value: values.duration, unit: 'months' };
  const months = numeric(duration.value, 'La durée doit être un nombre entier de mois.');
  if (!Number.isInteger(months) || months < 1 || (duration.unit && duration.unit !== 'months')) invalid('La durée doit être un nombre entier de mois supérieur à zéro.');
  const quantity = numeric(values.quantity ?? 1, 'La quantité doit être un entier positif.');
  if (!Number.isInteger(quantity) || quantity < 1) invalid('La quantité doit être un entier positif.');
  const unitPrice = numeric(values.unitPrice, 'Le prix unitaire est requis et doit être positif ou nul.');
  const unitCost = numeric(values.unitCost ?? 0, "Le prix d'achat doit être positif ou nul.");
  if (unitPrice < 0 || unitCost < 0) invalid('Les prix ne peuvent pas être négatifs.');
  const startDate = new Date(values.startDate);
  const purchaseDate = new Date(values.purchaseDate ?? Date.now());
  if (!values.startDate || Number.isNaN(startDate.getTime()) || Number.isNaN(purchaseDate.getTime())) invalid('Les dates de début et d\'achat doivent être valides.');
  const totalPrice = roundMoney(quantity * unitPrice);
  if (!Number.isFinite(totalPrice)) invalid('Le montant total est invalide.');
  const initialPayment = roundMoney(numeric(values.initialPayment ?? 0, 'Le montant payé est invalide.'));
  if (initialPayment < 0 || initialPayment > totalPrice) invalid('Le montant payé doit être compris entre zéro et le montant total.');
  const paymentMethod = values.paymentMethod || 'Espèces';
  if (initialPayment > 0 && !PAYMENT_METHODS.includes(paymentMethod)) invalid('Méthode de paiement invalide.');
  return { duration: { value: months, unit: 'months' }, quantity, unitPrice, unitCost, startDate, purchaseDate, totalPrice, initialPayment, paymentMethod };
}

module.exports = { subscriptionInput, roundMoney };
