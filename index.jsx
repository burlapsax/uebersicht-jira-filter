import base64 from 'base-64';
import { styled } from 'uebersicht';
import * as _config from './config.json';

const defaults = {
  startAt: 0,
  maxResults: 10,
};

const config = Object.assign({}, defaults, _config);

export const refreshFrequency = 1.8e6; // 30m

export const className = `
  left: 2rem;
  top: 2rem;
  color: white;
  font-family: -apple-system;
  z-index: 1;
`;

const IssueList = styled('ul')`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: 0;
  padding: 0.25rem;
  border: 1px solid #999;
  -webkit-border-radius: 5px;
  background-color: rgba(85, 85, 85, 0.7);
  list-style-type: none;
`;

const Item = styled('li')`
  margin: 0.25rem 0;
`;

const ItemLink = styled('a')`
  display: flex;
  align-items: center;
  justify-content: flex-start;
`

const Type = styled('img')`
  padding: 0 0.5rem 0 0;
  margin: 0;
`;

const Status = styled('span')`
  padding: 0 0.5rem 0 0;
  margin: 0;
  font-variant: small-caps;
  font-size: 0.5em;
  color: rgba(200, 200, 200, 1.0);
`;

const Key = styled('span')`
  padding: 0 0.5rem 0 0;
  margin: 0;
  color: rgba(200, 200, 200, 1.0);
  text-decoration: none;
`;

const Summary = styled('span')`
  padding: 0 0.5rem 0 0;
  margin: 0;
  color: white;
  text-decoration: none;
`;

const url = new URL(`http://127.0.0.1:41417/https://${config.jira_domain}/rest/api/2/search`);
const params = {
  jql: `filter = ${config.jira_filter}`,
  startAt: config.startAt,
  maxResults: config.maxResults,
  fields: [
    'summary',
    'status',
    'issuetype',
  ],
};

url.search = new URLSearchParams(params);

const opts = {};
if (config.username && config.password) {
  const auth = base64.encode(`${config.username}:${config.password}`);
  const headers = {
    Authorization: `Basic ${auth}`,
  };
  opts.headers = headers;
}

export const command = dispatch => fetch(url, opts)
  .then((response) => {
    if (!response.ok) {
      throw Error(`${response.status} ${response.statusText} - ${url}`);
    }
    return response.json();
  })
  .then(data => dispatch({ type: 'FETCH_SUCCEEDED', data }))
  .catch(error => dispatch({ type: 'FETCH_FAILED', error }));

export const updateState = (event, previousState) => {
  switch (event.type) {
    case 'FETCH_SUCCEEDED': return event.data;
    case 'FETCH_FAILED': return { error: event.error.message };
    default: return previousState;
  }
};

const Issue = ({
  issuekey,
  summary,
  issuetype,
  status,
}) => {
  const issueLink = `https://${config.jira_domain}/browse/${issuekey}`;
  return (
    <Item>
      <ItemLink href={issueLink}>
        <Type src={issuetype.iconUrl} />
        <Key>{issuekey}</Key>
        <Summary>{summary}</Summary>
        <Status>{status.name}</Status>
      </ItemLink>
    </Item>
  );
};

/*
Issue.propTypes = {
  issuekey: PropTypes.string.isRequired,
  summary: PropTypes.string.isRequired,
  issuetype: PropTypes.object.isRequired,
  status: PropTypes.object.isRequired
};
*/

export const render = ({ issues = [], error = '' }) => (
  error ? (
    <div>
      {`Error retrieving JIRA filter ${config.filter}: ${error}`}
    </div>
  ) : (
    <IssueList>
      {issues.map(({ key, fields }) => (<Issue key={key} issuekey={key} {...fields} />))}
    </IssueList>
  )
);

/*
render.propTypes = {
  issues: PropTypes.arrayOf(PropTypes.Object),
};

render.defaultProps = {
  issues: [],
};
*/
