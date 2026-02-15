// Cognito OIDC config — must match App client in Cognito (callback URL, scopes)
export const cognitoAuthConfig = {
  authority: 'https://cognito-idp.us-east-2.amazonaws.com/us-east-2_DUjA8aS3a',
  client_id: '3s30ludkju34npbol23rlk9n1c',
  redirect_uri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  response_type: 'code',
  scope: 'openid email',
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};
