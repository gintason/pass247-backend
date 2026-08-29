"""
Single source of truth for subscription plan pricing.

Plans live in the database (``payments.SubscriptionPlan``), but the canonical
tiers and their prices are defined here so that the seed logic
(``payments/apps.py``), the data migration, price-validation and any display
code all agree. Update prices in ONE place: this file (plus run the data
migration for existing rows).

Current tiers (Exam & Interview access) — prices in Naira (₦):
    Monthly    ₦3,500   / 30 days
    Quarterly  ₦8,500   / 90 days
    Yearly     ₦40,000  / 365 days
"""

# plan_type -> canonical definition
PLAN_PRICING = {
    'MONTHLY': {
        'canonical_name': 'Monthly',
        'price': 3500,
        'duration_days': 30,
        # Older rows may have been seeded under any of these names.
        'aliases': ['Monthly', 'One Month', '1 Month'],
    },
    'QUARTERLY': {
        'canonical_name': 'Quarterly',
        'price': 8500,
        'duration_days': 90,
        'aliases': ['Quarterly', 'Three Months', '3 Months'],
    },
    'YEARLY': {
        'canonical_name': 'Yearly',
        'price': 40000,
        'duration_days': 365,
        'aliases': ['Yearly', 'Annual', 'Annually', '12 Months'],
    },
}


def get_plan_price(plan_type):
    """Canonical price (Naira) for a plan_type, or ``None`` if not a tier."""
    tier = PLAN_PRICING.get((plan_type or '').upper())
    return tier['price'] if tier else None


def get_expected_pricing():
    """Iterable of canonical plan dicts, cheapest first."""
    return sorted(PLAN_PRICING.values(), key=lambda p: p['price'])


def validate_plan_price(price, plan_type=None):
    """
    Validate a price (in Naira) before it is used in a Paystack payload.

    Rules:
      * price must be a positive integer number of Naira.
      * if ``plan_type`` is one of the known tiers, the price must match the
        canonical price for that tier (guards against stale/tampered amounts).

    Returns the validated integer price, or raises ``ValueError``.
    """
    try:
        price_int = int(price)
    except (TypeError, ValueError):
        raise ValueError(f"Invalid plan price: {price!r}")

    if price_int <= 0:
        raise ValueError("Plan price must be greater than zero.")

    expected = get_plan_price(plan_type) if plan_type else None
    if expected is not None and price_int != expected:
        raise ValueError(
            f"Price ₦{price_int} does not match the expected ₦{expected} "
            f"for the {plan_type} plan.")

    return price_int
