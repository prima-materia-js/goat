type GraphViewerData = {
  isLoggedIn: boolean;
  id: string | null;
  roles: string[];
  tokens: string[];
  pseudonym?: string;
};

/**
 * Represents an entity (a user, script or job) that is querying the database.
 */
class GraphViewer {
  private _data: GraphViewerData;

  /**
   * Creates an instance of a graph viewer.
   * @param isLoggedIn Whether this viewer has authenticated successfully and has a known identity.
   * @param id An ID representing this viewer. Use a null value for anonymous access.
   * @param roles An array of string values representing roles held by this viewer.
   * @param tokens An array of string values representing actions that can be taken by this viewer (optional).
   * @param pseudonym A readable alias for this user (optional).
   */
  constructor(
    isLoggedIn: boolean,
    id: string | null,
    roles: string[],
    tokens?: string[],
    pseudonym?: string
  ) {
    this._data = {
      isLoggedIn,
      id,
      roles,
      tokens: tokens || [],
      pseudonym,
    };

    Object.freeze(this._data);
  }

  getIsLoggedIn() {
    return this._data.isLoggedIn;
  }

  getID() {
    return this._data.id;
  }

  getRoles() {
    return this._data.roles;
  }

  hasRole(role: string) {
    if (!this._data.roles) {
      return false;
    }

    return this._data.roles.indexOf(role) > -1;
  }

  hasToken(token: string) {
    return this._data.tokens.includes(token);
  }

  hasAnyOfTokens(tokens: string[]) {
    return tokens.some((token) => this.hasToken(token));
  }

  getPseudonym() {
    return this._data.pseudonym;
  }

  hasPseudonym() {
    return !!this._data.pseudonym;
  }
}

export default GraphViewer;
