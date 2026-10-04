// Shared semantics for rich/compact extraction and the independent audit.
// This does not change or repair the strict expression grammar.
export const PREFERRED_EXPRESSION_INSTRUCTION=`
Each item's level determines its required/preferred strength. The expression inventories source
relationships and references every item; it is not a boolean test of an applicant's eligibility.
Keep independent preferred items as ordinary references alongside other items under ALL, with
level preferred unchanged. An ALL inventory does not promote those references to mandatory.
Do not omit preferred items, change their level, or invent IF predicates to make them optional.
ANY represents actual source alternatives, never an invented optional branch for a preference.
Do not invent a no-requirement item, empty alternative or unknown passage for a clear preference.`;
