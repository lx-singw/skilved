// Reviewed deployment routing, not a credential or an execution grant.
// One provider scope must never acquire a second independent quota store.
export const GEMINI_AUTHORITY_ROUTES = Object.freeze([
  Object.freeze({
    scopeHash: '9cab437debbac9c42f02aa3cd03adba716e9f82009d1cd32f3437661dd8c7c70',
    projectId: 'skilved-staging', databaseId: '(default)',
    epoch: 'c6a855d7a0082d490274c5f79aebdf647dc4daa76660a4f817f5359b84173e13',
  }),
]);
export const geminiAuthorityRoute = scopeHash => GEMINI_AUTHORITY_ROUTES.find(row => row.scopeHash === scopeHash);
