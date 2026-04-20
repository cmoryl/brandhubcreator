export const BOOTHHUB_BASE = 'https://boothhub.lovable.app';

const PRESENTER_QUERY = new URLSearchParams({
  embed: '1',
  public: '1',
  presenter: '1',
  readonly: '1',
  hideEditor: '1',
  hideUI: '1',
  hideHeader: '1',
  hideNav: '1',
  hideFooter: '1',
  hideChrome: '1',
  chromeless: '1',
  characters: '1',
  view: '3d',
});

const EXTERNAL_QUERY = new URLSearchParams({
  embed: '1',
  public: '1',
  presenter: '1',
  readonly: '1',
  hideEditor: '1',
  characters: '1',
  view: '3d',
});

export const buildBoothHubPresenterUrl = (divisionId: string, variantLabel?: string, external = false) => {
  const query = new URLSearchParams(external ? EXTERNAL_QUERY : PRESENTER_QUERY);

  if (variantLabel) {
    return `${BOOTHHUB_BASE}/booths/${encodeURIComponent(divisionId)}/variant/${encodeURIComponent(variantLabel)}?${query.toString()}`;
  }

  query.set('booth', divisionId);
  query.set('guest', '1');
  return `${BOOTHHUB_BASE}/?${query.toString()}`;
};
